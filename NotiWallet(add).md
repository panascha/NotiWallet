# 📋 Plan: Notification Capture + Reimbursement Batch

> ส่วนต่อขยายของ AI-Powered Expense Tracker
> เป้าหมาย: บันทึกเร็วที่สุดผ่าน iOS Shortcut + จัดการ "รอบเบิกพ่อแม่" ให้กลายเป็นข้อความสรุปก็อปส่งแชตได้ทันที

---

## 1. หลักคิด (อ่านก่อน)

ระบบนี้ **ไม่ใช่ expense log ธรรมดา** แต่เป็น **reimbursement cycle** ตาม pattern ในโน้ตเดิม:

```
สะสมหลายรายการ → ตีกรอบเป็น "รอบ" → รวมยอด → ส่งเบิก → mark "ได้แล้ว"
```

ดังนั้น "รอบเบิก (batch)" ต้องเป็น object ระดับ first-class ไม่ใช่แค่ checkbox ลอยๆ

ข้อจำกัด iOS ที่กำหนด architecture (ต้องยอมรับ):
- PWA/แอป **อ่าน push ของแอปอื่นไม่ได้** → ต้องใช้ iOS Shortcuts Automation
- Automation จาก notification **ส่วนใหญ่ยังต้องแตะ 1 ครั้ง** (ไม่ silent ทุกเคส)
- notification ของ Kbank/เป๋าตัง บอกแค่ยอด+เวลา **ไม่บอกว่าจ่ายค่าอะไร** → ต้องมี step เลือกหมวดเอง

→ flow จริงคือ **"กึ่งอัตโนมัติ"**: noti เด้ง → แตะ Shortcut → pre-fill ยอด/เวลา/บัญชี → เลือกหมวด + เบิก/ไม่เบิก → จบ

---

## 2. บัญชีที่ใช้จริง (จากภาพ Evo Wallet)

| บัญชี | บทบาท | track ใน flow ใช้จ่าย? |
| --- | --- | --- |
| **Kbank** | กระเป๋าใช้จ่ายหลัก (โอนทั่วไป) | ✅ |
| **Truemoney** | กระเป๋าใช้จ่าย | ✅ |
| **เป๋าตัง** | โอนจาก Kbank มาใช้ | ✅ (เป็น internal transfer จาก Kbank) |
| **SCB ออมทรัพย์** | แบ่งเงินเดือนมาเก็บ | ⬜ เงินเก็บ — ไม่ต้อง track รายวัน |
| **SCB Easy saving** | เงินเก็บหลัก | ⬜ เงินเก็บ |

> **เป๋าตัง = โอนจาก Kbank** ต้องระวัง double-count: ตอนโอน Kbank→เป๋าตัง = internal transfer ไม่ใช่รายจ่าย, จ่ายจริงตอน "เป๋าตังจ่ายร้านค้า" เท่านั้น

---

## 3. Schema ที่ต้องเพิ่ม / แก้

### 3.1 แก้ table `transactions` (เพิ่ม columns)

| Column | Type | ใหม่? | Description |
| --- | --- | --- | --- |
| `reimbursable` | Boolean | ✅ ใหม่ | จ่ายเองก่อน รอเบิกพ่อแม่หรือไม่ |
| `batch_id` | String | ✅ ใหม่ | อ้างอิงรอบเบิก (null = ยังไม่จัดรอบ) |
| `source` | String | แก้ค่า | เพิ่มค่า `notification` จากเดิม `ocr`/`manual` |
| `dedup_hash` | String | ✅ ใหม่ | กันบันทึกซ้ำ = hash(amount+เวลานาที+account) |

### 3.2 table ใหม่ `reimburse_batches` (Sheet Tab: `Batches`)

| Column | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `id` | String | ✅ | รหัสรอบ | `batch_20260612_x1` |
| `user_id` | String | ✅ | Firebase UID | `abc123xyz` |
| `title` | String |  | ชื่อรอบ (เช่นเดือน) | `เบิก มิ.ย. 69` |
| `status` | String | ✅ | `open` / `sent` / `paid` | `open` |
| `total` | Number | ✅ | ยอดรวม (คำนวณตอนปิดรอบ) | `2098` |
| `created_at` | ISOString | ✅ | เปิดรอบ | `2026-06-12T...` |
| `paid_at` | ISOString |  | mark "ได้แล้ว" เมื่อไหร่ | `2026-06-20T...` |

> `status` map กับโน้ตเดิม: `open` = กำลังสะสม, `sent` = ส่งข้อความเบิกแล้ว, `paid` = `[x] ได้แล้ว`

### 3.3 รายรับ (income) — มาจากไหน

ใช้ table `transactions` เดิม `type=income` + ใช้ `category` เก็บแหล่งที่มา เช่น `รายเดือน`, `เงินเบิกคืน`, `ขายของ` (ในโน้ตมี "ขายใบพาย", "ขายอกไก่") — ไม่ต้องทำ table แยก

---

## 4. Flow หลัก: บันทึกผ่าน Notification

```
[Kbank/Truemoney/เป๋าตัง noti เด้ง]
        │
        ▼
[iOS Shortcut Automation]  →  จับ noti text → ส่ง POST ไป GAS
        │
        ▼
[GAS]  →  Gemini parse ยอด/เวลา/บัญชี → เช็ค dedup_hash
        │
        ▼
[PWA เปิดหน้า Quick-Confirm]  →  pre-fill ยอด+บัญชีให้แล้ว
        │
        ├─ เลือกหมวด (ปุ่มใหญ่ๆ: อาหาร/ของใช้/เดินทาง/...)
        ├─ toggle "เบิกพ่อแม่?" ◯
        └─ กดบันทึก → จบใน 2 แตะ
```

### GAS payload เพิ่ม

```json
{
  "action": "ingestNotification",
  "userId": "abc123xyz",
  "rawText": "K PLUS: รายการโอนเงิน 350.00 บาท ...",
  "capturedAt": "2026-06-12T19:20:00Z"
}
```

Response (ให้ PWA เอาไป pre-fill):
```json
{
  "status": "success",
  "parsed": {
    "amount": 350,
    "account_id": "acc_kbank",
    "date": "2026-06-12T19:20:00Z",
    "recipient": "ร้านกาแฟ",
    "dedup_hash": "a1b2c3",
    "duplicate": false
  }
}
```

---

## 5. Flow เบิก: ปิดรอบ → ก็อปข้อความ

```
[หน้า "รอเบิก"]  →  list รายการที่ reimbursable=true & batch_id=null
        │
        ▼
[เลือกรายการ → "ปิดรอบ"]  →  สร้าง batch, ผูก batch_id, รวม total
        │
        ▼
[Generate ข้อความสรุป]  →  ปุ่ม Copy → ส่ง LINE
        │
        ▼
[พ่อแม่โอนคืน → กด "ได้แล้ว"]  →  batch.status=paid
                                  + (option) สร้าง income "เงินเบิกคืน"
```

### รูปแบบข้อความสรุป (เลียนแบบโน้ตเดิม)

```
กาแฟหมูแหนม 2/6/69 90
เปลี่ยนเลนส์แว่น 5/6/69 2500
ตัดผม 6/6/69 50
ถิงถิง 6/6/69 183
Yamazaki 8/6/69 240

รวม 3063
```

> format: `[ชื่อ] [วันที่ d/m/yy พ.ศ.ย่อ] [ยอด]` ต่อบรรทัด + `รวม [total]` ปิดท้าย — ตรงกับที่คุณส่งอยู่แล้ว พ่อแม่คุ้นเคย

---

## 6. หน้าจอที่ต้องเพิ่ม / แก้

| หน้า | สถานะ | หน้าที่ |
| --- | --- | --- |
| `quick-confirm.js` | ✅ ใหม่ | pre-fill จาก noti → เลือกหมวด → บันทึก 2 แตะ |
| `reimburse.js` | ✅ ใหม่ | หน้า "รอเบิก" + ปิดรอบ + ก็อปข้อความ + mark ได้แล้ว |
| `manual.js` | เดิม | เพิ่ม toggle "เบิกพ่อแม่?" |
| `index.js` | เดิม | เพิ่มการ์ด "รอเบิก: X รายการ / รวม Y บาท" |

### service เพิ่ม
- `gas.service.js`: เพิ่ม `ingestNotification()`, `createBatch()`, `markBatchPaid()`
- `utils/reimburseText.js`: สร้างข้อความสรุปจาก array รายการ

---

## 7. หมวดหมู่เริ่มต้น (จากของจริงในโน้ต)

วิเคราะห์จากโน้ต ค่าใช้จ่ายซ้ำบ่อย:

| หมวด | icon | ตัวอย่างในโน้ต |
| --- | --- | --- |
| อาหาร/คาเฟ่ | 🍔 | Yamazaki, กาแฟ, สุกี้โรล, 62 block |
| ของใช้/Makro | 🛒 | Makro (ซ้ำบ่อยมาก) |
| ตัดผม/ดูแลตัว | ✂️ | ตัดผม, ขูดหินปูน |
| เดินทาง/รถ | 🚗 | น้ำมันเครื่อง, พรบ., ต่อใบขับขี่ |
| การศึกษา | 🎓 | ค่าเทอม, ใบรับรองนักศึกษา |
| Subscription | 📺 | Netflix, Disney+ |
| รายเดือนประจำ | 📅 | รายเดือน, ส่งผ้า |
| อื่นๆ | 📦 | — |

> ค่าเทอม/ค่าธรรมเนียมก้อนใหญ่ (3-8 หมื่น) ควรแยก flag ออกจากรายจ่ายรายวัน ไม่งั้นกราฟเพี้ยน

---

## 8. ลำดับการ build (แนะนำ)

1. **Phase 1 — Core capture**: เพิ่ม schema columns + `quick-confirm.js` + `ingestNotification` GAS
2. **Phase 2 — iOS Shortcut**: สร้าง Shortcut จับ noti → POST (เขียน spec แยก)
3. **Phase 3 — Reimburse**: `Batches` table + `reimburse.js` + ข้อความสรุป
4. **Phase 4 — Dashboard**: การ์ด "รอเบิก" + แยกก้อนใหญ่ออกจากกราฟ

> เริ่ม Phase 1+3 ก่อนได้เลยเพราะใช้งานได้จริงแม้ยังไม่มี Shortcut (กรอกมือผ่าน quick-confirm ก็เร็วอยู่แล้ว) แล้วค่อยเติม Shortcut ทีหลัง

---

## 9. ข้อควรระวัง

- **เป๋าตัง double-count**: Kbank→เป๋าตัง = transfer, อย่านับเป็นจ่าย
- **noti ซ้ำ**: บางทีเด้ง 2 ครั้ง → `dedup_hash` กันไว้
- **noti ไม่บอกร้าน**: Gemini เดา recipient ได้แต่ไม่ชัวร์ → ให้แก้ได้ในหน้า confirm
- **วันที่ พ.ศ./ค.ศ.**: โน้ตใช้ พ.ศ.ย่อ (69=2026) แต่ DB เก็บ ISO ค.ศ. → แปลงตอน render ข้อความเบิกเท่านั้น