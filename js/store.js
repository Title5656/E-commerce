(() => {
  const Mono = globalThis.Mono, { catalog, rules } = Mono;
  const STORAGE_KEY = "mono.v2", LEGACY_KEY = "itds294.warin.v1";
  const newState = () => ({ version: 2, customerId: "demo-local", cart: [], orders: [], credits: [],
    legacyTrials: [], profile: null, favorite: null, followUp: { enabled: false, updatedAt: null },
    attribution: { channel: "direct", placement: "direct" }, migrationNotice: null });
  const nonNegative = v => Number.isSafeInteger(v) && v >= 0;
  const string = v => typeof v === "string" && v.length > 0;
  const qty = v => Number.isInteger(v) && v >= 1 && v <= 9;
  const optionalString = v => v === null || string(v);
  const optionalTime = v => v === null || nonNegative(v);
  const every = (v, fn) => Array.isArray(v) && v.every(fn);
  const unique = (a, key) => new Set(a.map(v => v[key])).size === a.length;
  function validLine(l) {
    return l && [l.variantId,l.productId,l.name,l.color,l.colorName,l.size,l.lineId].every(string) && nonNegative(l.unitSatang) && qty(l.quantity);
  }
  function validOrder(o) {
    return o && [o.id,o.requestId].every(string) && nonNegative(o.createdAt) && ["purchase","kit","passport"].includes(o.mode) &&
      every(o.lines,validLine) && optionalString(o.creditId) &&
      [o.subtotalSatang,o.creditSatang,o.dueSatang].every(nonNegative) && o.subtotalSatang - o.creditSatang === o.dueSatang;
  }
  const validCredit = c => c && string(c.id) && string(c.issuedBy) && optionalString(c.usedBy);
  const validLegacyTrial = t => t && string(t.id) && nonNegative(t.createdAt) && nonNegative(t.totalSatang) &&
    (t.settlement === null || t.settlement && nonNegative(t.settlement.paySatang) && nonNegative(t.settlement.refundSatang));
  function decode(raw) {
    const v = JSON.parse(raw);
    if (!v || v.version !== 2 || !string(v.customerId) ||
      !every(v.cart,l => l && catalog.resolveVariant(l.variantId) && qty(l.quantity)) ||
      !every(v.orders,o => validOrder(o) && string(o.customerId) && optionalTime(o.deliveredAt)) ||
      !every(v.credits,validCredit) || !unique(v.orders,"id") || !unique(v.orders,"requestId") || !unique(v.credits,"id") ||
      !every(v.legacyTrials,validLegacyTrial) || (v.profile !== null && !catalog.isProfile(v.profile)) ||
      !v.followUp || typeof v.followUp.enabled !== "boolean" || !optionalTime(v.followUp.updatedAt) ||
      (v.favorite !== null && (!v.favorite || !string(v.favorite.productId) || !catalog.sizes.includes(v.favorite.size))) ||
      !optionalString(v.migrationNotice)) throw new Error("Invalid store state");
    v.attribution = rules.attribution(v.attribution);
    return v;
  }
  function migrate(raw) {
    const old = JSON.parse(raw);
    if (!old || old.version !== 1 || !every(old.orders,validOrder) || !every(old.credits,validCredit) ||
      !every(old.cart,l => l && string(l.variantId) && qty(l.quantity)) || !every(old.trials,validLegacyTrial) || !Array.isArray(old.trialCart)) throw new Error("Invalid legacy state");
    const next = newState();
    next.orders = old.orders.map(o => ({ ...o, legacy: true, customerId: next.customerId, deliveredAt: null }));
    next.credits = old.credits;
    next.profile = catalog.isProfile(old.profile) ? old.profile : null;
    next.legacyTrials = old.trials;
    next.cart = old.cart.filter(l => catalog.resolveVariant(l.variantId));
    const removed = old.cart.length - next.cart.length;
    next.migrationNotice = `อัปเดตร้านเป็น MONO V6 แล้ว เก็บประวัติและโค้ดเดิมไว้${removed ? ` นำสินค้าที่เลิกขาย ${removed} รายการออกจากตะกร้า` : ""}${old.trialCart.length ? " และล้างรายการลองที่ยังไม่ยืนยัน" : ""}`;
    return decode(JSON.stringify(next));
  }
  function reject(code,message) { const e=new Error(message); e.code=code; throw e; }
  const snapshotLines = draft => draft.map(l => ({ ...catalog.resolveVariant(l.variantId), lineId:l.variantId, quantity:l.quantity }));
  function numberId(prefix,items) { let n=items.length+1; while(items.some(i=>i.id===prefix+"-"+String(n).padStart(3,"0"))) n++; return prefix+"-"+String(n).padStart(3,"0"); }
  function checkout(state,action,now) {
    const mode = action.mode === "passport" ? "kit" : action.mode;
    if (!["kit","purchase"].includes(mode) || !string(action.requestId) || action.requestId.length>128) reject("checkout-input","เปิดหน้ายืนยันรายการอีกครั้ง");
    const duplicate=state.orders.find(o=>o.requestId===action.requestId);
    if (duplicate) return duplicate;
    if (rules.checkoutSignature(state,mode)!==action.signature) reject("draft-changed","รายการเปลี่ยนแล้ว กรุณาตรวจยอดล่าสุดก่อนยืนยัน");
    const kit=mode==="kit", lines=kit?[]:snapshotLines(state.cart);
    if (!kit && !lines.length) reject("empty-cart","ยังไม่มีสินค้าในตะกร้า");
    const code=typeof action.creditId==="string"?action.creditId.trim():null;
    const quote=kit?{subtotalSatang:rules.KIT_PRICE,creditSatang:0,dueSatang:rules.KIT_PRICE,creditId:null}:rules.quotePurchase(lines,state.credits,code);
    if (code && quote.creditId!==code) reject("credit-unavailable",kit?"โค้ดใช้ลดค่าเสื้อเท่านั้น ใช้กับ Fabric Kit ไม่ได้":"โค้ดไม่ถูกต้องหรือใช้แล้ว กรุณาตรวจใบแนบและยอดล่าสุด");
    const order={id:numberId("ORD",state.orders),requestId:action.requestId,createdAt:now,customerId:state.customerId,
      mode,lines,...quote,deliveredAt:null,attribution:rules.attribution(action.attribution??state.attribution),legacy:false};
    if (kit) {
      order.kitSnapshot={name:"Fabric Kit",quantity:1,unitSatang:rules.KIT_PRICE,swatchSize:"10 × 10 ซม.",
        contents:catalog.fabrics.map(f=>({code:f.code,name:f.name,gsm:f.gsm,color:"ขาว",quantity:1}))};
      state.credits.push({id:numberId("KIT",state.credits),issuedBy:order.id,usedBy:null});
    } else {
      if (quote.creditId) state.credits.find(c=>c.id===quote.creditId).usedBy=order.id;
      state.cart=[];
    }
    state.orders.push(order); return order;
  }
  const actions = {
    updatePurchase(s,{variantId,delta}) {
      if (!catalog.resolveVariant(variantId) || ![-1,1].includes(delta)) reject("invalid-variant","เลือกสีและไซซ์ก่อนเพิ่มสินค้า");
      const line=s.cart.find(l=>l.variantId===variantId), count=(line?.quantity??0)+delta;
      if(count>9) reject("purchase-limit","เพิ่มได้สูงสุด 9 ชิ้นต่อสีและไซซ์");
      if(count<=0) s.cart=s.cart.filter(l=>l.variantId!==variantId);
      else if(line) line.quantity=count;
      else s.cart.push({variantId,quantity:count});
      return s.cart;
    },
    removePurchase(s,{variantId}) { s.cart=s.cart.filter(l=>l.variantId!==variantId); return s.cart; },
    saveProfile(s,{profile}) { if(!catalog.isProfile(profile))reject("invalid-profile","ตรวจสัดส่วนให้อยู่ในช่วงที่กำหนด"); s.profile=profile;return profile; },
    clearProfile(s) { s.profile=null; },
    dismissMigration(s) { s.migrationNotice=null; },
    setAttribution(s,{attribution}) { s.attribution=rules.attribution(attribution);return s.attribution; },
    receiveOrder(s,{orderId},now) {
      const o=s.orders.find(o=>o.id===orderId);
      if(!o || o.mode!=="purchase" || o.legacy) reject("invalid-order","เลือกรายการเสื้อปัจจุบันก่อนจำลองรับเสื้อ");
      o.deliveredAt??=now; return o;
    },
    setFollowUp(s,{enabled},now) {
      if(typeof enabled!=="boolean")reject("invalid-consent","เลือกสถานะการติดตาม");
      s.followUp={enabled,updatedAt:now};return s.followUp;
    },
    saveFavorite(s,{orderId,lineId}) {
      const o=s.orders.find(o=>o.id===orderId), l=o?.lines.find(l=>l.lineId===lineId);
      if(!o?.deliveredAt || !l || !catalog.findProduct(l.productId))reject("invalid-favorite","รับเสื้อก่อนเลือกตัวที่ใส่พอดี");
      s.favorite={productId:l.productId,size:l.size,color:l.color,fabricCode:l.fabricCode,garmentChest:l.garmentChest};
      return s.favorite;
    },
    checkout
  };
  function createStore({storage,getNow=Date.now,runExclusive=task=>task()}) {
    let persistent=!!storage,corrupt=false,state=newState();
    function refresh() {
      if(!persistent)return;
      let raw,old;
      try {raw=storage.getItem(STORAGE_KEY);if(raw===null)old=storage.getItem(LEGACY_KEY);} catch {persistent=false;return;}
      try {
        state=raw!==null?decode(raw):old!==null && old!==undefined?migrate(old):newState();corrupt=false;
        if(raw===null && old) {try{storage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{persistent=false;}}
      } catch {state=newState();corrupt=true;}
    }
    function save(next) {
      if(persistent)try{storage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{persistent=false;}
      state=next;corrupt=false;
    }
    function apply(action) {
      refresh();
      if(action.type==="reset") {
        if(persistent)try{storage.removeItem(LEGACY_KEY);}catch{persistent=false;}
        save(newState());return;
      }
      if(corrupt)reject("corrupt-storage","ข้อมูลเดโมเปิดไม่ได้ กรุณารีเซ็ตก่อนทำรายการ");
      if(!Object.hasOwn(actions,action.type))reject("invalid-action","ทำรายการนี้ไม่ได้");
      const next=structuredClone(state),result=actions[action.type](next,action,getNow());save(next);return structuredClone(result);
    }
    refresh();
    return {read:()=>structuredClone(state),info:()=>({persistent,corrupt}),refresh,
      dispatch:action=>Promise.resolve().then(()=>runExclusive(()=>apply(action)))};
  }
  Object.assign(Mono,{createStore,STORAGE_KEY,LEGACY_KEY,snapshotLines});
})();
