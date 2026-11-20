(() => {
  const Mono = globalThis.Mono ??= {};
  const PASSPORT_PRICE = 9900;
  const CREDIT_VALUE = 9900;
  const CREDIT_MINIMUM = 49900;
  const TRIAL_LIMIT = 3;
  const TRIAL_LENGTH_MS = 72 * 60 * 60 * 1000;

  function totalOf(lines) {
    return lines.reduce((sum, line) => sum + line.unitSatang * line.quantity, 0);
  }

  function eligibleCredit(subtotalSatang, credits) {
    if (subtotalSatang < CREDIT_MINIMUM) return null;
    return credits.find(credit => credit.usedBy === null) ?? null;
  }

  function quotePurchase(lines, credits, creditId) {
    const subtotalSatang = totalOf(lines);
    const eligible = eligibleCredit(subtotalSatang, credits);
    const applied = eligible && eligible.id === creditId ? eligible : null;
    const creditSatang = applied ? CREDIT_VALUE : 0;
    return {
      subtotalSatang, creditSatang, dueSatang: subtotalSatang - creditSatang,
      creditId: applied?.id ?? null
    };
  }

  function quoteTrial(lines) {
    const totalSatang = totalOf(lines);
    const depositSatang = Math.max(0, ...lines.map(line => line.unitSatang));
    return { totalSatang, depositSatang, exposureSatang: totalSatang - depositSatang };
  }

  function quoteSettlement(lines, depositSatang, keep) {
    const keptSatang = totalOf(lines.filter(line => keep.includes(line.lineId)));
    const difference = keptSatang - depositSatang;
    return {
      keptSatang, depositSatang, paySatang: Math.max(0, difference),
      refundSatang: Math.max(0, -difference)
    };
  }

  function classifyFit(chest, garmentChest) {
    const ease = garmentChest - chest;
    const fit = ease < 6 ? "tight" : ease <= 14 ? "regular" : "oversized";
    return { ease, fit };
  }

  function recommendSize(profile, chart) {
    if (!profile) return null;
    let recommendation = null;
    for (const row of chart) {
      const result = classifyFit(profile.chest, row.circumference);
      if (result.fit === "regular" &&
          (!recommendation || Math.abs(result.ease - 10) < Math.abs(recommendation.ease - 10))) {
        recommendation = { size: row.size, ...result };
      }
    }
    return recommendation;
  }

  function isExpired(trial, now) {
    return trial.status === "trying" && trial.expiresAt !== null && now >= trial.expiresAt;
  }

  function checkoutSignature(state, mode) {
    if (mode === "purchase") return JSON.stringify(state.cart);
    if (mode === "trial") return JSON.stringify(state.trialCart);
    return "passport";
  }

  Mono.rules = {
    PASSPORT_PRICE, CREDIT_VALUE, CREDIT_MINIMUM, TRIAL_LIMIT, TRIAL_LENGTH_MS,
    totalOf, eligibleCredit, quotePurchase, quoteTrial, quoteSettlement,
    classifyFit, recommendSize, isExpired, checkoutSignature
  };
})();
