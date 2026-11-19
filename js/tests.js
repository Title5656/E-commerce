(() => {
  const Warin = globalThis.Warin ??= {};
  const tests = [];
  const test = (id, name, expected, fn) => tests.push({ id, name, expected, fn });

  function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  const fixtureLines = [
    { lineId: "a", unitSatang: 39000, quantity: 1 },
    { lineId: "b", unitSatang: 49000, quantity: 1 },
    { lineId: "c", unitSatang: 59000, quantity: 1 }
  ];
  const availableCredit = { id: "FP-001", issuedBy: "ORD-001", usedBy: null };
  const defaultVariant = "tee-heavy~chalk~M";
  const edgeVariant = "shorts-twill~oatmeal~M";

  function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: key => data.delete(key)
    };
  }

  function createDemoStore(overrides = {}) {
    let id = 0;
    return Warin.createStore({
      storage: memoryStorage(),
      getNow: () => 1800000000000,
      makeId: () => "test-" + ++id,
      ...overrides
    });
  }

  function checkout(store, mode, requestId, extra = {}) {
    return store.dispatch({
      type: "checkout", mode, requestId,
      signature: Warin.rules.checkoutSignature(store.read(), mode),
      ...extra
    });
  }

  async function openTrial(store) {
    for (const variantId of [defaultVariant, "polo-pique~olive~M", "shirt-linen~oatmeal~M"]) {
      await store.dispatch({ type: "addTrial", variantId });
    }
    return checkout(store, "trial", "box", { cafeId: "ari" });
  }

  async function rejectionMessage(action) {
    try {
      await action();
    } catch (error) {
      return error.code ?? error.message;
    }
    return "ข้อมูลถูกยอมรับ";
  }

  test("CAT01", "แค็ตตาล็อกมีข้อมูลผ้าครบและ variant ตรงกับราคา", [6, 6, 49900], () => {
    const { products, fabrics, resolveVariant } = Warin.catalog;
    return [products.length, fabrics.length, resolveVariant(edgeVariant).unitSatang];
  });
  test("CAT02", "สีที่ไม่มีขายใช้สร้างรายการไม่ได้", null,
    () => Warin.catalog.resolveVariant("tee-heavy~olive~M"));

  for (const [id, subtotal, expected] of [
    ["C01", 49800, [49800, 0]],
    ["C02", 49900, [40000, 9900]]
  ]) {
    test(id, "ยอดซื้อก่อนใช้เครดิต " + subtotal / 100 + " บาท", expected, () => {
      const quote = Warin.rules.quotePurchase(
        [{ unitSatang: subtotal, quantity: 1 }], [availableCredit], availableCredit.id
      );
      return [quote.dueSatang, quote.creditSatang];
    });
  }

  test("C03", "เครดิตที่ใช้แล้วไม่ลดราคาอีก", 49900,
    () => Warin.rules.quotePurchase(
      [{ unitSatang: 49900, quantity: 1 }],
      [{ ...availableCredit, usedBy: "ORD-002" }], availableCredit.id
    ).dueSatang);

  test("C04", "ได้เครดิตเมื่อซื้อสมุด ตัดเครดิตเมื่อยืนยันเสื้อผ้าเท่านั้น", [9900, null, 40000, true], async () => {
    const store = createDemoStore();
    const passport = await checkout(store, "passport", "passport-1");
    await store.dispatch({ type: "updatePurchase", variantId: edgeVariant, delta: 1 });
    const credit = store.read().credits[0];
    const changed = await checkout(store, "purchase", "purchase-1", { creditId: credit.id });
    return [passport.dueSatang, credit.usedBy, changed.dueSatang, store.read().credits[0].usedBy === changed.id];
  });

  for (const [id, difference, expected] of [
    ["F01", 5, "tight"], ["F02", 6, "regular"], ["F03", 14, "regular"], ["F04", 15, "oversized"]
  ]) {
    test(id, "ระยะเผื่อ " + difference + " ซม.", expected,
      () => Warin.rules.classifyFit(96, 96 + difference).fit);
  }
  test("F05", "อก 96 กับเสื้อคอตตอนหนาแนะนำ M", ["M", 10], () => {
    const product = Warin.catalog.findProduct("tee-heavy");
    const recommendation = Warin.rules.recommendSize({ chest: 96 }, product.chart);
    return [recommendation.size, recommendation.ease];
  });
  test("F06", "ไม่มีไซส์ Regular และกรณีเสมอกันเลือกไซส์เล็กกว่า", [null, "S"], () => [
    Warin.rules.recommendSize({ chest: 125 }, Warin.catalog.findProduct("tee-heavy").chart),
    Warin.rules.recommendSize({ chest: 90 }, [{ size: "S", circumference: 98 }, { size: "M", circumference: 102 }]).size
  ]);

  test("MC01", "สามชิ้น 390 + 490 + 590 บาท", [147000, 59000, 88000], () => {
    const quote = Warin.rules.quoteTrial(fixtureLines);
    return [quote.totalSatang, quote.depositSatang, quote.exposureSatang];
  });
  for (const [id, picks, expected] of [
    ["MC02", [], [0, 59000]],
    ["MC03", ["b"], [0, 10000]],
    ["MC04", ["c"], [0, 0]],
    ["MC05", ["a", "b"], [29000, 0]],
    ["MC06", ["a", "b", "c"], [88000, 0]]
  ]) {
    test(id, "ปิดยอดกล่องเมื่อเก็บ " + (picks.join(", ") || "0 ชิ้น"), expected, () => {
      const quote = Warin.rules.quoteSettlement(fixtureLines, 59000, picks);
      return [quote.paySatang, quote.refundSatang];
    });
  }
  test("MC07", "กล่องรองรับสองไซส์ของรุ่นเดียวกันและปฏิเสธชิ้นที่สี่", ["trial-full", 3], async () => {
    const store = createDemoStore();
    for (const variantId of [defaultVariant, "tee-heavy~chalk~L", "polo-pique~olive~M"]) {
      await store.dispatch({ type: "addTrial", variantId });
    }
    const result = await rejectionMessage(() => store.dispatch({ type: "addTrial", variantId: edgeVariant }));
    return [result, store.read().trialCart.length];
  });
  test("MC08", "เริ่ม 72 ชั่วโมงเมื่อรับของและเลยกำหนดยังขอคืนได้", [null, false, true, "awaiting_return"], async () => {
    let now = 1800000000000;
    const store = createDemoStore({ getNow: () => now });
    const trial = await openTrial(store);
    const received = await store.dispatch({ type: "receiveTrial", trialId: trial.id });
    const before = Warin.rules.isExpired(received, now + 72 * 3600000 - 1);
    now += 72 * 3600000;
    const after = Warin.rules.isExpired(received, now);
    const returned = await store.dispatch({ type: "submitDecisions", trialId: trial.id, keep: [] });
    return [trial.expiresAt, before, after, returned.status];
  });
  test("MC09", "รอตรวจรับแล้วปิดยอดครั้งเดียวและคืน 100 บาท", ["awaiting_return", null, 10000, true], async () => {
    const store = createDemoStore();
    const trial = await openTrial(store);
    await store.dispatch({ type: "receiveTrial", trialId: trial.id });
    const pending = await store.dispatch({ type: "submitDecisions", trialId: trial.id, keep: [trial.lines[1].lineId] });
    const command = { type: "completeReturn", trialId: trial.id };
    const settled = await store.dispatch(command);
    const again = await store.dispatch(command);
    return [pending.status, pending.settlement, settled.settlement.refundSatang, same(settled.settlement, again.settlement)];
  });
  test("MC10", "ของเสียหายเข้าตรวจสอบ การจ่ายและคืนเงินพักไว้", ["review", "trial-status", null], async () => {
    const store = createDemoStore();
    const trial = await openTrial(store);
    await store.dispatch({ type: "receiveTrial", trialId: trial.id });
    await store.dispatch({ type: "submitDecisions", trialId: trial.id, keep: [] });
    const review = await store.dispatch({ type: "reportIssue", trialId: trial.id, issue: "damage" });
    const result = await rejectionMessage(() => store.dispatch({ type: "completeReturn", trialId: trial.id }));
    return [review.status, result, store.read().trials[0].settlement];
  });
  test("MC11", "เก็บทั้งกล่องปิดยอดทันทีและเปิดกล่องใหม่ได้", ["settled", 88000, 1], async () => {
    const store = createDemoStore();
    const trial = await openTrial(store);
    await store.dispatch({ type: "receiveTrial", trialId: trial.id });
    const settled = await store.dispatch({ type: "submitDecisions", trialId: trial.id, keep: trial.lines.map(line => line.lineId) });
    const draft = await store.dispatch({ type: "addTrial", variantId: edgeVariant });
    return [settled.status, settled.settlement.paySatang, draft.length];
  });
  test("O01", "กดยืนยันซื้อซ้ำและเปิดร้านใหม่ยังเจอออเดอร์เดิม", [39000, true, 1], async () => {
    const storage = memoryStorage();
    const store = createDemoStore({ storage });
    await store.dispatch({ type: "updatePurchase", variantId: defaultVariant, delta: 1 });
    const first = await checkout(store, "purchase", "same-click");
    const again = await checkout(store, "purchase", "same-click");
    return [first.dueSatang, first.id === again.id, createDemoStore({ storage }).read().orders.length];
  });
  test("O02", "ตะกร้าเปลี่ยนระหว่างยืนยันไม่คิดยอดเก่า", "draft-changed", async () => {
    const store = createDemoStore();
    await store.dispatch({ type: "updatePurchase", variantId: defaultVariant, delta: 1 });
    const signature = Warin.rules.checkoutSignature(store.read(), "purchase");
    await store.dispatch({ type: "updatePurchase", variantId: edgeVariant, delta: 1 });
    return rejectionMessage(() => checkout(store, "purchase", "changed", { signature }));
  });
  test("O03", "คำสั่งจากสองหน้าอ่านเครดิตล่าสุดก่อนเขียน", ["credit-unavailable", 2], async () => {
    const storage = memoryStorage();
    const first = createDemoStore({ storage });
    await checkout(first, "passport", "passport-cross-tab");
    const credit = first.read().credits[0];
    await first.dispatch({ type: "updatePurchase", variantId: edgeVariant, delta: 1 });
    const second = createDemoStore({ storage });
    await checkout(first, "purchase", "consume", { creditId: credit.id });
    await first.dispatch({ type: "updatePurchase", variantId: edgeVariant, delta: 1 });
    const result = await rejectionMessage(() => checkout(second, "purchase", "stale-credit", { creditId: credit.id }));
    return [result, first.read().orders.length];
  });
  test("S01", "ลบโปรไฟล์อย่างเดียวโดยคงออเดอร์", [null, 1], async () => {
    const store = createDemoStore();
    await checkout(store, "passport", "book");
    await store.dispatch({ type: "saveProfile", profile: Warin.catalog.sampleProfile });
    await store.dispatch({ type: "clearProfile" });
    return [store.read().profile, store.read().orders.length];
  });
  test("S02", "ข้อมูลเสียมีสถานะแจ้งและรีเซ็ตเฉพาะ key ร้าน", [true, false, "other"], async () => {
    const storage = memoryStorage({ [Warin.STORAGE_KEY]: "{", external: "other" });
    const store = createDemoStore({ storage });
    const before = store.info().corrupt;
    await store.dispatch({ type: "reset" });
    return [before, store.info().corrupt, storage.getItem("external")];
  });
  test("S03", "storage ใช้ไม่ได้ยังซื้อสมุดในหน่วยความจำได้", [false, 1], async () => {
    const store = createDemoStore({ storage: null });
    await checkout(store, "passport", "memory");
    return [store.info().persistent, store.read().orders.length];
  });

  Warin.runTests = async () => {
    const results = [];
    for (const { id, name, expected, fn } of tests) {
      let actual;
      let passed = false;
      try {
        actual = await fn();
        passed = same(actual, expected);
      } catch (error) {
        actual = error.message;
      }
      results.push({ id, name, expected, actual, passed });
    }
    return results;
  };

  if (typeof document !== "undefined") {
    Warin.runTests().then(results => {
      const failed = results.filter(result => !result.passed).length;
      const summary = document.querySelector("#test-summary");
      summary.dataset.total = results.length;
      summary.dataset.failed = failed;
      summary.textContent = "ผ่าน " + (results.length - failed) + " จาก " + results.length + " · ตก " + failed;
      for (const result of results) {
        const row = document.createElement("li");
        row.className = result.passed ? "test-pass" : "test-fail";
        row.textContent = (result.passed ? "ผ่าน " : "ตก ") + result.id + " · " + result.name +
          " | คาด " + JSON.stringify(result.expected) + " | ได้ " + JSON.stringify(result.actual);
        document.querySelector("#test-results").append(row);
      }
    });
  }
})();
