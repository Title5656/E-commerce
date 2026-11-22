# งานต้นแบบ MONO

## ปรับตามแผนธุรกิจ V6 · 22 พฤศจิกายน 2569

| งาน | สถานะ | ไฟล์และผลที่ตรวจ |
|---|---|---|
| V6-01 เสื้อหกรุ่นและเส้นทางร้าน | DONE | `docs/plan/PRODUCT_SPEC.md`, `js/catalog.js`, `js/views/shop.js`, `index.html`, `assets/` ค้นรหัสตรงตัวและซื้อเสื้อตรง ยุติบริการกล่องลอง |
| V6-02 Kit โค้ดและย้ายข้อมูล | DONE | `docs/plan/ARCHITECTURE.md`, `docs/plan/DECISION_LOG.md`, `js/store.js`, `js/rules.js`, `js/views/checkout.js` ยอด 99/251/291/391 บาท ประวัติเดิมและข้ามแท็บ |
| V6-03 Fit-Twin หกรุ่น | DONE | `js/fit-model.js`, `js/views/studio.js` คอกลม/คอปก วิธีวัด ตารางตัวอย่างและกลับไซซ์เดิม |
| V6-04 ที่มาลิงก์และซื้อซ้ำ | DONE | `js/views/retention.js`, `js/app.js`, `js/rules.js` สมัครใจติดตาม รับเสื้อพร้อมวัน และนับต่อคนครบ 60 วัน |
| V6-05 ตรวจรับรุ่นบนเครื่อง | DONE | `docs/plan/V6_IMPLEMENTATION.md`, `docs/plan/TEST_AND_DEPLOYMENT.md`, `js/tests.js`, `tests.html`, `README.md` ทดสอบ 390/1440 พิกเซลและตรวจโค้ดก่อนพร้อมเผยแพร่ |
| V6-06 เมนูติดจอและการ์ด Fabric Kit | DONE | `styles.css`, `studio.css`, `js/views/shop.js`, `js/views/checkout.js`, `assets/fabrics/IMAGE_SOURCES.md`, `docs/plan/PRODUCT_SPEC.md`, `docs/plan/TEST_AND_DEPLOYMENT.md` ตรวจ 390/1440 พิกเซล เมนูติดขอบบนไม่บังหุ่น ภาพ Kit การ์ดผ้าคล้องห่วงปกคราฟต์และ checkout ผ่าน ชุดทดสอบ 47/47 |

## ประวัติงานก่อน V6

สถานะด้านล่างเป็นผลของรุ่นเดิม ไม่ใช่กติกาหรือผลตรวจของ V6

| งาน | สถานะ | ต้องผ่านก่อน | ไฟล์และผลที่ตรวจ |
|---|---|---|---|
| P00 ลงสเปก | DONE | แผนที่อนุมัติ | `AGENTS.md`, `docs/plan/` ระบุข้อมูลเดโม หน่วยเงิน route และผลลัพธ์ |
| T01 โครงร้าน | DONE | P00 | `index.html`, `styles.css`, `js/catalog.js`, `js/app.js`, `js/views/`, `assets/` เปิดสินค้า 6 รุ่นและลิงก์ตรงได้ |
| T02 ซื้อปกติ | DONE | T01 | `js/rules.js`, `js/store.js`, ตะกร้าและ checkout ซื้อ 390 บาท กดซ้ำพบเลขออเดอร์เดิม |
| T03 สมุดผ้า | DONE | T02 | หน้า Passport, กติกาเครดิต, C01–C04 ซื้อสมุดแล้วซื้อ 499 บาท จ่าย 400 บาท |
| T04 Fit-Twin | DONE | T01 | Studio และ Product, F01–F06 เปลี่ยนทรง บันทึกและลบโปรไฟล์ได้ |
| T05 เปิดกล่องลอง | DONE | T02 | ตะกร้าลอง checkout Tracker, MC01, MC07 มี 3 ช่อง มัดจำ 590 บาท ยอดเสี่ยง 880 บาท |
| T06 ปิดกล่อง | DONE | T05 | Tracker และ MC02–MC11 ปิดยอดหลังตรวจคืน ดำเนินการกับกล่องเลยกำหนดได้ |
| T07 ตรวจและเผยแพร่ | DONE | T03, T04, T06 | [เปิดเดโม](https://title5656.github.io/E-commerce/) และ [ชุดทดสอบ](https://title5656.github.io/E-commerce/tests.html) ผ่าน 29 กรณี ตรวจสี่เส้นทางที่ขนาดจอ 1440 และ 390 พิกเซลแล้ว |
| T08 รายงานและซ้อม | PAUSED | T07 | ผู้ใช้ขอเริ่มในแชตถัดไปหลังต้นแบบเสร็จ |
| T09 ปรับหน้าร้าน MONO และห้องลอง 3D | DONE | T07 | ตรวจรุ่นบนเครื่องที่ 390 และ 1440 พิกเซล สี่เส้นทางและชุดทดสอบ 30 กรณีผ่าน ภาพสินค้าครบ 12 ตัวเลือกสี หุ่นหมุนและขยายช่วงตัวได้ |

ดูข้อมูลใน [สเปก](docs/plan/PRODUCT_SPEC.md) และขั้นตอนใน [แผนทดสอบและเผยแพร่](docs/plan/TEST_AND_DEPLOYMENT.md)
