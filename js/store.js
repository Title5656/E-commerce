(() => {
  const Warin = globalThis.Warin;
  const { catalog, rules } = Warin;
  const STORAGE_KEY = "itds294.warin.v1";
  const trialStatuses = ["awaiting_delivery", "trying", "awaiting_return", "settled", "review"];

  const newState = () => ({
    version: 1, cart: [], trialCart: [], orders: [], credits: [], trials: [], profile: null
  });
  const nonNegative = value => Number.isSafeInteger(value) && value >= 0;
  const string = value => typeof value === "string" && value.length > 0;
  const quantity = value => Number.isInteger(value) && value >= 1 && value <= 9;
  const optionalString = value => value === null || string(value);
  const optionalTime = value => value === null || nonNegative(value);
  const hasId = value => value && string(value.id);
  const hasReceiptFields = value => hasId(value) && string(value.requestId) && nonNegative(value.createdAt);
  const every = (value, check) => Array.isArray(value) && value.every(check);

  function validLine(item) {
    return item && [item.variantId, item.productId, item.name, item.color,
      item.colorName, item.size, item.lineId].every(string) &&
      nonNegative(item.unitSatang) && quantity(item.quantity);
  }

  function validTrial(trial) {
    return hasReceiptFields(trial) && trialStatuses.includes(trial.status) && string(trial.cafeId) &&
      every(trial.lines, validLine) && trial.lines.length > 0 && trial.lines.length <= rules.TRIAL_LIMIT &&
      [trial.totalSatang, trial.depositSatang, trial.exposureSatang].every(nonNegative) &&
      optionalTime(trial.startedAt) && optionalTime(trial.expiresAt) &&
      (trial.keep === null || every(trial.keep, id => trial.lines.some(line => line.lineId === id))) &&
      optionalString(trial.returnCode) &&
      (trial.settlement === null ||
        [trial.settlement.keptSatang, trial.settlement.depositSatang, trial.settlement.paySatang,
          trial.settlement.refundSatang, trial.settlement.closedAt].every(nonNegative));
  }

  function decode(raw) {
    if (raw === null) return newState();
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 ||
        !every(value.cart, line => line && catalog.resolveVariant(line.variantId) && quantity(line.quantity)) ||
        !every(value.trialCart, line => line && string(line.lineId) && catalog.resolveVariant(line.variantId)) ||
        value.trialCart.length > rules.TRIAL_LIMIT ||
        !every(value.orders, order => hasReceiptFields(order) && ["purchase", "passport"].includes(order.mode) &&
          every(order.lines, validLine) && optionalString(order.creditId) &&
          [order.subtotalSatang, order.creditSatang, order.dueSatang].every(nonNegative)) ||
        !every(value.credits, credit => hasId(credit) && string(credit.issuedBy) && optionalString(credit.usedBy)) ||
        !every(value.trials, validTrial) ||
        (value.profile !== null && !catalog.isProfile(value.profile))) {
      throw new Error("Invalid store state");
    }
    return value;
  }

  function reject(code, message) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  function snapshotLines(draft) {
    return draft.map(line => ({
      ...catalog.resolveVariant(line.variantId),
      lineId: line.lineId ?? line.variantId,
      quantity: line.quantity ?? 1
    }));
  }

  const activeTrial = state => state.trials.find(trial => trial.status !== "settled") ?? null;
  const numberId = (prefix, items) => prefix + "-" + String(items.length + 1).padStart(3, "0");

  function requireAvailableTrial(state) {
    if (activeTrial(state)) reject("active-trial", "มีกล่องลองที่ยังเปิดอยู่ ไปที่หน้าติดตามเพื่อจัดการกล่องเดิม");
  }

  function requireStatus(trial, status) {
    if (trial.status !== status) reject("trial-status", "กล่องนี้ยังทำรายการในขั้นตอนนี้ไม่ได้");
  }

  function settle(trial, now) {
    trial.settlement = { ...rules.quoteSettlement(trial.lines, trial.depositSatang, trial.keep), closedAt: now };
    trial.status = "settled";
    return trial;
  }

  function checkout(state, action, now) {
    if (!["purchase", "passport", "trial"].includes(action.mode) ||
        !string(action.requestId) || action.requestId.length > 128) {
      reject("checkout-input", "เปิดหน้าชำระรายการอีกครั้ง");
    }
    const existing = action.mode === "trial" ? state.trials : state.orders;
    const duplicate = existing.find(record => record.requestId === action.requestId);
    if (duplicate) return duplicate;
    if (rules.checkoutSignature(state, action.mode) !== action.signature) {
      reject("draft-changed", "รายการเปลี่ยนแล้ว กรุณาตรวจยอดล่าสุดก่อนยืนยัน");
    }

    if (action.mode === "trial") {
      requireAvailableTrial(state);
      if (state.trialCart.length === 0 || !catalog.findCafe(action.cafeId)) {
        reject("trial-input", "เพิ่มสินค้าและเลือกคาเฟ่ก่อนยืนยันกล่องลอง");
      }
      const lines = snapshotLines(state.trialCart);
      const trial = {
        id: numberId("TR", state.trials), requestId: action.requestId, createdAt: now,
        status: "awaiting_delivery", cafeId: action.cafeId, lines, ...rules.quoteTrial(lines),
        startedAt: null, expiresAt: null, keep: null, returnCode: null,
        settlement: null, issue: null, demoExpired: false
      };
      state.trials.push(trial);
      state.trialCart = [];
      return trial;
    }

    const passport = action.mode === "passport";
    const lines = passport ? [] : snapshotLines(state.cart);
    if (!passport && lines.length === 0) reject("empty-cart", "ยังไม่มีสินค้าในตะกร้า");
    const quote = passport
      ? { subtotalSatang: rules.PASSPORT_PRICE, creditSatang: 0, dueSatang: rules.PASSPORT_PRICE, creditId: null }
      : rules.quotePurchase(lines, state.credits, action.creditId);
    if (action.creditId && quote.creditId !== action.creditId) {
      reject("credit-unavailable", "เครดิตใบนี้ใช้ไม่ได้แล้ว กรุณาตรวจยอดใหม่");
    }
    const order = {
      id: numberId("ORD", state.orders), requestId: action.requestId, createdAt: now,
      mode: action.mode, lines, ...quote
    };
    if (passport) {
      state.credits.push({ id: numberId("FP", state.credits), issuedBy: order.id, usedBy: null });
    } else {
      if (quote.creditId) state.credits.find(credit => credit.id === quote.creditId).usedBy = order.id;
      state.cart = [];
    }
    state.orders.push(order);
    return order;
  }

  const actions = {
    updatePurchase(state, { variantId, delta }) {
      if (!catalog.resolveVariant(variantId) || ![-1, 1].includes(delta)) {
        reject("invalid-variant", "เลือกสีและไซส์ก่อนเพิ่มสินค้า");
      }
      const line = state.cart.find(item => item.variantId === variantId);
      const count = (line?.quantity ?? 0) + delta;
      if (count > 9) reject("purchase-limit", "เพิ่มได้สูงสุด 9 ชิ้นต่อสีและไซส์");
      if (count <= 0) {
        state.cart = state.cart.filter(item => item.variantId !== variantId);
      } else if (line) {
        line.quantity = count;
      } else {
        state.cart.push({ variantId, quantity: count });
      }
      return state.cart;
    },
    removePurchase(state, { variantId }) {
      state.cart = state.cart.filter(item => item.variantId !== variantId);
      return state.cart;
    },
    addTrial(state, { variantId }, now, makeId) {
      requireAvailableTrial(state);
      if (!catalog.resolveVariant(variantId)) reject("invalid-variant", "เลือกสีและไซส์ก่อนเพิ่มสินค้า");
      if (state.trialCart.length >= rules.TRIAL_LIMIT) reject("trial-full", "กล่องลองเต็มแล้ว เลือกได้สูงสุด 3 ชิ้น");
      state.trialCart.push({ lineId: makeId(), variantId });
      return state.trialCart;
    },
    removeTrial(state, { lineId }) {
      state.trialCart = state.trialCart.filter(line => line.lineId !== lineId);
      return state.trialCart;
    },
    saveProfile(state, { profile }) {
      if (!catalog.isProfile(profile)) reject("invalid-profile", "ตรวจสัดส่วนให้อยู่ในช่วงที่กำหนด");
      state.profile = profile;
      return state.profile;
    },
    clearProfile(state) {
      state.profile = null;
    },
    checkout
  };

  const trialActions = {
    receiveTrial(trial, action, now) {
      if (trial.status === "trying") return trial;
      requireStatus(trial, "awaiting_delivery");
      trial.status = "trying";
      trial.startedAt = now;
      trial.expiresAt = now + rules.TRIAL_LENGTH_MS;
      return trial;
    },
    expireDemo(trial, action, now) {
      requireStatus(trial, "trying");
      trial.expiresAt = Math.min(trial.expiresAt, now);
      trial.demoExpired = true;
      return trial;
    },
    submitDecisions(trial, { keep }, now) {
      if (["awaiting_return", "settled"].includes(trial.status)) return trial;
      requireStatus(trial, "trying");
      if (!every(keep, id => trial.lines.some(line => line.lineId === id)) || new Set(keep).size !== keep.length) {
        reject("invalid-selection", "ตรวจรายการที่เลือกเก็บและส่งคืน");
      }
      trial.keep = keep;
      if (keep.length === trial.lines.length) return settle(trial, now);
      trial.status = "awaiting_return";
      trial.returnCode = "WRN-" + trial.id;
      return trial;
    },
    completeReturn(trial, action, now) {
      if (trial.status === "settled") return trial;
      requireStatus(trial, "awaiting_return");
      return settle(trial, now);
    },
    reportIssue(trial, { issue }) {
      requireStatus(trial, "awaiting_return");
      if (!["damage", "loss"].includes(issue)) reject("invalid-issue", "ระบุปัญหาก่อนบันทึก");
      trial.issue = issue;
      trial.status = "review";
      return trial;
    }
  };

  function createStore({ storage, getNow = Date.now, makeId, runExclusive = task => task() }) {
    let persistent = !!storage;
    let corrupt = false;
    let state = newState();

    function refresh() {
      if (!persistent) return;
      let raw;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        persistent = false;
        return;
      }
      try {
        state = decode(raw);
        corrupt = false;
      } catch {
        state = newState();
        corrupt = true;
      }
    }

    function save(next, clear = false) {
      if (persistent) {
        try {
          if (clear) storage.removeItem(STORAGE_KEY);
          else storage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          persistent = false;
        }
      }
      state = next;
      corrupt = false;
    }

    function apply(action) {
      refresh();
      if (action.type === "reset") {
        save(newState(), true);
        return;
      }
      if (corrupt) reject("corrupt-storage", "ข้อมูลเดโมเปิดไม่ได้ กรุณารีเซ็ตก่อนทำรายการ");
      const next = structuredClone(state);
      const now = getNow();
      let result;
      if (Object.hasOwn(actions, action.type)) {
        result = actions[action.type](next, action, now, makeId);
      } else if (Object.hasOwn(trialActions, action.type)) {
        const trial = next.trials.find(item => item.id === action.trialId);
        if (!trial) reject("missing-trial", "ไม่พบกล่องลองในเบราว์เซอร์นี้");
        result = trialActions[action.type](trial, action, now);
      } else {
        reject("invalid-action", "ทำรายการนี้ไม่ได้");
      }
      save(next);
      return structuredClone(result);
    }

    refresh();
    return {
      read: () => structuredClone(state),
      info: () => ({ corrupt, persistent }),
      refresh,
      dispatch: action => Promise.resolve().then(() => runExclusive(() => apply(action)))
    };
  }

  Warin.createStore = createStore;
  Warin.STORAGE_KEY = STORAGE_KEY;
  Warin.activeTrial = activeTrial;
  Warin.snapshotLines = snapshotLines;
})();
