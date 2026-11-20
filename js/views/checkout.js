(() => {
  const Mono = globalThis.Mono;
  const { views, catalog, rules, snapshotLines } = Mono;
  const {
    money, date, escape, icon, breadcrumb, pageTitle, emptyState, priceRows,
    orderLine, trialBalance, purchaseBalance, paymentNotice, trialLabel
  } = views;

  function cart(state) {
    const lines = snapshotLines(state.cart);
    const quote = rules.quotePurchase(lines, state.credits);
    const eligible = rules.eligibleCredit(quote.subtotalSatang, state.credits);
    return `<div class="wrap page">
      ${pageTitle("ตะกร้าของคุณ", "", "ซื้อปกติ")}
      ${lines.length ? `<div class="split-layout">
        <section class="panel"><h2>สินค้าในตะกร้า</h2><ul class="order-lines">${lines.map(line => {
          const label = line.name + " " + line.colorName + " ไซซ์ " + line.size;
          return orderLine(line, `<div class="quantity-row">
            <button class="step" type="button" data-action="quantity" data-focus="minus-${line.variantId}" data-delta="-1" data-variant="${line.variantId}" aria-label="ลดจำนวน ${label}">${icon("minus")}</button>
            <span aria-label="จำนวน">${line.quantity}</span>
            <button class="step" type="button" data-action="quantity" data-focus="plus-${line.variantId}" data-delta="1" data-variant="${line.variantId}" aria-label="เพิ่มจำนวน ${label}" ${line.quantity >= 9 ? "disabled" : ""}>${icon("plus")}</button>
            <button class="text-button" type="button" data-action="remove-purchase" data-variant="${line.variantId}" aria-label="นำ ${label} ออก">นำออก</button>
          </div>`);
        }).join("")}</ul></section>
        <aside class="panel totals-panel">
          <h2>สรุปตะกร้า</h2>
          ${priceRows([["ยอดสินค้า", money(quote.subtotalSatang)], ["ค่าจัดส่ง", money(0)], ["ยอดก่อนใช้เครดิต", money(quote.subtotalSatang), "total"]])}
          ${eligible ? `<p class="callout">ใช้เครดิตสมุดผ้า ${money(rules.CREDIT_VALUE)} ได้ในหน้าถัดไป</p>` : ""}
          <a class="button full" href="#/checkout/purchase">ตรวจสอบคำสั่งซื้อ</a>
          <a class="text-link" href="#/shop">เลือกสินค้าต่อ</a>
        </aside>
      </div>` : emptyState("ตะกร้ายังว่าง", "เลือกเสื้อหรือกางเกงที่อยากลองใส่ทุกวัน")}
    </div>`;
  }

  function trialBox(state) {
    const lines = snapshotLines(state.trialCart);
    const active = Mono.activeTrial(state);
    if (active) {
      return `<div class="wrap page">
        ${pageTitle("กล่องลองที่บ้าน", "เปิดกล่องใหม่ได้เมื่อปิดกล่องปัจจุบัน", "Micro-Closet")}
        ${emptyState("กล่อง " + escape(active.id) + " · " + trialLabel(active),
          "ดูเวลาลอง เลือกเก็บหรือคืน และตรวจยอดของกล่องที่เปิดไว้",
          "#/trials/" + escape(active.id), "เปิดกล่องปัจจุบัน")}
      </div>`;
    }

    const slots = Array.from({ length: rules.TRIAL_LIMIT - lines.length }, () =>
      '<li class="empty-slot">ยังมีที่สำหรับเสื้อผ้าอีกหนึ่งชิ้น</li>'
    );
    const quote = rules.quoteTrial(lines);
    return `<div class="wrap page">
      ${pageTitle("กล่องลองที่บ้าน", "เลือกได้สูงสุด 3 ชิ้น ลอง 72 ชั่วโมงหลังรับกล่อง คืนส่วนที่ไม่เก็บที่คาเฟ่ตัวอย่าง", "Micro-Closet")}
      <div class="split-layout">
        <section class="panel">
          <h2>กล่องของคุณ <span class="muted">${lines.length}/3</span></h2>
          <ul class="order-lines">${lines.map(line => orderLine(line,
            `<button class="text-button" type="button" data-action="remove-trial" data-line="${escape(line.lineId)}" aria-label="นำ ${line.name} ออกจากกล่อง">นำออก</button>`
          )).join("")}${slots.join("")}</ul>
          <a class="button secondary" href="#/shop">เลือกเสื้อผ้าลงกล่อง</a>
        </section>
        <aside class="panel totals-panel">
          <h2>ยอดก่อนยืนยัน</h2>
          ${trialBalance(quote)}
          <p class="form-note">มัดจำเท่ากับราคาชิ้นที่แพงที่สุด ยอดส่วนที่ไม่มีหลักประกันแสดงไว้ให้ตรวจสอบก่อนรับกล่อง</p>
          ${lines.length ? '<a class="button full" href="#/checkout/trial">เลือกจุดคืนและยืนยัน</a>' : ""}
          <a class="text-link" href="#/trials">ประวัติกล่องลอง</a>
        </aside>
      </div>
    </div>`;
  }

  const checkoutLabels = {
    purchase: { title: "ยืนยันการซื้อ", href: "#/cart", back: "กลับตะกร้า", submit: "ยืนยันคำสั่งซื้อ" },
    passport: { title: "ยืนยันสมุดผ้า", href: "#/passport", back: "กลับ Fabric Passport", submit: "ยืนยันสั่งสมุดผ้า" },
    trial: { title: "ยืนยันกล่องลอง", href: "#/trial-box", back: "กลับกล่องลอง", submit: "ยืนยันกล่องลอง" }
  };

  function passportBalance() {
    return priceRows([["Fabric Passport", money(rules.PASSPORT_PRICE)], ["ค่าจัดส่ง", money(0)], ["ยอดชำระ", money(rules.PASSPORT_PRICE), "total"]]);
  }

  function checkout(mode, state, requestId) {
    const config = checkoutLabels[mode];
    const trial = mode === "trial";
    const passport = mode === "passport";
    const lines = snapshotLines(trial ? state.trialCart : state.cart);
    if (!passport && !lines.length) {
      return `<div class="wrap page">${pageTitle(config.title)}
        ${emptyState("ยังไม่มีรายการให้ยืนยัน", "เพิ่มสินค้าก่อนกลับมาทำรายการ")}</div>`;
    }
    if (trial && Mono.activeTrial(state)) return trialBox(state);

    const subtotal = rules.totalOf(lines);
    const credit = mode === "purchase" ? rules.eligibleCredit(subtotal, state.credits) : null;
    const hasUnused = state.credits.some(item => item.usedBy === null);
    const balance = trial ? trialBalance(rules.quoteTrial(lines))
      : passport ? passportBalance()
      : purchaseBalance(rules.quotePurchase(lines, state.credits, credit?.id));

    return `<div class="wrap page">
      ${breadcrumb(config.href, config.back)}
      ${pageTitle(config.title)}
      ${paymentNotice()}
      <form class="split-layout" data-form="checkout" data-mode="${mode}" data-request="${escape(requestId)}"
        data-signature="${escape(rules.checkoutSignature(state, mode))}">
        <div class="stack">
          <section class="panel">
            <h2>ผู้รับตัวอย่าง</h2>
            <p class="address">ลูกค้าตัวอย่าง MONO<br>อาคารตัวอย่าง เขตสมมติ กรุงเทพมหานคร</p>
          </section>
          <section class="panel">
            <h2>รายการ</h2>
            ${passport ? `<div class="inline-purchase"><span class="tile-icon">${icon("swatch")}</span>
              <div><strong>Fabric Passport</strong><p>ตัวอย่างผ้า 6 ชนิด · รับเครดิต ฿99</p></div></div>`
              : `<ul class="order-lines">${lines.map(line => orderLine(line)).join("")}</ul>`}
          </section>
          ${trial ? `<fieldset class="panel cafe-choices">
            <legend>เลือกคาเฟ่สำหรับส่งคืน</legend>
            <p>จุดคืนทั้งสามแห่งเป็นสถานที่สมมติ</p>
            ${catalog.cafes.map(cafe => `<label class="choice-row">
              <input type="radio" name="cafe" value="${cafe.id}" required>
              <span><strong>${cafe.name}</strong><span>${cafe.area} · ${cafe.hours}</span></span>
            </label>`).join("")}
          </fieldset>` : ""}
        </div>
        <aside class="panel totals-panel">
          <h2>${trial ? "สรุปมัดจำ" : "สรุปยอดชำระ"}</h2>
          ${credit ? `<label class="choice-row credit-choice"><input type="checkbox" name="credit" value="${credit.id}" checked>
            <span><strong>ใช้เครดิตสมุดผ้า ${money(rules.CREDIT_VALUE)}</strong><span>${credit.id} · ใช้ได้หนึ่งครั้ง</span></span>
          </label>` : mode === "purchase" && hasUnused
            ? `<p class="callout">เพิ่มอีก ${money(rules.CREDIT_MINIMUM - subtotal)} เพื่อใช้เครดิตสมุดผ้า</p>` : ""}
          <div id="checkout-balance">${balance}</div>
          ${trial ? '<p class="form-note">ระยะเวลาลองเริ่มเมื่อกดรับกล่อง กล่องที่มีของคืนจะปิดยอดหลังตรวจรับ</p>' : ""}
          <button class="button full" type="submit">${config.submit}</button>
        </aside>
      </form>
    </div>`;
  }

  function order(state, order) {
    const passport = order.mode === "passport";
    const issued = passport ? state.credits.find(credit => credit.issuedBy === order.id) : null;
    return `<div class="wrap page narrow">
      ${breadcrumb("#/orders", "คำสั่งซื้อของฉัน")}
      <section class="panel confirmation">
        <span class="tile-icon">${icon("check")}</span>
        ${pageTitle(passport ? "สั่งสมุดผ้าแล้ว" : "ยืนยันคำสั่งซื้อแล้ว", escape(order.id) + " · " + date(order.createdAt))}
        ${paymentNotice()}
        ${passport ? `<p class="callout">เครดิตสมุดผ้า ${issued ? escape(issued.id) : ""} ·
          ${issued?.usedBy ? "ใช้แล้วกับ " + escape(issued.usedBy) : "พร้อมใช้ ฿99 เมื่อยอดเสื้อผ้าครบ ฿499"}</p>` : ""}
        ${passport ? passportBalance() : `<ul class="order-lines">${order.lines.map(line => orderLine(line)).join("")}</ul>${purchaseBalance(order)}`}
        <div class="button-row"><a class="button" href="#/shop">${passport ? "เลือกเสื้อผ้าเพื่อใช้เครดิต" : "เลือกสินค้าต่อ"}</a>
          <a class="button secondary" href="#/orders">ดูคำสั่งซื้อทั้งหมด</a></div>
      </section>
    </div>`;
  }

  function orders(state) {
    return `<div class="wrap page narrow">
      ${pageTitle("คำสั่งซื้อของฉัน", "รายการที่ยืนยันในเบราว์เซอร์นี้")}
      ${state.orders.length ? `<ul class="record-list">${state.orders.slice().reverse().map(order => `<li>
        <a class="record" href="#/order/${escape(order.id)}">
          <span><strong>${order.mode === "passport" ? "Fabric Passport" : "ซื้อเสื้อผ้าปกติ"}</strong>
          <span>${escape(order.id)} · ${date(order.createdAt)}</span></span>
          <strong>${money(order.dueSatang)}</strong>
        </a></li>`).join("")}</ul>` : emptyState("ยังไม่มีคำสั่งซื้อ", "เมื่อยืนยันแล้ว ใบคำสั่งซื้อจะอยู่ที่นี่")}
    </div>`;
  }

  Object.assign(views, { cart, trialBox, checkout, order, orders });
})();
