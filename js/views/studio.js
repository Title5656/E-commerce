(() => {
  const { views, catalog, rules } = globalThis.Mono;
  const { icon, pageTitle } = views;
  const garments = catalog.products.filter(product => product.studio);
  const fitNames = { tight: "แน่น", regular: "พอดี", oversized: "โคร่ง" };

  function studioResult(profile, product, size, color) {
    const row = product.chart.find(entry => entry.size === size);
    const { ease, fit } = rules.classifyFit(profile.chest, row.circumference);
    const recommended = rules.recommendSize(profile, product.chart);
    const room = ease < 0 ? `เสื้อเล็กกว่ารอบอก ${-ease} ซม.`
      : ease === 0 ? "รอบอกเสื้อเท่ากับรอบอกหุ่น" : `เผื่อรอบอก ${ease} ซม.`;
    const advice = !recommended ? "ยังไม่มีไซซ์ที่พอดีกับรอบอกนี้ ลองเทียบตารางไซซ์บนหน้าสินค้า"
      : recommended.size === size ? `แนะนำไซซ์ ${size} สำหรับรอบอกนี้`
        : `ถ้าชอบทรงพอดี แนะนำไซซ์ ${recommended.size} · เผื่อรอบอก ${recommended.ease} ซม.`;
    const selectedColor = product.colors.includes(color) ? color : product.colors[0];
    const query = new URLSearchParams({ size, color: selectedColor });
    const current = new URLSearchParams(location.hash.split("?")[1] ?? "");
    for (const key of ["utm_source", "utm_placement"]) if (current.has(key)) query.set(key, current.get(key));
    return {
      result: `<h3>ไซซ์ ${size} · ${fitNames[fit]}</h3><p>${room} <span>(เสื้อ ${row.circumference} / หุ่น ${profile.chest} ซม.)</span></p>`,
      recommendation: advice,
      link: "#/product/" + product.id + "?" + query
    };
  }

  function studioColors(product, selected) {
    return product.colors.map(key => {
      const { name, hex } = catalog.colors[key];
      return `<label class="fitting-swatch"><input type="radio" name="color" value="${key}" ${key === selected ? "checked" : ""}>
        <span><i style="--color:${hex}"></i>${name}</span></label>`;
    }).join("");
  }

  function studio(state, query) {
    const profile = state.profile ?? catalog.sampleProfile;
    const product = garments.find(item => item.id === query.get("product")) ?? garments[0];
    const size = product.chart.some(row => row.size === query.get("size")) ? query.get("size")
      : rules.recommendSize(profile, product.chart)?.size ?? "M";
    const color = product.colors.includes(query.get("color")) ? query.get("color") : product.colors[0];
    const initial = studioResult(profile, product, size, color);
    return `<div class="wrap page fitting-page">
      ${pageTitle("ห้องลองเสื้อ", "เลือกเสื้อยืดหรือโปโล ปรับหุ่นแล้วเทียบไซซ์ ภาพและขนาดเป็นค่าตัวอย่างสำหรับสาธิต", "Fit-Twin Studio")}
      <div class="fitting-layout">
        <figure id="studio-art" class="fitting-stage" aria-label="หุ่นลองเสื้อ">
          <div class="fitting-stage-label"><div><span id="studio-garment">${product.english}</span>
            <small id="studio-variant">${catalog.colors[color].name} / ${size}</small></div>
            <span class="fitting-rotate-hint">${icon("rotate")} ลากเพื่อหมุน</span></div>
          <div class="fitting-scene">
            <canvas class="fitting-canvas" id="studio-canvas" tabindex="0" role="img" aria-label="หุ่นลองเสื้อสามมิติ หมุนด้วยปุ่มลูกศรซ้ายและขวา"></canvas>
            <img class="fitting-fallback" src="${catalog.productImage(product.id, color)}" alt="${product.name} สี${catalog.colors[color].name}" hidden>
          </div>
          <div class="fitting-toolbar" role="group" aria-label="เลือกมุมมองหุ่น">
            <button type="button" data-angle="0" aria-pressed="true">ด้านหน้า</button>
            <button type="button" data-angle="90" aria-pressed="false">ด้านข้าง</button>
            <button type="button" data-angle="180" aria-pressed="false">ด้านหลัง</button>
            <button type="button" data-framing aria-controls="studio-canvas">ดูช่วงตัว</button>
          </div>
          <figcaption class="fitting-unavailable" hidden>อุปกรณ์นี้แสดงภาพสินค้าแทนหุ่นสามมิติ</figcaption>
        </figure>
        <form class="fitting-settings" data-form="profile">
          <section class="fitting-options" aria-labelledby="studio-options-title">
            <h2 id="studio-options-title">เสื้อที่กำลังลอง</h2>
            <label class="fitting-select"><span class="sr-only">รุ่นเสื้อ</span><select name="product">${garments.map(item =>
              `<option value="${item.id}" ${item.id === product.id ? "selected" : ""}>${item.name}</option>`
            ).join("")}</select></label>
            <fieldset><legend>สี</legend><div class="fitting-choices" id="studio-colors">${studioColors(product, color)}</div></fieldset>
            <fieldset><legend>ไซซ์</legend><div class="fitting-choices">${product.chart.map(({ size: item }) =>
              `<label class="fitting-size"><input type="radio" name="size" value="${item}" ${item === size ? "checked" : ""}><span>${item}</span></label>`
            ).join("")}</div></fieldset>
            <div class="fitting-verdict" role="status">
              <div id="fit-result">${initial.result}</div>
              <p id="studio-recommendation">${initial.recommendation}</p>
            </div>
            <a class="fitting-product-link" id="studio-product" href="${initial.link}">ดูเสื้อตัวนี้ ${icon("arrow-right")}</a>
          </section>
          <section class="fitting-measures" aria-labelledby="studio-measures-title">
            <div class="fitting-section-head"><h2 id="studio-measures-title">สัดส่วนหุ่น</h2>
              <button class="fitting-text-button" type="button" data-action="sample-profile">ใช้ค่าตัวอย่าง</button></div>
            <p class="fitting-note">ปรับสัดส่วนเพื่อดูทรงเสื้อบนหุ่น ระบบใช้รอบอกในการแนะนำไซซ์</p>
            ${Object.entries(catalog.measurements).map(([key, range]) => `<label class="fitting-measure" for="metric-${key}">
              <span>${range.label}</span><output id="read-${key}" for="metric-${key}">${profile[key]} ซม.</output>
              <input id="metric-${key}" type="range" name="${key}" min="${range.min}" max="${range.max}" value="${profile[key]}"
                style="--progress:${(profile[key] - range.min) / (range.max - range.min) * 100}%">
            </label>`).join("")}
            <div class="fitting-save"><button class="button" type="submit">บันทึกสัดส่วน</button>
              <button class="fitting-text-button" type="button" id="delete-profile" data-action="clear-profile" ${state.profile ? "" : "hidden"}>ลบสัดส่วนที่บันทึก</button></div>
            <p id="profile-note" class="fitting-note">${state.profile ? "มีสัดส่วนบันทึกในเบราว์เซอร์นี้" : "เมื่อกดบันทึก สัดส่วนจะอยู่ในเบราว์เซอร์นี้"}</p>
          </section>
        </form>
      </div>
      <section class="panel studio-chart"><h2>เทียบเสื้อตัวโปรดกับตาราง</h2>${views.measureGuide()}<div id="studio-size-table">${views.sizeTable(product)}</div></section>
    </div>`;
  }

  Object.assign(views, { studio, studioResult, studioColors });
})();
