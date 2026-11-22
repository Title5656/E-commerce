(() => {
  const Mono = globalThis.Mono ??= {};
  const KIT_PRICE = 9900, CREDIT_VALUE = 9900, OBSERVATION_MS = 60 * 86400000;
  const totalOf = lines => lines.reduce((sum, l) => sum + l.unitSatang * l.quantity, 0);
  function eligibleCredit(subtotalSatang, credits) {
    return subtotalSatang > 0 ? credits.find(c => c.usedBy === null) ?? null : null;
  }
  function quotePurchase(lines, credits, creditId) {
    const subtotalSatang = totalOf(lines);
    const applied = subtotalSatang > 0 ? credits.find(c => c.id === creditId && c.usedBy === null) : null;
    const creditSatang = applied ? Math.min(CREDIT_VALUE, subtotalSatang) : 0;
    return { subtotalSatang, creditSatang, dueSatang: subtotalSatang - creditSatang, creditId: applied?.id ?? null };
  }
  function classifyFit(chest, garmentChest) {
    const ease = garmentChest - chest;
    return { ease, fit: ease < 6 ? "tight" : ease <= 14 ? "regular" : "oversized" };
  }
  function recommendSize(profile, chart) {
    if (!profile) return null;
    let best = null;
    for (const row of chart) {
      const result = classifyFit(profile.chest, row.circumference);
      if (result.fit === "regular" && (!best || Math.abs(result.ease - 10) < Math.abs(best.ease - 10))) best = { size: row.size, ...result };
    }
    return best;
  }
  function checkoutSignature(state, mode) { return mode === "purchase" ? JSON.stringify(state.cart) : "kit"; }
  const attribution = value => ({
    channel: ["facebook", "tiktok"].includes(value?.channel) ? value.channel : "direct",
    placement: ["facebook", "tiktok"].includes(value?.channel)
      ? (["public-page", "salaya-group"].includes(value?.placement) ? value.placement : "unspecified") : "direct"
  });
  function metrics(state, now) {
    const kits = state.orders.filter(o => o.mode === "kit" || o.mode === "passport");
    const creditsUsed = state.credits.filter(c => c.usedBy !== null && kits.some(k => k.id === c.issuedBy)).length;
    const customers = new Map();
    for (const o of state.orders.filter(o => o.mode === "purchase" && !o.legacy && o.customerId && o.lines.length)) {
      if (!customers.has(o.customerId)) customers.set(o.customerId, []);
      customers.get(o.customerId).push(o);
    }
    let matureCustomers = 0, repeatCustomers = 0, pendingCustomers = 0;
    for (const orders of customers.values()) {
      const first = orders.slice().sort((a,b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
      if (first.deliveredAt === null || first.deliveredAt === undefined) continue;
      const end = first.deliveredAt + OBSERVATION_MS;
      if (now < end) { pendingCustomers++; continue; }
      matureCustomers++;
      if (orders.some(o => o.id !== first.id && o.createdAt >= first.deliveredAt && o.createdAt <= end)) repeatCustomers++;
    }
    return { kitsSold: kits.length, creditsUsed, redemptionRate: kits.length ? creditsUsed / kits.length : null,
      matureCustomers, repeatCustomers, pendingCustomers, repeatRate: matureCustomers ? repeatCustomers / matureCustomers : null };
  }
  Mono.rules = { KIT_PRICE, CREDIT_VALUE, OBSERVATION_MS, totalOf, eligibleCredit, quotePurchase,
    classifyFit, recommendSize, checkoutSignature, attribution, metrics };
})();
