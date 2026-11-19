(() => {
  const Warin = globalThis.Warin;
  const { catalog, rules } = Warin;
  const formatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });
  const money = satang => "฿" + formatter.format(satang / 100);
  const dt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
  const date = ms => dt.format(ms);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

  const iconPaths = {
    swatch: '<rect x="7" y="3" width="11" height="16" rx="2" transform="rotate(15 12 11)"/><path d="M8 5 4 7a2 2 0 0 0-1 3l5 10a2 2 0 0 0 3 1l8-4m-8-5h4m-5 3h4"/>',
    fit: '<circle cx="12" cy="4.5" r="2.5"/><path d="m6 8-3 6m15-6 3 6m-12 7 3-7 3 7m-9-13 3 4v4m9-8-3 4v4M6 8h12"/>',
    box: '<path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9M7.5 5.25l9 4.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    pin: '<path d="M19 9c0 5-7 11-7 11S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>'
  };

  function icon(name) {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? ""}</svg>`;
  }

  function breadcrumb(href, text) {
    return `<p class="breadcrumb"><a href="${href}">${text}</a></p>`;
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

  function swatches(keys) {
    return `<span class="swatches" aria-label="สีที่มี">${keys.map(key =>
      `<span class="swatch" style="--swatch:${catalog.colors[key].hex}" title="${catalog.colors[key].name}"></span>`
    ).join("")}</span>`;
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
      ["ยอดสินค้า", money(quote.subtotalSatang)], ["ค่าส่งจำลอง", money(0)],
      ["เครดิตสมุดผ้า", quote.creditSatang ? "−" + money(quote.creditSatang) : money(0)],
      ["ยอดชำระจำลอง", money(quote.dueSatang), "total"]
    ]);
  }

  function paymentNotice() {
    return '<p class="mini-notice">ธุรกรรมจำลองเพื่อการศึกษา ไม่มีการตัดเงินจริง</p>';
  }

  function trialLabel(trial, now = Date.now()) {
    if (rules.isExpired(trial, now)) return "เลยกำหนด";
    return {
      awaiting_delivery: "รอรับกล่อง", trying: "กำลังลอง", awaiting_return: "รอตรวจรับคืน",
      review: "กำลังตรวจสอบ", settled: "ปิดรายการแล้ว"
    }[trial.status];
  }

  Warin.views = {
    money, date, escape, icon, breadcrumb, pageTitle, emptyState, priceRows, swatches,
    orderLine, settlementRows, trialBalance, purchaseBalance, paymentNotice, trialLabel
  };
})();
