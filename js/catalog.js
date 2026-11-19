(() => {
  const Warin = globalThis.Warin ??= {};

  const sizes = ["S", "M", "L", "XL"];
  const colors = {
    chalk: { name: "ขาวชอล์ก", hex: "#eeece1" },
    oatmeal: { name: "โอ๊ตมีล", hex: "#c4af94" },
    olive: { name: "เขียวมะกอก", hex: "#737b60" },
    charcoal: { name: "ชาร์โคล", hex: "#444a46" }
  };

  const categories = {
    tee: "เสื้อยืด", polo: "โปโล", shirt: "เชิ้ต", shorts: "กางเกงขาสั้น", trousers: "กางเกงขายาว"
  };

  const fabrics = [
    { id: "heavy-cotton", name: "Heavy Cotton Jersey", gsm: 240, feel: "แน่น นุ่ม อยู่ทรง", detail: "ผ้าคอตตอนเนื้อแน่นที่ให้โครงกับเสื้อยืด เหมาะกับวันที่อยากได้ทรงชัดขึ้น", color: "chalk" },
    { id: "pique", name: "Cotton Piqué", gsm: 200, feel: "มีสัมผัส ระบายอากาศ", detail: "ผิวถักเป็นลายละเอียด ให้สัมผัสแตกต่างจากเสื้อยืดผ้าเรียบ", color: "olive" },
    { id: "linen-blend", name: "Cotton–Linen Blend", gsm: 165, feel: "โปร่ง มีเส้นใยให้เห็น", detail: "ผ้าผสมที่มีผิวเป็นธรรมชาติและเกิดรอยยับได้ตามการใส่", color: "oatmeal" },
    { id: "light-cotton", name: "Light Cotton Jersey", gsm: 155, feel: "เบา นุ่ม ทิ้งตัว", detail: "ผ้าเจอร์ซีย์น้ำหนักเบาสำหรับสวมเดี่ยวหรือใส่เป็นชั้นใน", color: "chalk" },
    { id: "twill", name: "Cotton Twill", gsm: 225, feel: "มีลายทแยง อยู่ทรง", detail: "ลายทอทแยงช่วยให้กางเกงมีโครงและมีสัมผัสเป็นเอกลักษณ์", color: "oatmeal" },
    { id: "poplin", name: "Cotton Poplin", gsm: 145, feel: "ผิวเรียบ สัมผัสเบา", detail: "ผ้าทอเนื้อละเอียดสำหรับกางเกงทรงตรงที่ใส่สบาย", color: "charcoal" }
  ];

  function chart(circumferences, lengths) {
    return sizes.map((size, index) => ({
      size, circumference: circumferences[index], length: lengths[index]
    }));
  }

  const products = [
    {
      id: "tee-heavy", name: "เสื้อยืดคอตตอนหนา", english: "Heavy Cotton Tee", category: "tee",
      fabricId: "heavy-cotton", unitSatang: 39000, colors: ["chalk", "charcoal"], studio: true,
      chart: chart([98, 106, 114, 122], [63, 66, 69, 72]),
      detail: "เสื้อยืดคอกลม เนื้อผ้า 240 gsm ให้ทรงชัด ใส่เดี่ยวหรือซ้อนกับเชิ้ตได้"
    },
    {
      id: "polo-pique", name: "เสื้อโปโลปิเก้", english: "Piqué Polo", category: "polo",
      fabricId: "pique", unitSatang: 49000, colors: ["olive", "oatmeal"], studio: false,
      chart: chart([98, 106, 114, 122], [64, 67, 70, 73]),
      detail: "คอปกเรียบกับผ้าปิเก้ผิวละเอียด สำหรับวันที่อยากแต่งตัวขึ้นอีกนิด"
    },
    {
      id: "shirt-linen", name: "เชิ้ตลินินทรงสบาย", english: "Linen Blend Shirt", category: "shirt",
      fabricId: "linen-blend", unitSatang: 59000, colors: ["oatmeal", "chalk"], studio: true,
      chart: chart([102, 110, 118, 126], [66, 69, 72, 75]),
      detail: "เชิ้ตแขนยาวผ้าคอตตอนผสมลินิน ทรงโปร่ง ใส่ทับเสื้อยืดตัวโปรดได้"
    },
    {
      id: "tee-air", name: "เสื้อยืดคอตตอนเบา", english: "Light Cotton Tee", category: "tee",
      fabricId: "light-cotton", unitSatang: 35000, colors: ["oatmeal", "olive"], studio: false,
      chart: chart([96, 104, 112, 120], [62, 65, 68, 71]),
      detail: "เสื้อยืดคอกลมเนื้อเบาและทิ้งตัว สำหรับใส่ได้บ่อยในวันอากาศอุ่น"
    },
    {
      id: "shorts-twill", name: "กางเกงขาสั้นทวิลล์", english: "Twill Shorts", category: "shorts",
      fabricId: "twill", unitSatang: 49900, colors: ["oatmeal", "charcoal"], studio: false,
      chart: chart([68, 76, 84, 92], [18, 19, 20, 21]),
      detail: "กางเกงขาสั้นผ้าทวิลล์ทรงตรง ผิวทอทแยงและมีกระเป๋าด้านข้าง"
    },
    {
      id: "trousers-easy", name: "กางเกงขายาวทรงตรง", english: "Easy Straight Trousers", category: "trousers",
      fabricId: "poplin", unitSatang: 69000, colors: ["charcoal", "olive"], studio: false,
      chart: chart([70, 78, 86, 94], [71, 73, 75, 77]),
      detail: "กางเกงขายาวทรงตรงผ้าป๊อปลินเรียบ เบาพอสำหรับใส่สลับกับกางเกงตัวเดิมทุกวัน"
    }
  ];

  const cafes = [
    { id: "ari", name: "คาเฟ่อารีย์", area: "อารีย์", hours: "09.00–18.00 น." },
    { id: "siam", name: "คาเฟ่สยาม", area: "สยาม", hours: "10.00–19.00 น." },
    { id: "salaya", name: "คาเฟ่ศาลายา", area: "ศาลายา", hours: "09.00–17.00 น." }
  ];

  const measurements = {
    height: { label: "ส่วนสูง", min: 150, max: 190 },
    shoulder: { label: "ความกว้างไหล่", min: 38, max: 54 },
    chest: { label: "รอบอก", min: 80, max: 125 },
    waist: { label: "รอบเอว", min: 65, max: 115 },
    leg: { label: "ความยาวช่วงขา", min: 70, max: 105 }
  };
  const sampleProfile = { height: 170, shoulder: 44, chest: 96, waist: 78, leg: 82 };
  const findProduct = id => products.find(product => product.id === id) ?? null;
  const findFabric = id => fabrics.find(fabric => fabric.id === id) ?? null;
  const findCafe = id => cafes.find(cafe => cafe.id === id) ?? null;
  const variantId = (productId, color, size) => [productId, color, size].join("~");
  const productImage = (productId, color) => "./assets/" + productId + "-" + color + ".svg";

  function resolveVariant(id) {
    if (typeof id !== "string") return null;
    const [productId, color, size, extra] = id.split("~");
    const product = findProduct(productId);
    if (extra !== undefined || !product?.colors.includes(color) || !sizes.includes(size)) return null;
    return {
      variantId: id, productId, name: product.name, color, colorName: colors[color].name,
      size, unitSatang: product.unitSatang
    };
  }

  function isProfile(profile) {
    return profile && Object.entries(measurements).every(([key, range]) =>
      Number.isInteger(profile[key]) && profile[key] >= range.min && profile[key] <= range.max
    );
  }

  Warin.catalog = {
    products, fabrics, colors, categories, cafes, sizes, measurements, sampleProfile,
    findProduct, findFabric, findCafe, variantId, productImage, resolveVariant, isProfile
  };
})();
