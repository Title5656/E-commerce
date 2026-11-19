(() => {
  const { views, catalog, rules, createStore, STORAGE_KEY, snapshotLines } = globalThis.Warin;
  const content = document.querySelector("#main");
  const warning = document.querySelector("#storage-warning");
  const toast = document.querySelector("#toast");
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }

  const makeId = () => globalThis.crypto?.randomUUID?.() ?? Date.now() + "-" + Math.random().toString(36).slice(2);
  const store = createStore({
    storage, makeId,
    runExclusive: task => navigator.locks ? navigator.locks.request(STORAGE_KEY, task) : task()
  });

  const sections = {
    shop: "shop", product: "shop", passport: "passport", studio: "studio",
    "trial-box": "trial", trials: "trial", cart: "cart", checkout: "cart"
  };
  let toastTimer;
  let busy = false;

  function getRoute() {
    const hash = window.location.hash || "#/";
    const [path, query = ""] = hash.slice(1).split("?", 2);
    const parts = path.startsWith("/") ? path.slice(1).split("/") : ["missing"];
    return { name: parts[0], id: parts[1], extra: parts.length > 2, query: new URLSearchParams(query) };
  }

  function missing(detail = "ตรวจลิงก์หรือกลับไปเลือกเสื้อผ้า") {
    return `<div class="wrap page">${views.pageTitle("หาหน้านี้ไม่เจอ")}${views.emptyState("เปิดรายการนี้ไม่ได้", detail)}</div>`;
  }

  function getView(route, state) {
    const { name, id, extra, query } = route;
    if (extra) return missing();
    if (name === "product") {
      const product = catalog.findProduct(id);
      return product ? views.productDetail(product, state, query) : missing();
    }
    if (name === "checkout") {
      return ["purchase", "passport", "trial"].includes(id) ? views.checkout(id, state, makeId()) : missing();
    }
    if (name === "order") {
      const order = state.orders.find(item => item.id === id);
      return order ? views.order(state, order) : missing("ใบคำสั่งซื้อจะอยู่ในเบราว์เซอร์ที่ใช้ทำรายการ");
    }
    if (name === "trials" && id) {
      const trial = state.trials.find(item => item.id === id);
      return trial ? views.tracker(trial, Date.now()) : missing("กล่องลองจะอยู่ในเบราว์เซอร์ที่ใช้ทำรายการ");
    }

    if (id !== undefined) return missing();
    switch (name) {
      case "": return views.home();
      case "shop": return views.shop(query);
      case "passport": return views.passport(state);
      case "studio": return views.studio(state, query);
      case "cart": return views.cart(state);
      case "trial-box": return views.trialBox(state);
      case "orders": return views.orders(state);
      case "trials": return views.trials(state);
      case "privacy": return views.privacy();
      default: return missing();
    }
  }

  function updateShell(state, route = getRoute()) {
    document.querySelector("#cart-count").textContent =
      state.cart.reduce((count, line) => count + line.quantity, 0);
    const section = route.name === "checkout" && route.id !== "purchase"
      ? (route.id === "trial" ? "trial" : "passport") : sections[route.name];
    document.querySelectorAll("[data-section]").forEach(link => {
      if (link.dataset.section === section) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const { corrupt, persistent } = store.info();
    warning.innerHTML = corrupt
      ? '<p class="callout warning">ข้อมูลเดโมเปิดไม่ได้ <a href="#/privacy">ไปที่หน้ารีเซ็ต</a> เพื่อเริ่มใหม่</p>'
      : !persistent ? '<p class="callout warning">อุปกรณ์นี้บันทึกข้อมูลไม่ได้ ทำรายการได้จนกว่าจะปิดหรือรีเฟรชหน้า</p>'
        : "";
  }

  function render({ newPage = false, focusKey = "" } = {}) {
    const state = store.read();
    const route = getRoute();
    updateShell(state, route);
    content.innerHTML = getView(route, state);
    const title = content.querySelector("h1");
    document.title = title ? title.textContent.trim() + " · WARIN" : "WARIN";
    if (newPage) {
      window.scrollTo(0, 0);
      if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
    } else if (focusKey) {
      const next = [...content.querySelectorAll("[data-focus]")].find(element => element.dataset.focus === focusKey);
      next?.focus({ preventScroll: true });
    }
  }

  function notify(message, error = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("toast-error", error);
    toast.classList.add("visible");
    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
      toast.textContent = "";
    }, error ? 6500 : 3800);
  }

  function navigate(hash, replace = false) {
    if (location.hash === hash) {
      render({ newPage: true });
    } else if (replace) {
      location.replace(hash);
    } else {
      location.hash = hash;
    }
  }

  async function commit(trigger, action, after) {
    if (busy) return;
    busy = true;
    if (trigger instanceof HTMLButtonElement) trigger.disabled = true;
    try {
      const result = await store.dispatch(action);
      updateShell(store.read());
      after?.(result);
    } catch (error) {
      if (["draft-changed", "credit-unavailable", "active-trial"].includes(error.code) && getRoute().name === "checkout") {
        render();
      } else {
        updateShell(store.read());
      }
      notify(error.message, true);
    } finally {
      busy = false;
      if (trigger instanceof HTMLButtonElement && trigger.isConnected) trigger.disabled = false;
    }
  }

  function updateProductColor(form) {
    const product = catalog.findProduct(form.dataset.product);
    const color = new FormData(form).get("color");
    const name = catalog.colors[color].name;
    const picture = document.querySelector("#product-image");
    picture.src = catalog.productImage(product.id, color);
    picture.alt = product.name + " สี" + name;
    form.querySelector("[data-color-name]").textContent = name;
  }

  function getProfile(data) {
    return Object.fromEntries(Object.keys(catalog.measurements).map(key => [key, Number(data.get(key))]));
  }

  function updateStudio(form) {
    const fields = new FormData(form);
    const profile = getProfile(fields);
    const result = views.studioResult(profile, catalog.findProduct(fields.get("product")), fields.get("size"));
    for (const [key, value] of Object.entries(profile)) document.querySelector("#read-" + key).textContent = value + " ซม.";
    document.querySelector("#studio-art").innerHTML = result.image;
    document.querySelector("#fit-result").innerHTML = result.result;
    document.querySelector("#studio-recommendation").textContent = result.recommendation;
    document.querySelector("#studio-product").href = result.link;
  }

  function trialChoices(form) {
    const trial = store.read().trials.find(item => item.id === form.dataset.id);
    const data = new FormData(form);
    const values = trial.lines.map((line, index) => data.get("line-" + index));
    const ready = values.every(value => value === "keep" || value === "return");
    return { trial, ready, keep: trial.lines.filter((line, index) => values[index] === "keep").map(line => line.lineId) };
  }

  const submitForms = {
    filters(form, data) {
      const query = new URLSearchParams();
      for (const key of ["category", "color"]) if (data.get(key)) query.set(key, data.get(key));
      navigate("#/shop" + (query.size ? "?" + query : ""));
    },
    variant(form, data, trigger) {
      const variantId = catalog.variantId(form.dataset.product, data.get("color"), data.get("size"));
      const trial = trigger?.value === "trial";
      const action = trial ? { type: "addTrial", variantId } : { type: "updatePurchase", variantId, delta: 1 };
      commit(trigger, action, () => {
        form.querySelector("[data-variant-note]").innerHTML = trial
          ? 'เพิ่มแล้ว <a href="#/trial-box">เปิดกล่องลอง</a>'
          : 'เพิ่มแล้ว <a href="#/cart">เปิดตะกร้า</a>';
        notify(trial ? "เพิ่มลงกล่องลองแล้ว" : "เพิ่มลงตะกร้าแล้ว");
      });
    },
    checkout(form, data, trigger) {
      const { mode, request, signature } = form.dataset;
      commit(trigger, {
        type: "checkout", mode, requestId: request, signature, cafeId: data.get("cafe"), creditId: data.get("credit")
      }, record => navigate((mode === "trial" ? "#/trials/" : "#/order/") + record.id, true));
    },
    profile(form, data, trigger) {
      commit(trigger, { type: "saveProfile", profile: getProfile(data) }, () => {
        document.querySelector("#profile-note").textContent = "บันทึกโปรไฟล์บนเบราว์เซอร์นี้แล้ว";
        document.querySelector("#delete-profile").hidden = false;
        notify("บันทึกโปรไฟล์แล้ว");
      });
    },
    "trial-decisions"(form, data, trigger) {
      const { trial, ready, keep } = trialChoices(form);
      if (!ready) return;
      commit(trigger, { type: "submitDecisions", trialId: trial.id, keep }, () => render({ newPage: true }));
    },
    "trial-issue"(form, data, trigger) {
      commit(trigger, { type: "reportIssue", trialId: form.dataset.id, issue: data.get("issue") }, () => render({ newPage: true }));
    }
  };

  function setReset(open) {
    const button = document.querySelector('[data-action="ask-reset"]');
    const controls = document.querySelector("#reset-controls");
    controls.hidden = !open;
    button.setAttribute("aria-expanded", open);
    (open ? controls.querySelector("button") : button).focus();
  }

  function trialClick(trigger) {
    commit(trigger, { type: trigger.dataset.action, trialId: trigger.dataset.id }, () => render({ newPage: true }));
  }

  const actions = {
    "size-chart"() {
      const chart = document.querySelector("#size-chart");
      chart.open = true;
      chart.querySelector("summary").focus();
    },
    quantity(trigger) {
      commit(trigger, {
        type: "updatePurchase", variantId: trigger.dataset.variant, delta: Number(trigger.dataset.delta)
      }, () => render({ focusKey: trigger.dataset.focus }));
    },
    "remove-purchase"(trigger) {
      commit(trigger, { type: "removePurchase", variantId: trigger.dataset.variant }, () => {
        render();
        notify("นำสินค้าออกจากตะกร้าแล้ว");
      });
    },
    "remove-trial"(trigger) {
      commit(trigger, { type: "removeTrial", lineId: trigger.dataset.line }, () => {
        render();
        notify("นำสินค้าออกจากกล่องลองแล้ว");
      });
    },
    "sample-profile"(trigger) {
      for (const [key, value] of Object.entries(catalog.sampleProfile)) trigger.form.elements[key].value = value;
      updateStudio(trigger.form);
      notify("กำลังใช้สัดส่วนตัวอย่าง");
    },
    "clear-profile"(trigger) {
      commit(trigger, { type: "clearProfile" }, () => {
        render({ newPage: true });
        notify("ลบโปรไฟล์แล้ว");
      });
    },
    "ask-reset": () => setReset(true),
    "cancel-reset": () => setReset(false),
    reset(trigger) {
      commit(trigger, { type: "reset" }, () => {
        navigate("#/");
        notify("เริ่มเดโมใหม่แล้ว");
      });
    },
    receiveTrial: trialClick,
    completeReturn: trialClick,
    expireDemo: trialClick
  };

  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    content.focus();
  });

  content.addEventListener("click", event => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || !Object.hasOwn(actions, trigger.dataset.action)) return;
    event.preventDefault();
    actions[trigger.dataset.action](trigger);
  });

  content.addEventListener("submit", event => {
    const form = event.target;
    if (!Object.hasOwn(submitForms, form.dataset.form)) return;
    event.preventDefault();
    submitForms[form.dataset.form](form, new FormData(form), event.submitter);
  });

  content.addEventListener("input", event => {
    if (event.target.type === "range" && event.target.form?.dataset.form === "profile") updateStudio(event.target.form);
  });

  content.addEventListener("change", event => {
    const input = event.target;
    const form = input.form;
    if (form?.dataset.form === "variant" && input.name === "color") updateProductColor(form);
    if (form?.dataset.form === "profile" && input.type !== "range") updateStudio(form);
    if (form?.dataset.form === "checkout" && input.name === "credit") {
      const state = store.read();
      const quote = rules.quotePurchase(snapshotLines(state.cart), state.credits, input.checked ? input.value : null);
      document.querySelector("#checkout-balance").innerHTML = views.purchaseBalance(quote);
    }
    if (form?.dataset.form === "trial-decisions") {
      const { trial, keep, ready } = trialChoices(form);
      if (ready) document.querySelector("#trial-preview").innerHTML =
        "<strong>ยอดประมาณการ</strong>" + views.settlementRows(rules.quoteSettlement(trial.lines, trial.depositSatang, keep));
    }
  });

  content.addEventListener("error", event => {
    if (event.target instanceof HTMLImageElement && !event.target.dataset.fallback) {
      event.target.dataset.fallback = "true";
      event.target.src = "./assets/mark.svg";
    }
  }, true);

  window.addEventListener("hashchange", () => render({ newPage: true }));
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      store.refresh();
      render();
    }
  });
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY || event.key === null) {
      store.refresh();
      render();
    }
  });

  setInterval(() => {
    const clock = document.querySelector("#trial-clock");
    if (!clock) return;
    const deadline = Number(clock.dataset.deadline);
    const now = Date.now();
    clock.textContent = views.remaining({ expiresAt: deadline }, now);
    if (now >= deadline) {
      document.querySelector("#tracker-status").textContent = "เลยกำหนด";
      const simulate = document.querySelector('[data-action="expireDemo"]');
      if (simulate) simulate.hidden = true;
    }
  }, 1000);

  render();
})();
