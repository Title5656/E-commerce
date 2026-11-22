(() => {
  const {views,catalog,rules}=globalThis.Mono,{escape,date,pageTitle}=views;
  function sourceLabel(a) {
    if(!a || a.channel==="direct")return "เข้าเว็บโดยตรง";
    return `${a.channel==="facebook"?"Facebook":"TikTok"} · ${a.placement==="salaya-group"?"กลุ่มศาลายา":a.placement==="public-page"?"เพจสาธารณะ":"ไม่ระบุแหล่งเผยแพร่"}`;
  }
  function receivedPanel(state,o) {
    if(!o.deliveredAt)return `<div class="received-panel"><h2>ติดตามหลังสั่งซื้อ</h2><p>จำลองเมื่อพัสดุเสื้อถึงผู้รับ เพื่อเริ่มนับช่วงติดตาม 60 วัน</p><button class="button secondary" type="button" data-action="receive-order" data-id="${escape(o.id)}">จำลองได้รับเสื้อแล้ว</button></div>`;
    return `<div class="received-panel"><h2>ได้รับเสื้อแล้ว</h2><p>${date(o.deliveredAt)} · วันรับเสื้อสาธิต</p><p>หลังใส่จริง เสื้อรุ่นไหนและไซซ์ไหนพอดีกับคุณ?</p><ul class="favorite-lines">${o.lines.map(l=>`<li><span>${escape(l.name)} · ${escape(l.size)}</span><button class="text-button" type="button" data-action="save-favorite" data-id="${escape(o.id)}" data-line="${escape(l.lineId)}">ตัวนี้ใส่พอดี</button></li>`).join("")}</ul>${followUpPanel(state)}</div>`;
  }
  function followUpPanel(state) {
    const favorite=state.favorite,p=favorite&&catalog.findProduct(favorite.productId);
    let recommendation="";
    if(p) {
      const next=catalog.products.find(n=>n.category===p.category&&n.id!==p.id)??catalog.products[0];
      const row=next.chart.reduce((best,r)=>Math.abs(r.circumference-favorite.garmentChest)<Math.abs(best.circumference-favorite.garmentChest)?r:best);
      recommendation=`<p>ตัวที่ใส่พอดี: ${escape(p.name)} · ${escape(favorite.size)} · รหัสผ้า ${escape(favorite.fabricCode)}</p><p>หากอยากเปลี่ยนเนื้อผ้า ลองเริ่มเทียบ ${next.name} ไซซ์ ${row.size} จากรอบอกเสื้อ ${row.circumference} ซม. แล้วดูตารางและผ้าจริงอีกครั้ง</p><a class="text-link" href="#/product/${next.id}?size=${row.size}">ดูเสื้อที่แนะนำ</a>`;
    }
    return `<section class="panel follow-up"><h2>เสื้อตัวโปรดและครั้งถัดไป</h2>${recommendation||'<p>เมื่อได้รับเสื้อแล้ว เลือกตัวที่ใส่พอดีจากใบสั่งซื้อเพื่อใช้เป็นจุดเริ่มครั้งถัดไป</p>'}
      <label class="choice-row"><input type="checkbox" name="followUp" ${state.followUp.enabled?"checked":""}><span>สมัครใจรับการติดตามทาง LINE OA (จำลอง)</span></label><p class="form-note">${state.followUp.enabled?"เลือกรับการติดตามแล้ว":"ยังไม่ได้สมัครรับการติดตาม"} · เปลี่ยนใจได้ตลอด ไม่มีการเชื่อมต่อหรือส่งข้อความจริง</p>
      ${state.followUp.enabled?`<div class="callout"><strong>ตัวอย่างข้อความหลังใส่จริง</strong><p>เสื้อที่ได้รับสัมผัสผ้าเป็นอย่างไร รอบอกและความยาวพอดีไหม? ถ้ามีตัวที่ใส่พอดีแล้ว เราจะเริ่มเทียบรุ่นถัดไปจากขนาดและผ้าที่คุณชอบ</p></div>`:""}<p><a class="text-link" href="#/shop">กลับมาเลือกซื้อเองได้เสมอ</a></p></section>`;
  }
  function insights(state) {
    const m=rules.metrics(state,Date.now()),percent=n=>n===null?"ยังไม่มีฐานวัดผล":(n*100).toLocaleString("th-TH",{maximumFractionDigits:1})+"%";
    return `<div class="wrap page narrow">${pageTitle("ผลสาธิตและช่องทาง","นับจากรายการที่เกิดขึ้นในเครื่องนี้ แยกจากสมมติฐานยอดขายในรายงาน")}
      <section class="panel"><h2>การใช้โค้ด Fabric Kit</h2><p class="metric-value">${percent(m.redemptionRate)}</p><p>ใช้สิทธิ์ ${m.creditsUsed} ใบ / ขาย Kit ${m.kitsSold} ชุด</p></section>
      <section class="panel"><h2>ซื้อเสื้อครั้งที่สองภายใน 60 วัน</h2><p class="metric-value">${m.matureCustomers?percent(m.repeatRate):"ยังไม่มีผู้ติดตามครบ 60 วัน"}</p><p>ซื้อซ้ำ ${m.repeatCustomers} คน / ผู้รับเสื้อตัวแรกที่สังเกตครบช่วง ${m.matureCustomers} คน · รอครบช่วง ${m.pendingCustomers} คน</p><p class="form-note">เริ่มวันรับเสื้อตัวแรก นับคนและคำสั่งซื้อคนละรายการ ซื้อหลายตัวในบิลเดียวหรือ Kit แล้วซื้อเสื้อตัวแรกไม่นับเป็นซื้อเสื้อซ้ำ ประวัติรุ่นเดิมไม่มีวันรับจึงไม่เข้าฐานนี้</p></section>
      <section class="panel"><h2>ลิงก์ตัวอย่างการตลาด</h2><p>เดโมโพสต์เทียบผ้า เริ่มประชาสัมพันธ์ที่มหิดล ศาลายา และรับผู้ซื้อทั่วประเทศ ลิงก์ที่แชร์ต่อยังคงที่มาของลิงก์ไว้</p><div class="stack">
        <a class="text-link" href="#/product/polo-tc-micro?utm_source=facebook&utm_placement=salaya-group">Facebook · กลุ่มศาลายา → โปโลรหัส 24</a>
        <a class="text-link" href="#/shop?category=polo&utm_source=tiktok&utm_placement=public-page">TikTok · เพจสาธารณะ → เทียบโปโลรหัส 20 และ 24</a>
        <a class="text-link" href="#/product/tee-comb32?utm_source=facebook&utm_placement=public-page">Facebook · เพจสาธารณะ → เสื้อยืดรหัส 0</a></div></section>
      <p class="form-note">หนึ่งเบราว์เซอร์แทนลูกค้าสมมติหนึ่งคน กรณีลูกค้าหลายคนและผู้ครบช่วงดูใน tests.html ไม่มีการเติมยอดประมาณการลงประวัติ</p><a class="text-link" href="./tests.html">เปิดชุดทดสอบและตัวอย่างลูกค้าสมมติ</a></div>`;
  }
  Object.assign(views,{sourceLabel,receivedPanel,followUpPanel,insights});
})();
