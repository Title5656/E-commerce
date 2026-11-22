(() => {
  const { views, catalog, rules } = globalThis.Mono;
  const { money, escape, icon, breadcrumb, pageTitle, emptyState } = views;
  const codeOf = p => catalog.findFabric(p.fabricId).code;
  function catalogUrl(filters) {
    const q=new URLSearchParams();for(const [k,v] of Object.entries(filters))if(v)q.set(k,v);
    return "#/shop"+(q.size?"?"+q:"");
  }
  function productCard(p) {
    return `<article class="product-card" data-product="${p.id}">
      <a class="card-image" href="#/product/${p.id}"><img src="${catalog.productImage(p.id,"white")}" alt="ภาพจำลอง ${p.name} สีขาว" width="800" height="1000" loading="lazy"></a>
      <div class="product-meta"><p class="caption">รหัสผ้า ${codeOf(p)} · ${catalog.findFabric(p.fabricId).gsm} g/m²</p>
        <h3><a href="#/product/${p.id}">${p.name}</a></h3><div class="product-bottom"><strong>${money(p.unitSatang)}</strong><span class="caption">สีขาวสาธิต</span></div></div>
    </article>`;
  }
  function home() {
    return `<div class="wrap home">
      <section class="v6-hero" aria-labelledby="home-title"><div class="v6-hero-copy">
        <p class="eyebrow">MONO · EVERYDAY SHIRTS</p><h1 id="home-title">เสื้อเรียบง่าย<br>เลือกให้เป็นคุณ</h1>
        <p>เสื้อยืดและโปโล 6 รุ่น เริ่มต้น ${money(35000)}<br>เลือกเนื้อผ้าที่ชอบ เทียบไซซ์ที่ใช่ แล้วซื้อได้เลย</p>
        <a class="button" href="#/shop">เลือกซื้อเสื้อ ${icon("arrow-right")}</a>
        <p class="form-note">ส่งทั่วประเทศ · ร้านออกค่าจัดส่ง<br>ต้นแบบสาธิต ไม่มีการเรียกเก็บเงินจริง</p>
      </div><div class="v6-hero-images"><a href="#/product/tee-comb32"><img src="${catalog.productImage("tee-comb32","white")}" alt="ภาพจำลองเสื้อยืด Cotton Comb 32 สีขาว" width="800" height="1000"><span>คอกลม · ฿350</span></a>
        <a href="#/product/polo-tc-micro"><img src="${catalog.productImage("polo-tc-micro","white")}" alt="ภาพจำลองโปโล TC Micro สีขาว" width="800" height="1000"><span>คอปก · ฿490</span></a></div></section>
      <section class="featured"><div class="section-heading"><h2>เลือกเสื้อตัวถัดไป</h2><a class="action-link" href="#/shop">ดูทั้ง 6 รุ่น ${icon("arrow-right")}</a></div>
        <div class="product-grid">${[catalog.products[0],catalog.products[3],catalog.products[4],catalog.products[5]].map(productCard).join("")}</div>
        <p class="form-note">ภาพสร้างด้วย AI สี น้ำหนักผ้าและตารางขนาดเป็นข้อมูลสาธิต ต้องยืนยันกับล็อตผลิตจริงก่อนขาย</p></section>
      <section class="v6-services" aria-label="ตัวช่วยเลือกเสื้อ"><a class="panel" href="#/kit"><span class="tile-icon">${icon("swatch")}</span><h2>ยังไม่แน่ใจเรื่องผ้า?</h2><p>Fabric Kit ฿99 · ผ้าขาว 6 รหัส พร้อมโค้ดลดค่าเสื้อ ฿99 ไม่มีขั้นต่ำ เก็บชุดไว้ได้</p><span class="text-link">ดูชุดและคู่มือผ้า ${icon("arrow-right")}</span></a>
        <a class="panel" href="#/studio"><span class="tile-icon">${icon("fit")}</span><h2>อยากเทียบทรงก่อนเลือก?</h2><p>เปิด Fit-Twin หมุนหุ่นและเทียบไซซ์ของทั้งเสื้อยืดและโปโล ใช้ค่าตัวอย่างได้</p><span class="text-link">เข้าห้องลอง 3D ${icon("arrow-right")}</span></a></section>
      <p class="local-note">เริ่มเล่าเรื่องผ้าที่มหิดล ศาลายา เปิดรับผู้ซื้อทั่วประเทศตั้งแต่แรก · ซื้อเสื้อได้โดยไม่ต้องซื้อ Kit หรือเปิดหุ่น</p>
    </div>`;
  }
  function shop(query) {
    const category=Object.hasOwn(catalog.categories,query.get("category"))?query.get("category"):"";
    const color=Object.hasOwn(catalog.colors,query.get("color"))?query.get("color"):"";
    const q=(query.get("q")||"").trim(), numeric=/^[\d.]+$/.test(q);
    const exact=numeric?catalog.findByFabricCode(q):null;
    const terms=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const filtered=catalog.products.filter(p=>{
      const words=[p.name,p.english,catalog.categories[p.category],catalog.findFabric(p.fabricId).name].join(" ").toLocaleLowerCase();
      return (!category||category===p.category)&&(!color||p.colors.includes(color))&&(numeric?p===exact:terms.every(t=>words.includes(t)));
    });
    return `<div class="wrap page catalog-page">${pageTitle("เสื้อทั้งหมด","เสื้อยืด 4 รุ่น · โปโล 2 รุ่น · ซื้อได้โดยตรง","EVERYDAY COLLECTION")}
      <nav class="category-tabs" aria-label="ประเภทเสื้อ">${[["","ทั้งหมด"],...Object.entries(catalog.categories)].map(([k,n])=>`<a href="${escape(catalogUrl({category:k,color,q}))}" ${category===k?'aria-current="page"':""}>${n}</a>`).join("")}</nav>
      <form class="filters" data-form="filters" role="search"><label class="catalog-search">${icon("search")}<input id="catalog-query" type="search" name="q" value="${escape(q)}" placeholder="ชื่อเสื้อหรือรหัสผ้า เช่น 0, 2.1, 24" aria-label="ชื่อเสื้อหรือรหัสผ้า"></label>
        <input type="hidden" name="category" value="${category}"><label class="color-filter"><span class="sr-only">กรองตามสี</span><select name="color"><option value="">ทุกสี</option><option value="white" ${color?'selected':""}>ขาว (สีสาธิต)</option></select></label>
        <button class="filter-apply" type="submit">กรองสินค้า</button><div class="filter-status">${q||category||color?'<a class="text-link" href="#/shop">ล้างตัวกรอง</a>':""}<span>${filtered.length} รุ่น</span></div></form>
      ${filtered.length?`<div class="product-grid">${filtered.map(productCard).join("")}</div>`:emptyState("ไม่พบสินค้าที่ตรงกัน","รหัสผ้าต้องตรงทั้งรหัส เช่น 2.1 และ 2.2 เป็นคนละชนิด")}
      <p class="form-note">ภาพและสีขาวเป็นตัวอย่างสำหรับสาธิต ยังไม่ใช่รายการสีที่โรงงานยืนยัน</p></div>`;
  }
  function variantLinks(p,color,size) {
    const options=new URLSearchParams({color});if(size)options.set("size",size);
    const current=new URLSearchParams((location.hash.split("?")[1]??""));
    for(const key of ["utm_source","utm_placement"])if(current.has(key))options.set(key,current.get(key));
    const publicPage=new URL(location.protocol==="file:"?"https://title5656.github.io/E-commerce/":location.href);
    publicPage.search="";publicPage.hash="/product/"+p.id+"?"+options;
    return {product:publicPage.hash,studio:"#/studio?product="+p.id+"&"+options,share:"https://social-plugins.line.me/lineit/share?url="+encodeURIComponent(publicPage.href)};
  }
  function sizeTable(p) {
    return `<p class="form-note">${p.chartSource} · ล็อต ${p.lot}</p><div class="table-scroll"><table><thead><tr><th scope="col">ไซซ์</th><th scope="col">รอบอกเสื้อสำเร็จ (ซม.)</th><th scope="col">ยาวเสื้อ (ซม.)</th></tr></thead><tbody>${p.chart.map(r=>`<tr><th scope="row">${r.size}</th><td>${r.circumference}</td><td>${r.length}</td></tr>`).join("")}</tbody></table></div>`;
  }
  const measureGuide=()=>`<p>วางเสื้อตัวโปรดราบ วัดรักแร้ถึงรักแร้แล้วคูณ 2 เป็นรอบอกเสื้อสำเร็จ วัดความยาวจากจุดสูงสุดของไหล่ถึงชายเสื้อ แล้วเทียบหน่วยเซนติเมตรในตาราง</p><p class="form-note">รอบอกเสื้อสำเร็จต่างจากรอบอกหุ่น คำแนะนำใช้ระยะเผื่อรอบอกเท่านั้น ไม่รับรองความพอดีช่วงไหล่หรือผลหลังซัก</p>`;
  function productDetail(p,state,query) {
    const color=p.colors.includes(query.get("color"))?query.get("color"):p.colors[0],f=catalog.findFabric(p.fabricId);
    const recommendation=rules.recommendSize(state.profile,p.chart),size=catalog.sizes.includes(query.get("size"))?query.get("size"):recommendation?.size??"";
    const links=variantLinks(p,color,size);
    return `<div class="wrap page detail-page">${breadcrumb("#/shop","เสื้อทั้งหมด")}<div class="product-layout"><div class="detail-photos"><div class="gallery"><img id="product-image" src="${catalog.productImage(p.id,color)}" alt="ภาพจำลอง ${p.name} สีขาว" width="800" height="1000"></div><p class="form-note">${p.imageNote}</p></div>
      <div class="product-details"><p class="eyebrow">รหัสผ้า ${f.code} · ${p.english}</p><h1>${p.name}</h1><p class="large-price">${money(p.unitSatang)}</p><p class="product-description">${p.detail}</p>
        <p class="fabric-link"><a href="#/kit">${f.name} · รหัส ${f.code}</a><span>${f.gsm} g/m² (ตัวอย่าง)</span></p>
        <form class="product-options" data-form="variant" data-product="${p.id}"><fieldset><legend>สี <span data-color-name>${catalog.colors[color].name}</span></legend><div class="choices"><label class="chip color-chip"><input type="radio" name="color" value="white" checked><span><i style="--swatch:#f3f2ec"></i>ขาว</span></label></div></fieldset>
          <fieldset><legend>ไซซ์ <button class="text-button" type="button" data-action="size-chart">ดูตารางไซซ์</button></legend><div class="choices">${catalog.sizes.map(s=>`<label class="chip"><input type="radio" name="size" value="${s}" ${s===size?'checked':""} required><span>${s}</span></label>`).join("")}</div></fieldset>
          <a class="fit-link" href="${escape(links.studio)}">${icon("fit")}<span><strong>${recommendation?"แนะนำไซซ์ "+recommendation.size:"เทียบไซซ์ในห้องลอง 3D"}</strong><small>ใช้ระยะเผื่อรอบอกและตารางตัวอย่าง</small></span>${icon("arrow-right")}</a>
          <button class="button full" type="submit">${icon("shopping-bag")}เพิ่มลงตะกร้า · ${money(p.unitSatang)}</button><p class="form-note" data-variant-note aria-live="polite">จัดส่งทั่วประเทศ ร้านออกค่าจัดส่ง</p>
        </form><details class="size-details" id="size-chart"><summary>ตารางไซซ์และวิธีวัด</summary>${measureGuide()}${sizeTable(p)}</details>
        <a class="share-line" data-share-line href="${escape(links.share)}" target="_blank" rel="noopener noreferrer">${icon("line")}แชร์สินค้าทาง LINE</a></div></div></div>`;
  }
  function passport(state) {
    const count=state.credits.filter(c=>c.usedBy===null).length;
    return `<div class="wrap page passport-page"><section class="passport-hero"><div class="passport-intro">${pageTitle("สัมผัสผ้าก่อนเลือกเสื้อ","Fabric Kit รวมผ้าขาว 6 รหัส รหัสละ 1 ชิ้น ขนาด 10 × 10 ซม. เก็บชุดไว้เปรียบเทียบได้","FABRIC KIT")}
      <p class="passport-terms">ชุดละ <strong>${money(rules.KIT_PRICE)}</strong> พร้อมโค้ดบนใบแนบ ลดค่าเสื้อ ${money(rules.CREDIT_VALUE)} ไม่มีขั้นต่ำ</p><p>ร้านออกค่าจัดส่ง แยกส่ง Kit กับเสื้อ · เลือกซื้อเสื้อตรงได้เสมอ</p>
      <a class="button" href="#/checkout/kit">สั่ง Fabric Kit · ${money(rules.KIT_PRICE)} ${icon("arrow-right")}</a>${count?`<p class="form-note">มีโค้ดพร้อมใช้ ${count} ใบ · <a href="#/orders">เปิดใบแนบในประวัติ</a></p>`:""}</div>
      <figure class="kit-board"><img src="./assets/fabrics/kit-chain.webp" srcset="./assets/fabrics/kit-chain-small.webp 640w, ./assets/fabrics/kit-chain.webp 960w" sizes="(max-width: 760px) 92vw, 44vw" alt="ภาพ AI ของ Fabric Kit แบบการ์ดผ้าขาวคล้องห่วงโซ่ มีปกกระดาษคราฟต์สีน้ำตาลด้านหน้าและหลัง" width="960" height="720" decoding="async" fetchpriority="high"><figcaption>การ์ดผ้าคล้องห่วง · ปกคราฟต์หน้า–หลัง · ภาพแนวคิดสร้างด้วย AI</figcaption></figure></section>
      <section class="featured"><div class="section-heading"><h2>คู่มือผ้า · ชอบรหัสไหน เปิดเสื้อรุ่นนั้น</h2></div><p>นำชิ้นผ้าเทียบความทึบ สัมผัสและการทิ้งตัวภายใต้แสงเดียวกัน รหัสผ้าใช้ค้นสินค้า ส่วนโค้ดบนใบแนบใช้ลดราคา</p>
        <div class="fabric-grid">${catalog.fabrics.map(f=>`<article class="fabric-card"><img src="./assets/fabrics/${f.id}-white.webp" alt="ภาพจำลองผ้าขาวรหัส ${f.code} ${f.name}" width="520" height="310" loading="lazy"><div><p class="eyebrow">รหัส ${f.code} · ${f.gsm} g/m² ตัวอย่าง</p><h3>${f.name}</h3><p>${f.detail}</p><a class="text-link" href="#/product/${catalog.findByFabricCode(f.code).id}">เลือกเสื้อผ้ารหัส ${f.code} ${icon("arrow-right")}</a></div></article>`).join("")}</div></section>
      <section class="panel"><h2>ตัวอย่างโปโล 490 บาท</h2><p>จ่าย Kit 99 บาท แล้วใช้โค้ดลดค่าเสื้อ 99 บาท เหลือค่าเสื้อ 391 บาท รวมสองรายการ 490 บาท ใช้หนึ่งโค้ดต่อการซื้อเสื้อหนึ่งครั้ง</p></section></div>`;
  }
  function privacy() {
    return `<div class="wrap page narrow">${pageTitle("ข้อมูลบนอุปกรณ์")}<section class="panel"><h2>สิ่งที่ MONO บันทึก</h2><p>ตะกร้า คำสั่งซื้อ โค้ดส่วนลด ที่มาลิงก์และการติดตามจำลองเก็บในเบราว์เซอร์นี้ สัดส่วนบันทึกเมื่อคุณเลือกบันทึกเท่านั้น ผู้รับและที่อยู่เป็นข้อมูลสมมติ</p><p>หนึ่งเบราว์เซอร์แทนลูกค้าสมมติหนึ่งคน ผลสาธิตไม่ใช่ยอดขายจริง ไม่มีการส่งข้อความไป LINE OA</p><a class="text-link" href="#/studio">จัดการสัดส่วน</a></section>
      <section class="panel"><h2>ล้างข้อมูลร้าน</h2><p>ลบตะกร้า สัดส่วน โค้ด คำสั่งซื้อ ประวัติเก่าและการติดตามของ MONO บนอุปกรณ์นี้</p><button class="button secondary" type="button" data-action="ask-reset" aria-expanded="false">ล้างข้อมูลบนอุปกรณ์</button><div id="reset-controls" class="reset-controls" hidden><p>ยืนยันล้างข้อมูลของร้านทั้งหมดบนอุปกรณ์นี้</p><div class="button-row"><button class="button danger" type="button" data-action="reset">ยืนยันล้างข้อมูล</button><button class="button secondary" type="button" data-action="cancel-reset">ยกเลิก</button></div></div></section></div>`;
  }
  Object.assign(views,{home,shop,productDetail,passport,privacy,variantLinks,sizeTable,measureGuide});
})();
