(() => {
  const Mono = globalThis.Mono ??= globalThis.Warin ?? {};
  globalThis.Warin = Mono;
  const sizes = ["S", "M", "L", "XL"];
  const colors = { white: { name: "ขาว (สีสาธิต)", hex: "#f3f2ec" } };
  const categories = { tee: "เสื้อยืด", polo: "โปโล" };
  // Codes are identifiers, never numbers. In particular 0, 2.1 and 2.2 are distinct.
  const fabrics = [
    { id: "cvc32", code: "1", name: "CVC 32", gsm: 150, feel: "เจอร์ซีย์เนื้อบาง", detail: "เปรียบเทียบสัมผัส ความทึบ และการทิ้งตัวกับผ้าเบอร์ 32 อีกชนิด" },
    { id: "comb32", code: "0", name: "Cotton Comb 32", gsm: 160, feel: "เจอร์ซีย์น้ำหนักเบา", detail: "ผ้าคอตตอนสำหรับเสื้อยืดคอกลม เทียบกับ CVC 32 ภายใต้แสงเดียวกัน" },
    { id: "semi20", code: "2.1", name: "Cotton Semi 20", gsm: 190, feel: "เจอร์ซีย์น้ำหนักปานกลาง", detail: "เปรียบเทียบผิวสัมผัสกับ Cotton Comb 20 ที่น้ำหนักตัวอย่างเท่ากัน" },
    { id: "comb20", code: "2.2", name: "Cotton Comb 20", gsm: 190, feel: "เจอร์ซีย์น้ำหนักปานกลาง", detail: "เทียบความเรียบและการอยู่ทรงด้วยชิ้นผ้าจริงก่อนเลือกเสื้อ" },
    { id: "tk", code: "20", name: "จูติ TK", gsm: 240, feel: "ผิวถักจูติสำหรับโปโล", detail: "เทียบผิวถักและความทึบกับ TC Micro สเปกเส้นใยต้องยืนยันกับโรงงานก่อนขายจริง" },
    { id: "tc-micro", code: "24", name: "จูติ TC Micro", gsm: 240, feel: "ผิวถักจูติสำหรับโปโล", detail: "ใช้กับเสื้อโปโล TC Micro สเปกเส้นใยต้องยืนยันกับโรงงานก่อนขายจริง" }
  ];
  const definitions = [
    ["tee-cvc32", "เสื้อยืดคอกลม CVC 32", "CVC 32 Tee", "tee", "cvc32", 35000],
    ["tee-comb32", "เสื้อยืดคอกลม Cotton Comb 32", "Cotton Comb 32 Tee", "tee", "comb32", 35000],
    ["tee-semi20", "เสื้อยืดคอกลม Cotton Semi 20", "Cotton Semi 20 Tee", "tee", "semi20", 39000],
    ["tee-comb20", "เสื้อยืดคอกลม Cotton Comb 20", "Cotton Comb 20 Tee", "tee", "comb20", 39000],
    ["polo-tk", "เสื้อโปโลจูติ TK", "TK Piqué Polo", "polo", "tk", 49000],
    ["polo-tc-micro", "เสื้อโปโลจูติ TC Micro", "TC Micro Piqué Polo", "polo", "tc-micro", 49000]
  ];
  const products = definitions.map(([id, name, english, category, fabricId, unitSatang]) => ({
    id, name, english, category, fabricId, unitSatang, colors: ["white"], studio: true,
    chartSource: "ขนาดตัวอย่างสำหรับสาธิต ยังไม่ใช่ค่าที่วัดจากล็อตผลิตจริง",
    lot: "DEMO-V6", imageNote: "ภาพสร้างด้วย AI เพื่อสาธิต ไม่ใช่ภาพสินค้าจริง",
    chart: sizes.map((size, i) => ({ size, circumference: 98 + i * 8, length: (category === "polo" ? 64 : 63) + i * 3 })),
    detail: category === "polo" ? "เสื้อโปโลคอปกแขนสั้น สำหรับวันเรียน วันนำเสนองาน และวันทำงาน" : "เสื้อยืดคอกลมแขนสั้น เรียบง่ายสำหรับสวมใส่ทุกวัน"
  }));
  const measurements = {
    height: { label: "ส่วนสูง", min: 150, max: 190 }, shoulder: { label: "ความกว้างไหล่", min: 38, max: 54 },
    chest: { label: "รอบอกหุ่น", min: 80, max: 125 }, waist: { label: "รอบเอว", min: 65, max: 115 },
    leg: { label: "ความยาวช่วงขา", min: 70, max: 105 }
  };
  const sampleProfile = { height: 170, shoulder: 44, chest: 96, waist: 78, leg: 82 };
  const findProduct = id => products.find(p => p.id === id) ?? null;
  const findFabric = id => fabrics.find(f => f.id === id) ?? null;
  const findByFabricCode = code => {
    const fabric = fabrics.find(f => f.code === code);
    return fabric ? products.find(p => p.fabricId === fabric.id) ?? null : null;
  };
  const variantId = (productId, color, size) => [productId, color, size].join("~");
  const productImage = (id, color) => "./assets/products/" + id + "-" + color + ".webp";
  function resolveVariant(id) {
    if (typeof id !== "string") return null;
    const [productId, color, size, extra] = id.split("~"), p = findProduct(productId);
    if (extra !== undefined || !p?.colors.includes(color) || !sizes.includes(size)) return null;
    return { variantId: id, productId, name: p.name, fabricCode: findFabric(p.fabricId).code,
      color, colorName: colors[color].name, size, unitSatang: p.unitSatang, lot: p.lot,
      garmentChest: p.chart.find(r => r.size === size).circumference,
      garmentLength: p.chart.find(r => r.size === size).length };
  }
  const isProfile = p => !!p && Object.entries(measurements).every(([k, r]) => Number.isInteger(p[k]) && p[k] >= r.min && p[k] <= r.max);
  Mono.catalog = { products, fabrics, colors, categories, sizes, measurements, sampleProfile,
    findProduct, findFabric, findByFabricCode, variantId, productImage, resolveVariant, isProfile };
})();
