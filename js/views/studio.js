(() => {
  const { views, catalog, rules } = globalThis.Warin;
  const { icon, pageTitle } = views;
  const studioProducts = catalog.products.filter(product => product.studio);

  const fitLabels = {
    tight: { name: "แน่น", detail: "ลองเทียบไซส์ใหญ่ขึ้นเพื่อเพิ่มพื้นที่ช่วงอก" },
    regular: { name: "พอดี", detail: "มีระยะเผื่อรอบอกอยู่ในช่วงสำหรับทรงพอดีของเดโม" },
    oversized: { name: "โคร่ง", detail: "มีพื้นที่รอบตัวมากขึ้นสำหรับลุคหลวม" }
  };

  function mannequin(profile, product, fit) {
    const mid = 220;
    const shoulders = profile.shoulder * 1.58;
    const chest = profile.chest * 0.58;
    const waist = profile.waist * 0.59;
    const headY = 83 - (profile.height - 150) * 0.43;
    const shoulderY = headY + 51;
    const chestY = shoulderY + 47;
    const waistY = chestY + 66 + (profile.height - 150) * 0.32;
    const jointY = waistY + 27;
    const shoeY = jointY + 104 + (profile.leg - 70) * 1.4;
    const roomy = { tight: 2, regular: 11, oversized: 25 }[fit];
    const sleeve = product.category === "shirt" ? 101 : 40;
    const hemY = waistY + 6 + roomy * 0.60;
    const left = mid - (chest + roomy);
    const right = mid + chest + roomy;
    const tone = fit === "tight" ? "#9f694e" : fit === "regular" ? "#65745a" : "#697e87";
    return `<svg class="mannequin" viewBox="0 0 440 480" role="img" aria-labelledby="model-title">
      <title id="model-title">ภาพหุ่นสาธิต ทรง${fitLabels[fit].name}</title>
      <defs><pattern id="studio-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" fill="none" stroke="#d5dcd0" stroke-width="1"/>
      </pattern><linearGradient id="studio-shirt" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${tone}"/><stop offset="1" stop-color="${tone}" stop-opacity=".77"/></linearGradient></defs>
      <rect x="18" y="12" width="404" height="456" rx="22" fill="url(#studio-grid)" opacity=".83"/>
      <path d="M220 27v420M62 ${chestY}h316M62 ${waistY}h316" fill="none" stroke="#adb9ab" stroke-dasharray="4 6"/>
      <ellipse cx="220" cy="${shoeY + 5}" rx="93" ry="10" fill="#42563f" opacity=".12"/>
      <g fill="#d7d0bb" stroke="#a9a38f" stroke-width="1.4">
        <ellipse cx="220" cy="${headY}" rx="26" ry="35"/>
        <path d="M205 ${headY + 25}v23l-18 12h66l-18-12v-23Z"/>
        <path d="M${mid - shoulders} ${shoulderY} Q${mid - chest} ${chestY} ${mid - waist} ${waistY} L${mid - waist - 4} ${jointY}
          H${mid + waist + 4} L${mid + waist} ${waistY} Q${mid + chest} ${chestY} ${mid + shoulders} ${shoulderY}Z"/>
        <path d="M${mid - shoulders} ${shoulderY + 10} l-26 131 14 4 31-122Zm${shoulders * 2} 0 26 131-14 4-31-122Z"/>
        <path d="M${mid - waist - 4} ${jointY - 2} L${mid - 45} ${shoeY} h18l27-${shoeY - jointY - 16} 27 ${shoeY - jointY - 16}h18L${mid + waist + 4} ${jointY - 2}Z"/>
      </g>
      <path d="M200 ${shoulderY - 4} Q220 ${shoulderY + 13} 240 ${shoulderY - 4} L${mid + shoulders + roomy} ${shoulderY + 4}
        L${mid + shoulders + roomy + 18} ${shoulderY + sleeve} l-24 9 L${right} ${chestY}
        L${mid + waist + roomy} ${hemY} Q220 ${hemY + 12} ${mid - waist - roomy} ${hemY}
        L${left} ${chestY} L${mid - shoulders - roomy + 6} ${shoulderY + sleeve + 9}
        l-24-9 L${mid - shoulders - roomy} ${shoulderY + 4}Z"
        fill="url(#studio-shirt)" stroke="white" stroke-width="1.9" stroke-opacity=".55"/>
      ${product.category === "shirt"
        ? `<path d="M200 ${shoulderY - 4}l20 13-15 23-15-22m50-14-20 13 15 23 15-22m-30-1v${hemY - shoulderY - 6}" stroke="#fff" stroke-opacity=".46" fill="none" stroke-width="1.8"/>`
        : `<path d="M201 ${shoulderY - 3}q18 26 38 1" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`}
      <path d="M${left} ${chestY}h${right - left}" stroke="#fff" stroke-dasharray="3 5" stroke-opacity=".86"/>
      <circle cx="${left}" cy="${chestY}" r="4" fill="#fcfaf0"/><circle cx="${right}" cy="${chestY}" r="4" fill="#fcfaf0"/>
    </svg>`;
  }

  function studioResult(profile, product, size) {
    const row = product.chart.find(entry => entry.size === size);
    const { ease, fit } = rules.classifyFit(profile.chest, row.circumference);
    const recommendation = rules.recommendSize(profile, product.chart);
    return {
      image: mannequin(profile, product, fit),
      result: `<div class="fit-result ${fit}">
        <div><span class="status-pill">${fitLabels[fit].name}</span><h2>ไซส์ ${size} · ระยะเผื่อ ${ease} ซม.</h2><p>${fitLabels[fit].detail}</p></div>
        <small>รอบอกเสื้อ ${row.circumference} ซม. · รอบอกตัวอย่าง ${profile.chest} ซม.</small>
      </div>`,
      recommendation: recommendation ? `แนะนำไซส์ ${recommendation.size} · ระยะเผื่อ ${recommendation.ease} ซม.` : "ลองเทียบกับตารางไซส์ ยังไม่มีไซส์พอดีในช่วงตัวอย่าง",
      link: "#/product/" + product.id + "?size=" + (recommendation?.size ?? size)
    };
  }

  function studio(state, query) {
    const profile = state.profile ?? catalog.sampleProfile;
    const product = studioProducts.find(item => item.id === query.get("product")) ?? studioProducts[0];
    const fit = rules.recommendSize(profile, product.chart);
    const size = catalog.sizes.includes(query.get("size")) ? query.get("size") : fit?.size ?? "M";
    const initial = studioResult(profile, product, size);

    return `<div class="wrap page">
      ${pageTitle("ลองเทียบทรงของคุณ", "ปรับสัดส่วนตัวอย่าง เลือกเสื้อและไซส์ แล้วดูระยะเผื่อก่อนตัดสินใจ", "Fit-Twin Studio")}
      <div class="studio-layout">
        <section class="studio-stage" aria-label="ภาพและผลเปรียบเทียบทรง">
          <div class="stage-top"><span class="tile-icon">${icon("fit")}</span><span>ภาพหุ่น 2 มิติ</span></div>
          <div id="studio-art">${initial.image}</div>
          <div id="fit-result" aria-live="polite">${initial.result}</div>
        </section>
        <form class="panel studio-panel" data-form="profile">
          <h2>เสื้อที่ต้องการเทียบ</h2>
          <label>รุ่น<select name="product">${studioProducts.map(item =>
            `<option value="${item.id}" ${item.id === product.id ? "selected" : ""}>${item.name}</option>`
          ).join("")}</select></label>
          <fieldset><legend>ไซส์ที่กำลังลอง</legend><div class="choices">${catalog.sizes.map(item =>
            `<label class="chip"><input type="radio" name="size" value="${item}" ${item === size ? "checked" : ""}><span>${item}</span></label>`
          ).join("")}</div></fieldset>
          <div class="measurement-header"><h2>สัดส่วน (ซม.)</h2>
            <button class="text-button" type="button" data-action="sample-profile">ใช้ค่าตัวอย่าง</button></div>
          ${Object.entries(catalog.measurements).map(([key, range]) => `<label class="measurement" for="metric-${key}">
            <span>${range.label}</span><output id="read-${key}" for="metric-${key}">${profile[key]} ซม.</output>
            <input id="metric-${key}" type="range" name="${key}" min="${range.min}" max="${range.max}" value="${profile[key]}">
          </label>`).join("")}
          <div id="studio-recommendation" class="callout">${initial.recommendation}</div>
          <button class="button full" type="submit">บันทึกสัดส่วน</button>
          <p id="profile-note" class="form-note">${state.profile ? "มีโปรไฟล์บันทึกบนเบราว์เซอร์นี้" : "สัดส่วนจะเก็บบนเบราว์เซอร์นี้เมื่อกดบันทึก"}</p>
          <div class="button-row compact">
            <a id="studio-product" class="text-link" href="${initial.link}">ไปดูสินค้ารุ่นนี้</a>
            <button class="text-button" type="button" id="delete-profile" data-action="clear-profile" ${state.profile ? "" : "hidden"}>ลบโปรไฟล์</button>
          </div>
          <p class="form-note">หุ่นเป็นภาพประกอบสัดส่วน คำแนะนำสำหรับสองรุ่นนี้คำนวณจากรอบอก โปรดเทียบตารางไซส์ก่อนเลือก</p>
        </form>
      </div>
    </div>`;
  }

  Object.assign(views, { studio, studioResult });
})();
