# สถาปัตยกรรม

ใช้ไฟล์ในราก repo เป็น publishing source โดยตรง `index.html` ใช้ classic scripts แบบ defer ตามลำดับ catalog → rules → store → views → app การทดสอบโหลดสามโมดูลแรกและ `tests.js` ภายใน `tests.html` ทุกไฟล์ทำงานจาก static hosting

| โมดูล | สัญญา |
|---|---|
| catalog | ข้อมูลสินค้า/สี/ผ้า/คาเฟ่/ไซส์แบบคงที่ variant ID ประกอบจาก product, color, size |
| rules | คำนวณ quote ซื้อ กล่องลอง และ settlement จากรายการที่ resolve แล้ว จำแนก fit จากระยะเผื่อ และหาไซส์แนะนำ ฟังก์ชันคำนวณไม่อ่านเวลาและ storage เอง |
| store | บันทึกการกระทำทั้งรายการใน localStorage key `itds294.warin.v1` snapshot ราคาก่อนจ่าย ผูกเครดิตกับออเดอร์และ ID คำขอยืนยันกับใบเดิม |
| views | วาดแต่ละหน้าจาก route และ state ส่ง form/เหตุการณ์กลับไปที่ app ห้องลองใช้โมเดลสามมิติใน `js/fit-model.js` สำหรับภาพที่เปลี่ยนตามสัดส่วน |
| app | อ่าน hash ผูก form กับ store แสดงผลตอบรับและนำทางหลังบันทึก จัด focus เมื่อเปลี่ยนหน้า |

เก็บ `version: 1`, `cart`, `trialCart`, `credits`, `orders`, `trials` และ `profile` ราคาเป็นสตางค์ สัดส่วนเป็นซม. เวลาเป็น epoch มิลลิวินาที ตรวจข้อมูลที่อ่านจาก storage แล้วแสดงทางไปรีเซ็ตเมื่อรูปแบบเสีย fallback ในหน่วยความจำเมื่อ storage ใช้ไม่ได้

กล่องลองผ่าน `awaiting_delivery → trying → awaiting_return → settled` กล่องที่เก็บทั้งหมดข้าม `awaiting_return` ได้ กล่องที่พบปัญหาหยุดที่ `review` กำหนดเลยเวลาอ่านจาก `expiresAt` และเวลาปัจจุบัน ผู้ใช้ยังแจ้งคืนได้เมื่อเลยกำหนด
