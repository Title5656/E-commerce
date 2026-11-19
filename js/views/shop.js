(() => {
  const { views, catalog, rules } = globalThis.Warin;
  const { money, escape, icon, breadcrumb, pageTitle, emptyState, swatches } = views;

  function productCard(product, preferredColor) {
    const color = product.colors.includes(preferredColor) ? preferredColor : product.colors[0];
    const href = "#/product/" + product.id + (preferredColor ? "?color=" + color : "");
    return `<article class="product-card">
      <a class="card-image" href="${href}" aria-label="${product.name}">
        <img src="${catalog.productImage(product.id, color)}" alt="${product.name} สี${catalog.colors[color].name}" width="640" height="700" loading="lazy">
      </a>
      <div class="product-meta">
        <p class="caption">${product.english}</p>
        <h3><a href="${href}">${product.name}</a></h3>
        <div class="product-bottom"><strong>${money(product.unitSatang)}</strong>${swatches(product.colors)}</div>
      </div>
    </article>`;
  }

  function home() {
    return `<div class="wrap home">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Everyday essentials</p>
          <h1>เบสิกที่เลือกง่าย<br>ใส่ได้ทุกวัน</h1>
          <p>รู้จักเนื้อผ้า เทียบไซส์ที่เหมาะกับคุณ แล้วเลือกเสื้อผ้าที่อยากหยิบมาใส่ทุกวัน</p>
          <div class="button-row"><a class="button" href="#/shop">เลือกซื้อเสื้อผ้า</a><a class="button secondary" href="#/studio">ลองเทียบไซส์</a></div>
        </div>
        <figure class="hero-art">
          <img src="./assets/hero.svg" alt="ภาพประกอบเสื้อยืดสีมะกอก เชิ้ตสีโอ๊ตมีล และสมุดตัวอย่างผ้า WARIN" width="840" height="720">
          <figcaption>เสื้อผ้าโทนธรรมชาติ · คอลเลกชัน Everyday</figcaption>
        </figure>
      </section>
      <section class="service-grid" aria-label="ตัวช่วยเลือกเสื้อผ้า">
        <a class="service" href="#/passport">
          <span class="tile-icon">${icon("swatch")}</span>
          <div><h2>Fabric Passport</h2><p>ตัวอย่างผ้า 6 ชนิด · รับเครดิต ฿99</p></div>
        </a>
        <a class="service" href="#/studio">
          <span class="tile-icon">${icon("fit")}</span>
          <div><h2>Fit-Twin Studio</h2><p>ปรับสัดส่วนและเทียบทรงก่อนเลือกไซส์</p></div>
        </a>
        <a class="service" href="#/trial-box">
          <span class="tile-icon">${icon("box")}</span>
          <div><h2>Micro-Closet</h2><p>เลือกลองที่บ้านได้สูงสุด 3 ชิ้น</p></div>
        </a>
      </section>
      <section class="featured">
        <div class="section-heading">
          <div><p class="eyebrow">คอลเลกชัน Everyday</p><h2>ตัวพื้นฐานที่หยิบใส่ง่าย</h2></div>
          <a class="text-link" href="#/shop">ดูสินค้าทั้งหมด</a>
        </div>
        <div class="product-grid">${catalog.products.slice(0, 4).map(product => productCard(product)).join("")}</div>
      </section>
    </div>`;
  }

  function shop(query) {
    const category = Object.hasOwn(catalog.categories, query.get("category")) ? query.get("category") : "";
    const color = Object.hasOwn(catalog.colors, query.get("color")) ? query.get("color") : "";
    const filtered = catalog.products.filter(product =>
      (!category || product.category === category) && (!color || product.colors.includes(color))
    );

    return `<div class="wrap page">
      ${pageTitle("เสื้อผ้าทุกวัน", "เสื้อและกางเกงสีธรรมชาติ จับคู่กับตัวที่มีอยู่แล้วได้ง่าย", "Everyday Collection")}
      <form class="filters" data-form="filters">
        <label>ประเภท<select name="category"><option value="">ทุกประเภท</option>
          ${Object.entries(catalog.categories).map(([key, name]) => `<option value="${key}" ${key === category ? "selected" : ""}>${name}</option>`).join("")}
        </select></label>
        <label>สี<select name="color"><option value="">ทุกสี</option>
          ${Object.entries(catalog.colors).map(([key, value]) => `<option value="${key}" ${key === color ? "selected" : ""}>${value.name}</option>`).join("")}
        </select></label>
        <button class="button secondary" type="submit">กรองสินค้า</button>
        ${category || color ? '<a class="text-link" href="#/shop">ล้างตัวกรอง</a>' : ""}
        <span class="filter-count">${filtered.length} รุ่น</span>
      </form>
      ${filtered.length
        ? `<div class="product-grid">${filtered.map(product => productCard(product, color)).join("")}</div>`
        : emptyState("ยังไม่มีสีในหมวดนี้", "ลองเปลี่ยนประเภทหรือเลือกทุกสี", "#/shop", "ดูเสื้อผ้าทั้งหมด")}
    </div>`;
  }

  function productDetail(product, state, query) {
    const requestedColor = query.get("color");
    const color = product.colors.includes(requestedColor) ? requestedColor : product.colors[0];
    const fabric = catalog.findFabric(product.fabricId);
    const recommendation = product.studio ? rules.recommendSize(state.profile, product.chart) : null;
    const size = catalog.sizes.includes(query.get("size")) ? query.get("size") : recommendation?.size ?? "";
    const bottom = ["shorts", "trousers"].includes(product.category);
    const sizeNote = !product.studio ? "" : state.profile
      ? recommendation
        ? `<strong>แนะนำไซส์ ${recommendation.size}</strong><span>ระยะเผื่อรอบอก ${recommendation.ease} ซม.</span>`
        : "<strong>ลองดูตารางไซส์ประกอบ</strong><span>ยังไม่มีไซส์พอดีจากรอบอกที่บันทึกไว้</span>"
      : "<strong>ขอคำแนะนำไซส์จาก Fit-Twin</strong><span>ใช้สัดส่วนตัวอย่างได้ทันที</span>";
    return `<div class="wrap page">
      ${breadcrumb("#/shop", "เสื้อผ้าทุกวัน")}
      <div class="product-layout">
        <div class="gallery">
          <img id="product-image" src="${catalog.productImage(product.id, color)}" alt="${product.name} สี${catalog.colors[color].name}" width="640" height="700">
        </div>
        <div class="product-details">
          <p class="eyebrow">${product.english}</p>
          <h1>${product.name}</h1>
          <p class="large-price">${money(product.unitSatang)}</p>
          <p class="product-description">${product.detail}</p>
          <p class="fabric-link"><a href="#/passport">${fabric.name}</a> · ${fabric.gsm} gsm</p>
          <form class="product-options" data-form="variant" data-product="${product.id}">
            <fieldset><legend>สี <span data-color-name>${catalog.colors[color].name}</span></legend>
              <div class="choices">${product.colors.map(key => `<label class="chip color-chip">
                <input type="radio" name="color" value="${key}" ${key === color ? "checked" : ""}>
                <span><i style="--swatch:${catalog.colors[key].hex}" aria-hidden="true"></i>${catalog.colors[key].name}</span>
              </label>`).join("")}</div>
            </fieldset>
            <fieldset><legend>ไซส์ <a class="text-link" href="#/product/${product.id}" data-action="size-chart">ดูตารางไซส์</a></legend>
              <div class="choices">${catalog.sizes.map(key => `<label class="chip">
                <input type="radio" name="size" value="${key}" ${key === size ? "checked" : ""} required><span>${key}</span>
              </label>`).join("")}</div>
            </fieldset>
            ${product.studio ? `<a class="fit-link" href="#/studio?product=${product.id}">
              <span class="tile-icon">${icon("fit")}</span><span>${sizeNote}</span>
            </a>` : ""}
            <div class="stack">
              <button class="button full" type="submit" name="intent" value="purchase">เพิ่มลงตะกร้า · ${money(product.unitSatang)}</button>
              <button class="button secondary full" type="submit" name="intent" value="trial">เพิ่มลงกล่องลอง</button>
            </div>
            <p class="form-note" data-variant-note aria-live="polite">กล่องลองได้สูงสุด 3 ชิ้น</p>
          </form>
          <details class="size-details" id="size-chart">
            <summary>ตารางไซส์ · เซนติเมตร</summary>
            <table><thead><tr><th scope="col">ไซส์</th><th scope="col">${bottom ? "รอบเอวกางเกง" : "รอบอกเสื้อ"}</th>
              <th scope="col">${bottom ? "ช่วงขาด้านใน" : "ความยาวเสื้อ"}</th></tr></thead>
              <tbody>${product.chart.map(row => `<tr><th scope="row">${row.size}</th><td>${row.circumference}</td><td>${row.length}</td></tr>`).join("")}</tbody>
            </table>
          </details>
        </div>
      </div>
    </div>`;
  }

  function passport(state) {
    const count = state.credits.filter(credit => credit.usedBy === null).length;
    return `<div class="wrap page">
      <section class="passport-hero">
        <div>
          ${pageTitle("รู้จักผ้าก่อนซื้อ", "Fabric Passport รวมตัวอย่างผ้า 6 ชนิดไว้ในสมุดเดียว เปิดเทียบกับเสื้อที่คุณกำลังเลือกได้เลย", "Fabric Passport")}
          <p class="passport-terms"><strong>${money(rules.PASSPORT_PRICE)}</strong> ได้เครดิต ${money(rules.CREDIT_VALUE)} เมื่อซื้อสมุดสำเร็จ ใช้กับเสื้อผ้าปกติยอด ${money(rules.CREDIT_MINIMUM)} ขึ้นไป</p>
          <a class="button" href="#/checkout/passport">สั่งสมุดผ้า · ${money(rules.PASSPORT_PRICE)}</a>
          ${count ? `<p class="form-note">คุณมีเครดิตพร้อมใช้ ${count} ใบ</p>` : ""}
        </div>
        <div class="fabric-mosaic" aria-label="ตัวอย่างเนื้อผ้า 6 ชนิด">
          ${catalog.fabrics.map(fabric => `<img src="./assets/fabric-${fabric.id}.svg" alt="${fabric.name}" width="520" height="280">`).join("")}
        </div>
      </section>
      <section class="featured">
        <div class="section-heading"><h2>ผ้าทั้งหกในสมุด</h2></div>
        <div class="fabric-grid">${catalog.fabrics.map(fabric => `<article class="fabric-card">
          <img src="./assets/fabric-${fabric.id}.svg" alt="ภาพตัวอย่างลายผ้า ${fabric.name}" width="520" height="280" loading="lazy">
          <div><p class="caption">${fabric.gsm} gsm · ${fabric.feel}</p><h3>${fabric.name}</h3><p>${fabric.detail}</p></div>
        </article>`).join("")}</div>
        <p class="form-note">ภาพ ลาย และสเปกผ้าเป็นตัวอย่างเพื่อการสาธิต</p>
      </section>
    </div>`;
  }

  function privacy() {
    return `<div class="wrap page narrow">
      ${pageTitle("ข้อมูลและการรีเซ็ต", "ต้นแบบร้าน WARIN สำหรับโครงงาน ITDS294")}
      <section class="panel">
        <h2>ข้อมูลที่เก็บบนเบราว์เซอร์นี้</h2>
        <p>ตะกร้า ออเดอร์ เครดิต และสถานะกล่องลองจะบันทึกไว้บนอุปกรณ์นี้ โปรไฟล์สัดส่วนจะบันทึกเมื่อคุณกดบันทึกเท่านั้น แนะนำให้ใช้สัดส่วนตัวอย่างเมื่อสาธิต</p>
        <p>ผู้รับ ที่อยู่ และจุดคืนทั้งหมดเป็นข้อมูลสมมติ ระบบชำระเงินใช้การคำนวณในหน้านี้</p>
        <a class="text-link" href="#/studio">จัดการโปรไฟล์ใน Fit-Twin</a>
      </section>
      <section class="panel">
        <h2>เริ่มเดโมใหม่</h2>
        <p>ระบบจะลบตะกร้า โปรไฟล์ เครดิต ออเดอร์ และกล่องลองของ WARIN ในเบราว์เซอร์นี้</p>
        <button class="button secondary" type="button" data-action="ask-reset" aria-expanded="false">รีเซ็ตข้อมูลเดโม</button>
        <div class="reset-controls" id="reset-controls" hidden>
          <p>ยืนยันการล้างข้อมูล WARIN ทั้งหมดบนอุปกรณ์นี้</p>
          <div class="button-row">
            <button class="button danger" type="button" data-action="reset">ยืนยันรีเซ็ต</button>
            <button class="button secondary" type="button" data-action="cancel-reset">ยกเลิก</button>
          </div>
        </div>
      </section>
    </div>`;
  }

  Object.assign(views, { home, shop, productDetail, passport, privacy });
})();
