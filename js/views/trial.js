(() => {
  const { views, rules, catalog } = globalThis.Mono;
  const {
    escape, date, icon, breadcrumb, pageTitle, orderLine, emptyState, trialLabel,
    trialBalance, settlementRows, paymentNotice
  } = views;

  function remaining(trial, now) {
    const seconds = Math.max(0, Math.ceil((trial.expiresAt - now) / 1000));
    if (!seconds) return "เลยกำหนด · ยังแจ้งคืนได้";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = seconds % 60;
    return "เวลาคงเหลือ " + [h, m, s].map(value => String(value).padStart(2, "0")).join(":");
  }

  function timeline(trial) {
    const index = { awaiting_delivery: 0, trying: 1, awaiting_return: 2, review: 2, settled: 3 }[trial.status];
    return `<ol class="timeline" aria-label="สถานะกล่องลอง">${["สั่งกล่อง", "ลองที่บ้าน", "ตรวจการคืน", "ปิดยอด"].map((label, step) =>
      `<li class="${step <= index ? "reached" : ""}" ${step === index ? 'aria-current="step"' : ""}>${label}</li>`
    ).join("")}</ol>`;
  }

  function cafeDetails(trial) {
    const cafe = catalog.findCafe(trial.cafeId);
    return `<div class="inline-purchase return-location">
      <span class="tile-icon">${icon("pin")}</span><div><strong>${cafe?.name ?? "คาเฟ่"}</strong>
      <p>จุดคืนสมมติ${cafe ? " · " + cafe.hours : ""}</p></div>
    </div>`;
  }

  function trialList(trial, decisions = false) {
    return `<ul class="order-lines">${trial.lines.map((line, index) => {
      let controls = "";
      if (decisions) {
        controls = `<fieldset class="choice-field">
          <legend class="sr-only">เลือกสำหรับ ${escape(line.name)} ${escape(line.size)} ชิ้นที่ ${index + 1}</legend>
          <div class="choices"><label class="chip"><input type="radio" value="keep" name="line-${index}" required><span>เก็บไว้</span></label>
          <label class="chip"><input type="radio" value="return" name="line-${index}" required><span>ส่งคืน</span></label></div>
        </fieldset>`;
      } else if (trial.keep) {
        controls = `<span class="status-pill">${trial.keep.includes(line.lineId) ? "เก็บไว้" : "ส่งคืน"}</span>`;
      }
      return orderLine(line, controls);
    }).join("")}</ul>`;
  }

  function delivery(trial) {
    return `<section class="panel">
      <h2>กล่องของคุณกำลังรอรับ</h2><p>กดรับของเมื่อพร้อมเริ่มจับเวลา 72 ชั่วโมง</p>
      ${trialList(trial)}
      <button class="button" type="button" data-action="receiveTrial" data-id="${escape(trial.id)}">รับของจำลอง</button>
    </section>`;
  }

  function trying(trial, now) {
    const expired = rules.isExpired(trial, now);
    return `<form class="panel" data-form="trial-decisions" data-id="${escape(trial.id)}">
      <h2>เลือกเสื้อผ้าที่จะเก็บ</h2>
      <p id="trial-clock" class="clock" data-deadline="${trial.expiresAt}">${remaining(trial, now)}</p>
      <p class="form-note">ครบกำหนด ${date(trial.expiresAt)}${trial.demoExpired ? " · เร่งเวลาสำหรับเดโม" : ""}</p>
      ${trialList(trial, true)}
      <div id="trial-preview" class="callout" role="status">เลือกเก็บหรือคืนให้ครบเพื่อดูยอดประมาณการ</div>
      <div class="button-row">
        <button class="button" type="submit">ยืนยันเก็บและคืน</button>
        ${expired ? "" : `<button class="text-button" type="button" data-action="expireDemo" data-id="${escape(trial.id)}">จำลองให้ครบ 72 ชม.</button>`}
      </div>
    </form>`;
  }

  function awaitingReturn(trial) {
    return `<section class="panel">
      <h2>นำชิ้นที่เลือกไปคืน</h2>
      <p>แสดงรหัสคืนที่คาเฟ่จำลอง เมื่อรับและตรวจของครบแล้วระบบจึงปิดยอด</p>
      <div class="return-ticket"><span>รหัสคืนจำลอง</span><strong>${escape(trial.returnCode)}</strong></div>
      ${trialList(trial)}
      <button class="button" type="button" data-action="completeReturn" data-id="${escape(trial.id)}">จำลองตรวจรับคืนผ่าน</button>
      <form class="issue-form" data-form="trial-issue" data-id="${escape(trial.id)}">
        <label>กรณีตรวจรับมีปัญหา<select name="issue" required>
          <option value="">เลือกปัญหาจำลอง</option><option value="damage">พบความเสียหาย</option><option value="loss">ของส่งคืนไม่ครบ</option>
        </select></label>
        <button class="button secondary" type="submit">บันทึกเพื่อเข้าตรวจสอบ</button>
      </form>
    </section>`;
  }

  function review(trial) {
    return `<section class="panel">
      <h2>รอตรวจสอบก่อนปิดยอด</h2>
      <p class="callout warning">${trial.issue === "damage" ? "พบความเสียหาย" : "ของส่งคืนไม่ครบ"} · ระบบพักการชำระและคืนมัดจำไว้</p>
      ${trialList(trial)}
    </section>`;
  }

  function settled(trial) {
    return `<section class="panel">
      <span class="tile-icon">${icon("check")}</span><h2>ปิดกล่องลองแล้ว</h2>
      <p>${date(trial.settlement.closedAt)} · ใบสรุป ${escape(trial.id)}</p>
      ${trial.returnCode ? `<div class="return-ticket"><span>หลักฐานรับคืนจำลอง</span><strong>${escape(trial.returnCode)}</strong></div>` : ""}
      ${trialList(trial)}
      <a class="button secondary" href="#/shop">เลือกสินค้าอีกครั้ง</a>
    </section>`;
  }

  const trialView = {
    awaiting_delivery: delivery, trying, awaiting_return: awaitingReturn, review, settled
  };

  function tracker(trial, now) {
    const quote = trial.keep ? rules.quoteSettlement(trial.lines, trial.depositSatang, trial.keep) : null;
    return `<div class="wrap page">
      ${breadcrumb("#/trials", "ประวัติกล่องลอง")}
      ${pageTitle("กล่องลอง " + escape(trial.id), "สั่งเมื่อ " + date(trial.createdAt), "Micro-Closet")}
      ${timeline(trial)}
      ${paymentNotice()}
      <div class="split-layout">
        ${trialView[trial.status](trial, now)}
        <aside class="panel totals-panel">
          <span id="tracker-status" class="status-pill">${trialLabel(trial, now)}</span>
          <h2>${trial.settlement ? "ยอดปิดรายการ" : quote ? "ยอดประมาณการ" : "สรุปกล่อง"}</h2>
          ${trial.settlement ? settlementRows(trial.settlement) : quote ? settlementRows(quote) : trialBalance(trial)}
          ${cafeDetails(trial)}
        </aside>
      </div>
    </div>`;
  }

  function trials(state) {
    return `<div class="wrap page narrow">
      ${pageTitle("ติดตามกล่องลอง", "เปิดกล่องที่สั่งจากเบราว์เซอร์นี้", "Micro-Closet")}
      ${state.trials.length ? `<ul class="record-list">${state.trials.slice().reverse().map(trial => `<li>
        <a class="record" href="#/trials/${escape(trial.id)}">
          <span><strong>${escape(trial.id)} · ${trial.lines.length} ชิ้น</strong><span>${date(trial.createdAt)}</span></span>
          <span class="status-pill">${trialLabel(trial)}</span>
        </a></li>`).join("")}</ul>` : emptyState("ยังไม่มีกล่องที่สั่ง", "เพิ่มเสื้อผ้าในกล่องลองแล้วเลือกคาเฟ่ส่งคืน", "#/trial-box", "ไปที่กล่องลอง")}
    </div>`;
  }

  Object.assign(views, { tracker, trials, remaining });
})();
