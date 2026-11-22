# สถาปัตยกรรม MONO V6

ไฟล์รากเป็น publishing source เปิด HTML โดยตรงหรือ GitHub Pages ได้ ใช้ classic scripts defer: catalog → rules → store → shared/shop/checkout → fit-model/studio/retention → app การทดสอบใช้สามโมดูลแรกกับ tests.js ไม่อ่าน storage ของร้าน

| โมดูล | สัญญา |
|---|---|
| catalog | แหล่งเดียวของ products/fabrics/chart รายรุ่นและล็อต `findByFabricCode(string)` จับคู่ตรงตัว `resolveVariant(id)` คืนสินค้าและขนาด ณ ตอนนี้หรือ null |
| rules | `quotePurchase(lines,credits,creditId)` คืน subtotalSatang/creditSatang/dueSatang/creditId, `classifyFit`, `recommendSize`, `metrics(state,now)` ไม่อ่าน storage/เวลาภายใน |
| store | `createStore({storage,getNow,runExclusive})` คืน read/info/refresh/dispatch, ตรวจข้อมูล ย้าย v1 เก็บ snapshot และผูกเครดิต/คำขอยืนยันกับใบสั่งซื้อ |
| views | วาดจาก route/state ไม่มี mutation; retention แสดงที่มาลิงก์ การติดตามจำลองและตัวชี้วัด |
| app | hash router, forms/actions, Web Locks และ storage event, session attribution, จัด focus/menu และ mount/destroy หุ่น |
| fit-model | WebGL และ software renderer, คอกลม/คอปกแขนสั้น, หมุน/ขยายหุ่น หากใช้ canvas ไม่ได้แสดงภาพและตาราง |

## Storage และการย้าย

key ใหม่ `mono.v2`, `version: 2`: `customerId`, `cart`, `orders`, `credits`, `legacyTrials`, `profile`, `favorite`, `followUp`, `attribution`, `migrationNotice` เงินเป็นสตางค์ เวลา epoch มิลลิวินาที ขนาดเป็นซม.

ถ้าไม่มี v2 ให้อ่าน `itds294.warin.v1`: ตรวจประวัติจากรายละเอียดที่เก็บไว้ ไม่ resolve กับ catalog ใหม่ คัดตะกร้าเฉพาะ variant ที่ยังขาย แจ้งรายการที่นำออก คงโปรไฟล์ที่อยู่ในช่วง ข้อมูล trial ที่ยืนยันแล้วอยู่ใน legacyTrials แบบอ่านอย่างเดียว เครดิตเดิมคัดทั้ง issuedBy/usedBy ไม่ออกสิทธิ์จากใบเก่าซ้ำ บันทึก v2 เป็นเครื่องหมายย้ายแล้ว เก็บ v1 เดิมจนผู้ใช้ล้างข้อมูลร้าน

reset ลบ key v1 และเขียน v2 ว่าง เพื่อไม่ฟื้นประวัติรอบหน้า ไม่แตะ key ของแอปอื่น รูปแบบเสียห้ามเขียนทับจน reset; storage อ่าน/เขียนไม่ได้ทำต่อในหน่วยความจำพร้อมแจ้งข้อจำกัด

## ธุรกรรม

`checkout` ตรวจ requestId ซ้ำก่อนตรวจตะกร้า เพื่อคืนใบเดิมแม้ตะกร้าถูกล้างแล้ว จากนั้นตรวจ signature ของ draft อ่านโค้ดจากสิทธิ์ล่าสุดและปฏิเสธโค้ดผิด/ใช้แล้ว/ใช้กับ Kit ภายใต้ Web Lock ชื่อเดียวกับ storage key

Order เก็บ `mode: kit|purchase` (ประวัติเดิมคง passport), `requestId`, `createdAt`, `customerId`, `deliveredAt`, `attribution`, `legacy`, `lines`, quote ของยอดจริง Kit เก็บ `kitSnapshot` พร้อมชื่อ จำนวน ขนาดและ contents หกชิ้นด้วย Purchase line เก็บชื่อ fabricCode สี ไซซ์ lot garmentChest garmentLength unitSatang quantity เครดิตเก็บ `id/issuedBy/usedBy`

อ่าน refresh ก่อนทุก mutation บันทึก state ทั้งก้อน และฟัง storage event เพื่อให้สองแท็บเห็นโค้ดล่าสุด เบราว์เซอร์เป้าหมายคือ Edge/Chrome รุ่นที่มี Web Locks บน GitHub Pages (HTTPS) เมื่อเปลี่ยนหน้าระหว่างรอ mutation ให้ render หน้าปัจจุบันด้วย state หลังบันทึก

## ที่มาและติดตาม

ลิงก์ hash ใช้ `utm_source` และ `utm_placement` แบบ allowlist เก็บที่มาใน sessionStorage `mono.visit` ของแท็บ ส่งเป็น `action.attribution` ตอน checkout และคัดลง order โดยไม่ใช้ค่าที่แท็บอื่นเขียน แหล่งเผยแพร่ที่ไม่ระบุเป็น unspecified การเปลี่ยนตัวเลือกสินค้า/Studio คง query ที่มาเพื่อแชร์ต่อได้ ช่อง LINE OA เก็บเพียง boolean และเวลา ไม่มี SDK หรือการส่งข้อความออกนอกเว็บ

`receiveOrder` บันทึกวันรับครั้งเดียว `saveFavorite` อ้าง order/line ที่รับแล้ว ใช้ขนาด snapshot เป็นจุดเริ่มเทียบรุ่นใหม่ `metrics` ใช้ Kit/สิทธิ์และ order จริงใน state: จัดกลุ่ม customerId เลือกซื้อเสื้อตัวแรก ตรวจวันรับและช่วงครบ 60 วัน แล้วนับบิลอื่นในช่วงเพียงหนึ่งครั้งต่อคน ประวัติเดิมที่ไม่มีวันรับไม่อยู่ใน cohort
