(() => {
  const { views, catalog, rules } = globalThis.Mono;
  const { money, escape, icon, breadcrumb, pageTitle, emptyState } = views;

  function catalogUrl(filters) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
    return "#/shop" + (query.size ? "?" + query : "");
  }

  function productCard(product, preferredColor) {
    const color = product.colors.includes(preferredColor) ? preferredColor : product.colors[0];
    const href = "#/product/" + product.id + "?color=" + color;
    return `<article class="product-card" data-product="${product.id}">
      <a class="card-image" href="${href}" aria-label="${product.name}">
        <img src="${catalog.productImage(product.id, color)}" alt="${product.name} สี${catalog.colors[color].name}" width="800" height="1000" loading="lazy" decoding="async">
      </a>
      <div class="product-meta">
        <p class="caption" lang="en">${product.english}</p>
        <h3><a href="${href}">${product.name}</a></h3>
        <div class="product-bottom">
          <strong>${money(product.unitSatang)}</strong>
          <div class="card-swatches" role="group" aria-label="เลือกสี ${product.name}">${product.colors.map(key =>
            `<button type="button" data-action="card-color" data-color="${key}" aria-label="สี${catalog.colors[key].name}" title="${catalog.colors[key].name}" aria-pressed="${key === color}"><i style="--swatch:${catalog.colors[key].hex}"></i></button>`
          ).join("")}</div>
        </div>
      </div>
    </article>`;
  }

  function home() {
    const linen = catalog.findProduct("shirt-linen");
    const featured = ["tee-heavy", "shirt-linen", "trousers-easy", "polo-pique"].map(catalog.findProduct);
    return `<div class="wrap home">
      <section class="collection-intro" aria-labelledby="collection-title">
        <div class="intro-line">
          <h1 id="collection-title" lang="en">New Season.<br>Clothing for simple living.</h1>
          <div class="intro-shopping">
            <p>เสื้อผ้าสีธรรมชาติในเนื้อผ้าคอตตอนและลินิน <br>สำหรับวันที่อยากแต่งตัวให้เรียบง่าย</p>
            <a class="action-link" href="#/shop">เลือกซื้อคอลเลกชัน ${icon("arrow-right")}</a>
          </div>
        </div>
        <figure class="hero-art">
          <a class="campaign-image" href="#/product/shirt-linen?color=oatmeal" aria-label="ดูเชิ้ตลินินทรงสบาย สีโอ๊ตมีล">
            <picture>
              <source media="(max-width: 520px)" srcset="./assets/editorial/linen-on-model.webp" width="816" height="832">
              <img src="./assets/editorial/new-season.webp" srcset="./assets/editorial/new-season-small.webp 768w, ./assets/editorial/new-season.webp 1536w" sizes="(max-width: 760px) 150vw, 92vw" width="1536" height="672" alt="นางแบบสวมเชิ้ตลินินสีโอ๊ตมีลกับกางเกงสีอ่อนในห้องที่แสงธรรมชาติส่องถึง" fetchpriority="high">
            </picture>
          </a>
          <figcaption><a href="#/product/shirt-linen?color=oatmeal"><span>${linen.name}</span><span>${money(linen.unitSatang)}</span>${icon("arrow-up-right")}</a></figcaption>
        </figure>
      </section>
      <section class="featured" aria-labelledby="featured-title">
        <div class="section-heading">
          <h2 id="featured-title">เสื้อผ้าแนะนำ</h2>
          <a class="action-link" href="#/shop">ดูทั้งหมด ${icon("arrow-right")}</a>
        </div>
        <div class="product-grid">${featured.map(product => productCard(product)).join("")}</div>
      </section>
      <section class="editorial-pair" aria-label="เลือกเนื้อผ้าและลองเสื้อ">
        <a class="editorial-story" href="#/passport">
          <div class="story-image material-story"><img src="./assets/editorial/cotton-detail.webp" width="840" height="840" loading="lazy" alt="ขอบคอและฝีเย็บของเสื้อคอตตอนสีธรรมชาติ"></div>
          <div class="story-heading"><h2 lang="en">Fabric Passport</h2>${icon("arrow-up-right")}</div>
          <p>รู้จักสัมผัสและน้ำหนักของผ้า 6 ชนิดในสมุดผ้า</p>
        </a>
        <a class="editorial-story" href="#/studio">
          <div class="story-image fitting-story"><img src="./assets/editorial/studio-look.webp" width="840" height="653" loading="lazy" alt="ทรงของเสื้อยืดและกางเกงเมื่อสวมใส่"></div>
          <div class="story-heading"><h2 lang="en">Fit-Twin Studio</h2>${icon("arrow-up-right")}</div>
          <p>ปรับสัดส่วนและหมุนดูทรงเสื้อในห้องลอง 3D</p>
        </a>
      </section>
    </div>`;
  }

  function shop(query) {
    const category = Object.hasOwn(catalog.categories, query.get("category")) ? query.get("category") : "";
    const color = Object.hasOwn(catalog.colors, query.get("color")) ? query.get("color") : "";
    const q = (query.get("q") || "").trim();
    const terms = q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const filtered = catalog.products.filter(product => {
      const fabric = catalog.findFabric(product.fabricId);
      const words = [product.name, product.english, catalog.categories[product.category], fabric.name,
        ...product.colors.map(key => catalog.colors[key].name)].join(" ").toLocaleLowerCase();
      return (!category || product.category === category) && (!color || product.colors.includes(color)) &&
        terms.every(term => words.includes(term));
    });
    const tabs = [["", "ทั้งหมด"], ...Object.entries(catalog.categories)];

    return `<div class="wrap page catalog-page">
      ${pageTitle("เสื้อผ้าทั้งหมด", "", "Everyday collection")}
      <nav class="category-tabs" aria-label="ประเภทเสื้อผ้า">${tabs.map(([key, name]) =>
        `<a href="${escape(catalogUrl({ category: key, color, q }))}" ${category === key ? 'aria-current="page"' : ""}>${name}</a>`
      ).join("")}</nav>
      <form class="filters" data-form="filters" role="search" aria-label="ค้นหาและกรองสินค้า">
        <label class="catalog-search">${icon("search")}<input type="search" id="catalog-query" name="q" placeholder="ค้นหาชื่อสินค้าหรือเนื้อผ้า" aria-label="ค้นหาชื่อสินค้าหรือเนื้อผ้า" value="${escape(q)}"></label>
        <input type="hidden" name="category" value="${category}">
        <label class="color-filter"><span class="sr-only">กรองตามสี</span><select name="color"><option value="">ทุกสี</option>
          ${Object.entries(catalog.colors).map(([key, value]) => `<option value="${key}" ${key === color ? "selected" : ""}>${value.name}</option>`).join("")}
        </select></label>
        <button class="filter-apply" type="submit">กรองสินค้า</button>
        <div class="filter-status">
          ${category || color || q ? '<a class="text-link" href="#/shop">ล้างตัวกรอง</a>' : ""}
          <span>${filtered.length} รุ่น</span>
        </div>
      </form>
      ${filtered.length
        ? `<div class="product-grid">${filtered.map(product => productCard(product, color)).join("")}</div>`
        : emptyState("ไม่พบสินค้าที่ตรงกัน", "ลองเปลี่ยนคำค้น ประเภทเสื้อผ้า หรือสีที่เลือก", "#/shop", "ดูเสื้อผ้าทั้งหมด")}
    </div>`;
  }

  function variantLinks(product, color, size) {
    const options = new URLSearchParams({ color });
    if (size) options.set("size", size);
    const studio = "#/studio?product=" + product.id + "&" + options;
    const publicPage = new URL(location.protocol === "file:" ? "https://title5656.github.io/E-commerce/" : location.href);
    publicPage.search = "";
    publicPage.hash = "/product/" + product.id + "?" + options;
    return { product: publicPage.hash, studio, share: "https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(publicPage.href) };
  }

  function productDetail(product, state, query) {
    const requestedColor = query.get("color");
    const color = product.colors.includes(requestedColor) ? requestedColor : product.colors[0];
    const fabric = catalog.findFabric(product.fabricId);
    const recommendation = product.studio ? rules.recommendSize(state.profile, product.chart) : null;
    const size = catalog.sizes.includes(query.get("size")) ? query.get("size") : recommendation?.size ?? "";
    const bottom = ["shorts", "trousers"].includes(product.category);
    const links = variantLinks(product, color, size);
    const fitTitle = recommendation ? "แนะนำไซซ์ " + recommendation.size : "เทียบไซซ์ในห้องลอง 3D";
    const fitDetail = recommendation ? `ระยะเผื่อรอบอก ${recommendation.ease} ซม.`
      : state.profile ? "เทียบสัดส่วนที่บันทึกไว้กับตารางไซซ์" : "ลองกับสัดส่วนตัวอย่างหรือปรับให้ตรงกับคุณ";
    return `<div class="wrap page detail-page">
      ${breadcrumb("#/shop", "เสื้อผ้าทั้งหมด")}
      <div class="product-layout">
        <div class="detail-photos">
          <div class="gallery"><img id="product-image" src="${catalog.productImage(product.id, color)}" alt="${product.name} สี${catalog.colors[color].name}" width="800" height="1000" fetchpriority="high"></div>
          ${product.id === "shirt-linen" ? `<div class="photo-switch" role="group" aria-label="มุมมองสินค้า" ${color !== "oatmeal" ? "hidden" : ""}>
            <button type="button" data-action="product-photo" data-view="product" aria-pressed="true">ภาพสินค้า</button>
            <button type="button" data-action="product-photo" data-view="worn" aria-pressed="false">เมื่อสวมใส่</button>
          </div>` : ""}
        </div>
        <div class="product-details">
          <p class="eyebrow" lang="en">${product.english}</p>
          <h1>${product.name}</h1>
          <p class="large-price">${money(product.unitSatang)}</p>
          <p class="product-description">${product.detail}</p>
          <p class="fabric-link"><a href="#/passport">${fabric.name}</a><span>${fabric.gsm} g/m²</span></p>
          <form class="product-options" data-form="variant" data-product="${product.id}">
            <fieldset><legend>สี <span data-color-name>${catalog.colors[color].name}</span></legend>
              <div class="choices">${product.colors.map(key => `<label class="chip color-chip" title="${catalog.colors[key].name}">
                <input type="radio" name="color" value="${key}" ${key === color ? "checked" : ""}>
                <span><i style="--swatch:${catalog.colors[key].hex}" aria-hidden="true"></i>${catalog.colors[key].name}</span>
              </label>`).join("")}</div>
            </fieldset>
            <fieldset><legend>ไซซ์ <button class="text-button" type="button" data-action="size-chart">ดูตารางไซซ์</button></legend>
              <div class="choices">${catalog.sizes.map(key => `<label class="chip">
                <input type="radio" name="size" value="${key}" ${key === size ? "checked" : ""} required><span>${key}</span>
              </label>`).join("")}</div>
            </fieldset>
            ${product.studio ? `<a class="fit-link" href="${escape(links.studio)}">
              ${icon("fit")}<span><strong>${fitTitle}</strong><small>${fitDetail}</small></span>${icon("arrow-right")}
            </a>` : ""}
            <div class="stack purchase-actions">
              <button class="button full" type="submit" name="intent" value="purchase">${icon("shopping-bag")}เพิ่มลงตะกร้า · ${money(product.unitSatang)}</button>
              <button class="button secondary full" type="submit" name="intent" value="trial">เพิ่มลงกล่องลอง</button>
            </div>
            <p class="form-note" data-variant-note aria-live="polite">เลือกลองที่บ้านได้สูงสุด 3 ชิ้น</p>
          </form>
          <details class="size-details" id="size-chart">
            <summary>ตารางไซซ์ (ซม.)</summary>
            <table><thead><tr><th scope="col">ไซซ์</th><th scope="col">${bottom ? "รอบเอวกางเกง" : "รอบอกเสื้อ"}</th>
              <th scope="col">${bottom ? "ช่วงขาด้านใน" : "ความยาวเสื้อ"}</th></tr></thead>
              <tbody>${product.chart.map(row => `<tr><th scope="row">${row.size}</th><td>${row.circumference}</td><td>${row.length}</td></tr>`).join("")}</tbody>
            </table>
          </details>
          <a class="share-line" data-share-line href="${escape(links.share)}" target="_blank" rel="noopener noreferrer">${icon("line")}แชร์สินค้าทาง LINE</a>
        </div>
      </div>
    </div>`;
  }

  function passport(state) {
    const count = state.credits.filter(credit => credit.usedBy === null).length;
    return `<div class="wrap page passport-page">
      <section class="passport-hero">
        <div class="passport-intro">
          ${pageTitle("สมุดตัวอย่างผ้า", "เปิดเทียบผ้า 6 ชนิดที่ใช้ในคอลเลกชัน ตั้งแต่คอตตอนเจอร์ซีย์เนื้อเบาไปจนถึงทวิลล์ที่ทอเป็นลายทแยง", "Fabric Passport")}
          <p class="passport-terms">สมุดราคา <strong>${money(rules.PASSPORT_PRICE)}</strong> รับเครดิต ${money(rules.CREDIT_VALUE)} สำหรับซื้อเสื้อผ้าครั้งถัดไปเมื่อยอดครบ ${money(rules.CREDIT_MINIMUM)}</p>
          <a class="button" href="#/checkout/passport">สั่งสมุดผ้า · ${money(rules.PASSPORT_PRICE)} ${icon("arrow-right")}</a>
          ${count ? `<p class="form-note">คุณมีเครดิตพร้อมใช้ ${count} ใบ</p>` : ""}
        </div>
        <img class="passport-cover" src="./assets/editorial/cotton-detail.webp" alt="รายละเอียดผิวสัมผัสและตะเข็บของเสื้อคอตตอน" width="840" height="840">
      </section>
      <section class="featured">
        <div class="section-heading"><h2>ผ้าทั้งหกในสมุด</h2></div>
        <div class="fabric-grid">${catalog.fabrics.map(fabric => `<article class="fabric-card">
          <img src="./assets/fabrics/${fabric.id}.webp" alt="เนื้อผ้า ${fabric.name}" width="520" height="310" loading="lazy">
          <div><p class="caption">${fabric.gsm} g/m² · ${fabric.feel}</p><h3 lang="en">${fabric.name}</h3><p>${fabric.detail}</p></div>
        </article>`).join("")}</div>
      </section>
    </div>`;
  }

  function privacy() {
    return `<div class="wrap page narrow">
      ${pageTitle("ข้อมูลบนอุปกรณ์")}
      <section class="panel">
        <h2>สิ่งที่ MONO บันทึก</h2>
        <p>เบราว์เซอร์นี้เก็บตะกร้า คำสั่งซื้อ เครดิต และกล่องลองของคุณ ส่วนสัดส่วนจะบันทึกเมื่อคุณกดบันทึกในห้องลอง</p>
        <p>คุณใช้สัดส่วนตัวอย่างได้ ผู้รับ ที่อยู่ และจุดคืนในรายการสั่งซื้อเป็นข้อมูลสมมติ</p>
        <a class="text-link" href="#/studio">จัดการสัดส่วนในห้องลอง</a>
      </section>
      <section class="panel">
        <h2>ล้างข้อมูลร้าน</h2>
        <p>ลบตะกร้า สัดส่วน เครดิต คำสั่งซื้อ และกล่องลองของ MONO ออกจากเบราว์เซอร์นี้</p>
        <button class="button secondary" type="button" data-action="ask-reset" aria-expanded="false">ล้างข้อมูลบนอุปกรณ์</button>
        <div class="reset-controls" id="reset-controls" hidden>
          <p>ยืนยันการล้างข้อมูลทั้งหมดของร้านบนอุปกรณ์นี้</p>
          <div class="button-row"><button class="button danger" type="button" data-action="reset">ยืนยันล้างข้อมูล</button>
            <button class="button secondary" type="button" data-action="cancel-reset">ยกเลิก</button></div>
        </div>
      </section>
    </div>`;
  }

  Object.assign(views, { home, shop, productDetail, passport, privacy, variantLinks });
})();
