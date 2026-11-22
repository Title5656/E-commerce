(() => {
  const {views,catalog,rules,createStore,STORAGE_KEY,LEGACY_KEY,snapshotLines}=globalThis.Mono;
  const content=document.querySelector("#main"),warning=document.querySelector("#storage-warning"),toast=document.querySelector("#toast");
  let storage;try{storage=localStorage;}catch{storage=null;}
  const makeId=()=>crypto.randomUUID?.()??Date.now()+"-"+Math.random().toString(36).slice(2);
  const store=createStore({storage,runExclusive:task=>navigator.locks?navigator.locks.request(STORAGE_KEY,task):task()});
  let busy=false,studioViewer=null,toastTimer,visitAttribution=rules.attribution(null);
  const sections={"":"home",shop:"shop",product:"shop",kit:"kit",passport:"kit",studio:"studio",orders:"orders",order:"orders",cart:"cart",checkout:"cart"};
  function getRoute(){const [path,q=""]=(location.hash||"#/").slice(1).split("?",2),parts=path.startsWith("/")?path.slice(1).split("/"):["missing"];return {name:parts[0],id:parts[1],extra:parts.length>2,query:new URLSearchParams(q)};}
  const missing=()=>`<div class="wrap page">${views.pageTitle("หาหน้านี้ไม่เจอ")}${views.emptyState("เปิดรายการนี้ไม่ได้","ตรวจลิงก์หรือกลับไปเลือกเสื้อ")}</div>`;
  function getView(r,s){
    const {name,id,query}=r;
    if(["trial-box","trials"].includes(name)||name==="checkout"&&id==="trial")return views.orders(s);
    if(r.extra)return missing();
    if(name==="product"){const p=catalog.findProduct(id);return p?views.productDetail(p,s,query):`<div class="wrap page">${views.pageTitle("สินค้าเดิมไม่อยู่ในคอลเลกชันแล้ว")}${views.emptyState("เลือกดูเสื้อรุ่นปัจจุบัน","ประวัติคำสั่งซื้อเดิมยังเปิดได้จากเมนูคำสั่งซื้อ")}</div>`;}
    if(name==="checkout")return ["purchase","kit","passport"].includes(id)?views.checkout(id==="passport"?"kit":id,{...s,attribution:visitAttribution},makeId()):missing();
    if(name==="order"){const o=s.orders.find(o=>o.id===id);return o?views.order(s,o):missing();}
    if(id!==undefined)return missing();
    switch(name){case "":return views.home();case "shop":return views.shop(query);case "kit":case "passport":return views.passport(s);case "studio":return views.studio(s,query);case "cart":return views.cart(s);case "orders":return views.orders(s);case "privacy":return views.privacy();case "insights":return views.insights(s);default:return missing();}
  }
  function updateShell(s,r=getRoute()){
    const count=s.cart.reduce((n,l)=>n+l.quantity,0),badge=document.querySelector("#cart-count");badge.textContent=count;badge.hidden=count===0;badge.closest("a").setAttribute("aria-label","ตะกร้าสินค้า "+count+" ชิ้น");
    const section=r.name==="checkout"&&["kit","passport"].includes(r.id)?"kit":sections[r.name];
    document.querySelectorAll("[data-section]").forEach(a=>{if(a.dataset.section===section)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current");});
    const info=store.info();
    warning.innerHTML=info.corrupt?'<p class="callout warning">เปิดข้อมูลร้านบนอุปกรณ์นี้ไม่ได้ <a href="#/privacy">จัดการข้อมูล</a></p>':!info.persistent?'<p class="callout warning">อุปกรณ์นี้บันทึกข้อมูลไม่ได้ ทำรายการได้จนกว่าจะปิดหรือรีเฟรชหน้า</p>':s.migrationNotice?`<p class="callout">${views.escape(s.migrationNotice)} <button class="text-button" type="button" data-dismiss-migration>รับทราบ</button></p>`:"";
  }
  function render({newPage=false,focusKey=""}={}){
    const s=store.read(),r=getRoute();updateShell(s,r);studioViewer?.destroy();studioViewer=null;content.innerHTML=getView(r,s);
    const stage=content.querySelector("#studio-art");if(stage){studioViewer=globalThis.Mono.fitModel.mount(stage);updateStudio(content.querySelector('[data-form="profile"]'));}
    const title=content.querySelector("h1");document.title=title?title.textContent.trim()+" · MONO":"MONO";
    if(newPage){scrollTo(0,0);if(r.name==="shop"&&r.query.has("search"))content.querySelector("#catalog-query")?.focus({preventScroll:true});else if(title){title.tabIndex=-1;title.focus({preventScroll:true});}}
    else if(focusKey)[...content.querySelectorAll("[data-focus]")].find(e=>e.dataset.focus===focusKey)?.focus({preventScroll:true});
  }
  function notify(message,error=false){clearTimeout(toastTimer);toast.textContent=message;toast.classList.toggle("toast-error",error);toast.classList.add("visible");toastTimer=setTimeout(()=>{toast.classList.remove("visible");toast.textContent="";},error?6500:3800);}
  function navigate(hash,replace=false){if(location.hash===hash)render({newPage:true});else if(replace)location.replace(hash);else location.hash=hash;}
  async function commit(trigger,action,after){
    if(busy)return;busy=true;const startedOn=location.hash;if(trigger instanceof HTMLButtonElement)trigger.disabled=true;
    try{const result=await store.dispatch(action);const moved=location.hash!==startedOn;updateShell(store.read());after?.(result);if(moved)render();}catch(e){if(["draft-changed","credit-unavailable"].includes(e.code)&&getRoute().name==="checkout")render();else updateShell(store.read());notify(e.message,true);}finally{busy=false;if(trigger instanceof HTMLButtonElement&&trigger.isConnected)trigger.disabled=false;}
  }
  function updateProductOptions(form){
    const p=catalog.findProduct(form.dataset.product),color=form.elements.color.value,links=views.variantLinks(p,color,form.elements.size.value);
    form.querySelector(".fit-link").href=links.studio;content.querySelector("[data-share-line]").href=links.share;
    if(location.hash!==links.product)history.replaceState(history.state,"",links.product);
  }
  const getProfile=data=>Object.fromEntries(Object.keys(catalog.measurements).map(k=>[k,Number(data.get(k))]));
  function updateStudio(form,variantChanged=false){
    const data=new FormData(form),profile=getProfile(data),p=catalog.findProduct(data.get("product")),size=data.get("size"),color=p.colors.includes(data.get("color"))?data.get("color"):p.colors[0];
    if(form.dataset.garment!==p.id){form.querySelector("#studio-colors").innerHTML=views.studioColors(p,color);form.dataset.garment=p.id;}
    for(const [k,v] of Object.entries(profile)){form.querySelector("#read-"+k).value=v+" ซม.";const field=form.elements[k];field.style.setProperty("--progress",(v-field.min)/(field.max-field.min)*100+"%");}
    const result=views.studioResult(profile,p,size,color);form.querySelector("#fit-result").innerHTML=result.result;form.querySelector("#studio-recommendation").textContent=result.recommendation;form.querySelector("#studio-product").href=result.link;
    content.querySelector("#studio-garment").textContent=p.english;content.querySelector("#studio-variant").textContent=catalog.colors[color].name+" / "+size;
    const fallback=content.querySelector(".fitting-fallback"),src=catalog.productImage(p.id,color);if(fallback.getAttribute("src")!==src)fallback.src=src;fallback.alt="ภาพจำลอง "+p.name;
    content.querySelector("#studio-size-table").innerHTML=views.sizeTable(p);studioViewer?.update(profile,p,size,color);
    if(variantChanged){const q=new URLSearchParams({product:p.id,size,color});copyTracking(getRoute().query,q);history.replaceState(history.state,"","#/studio?"+q);}
  }
  function previewCode(form){
    store.refresh();const s=store.read(),code=form.elements.credit.value.trim(),found=s.credits.find(c=>c.id===code&&c.usedBy===null);
    const quote=rules.quotePurchase(snapshotLines(s.cart),s.credits,code);content.querySelector("#checkout-balance").innerHTML=views.purchaseBalance(quote);
    const note=content.querySelector("#code-feedback");note.textContent=!code?"ยังไม่ได้ใช้โค้ด":found?"ใช้โค้ดลดค่าเสื้อ ฿99 ได้":"โค้ดไม่ถูกต้องหรือใช้แล้ว กรุณาตรวจใบแนบ";note.classList.toggle("code-error",!!code&&!found);
  }
  const submits={
    filters(form,data){const q=new URLSearchParams();for(const k of ["category","color","q"]){const v=data.get(k)?.trim();if(v)q.set(k,v);}copyTracking(getRoute().query,q);navigate("#/shop"+(q.size?"?"+q:""));},
    variant(form,data,trigger){const variantId=catalog.variantId(form.dataset.product,data.get("color"),data.get("size"));commit(trigger,{type:"updatePurchase",variantId,delta:1},()=>{form.querySelector("[data-variant-note]").innerHTML='เพิ่มแล้ว <a href="#/cart">เปิดตะกร้า</a>';notify("เพิ่มลงตะกร้าแล้ว");});},
    checkout(form,data,trigger){commit(trigger,{type:"checkout",mode:form.dataset.mode,requestId:form.dataset.request,signature:form.dataset.signature,creditId:data.get("credit"),attribution:visitAttribution},o=>navigate("#/order/"+o.id,true));},
    profile(form,data,trigger){commit(trigger,{type:"saveProfile",profile:getProfile(data)},()=>{content.querySelector("#profile-note").textContent="บันทึกสัดส่วนในเบราว์เซอร์นี้แล้ว";content.querySelector("#delete-profile").hidden=false;notify("บันทึกสัดส่วนแล้ว");});}
  };
  function setReset(open){const b=content.querySelector('[data-action="ask-reset"]'),c=content.querySelector("#reset-controls");c.hidden=!open;b.setAttribute("aria-expanded",open);(open?c.querySelector("button"):b).focus();}
  const actions={
    "size-chart"(){const e=content.querySelector("#size-chart");e.open=true;e.querySelector("summary").focus();},
    "apply-code"(b){previewCode(b.form);},
    quantity(b){commit(b,{type:"updatePurchase",variantId:b.dataset.variant,delta:Number(b.dataset.delta)},()=>render({focusKey:b.dataset.focus}));},
    "remove-purchase"(b){commit(b,{type:"removePurchase",variantId:b.dataset.variant},()=>render());},
    "sample-profile"(b){for(const [k,v] of Object.entries(catalog.sampleProfile))b.form.elements[k].value=v;updateStudio(b.form);notify("กำลังใช้สัดส่วนตัวอย่าง");},
    "clear-profile"(b){commit(b,{type:"clearProfile"},()=>{for(const [k,v] of Object.entries(catalog.sampleProfile))b.form.elements[k].value=v;updateStudio(b.form);content.querySelector("#profile-note").textContent="ลบสัดส่วนที่บันทึกแล้ว กำลังใช้ค่าตัวอย่าง";b.form.querySelector('[data-action="sample-profile"]').focus();b.hidden=true;});},
    "receive-order"(b){commit(b,{type:"receiveOrder",orderId:b.dataset.id},()=>render());},
    "save-favorite"(b){commit(b,{type:"saveFavorite",orderId:b.dataset.id,lineId:b.dataset.line},()=>{render();notify("บันทึกเสื้อตัวที่ใส่พอดีแล้ว");});},
    "ask-reset":()=>setReset(true),"cancel-reset":()=>setReset(false),reset(b){commit(b,{type:"reset"},()=>{try{sessionStorage.removeItem("mono.visit");}catch{}navigate("#/");notify("ล้างข้อมูลร้านบนอุปกรณ์แล้ว");});}
  };
  function copyTracking(from,to){for(const k of ["utm_source","utm_placement"])if(from.has(k))to.set(k,from.get(k));}
  function captureSource(initial=false){
    const q=getRoute().query;let a;
    if(q.has("utm_source"))a=rules.attribution({channel:q.get("utm_source"),placement:q.get("utm_placement")});
    else if(initial){try{a=JSON.parse(sessionStorage.getItem("mono.visit"));}catch{}a=rules.attribution(a);}
    if(a){visitAttribution=a;try{sessionStorage.setItem("mono.visit",JSON.stringify(a));}catch{}}
    return Promise.resolve();
  }
  document.querySelector(".skip-link").addEventListener("click",e=>{e.preventDefault();content.focus();});
  const header=document.querySelector(".site-header"),menu=header.querySelector(".menu-toggle");
  function setMenu(open){header.classList.toggle("nav-open",open);menu.setAttribute("aria-expanded",open);menu.setAttribute("aria-label",open?"ปิดเมนู":"เปิดเมนู");menu.querySelector('[data-icon="menu"]').hidden=open;menu.querySelector('[data-icon="x"]').hidden=!open;}
  menu.addEventListener("click",e=>{const open=menu.getAttribute("aria-expanded")!=="true";setMenu(open);if(open&&!e.detail)header.querySelector("nav a").focus();});
  header.addEventListener("click",e=>{if(e.target.closest("a"))setMenu(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){setMenu(false);menu.focus();}});
  document.addEventListener("click",e=>{if(header.classList.contains("nav-open")&&!header.contains(e.target))setMenu(false);});
  matchMedia("(max-width: 760px)").addEventListener("change",()=>setMenu(false));
  warning.addEventListener("click",e=>{if(e.target.closest("[data-dismiss-migration]"))commit(null,{type:"dismissMigration"},()=>updateShell(store.read()));});
  content.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(b&&Object.hasOwn(actions,b.dataset.action))actions[b.dataset.action](b);});
  content.addEventListener("submit",e=>{const form=e.target;if(!Object.hasOwn(submits,form.dataset.form))return;e.preventDefault();submits[form.dataset.form](form,new FormData(form),e.submitter);});
  content.addEventListener("input",e=>{
    const input=e.target,form=input.form;
    if(form?.dataset.form==="profile"&&input.type==="range")updateStudio(form);
    if(form?.dataset.form==="checkout"&&input.name==="credit"){content.querySelector("#checkout-balance").innerHTML=views.purchaseBalance(rules.quotePurchase(snapshotLines(store.read().cart),[],null));content.querySelector("#code-feedback").textContent="กดตรวจโค้ดเพื่อดูยอดหลังส่วนลด";}
  });
  content.addEventListener("change",e=>{
    const input=e.target,form=input.form;
    if(form?.dataset.form==="variant")updateProductOptions(form);
    if(form?.dataset.form==="profile"&&input.type!=="range")updateStudio(form,true);
    if(input.name==="followUp")commit(null,{type:"setFollowUp",enabled:input.checked},()=>render());
  });
  content.addEventListener("error",e=>{if(e.target instanceof HTMLImageElement&&!e.target.dataset.fallback){e.target.dataset.fallback="true";e.target.src="./assets/mark.svg";}},true);
  window.addEventListener("hashchange",async()=>{setMenu(false);await captureSource();render({newPage:true});});
  window.addEventListener("pageshow",e=>{if(e.persisted){store.refresh();render();}});
  window.addEventListener("storage",e=>{if(![STORAGE_KEY,LEGACY_KEY,null].includes(e.key))return;const previous=studioViewer&&store.read().profile;store.refresh();if(studioViewer&&e.newValue!==null&&JSON.stringify(previous)===JSON.stringify(store.read().profile))updateShell(store.read());else render();});
  captureSource(true).then(()=>render());
})();
