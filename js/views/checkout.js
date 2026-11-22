(() => {
  const Mono=globalThis.Mono,{views,catalog,rules,snapshotLines}=Mono;
  const {money,escape,icon,pageTitle,emptyState,orderLine,purchaseBalance,paymentNotice,breadcrumb,date}=views;
  function cart(state) {
    const lines=snapshotLines(state.cart),quote=rules.quotePurchase(lines,[],null);
    return `<div class="wrap page">${pageTitle("ตะกร้าสินค้า","ร้านออกค่าจัดส่งทั่วประเทศ")}${lines.length?`<div class="split-layout"><section class="panel"><h2>เสื้อที่เลือก</h2><ul class="order-lines">${lines.map(l=>orderLine(l,`<div class="line-actions"><span class="quantity-controls"><button type="button" data-action="quantity" data-variant="${l.variantId}" data-delta="-1" data-focus="minus-${l.variantId}" aria-label="ลดจำนวน ${l.name}">−</button><span>${l.quantity}</span><button type="button" data-action="quantity" data-variant="${l.variantId}" data-delta="1" data-focus="plus-${l.variantId}" aria-label="เพิ่มจำนวน ${l.name}">+</button></span><button class="text-button" type="button" data-action="remove-purchase" data-variant="${l.variantId}">นำออก</button></div>`)).join("")}</ul></section>
      <aside class="panel totals-panel"><h2>สรุปตะกร้า</h2>${purchaseBalance(quote)}<p class="form-note">มีโค้ดจากใบแนบ Kit? กรอกในหน้าถัดไปเพื่อลดค่าเสื้อ ฿99 ไม่มีขั้นต่ำ</p><a class="button full" href="#/checkout/purchase">ตรวจสอบคำสั่งซื้อ</a><a class="text-link" href="#/shop">เลือกเสื้อต่อ</a></aside></div>`:emptyState("ตะกร้ายังว่าง","เลือกเสื้อยืดหรือโปโลตัวที่ชอบ")}</div>`;
  }
  function checkout(mode,state,requestId) {
    const kit=mode==="kit",lines=kit?[]:snapshotLines(state.cart);
    if(!kit&&!lines.length)return `<div class="wrap page">${pageTitle("ยืนยันการซื้อ")}${emptyState("ยังไม่มีรายการให้ยืนยัน","เพิ่มเสื้อก่อนกลับมาทำรายการ")}</div>`;
    const quote=kit?{subtotalSatang:rules.KIT_PRICE,creditSatang:0,dueSatang:rules.KIT_PRICE}:rules.quotePurchase(lines,state.credits,null);
    return `<div class="wrap page">${breadcrumb(kit?"#/kit":"#/cart",kit?"กลับ Fabric Kit":"กลับตะกร้า")}${pageTitle(kit?"ยืนยัน Fabric Kit":"ยืนยันการซื้อ")}${paymentNotice()}
      <form class="split-layout" data-form="checkout" data-mode="${mode}" data-request="${escape(requestId)}" data-signature="${escape(rules.checkoutSignature(state,mode))}">
        <div class="stack"><section class="panel"><h2>ผู้รับตัวอย่าง</h2><p class="address">ลูกค้าสมมติ MONO<br>อาคารตัวอย่าง อำเภอสมมติ จังหวัดสมมติ 00000</p><p class="form-note">จัดส่งทั่วประเทศ ไม่ต้องเลือกสถาบัน · ร้านออกค่าส่ง Kit และเสื้อแยกกัน</p></section>
          <section class="panel"><h2>รายการ</h2>${kit?`<div class="inline-purchase"><img class="kit-thumb" src="./assets/fabrics/kit-chain-small.webp" alt="Fabric Kit การ์ดผ้าคล้องห่วงพร้อมปกคราฟต์" width="640" height="480" decoding="async"><div><strong>Fabric Kit · 1 ชุด</strong><p>ผ้าขาว 6 รหัส รหัสละ 1 ชิ้น · 10 × 10 ซม.</p><p>เก็บชุดไว้ได้ พร้อมโค้ดลดค่าเสื้อ ฿99 บนใบแนบ</p></div></div>`:`<ul class="order-lines">${lines.map(l=>orderLine(l)).join("")}</ul>`}</section>
          <section class="panel"><h2>ที่มาของลิงก์</h2><p>${views.sourceLabel(state.attribution)}</p><p class="form-note">บันทึกที่มาของลิงก์ที่เปิด แม้ได้รับลิงก์ที่แชร์ต่อ</p></section></div>
        <aside class="panel totals-panel"><h2>สรุปยอดชำระ</h2>${kit?"":`<label class="code-label" for="credit-code">โค้ดบนใบแนบ Fabric Kit</label><div class="code-entry"><input id="credit-code" name="credit" type="text" autocomplete="off" placeholder="เช่น KIT-001" aria-describedby="code-feedback"><button class="button secondary" type="button" data-action="apply-code">ตรวจโค้ด</button></div><p id="code-feedback" class="form-note" role="status">ลดค่าเสื้อ ฿99 ไม่มีขั้นต่ำ · ใช้ครั้งเดียว</p><a class="text-link" href="#/orders">ดูโค้ดที่ได้รับในประวัติ</a>`}
          <div id="checkout-balance">${purchaseBalance(quote)}</div><button class="button full" type="submit">${kit?"ยืนยันสั่ง Fabric Kit":"ยืนยันคำสั่งซื้อ"}</button></aside></form></div>`;
  }
  function order(state,o) {
    const kit=o.mode==="kit"||o.mode==="passport",issued=kit?state.credits.find(c=>c.issuedBy===o.id):null;
    return `<div class="wrap page narrow">${breadcrumb("#/orders","คำสั่งซื้อของฉัน")}<section class="panel confirmation"><span class="tile-icon">${icon("check")}</span>
      ${pageTitle(kit?(o.legacy?"รายการสมุดผ้าเดิม":"สั่ง Fabric Kit แล้ว"):"ยืนยันคำสั่งซื้อแล้ว",escape(o.id)+" · "+date(o.createdAt))}${paymentNotice()}
      ${o.legacy?'<p class="callout">ประวัติเดิม แสดงสินค้าและยอดตามใบยืนยันที่บันทึกไว้</p>':""}
      ${kit?`<p><strong>${escape(o.kitSnapshot?.name??"Fabric Passport (รายการเดิม)")}</strong> · 1 ชุด</p>${o.kitSnapshot?`<p>ผ้าขาว ${o.kitSnapshot.contents.length} รหัส · ${escape(o.kitSnapshot.swatchSize)}</p>`:""}`:`<ul class="order-lines">${o.lines.map(l=>orderLine(l)).join("")}</ul>`}
      ${purchaseBalance(o)}${o.creditId?`<p class="form-note">ใช้โค้ด ${escape(o.creditId)} กับรายการนี้แล้ว</p>`:""}
      ${issued?`<details class="kit-insert"><summary>เปิดใบแนบที่ได้รับกับพัสดุ (จำลอง)</summary><p class="eyebrow">MONO · THANK YOU</p><h2>เลือกผ้าที่ชอบ แล้วเลือกเสื้อของคุณ</h2><p>โค้ดลดค่าเสื้อ 99 บาท ไม่มีขั้นต่ำ ใช้หนึ่งครั้งต่อหนึ่งรายการซื้อเสื้อ ใช้กับ Kit ไม่ได้</p><strong class="issued-code" data-issued-code>${escape(issued.id)}</strong><p>${issued.usedBy?`ใช้แล้วกับ <a class="text-link" href="#/order/${escape(issued.usedBy)}">${escape(issued.usedBy)}</a>`:"พร้อมใช้กับเสื้อครั้งถัดไป"}</p><p class="form-note">รหัสบนชิ้นผ้า เช่น 24 ใช้ค้นรุ่นเสื้อ ส่วนโค้ดด้านบนใช้ลดราคา</p><a class="button" href="#/kit">เปิดคู่มือผ้า</a></details>`:""}
      ${!kit&&!o.legacy?views.receivedPanel(state,o):""}<p class="form-note">ที่มาลิงก์: ${views.sourceLabel(o.attribution)}</p>
      <div class="button-row"><a class="button" href="#/shop">เลือกเสื้อต่อ</a><a class="button secondary" href="#/orders">ดูคำสั่งซื้อทั้งหมด</a></div></section></div>`;
  }
  function orders(state) {
    return `<div class="wrap page narrow">${pageTitle("คำสั่งซื้อของฉัน","รายการสาธิตในเบราว์เซอร์นี้")}${state.orders.length?`<ul class="record-list">${state.orders.slice().reverse().map(o=>`<li><a class="record" href="#/order/${escape(o.id)}"><span><strong>${o.mode==="kit"?"Fabric Kit":o.mode==="passport"?"Fabric Passport (รายการเดิม)":"ซื้อเสื้อ"}</strong><span>${escape(o.id)} · ${date(o.createdAt)}</span><span>${o.deliveredAt?"ได้รับเสื้อแล้ว · "+date(o.deliveredAt):o.legacy?"ประวัติเดิม":"ยืนยันรายการแล้ว"}</span></span><strong>${money(o.dueSatang)}</strong></a></li>`).join("")}</ul>`:emptyState("ยังไม่มีคำสั่งซื้อ","ใบยืนยันและโค้ดจาก Kit จะอยู่ที่นี่")}
      ${views.followUpPanel(state)}${state.legacyTrials.length?`<details class="panel"><summary>รายการบริการเดิมที่บันทึกไว้</summary><p class="form-note">ประวัติเพื่ออ้างอิง ไม่เปิดบริการนี้ใน V6</p>${state.legacyTrials.map(t=>`<p>${escape(t.id)} · ${date(t.createdAt)} · ยอดที่บันทึก ${money(t.totalSatang)}${t.settlement?` · จ่ายเพิ่ม ${money(t.settlement.paySatang)} / คืน ${money(t.settlement.refundSatang)}`:""}</p>`).join("")}</details>`:""}
      <p><a class="text-link" href="#/insights">ดูตัวชี้วัดจากรายการสาธิต</a></p></div>`;
  }
  Object.assign(views,{cart,checkout,order,orders});
})();
