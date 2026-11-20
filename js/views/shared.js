(() => {
  const Mono = globalThis.Mono;
  const { catalog, rules } = Mono;
  const formatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });
  const money = satang => "฿" + formatter.format(satang / 100);
  const dt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
  const date = ms => dt.format(ms);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

  // Lucide interface symbols and the Simple Icons LINE mark. Licenses in assets/icons/.
  const iconPaths = {
    "swatch": '<path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/><path d="M 7 17h.01"/><path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"/>',
    "fit": '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    "box": '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    "check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "search": '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    "menu": '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "shopping-bag": '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "minus": '<path d="M5 12h14"/>',
    "rotate": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    "line": '<path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>'
  };

  function icon(name) {
    const path = iconPaths[name];
    if (!path) return "";
    const paint = name === "line" ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"';
    return `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" ${paint} aria-hidden="true" focusable="false">${path}</svg>`;
  }

  document.querySelectorAll("[data-icon]").forEach(element => {
    element.innerHTML = icon(element.dataset.icon);
  });

  function breadcrumb(href, text) {
    return `<p class="breadcrumb"><a href="${href}">${icon("arrow-left")}${text}</a></p>`;
  }

  function pageTitle(title, description = "", label = "") {
    return `<header class="page-title">
      ${label ? `<p class="eyebrow">${label}</p>` : ""}
      <h1>${title}</h1>
      ${description ? `<p>${description}</p>` : ""}
    </header>`;
  }

  function emptyState(title, detail, href = "#/shop", button = "ไปเลือกสินค้า") {
    return `<div class="empty-state">
      <span class="tile-icon">${icon("box")}</span>
      <h2>${title}</h2><p>${detail}</p><a class="button" href="${href}">${button}</a>
    </div>`;
  }

  function priceRows(rows) {
    return `<dl class="price-rows">${rows.map(([label, value, key]) =>
      `<div${key ? ` class="${key}"` : ""}><dt>${label}</dt><dd>${value}</dd></div>`
    ).join("")}</dl>`;
  }

  function orderLine(line, actions = "") {
    const picture = catalog.findProduct(line.productId) ? catalog.productImage(line.productId, line.color) : "./assets/mark.svg";
    return `<li class="order-line">
      <img src="${escape(picture)}" width="84" height="90" alt="" loading="lazy">
      <div class="line-info"><strong>${escape(line.name)}</strong><span>${escape(line.colorName)} · ${escape(line.size)}
      ${line.quantity > 1 ? ` · ${line.quantity} ชิ้น` : ""}</span>${actions}</div>
      <strong class="line-price">${money(line.unitSatang * line.quantity)}</strong>
    </li>`;
  }

  function settlementRows(quote) {
    const final = quote.paySatang > 0
      ? ["จ่ายเพิ่ม", money(quote.paySatang)]
      : quote.refundSatang > 0
        ? ["คืนมัดจำ", money(quote.refundSatang)]
        : ["ยอดคงเหลือ", money(0)];
    return priceRows([
      ["มูลค่าสินค้าที่เก็บ", money(quote.keptSatang)], ["มัดจำที่จ่ายแล้ว", money(quote.depositSatang)],
      [...final, "total"]
    ]);
  }

  function trialBalance(quote) {
    return priceRows([
      ["มูลค่ากล่องทั้งหมด", money(quote.totalSatang)],
      ["ยอดส่วนที่ไม่มีหลักประกัน", money(quote.exposureSatang)],
      ["ยอดมัดจำวันนี้", money(quote.depositSatang), "total"]
    ]);
  }

  function purchaseBalance(quote) {
    return priceRows([
      ["ยอดสินค้า", money(quote.subtotalSatang)], ["ค่าจัดส่ง", money(0)],
      ["เครดิตสมุดผ้า", quote.creditSatang ? "−" + money(quote.creditSatang) : money(0)],
      ["ยอดชำระ", money(quote.dueSatang), "total"]
    ]);
  }

  function paymentNotice() {
    return '<p class="mini-notice">รายการนี้ใช้ข้อมูลตัวอย่างและไม่มีการเรียกเก็บเงินจริง</p>';
  }

  function trialLabel(trial, now = Date.now()) {
    if (rules.isExpired(trial, now)) return "เลยกำหนด";
    return {
      awaiting_delivery: "รอรับกล่อง", trying: "กำลังลอง", awaiting_return: "รอตรวจรับคืน",
      review: "กำลังตรวจสอบ", settled: "ปิดรายการแล้ว"
    }[trial.status];
  }

  Mono.views = {
    money, date, escape, icon, breadcrumb, pageTitle, emptyState, priceRows,
    orderLine, settlementRows, trialBalance, purchaseBalance, paymentNotice, trialLabel
  };
})();
