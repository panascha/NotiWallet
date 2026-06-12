# AI-Powered Expense Tracker 🚀

> ระบบบันทึกและติดตามค่าใช้จ่ายส่วนตัวอัจฉริยะ ที่ใช้ AI วิเคราะห์สลิปโอนเงินและ notification ของธนาคารอัตโนมัติ
>
> รองรับการใช้งานบน iPhone ผ่านเว็บ / PWA โดยไม่ต้องติดตั้งผ่าน App Store

---

## 🌟 Features

- 🤖 **AI-Powered OCR (Gemini API)** — สแกนสลิปโอนเงินด้วย AI ดึงข้อมูลยอด, วันที่, ผู้รับ, ธนาคาร และจำแนกหมวดหมู่อัตโนมัติ
- 🔔 **Notification Capture** — iOS Shortcut Automation จับ notification ของ Kbank/Truemoney/เป๋าตัง → ส่งให้ Gemini parse → เปิดหน้า Quick-Confirm pre-fill ยอด/บัญชีให้แล้ว → บันทึกได้ใน 2 แตะ
- 📱 **PWA (Progressive Web App)** — ติดตั้งเป็นไอคอนบนหน้าจอ Home ของ iPhone เสมือนแอปจริง โดยไม่ผ่าน App Store
- ✏️ **Manual Entry** — ป้อนรายรับ-รายจ่ายด้วยตนเองสำหรับธุรกรรมเงินสดที่ไม่มีสลิป พร้อม toggle "เบิกพ่อแม่?"
- 💸 **Reimbursement Batch** — สะสมรายการที่ "รอเบิก" → ปิดเป็นรอบ → Generate ข้อความสรุปก็อปส่ง LINE ได้ทันที → mark "ได้แล้ว"
- 📊 **Visualized Dashboard** — สรุปยอดรายรับ-รายจ่ายประจำเดือน, กราฟวงกลมแยกหมวดหมู่, การ์ด "รอเบิก: X รายการ / รวม Y บาท"
- 🏦 **Multi-Account Management** — ติดตามยอดคงเหลือแยกตามบัญชี (Kbank, Truemoney, เป๋าตัง) พร้อมป้องกัน double-count สำหรับ internal transfer
- 🗂️ **Category & Budget** — กำหนดหมวดหมู่และตั้ง Budget Limit แต่ละหมวดหมู่ได้
- 🔕 **Budget Alert (แผนพัฒนา)** — แจ้งเตือนเมื่อค่าใช้จ่ายเกินงบประมาณที่กำหนด
- 📥 **Export (แผนพัฒนา)** — ดาวน์โหลดข้อมูลเป็น Excel หรือ PDF
- 👨‍👩‍👧 **Multi-user (แผนพัฒนา)** — รองรับการใช้งานร่วมกันเป็นกลุ่มหรือครอบครัว

---

## 🛠️ Tech Stack

| Layer | Technology | หน้าที่ |
| --- | --- | --- |
| **Frontend** | Next.js (React) | UI, Dashboard, PWA Shell |
| **Styling** | Tailwind CSS | Responsive Design สำหรับ Mobile/Desktop |
| **Auth** | Firebase Authentication | Google Sign-In, Session Management |
| **AI / OCR** | Google Gemini API | วิเคราะห์รูปสลิป (Base64) + parse notification text → JSON |
| **Backend Logic** | Google Apps Script (GAS) | รับ Base64/text, เรียก Gemini, บันทึกลง Sheets |
| **DB (Primary)** | Google Sheets | เก็บ Transactions, Accounts, Categories, Batches |
| **Hosting** | Vercel | Deploy Next.js + PWA |

---

## 💡 หลักคิด: Reimbursement Cycle

ระบบนี้ไม่ใช่แค่ expense log ธรรมดา แต่รองรับ **reimbursement cycle** ตาม pattern:

```
สะสมหลายรายการ → ตีกรอบเป็น "รอบ" → รวมยอด → ส่งเบิก → mark "ได้แล้ว"
```

`reimburse_batches` เป็น object ระดับ first-class ไม่ใช่แค่ checkbox ลอยๆ

**ข้อจำกัด iOS ที่กำหนด architecture:**
- PWA/แอป **อ่าน push ของแอปอื่นไม่ได้** → ต้องใช้ iOS Shortcuts Automation
- Automation จาก notification **ส่วนใหญ่ต้องแตะ 1 ครั้ง** (ไม่ silent ทุกเคส)
- Notification ของ Kbank/เป๋าตัง บอกแค่ยอด+เวลา **ไม่บอกว่าจ่ายค่าอะไร** → ต้องมี step เลือกหมวดเอง

Flow จริงคือ **กึ่งอัตโนมัติ**: noti เด้ง → แตะ Shortcut → pre-fill ยอด/เวลา/บัญชี → เลือกหมวด + เบิก/ไม่เบิก → จบ

---

## 🏦 บัญชีที่ใช้จริง

| บัญชี | บทบาท | track ใน flow ใช้จ่าย? |
| --- | --- | --- |
| **Kbank** | กระเป๋าใช้จ่ายหลัก | ✅ |
| **Truemoney** | กระเป๋าใช้จ่าย | ✅ |
| **เป๋าตัง** | รับโอนจาก Kbank มาใช้ | ✅ (internal transfer จาก Kbank — อย่านับเป็นรายจ่าย) |
| **SCB ออมทรัพย์** | เงินเก็บ | ⬜ ไม่ต้อง track รายวัน |
| **SCB Easy saving** | เงินเก็บหลัก | ⬜ ไม่ต้อง track รายวัน |

> ⚠️ **Double-count**: Kbank→เป๋าตัง = internal transfer ไม่ใช่รายจ่าย รายจ่ายเกิดตอน "เป๋าตังจ่ายร้านค้า" เท่านั้น

---

## 📂 Project Structure

```
expense-tracker/
├── public/
│   ├── manifest.json               # PWA Manifest
│   └── icons/                      # App icons สำหรับ iOS Home Screen
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── TransactionCard.js
│   │   ├── PieChart.js
│   │   └── Modal.js
│   ├── pages/
│   │   ├── index.js                # Dashboard (+ การ์ด "รอเบิก")
│   │   ├── scan.js                 # สแกนสลิปด้วย OCR
│   │   ├── quick-confirm.js        # pre-fill จาก noti → เลือกหมวด → บันทึก 2 แตะ
│   │   ├── manual.js               # กรอกรายการด้วยตนเอง (+ toggle "เบิกพ่อแม่?")
│   │   ├── reimburse.js            # หน้า "รอเบิก" + ปิดรอบ + ก็อปข้อความ + mark ได้แล้ว
│   │   ├── accounts.js             # จัดการบัญชี
│   │   └── categories.js           # จัดการหมวดหมู่และ Budget
│   ├── services/
│   │   ├── firebase.js             # Firebase SDK init
│   │   ├── auth.service.js         # Login, Logout, onAuthStateChanged
│   │   └── gas.service.js          # fetch() ทั้งหมดไป GAS Web App URL
│   ├── styles/
│   │   └── global.css
│   └── utils/
│       ├── helpers.js              # formatDate(), formatCurrency() ฯลฯ
│       ├── imageUtils.js           # แปลง File → Base64
│       └── reimburseText.js        # Generate ข้อความสรุปรอบเบิกจาก array รายการ
├── google-apps-script/
│   ├── Code.js
│   └── appsscript.json
├── .env                            # ❌ ห้าม commit
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
└── tailwind.config.js
```

---

## ⚙️ Config Files

### `next.config.js`

```js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

### `.env.example`

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GAS_WEBAPP_URL=https://script.google.com/macros/s/.../exec
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=@gmail.com
```

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

---

## 🗄️ Database Schema

> ⚠️ Google Sheets เป็น Schemaless — **ต้องล็อกชื่อ column ไว้ที่นี่** เพื่อป้องกัน field ชื่อเพี้ยน

### Table: `transactions` (Sheet Tab: `Transactions`)

| Column | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `id` | String | ✅ | UUID สร้างโดย GAS | `txn_20260521_abc123` |
| `user_id` | String | ✅ | Firebase Auth UID | `abc123xyz` |
| `date` | ISOString | ✅ | วันที่ธุรกรรม (UTC) | `2026-05-21T15:00:00Z` |
| `type` | String | ✅ | `income` หรือ `expense` | `expense` |
| `amount` | Number | ✅ | จำนวนเงิน (บาท) | `350` |
| `category` | String | ✅ | หมวดหมู่ | `อาหาร` |
| `account_id` | String | ✅ | อ้างอิง Accounts sheet | `acc_kbank` |
| `recipient` | String | | ผู้รับเงิน / ร้านค้า | `7-ELEVEN` |
| `bank` | String | | ธนาคารต้นทาง | `กสิกรไทย` |
| `note` | String | | หมายเหตุ | `ข้าวเที่ยง` |
| `source` | String | ✅ | `ocr` / `manual` / `notification` | `notification` |
| `reimbursable` | Boolean | ✅ | รอเบิกพ่อแม่หรือไม่ | `true` |
| `batch_id` | String | | อ้างอิงรอบเบิก (null = ยังไม่จัดรอบ) | `batch_20260612_x1` |
| `dedup_hash` | String | | กันบันทึกซ้ำ = hash(amount+เวลานาที+account) | `a1b2c3` |
| `created_at` | ISOString | ✅ | เวลาบันทึกลงระบบ | `2026-05-21T15:05:00Z` |

### Table: `accounts` (Sheet Tab: `Accounts`)

| Column | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `id` | String | ✅ | รหัสบัญชี | `acc_kbank` |
| `user_id` | String | ✅ | Firebase Auth UID | `abc123xyz` |
| `name` | String | ✅ | ชื่อบัญชีที่แสดง | `กสิกรไทย` |
| `type` | String | ✅ | `cash` / `bank` / `wallet` | `bank` |
| `balance` | Number | ✅ | ยอดคงเหลือปัจจุบัน | `12500` |
| `updated_at` | ISOString | ✅ | อัปเดตล่าสุด | `2026-05-21T15:05:00Z` |

### Table: `categories` (Sheet Tab: `Categories`)

| Column | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `id` | String | ✅ | รหัสหมวดหมู่ | `cat_food` |
| `user_id` | String | ✅ | Firebase Auth UID | `abc123xyz` |
| `name` | String | ✅ | ชื่อหมวดหมู่ | `อาหาร` |
| `budget_limit` | Number | | งบประมาณต่อเดือน (0 = ไม่จำกัด) | `3000` |
| `icon` | String | | Emoji ไอคอน | `🍔` |

### Table: `reimburse_batches` (Sheet Tab: `Batches`)

| Column | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `id` | String | ✅ | รหัสรอบ | `batch_20260612_x1` |
| `user_id` | String | ✅ | Firebase UID | `abc123xyz` |
| `title` | String | | ชื่อรอบ | `เบิก มิ.ย. 69` |
| `status` | String | ✅ | `open` / `sent` / `paid` | `open` |
| `total` | Number | ✅ | ยอดรวม (คำนวณตอนปิดรอบ) | `2098` |
| `created_at` | ISOString | ✅ | เปิดรอบ | `2026-06-12T...` |
| `paid_at` | ISOString | | เมื่อ mark "ได้แล้ว" | `2026-06-20T...` |

> `status`: `open` = กำลังสะสม, `sent` = ส่งข้อความเบิกแล้ว, `paid` = ได้รับเงินคืนแล้ว

---

## 🔗 GAS API Payload Spec

### `POST /exec` — สแกนสลิปด้วย OCR

```json
{
  "action": "scanSlip",
  "userId": "abc123xyz",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

Response:
```json
{
  "status": "success",
  "data": { "amount": 350, "date": "2026-05-21", "recipient": "7-ELEVEN", "bank": "กสิกรไทย", "category": "อาหาร" }
}
```

### `POST /exec` — บันทึก Notification (จาก iOS Shortcut)

```json
{
  "action": "ingestNotification",
  "userId": "abc123xyz",
  "rawText": "K PLUS: รายการโอนเงิน 350.00 บาท ...",
  "capturedAt": "2026-06-12T19:20:00Z"
}
```

Response (PWA เอาไป pre-fill หน้า quick-confirm):
```json
{
  "status": "success",
  "parsed": { "amount": 350, "account_id": "acc_kbank", "date": "2026-06-12T19:20:00Z", "recipient": "ร้านกาแฟ", "dedup_hash": "a1b2c3", "duplicate": false }
}
```

### `POST /exec` — บันทึกธุรกรรม

```json
{
  "action": "createTransaction",
  "userId": "abc123xyz",
  "data": {
    "type": "expense", "amount": 350, "category": "อาหาร",
    "account_id": "acc_kbank", "recipient": "7-ELEVEN", "bank": "กสิกรไทย",
    "note": "", "source": "notification", "reimbursable": true,
    "batch_id": null, "dedup_hash": "a1b2c3", "date": "2026-06-12T19:20:00Z"
  }
}
```

### `POST /exec` — ปิดรอบเบิก / mark ได้แล้ว

```json
{ "action": "createBatch", "userId": "abc123xyz", "transactionIds": ["txn_1", "txn_2"], "title": "เบิก มิ.ย. 69" }
{ "action": "markBatchPaid", "userId": "abc123xyz", "batchId": "batch_20260612_x1" }
```

### `GET /exec` — ดึงรายการ

```
GET /exec?action=getTransactions&userId=xxx&month=2026-05
```

---

## 🔄 System Flows

### Flow 1: OCR (สแกนสลิป)

```
iPhone → เลือกรูปสลิปจาก Photo Library / ถ่ายภาพ
       → Next.js PWA แปลงรูปเป็น Base64
       → GAS → Gemini วิเคราะห์รูป → JSON
       → GAS บันทึกลง Sheets
       → Dashboard แสดงผล
```

### Flow 2: Notification Capture (กึ่งอัตโนมัติ)

```
Kbank/Truemoney/เป๋าตัง noti เด้ง
       → iOS Shortcut Automation จับ noti text → POST ไป GAS
       → GAS → Gemini parse ยอด/เวลา/บัญชี → เช็ค dedup_hash
       → PWA เปิดหน้า quick-confirm (pre-fill ยอด+บัญชีแล้ว)
       → เลือกหมวด + toggle เบิก/ไม่เบิก → กดบันทึก (2 แตะ)
```

### Flow 3: Reimbursement Batch (ส่งเบิก)

```
หน้า "reimburse" → list รายการ reimbursable=true & batch_id=null
       → เลือกรายการ → "ปิดรอบ" → สร้าง batch, ผูก batch_id, รวม total
       → Generate ข้อความสรุป → ปุ่ม Copy → ส่ง LINE
       → พ่อแม่โอนคืน → กด "ได้แล้ว" → batch.status=paid
         + (option) สร้าง income "เงินเบิกคืน"
```

**รูปแบบข้อความสรุป** (ใน `reimburseText.js`):
```
กาแฟหมูแหนม 2/6/69 90
เปลี่ยนเลนส์แว่น 5/6/69 2500
ตัดผม 6/6/69 50

รวม 2640
```
> format: `[ชื่อ] [d/m/yy พ.ศ.ย่อ] [ยอด]` — วันที่ใช้ พ.ศ.ย่อ ในข้อความสรุป แต่ DB เก็บ ISO ค.ศ. เสมอ

---

## 🗂️ หมวดหมู่เริ่มต้น

| หมวด | icon | ตัวอย่าง |
| --- | --- | --- |
| อาหาร/คาเฟ่ | 🍔 | Yamazaki, กาแฟ, สุกี้โรล |
| ของใช้/Makro | 🛒 | Makro |
| ตัดผม/ดูแลตัว | ✂️ | ตัดผม, ขูดหินปูน |
| เดินทาง/รถ | 🚗 | น้ำมันเครื่อง, พรบ. |
| การศึกษา | 🎓 | ค่าเทอม |
| Subscription | 📺 | Netflix, Disney+ |
| รายเดือนประจำ | 📅 | รายเดือน, ส่งผ้า |
| อื่นๆ | 📦 | — |

> ⚠️ ค่าเทอม/ค่าธรรมเนียมก้อนใหญ่ (3–8 หมื่น) ควร flag แยก เพื่อไม่ให้กราฟรายเดือนเพี้ยน

---

## ⚡ Getting Started

**Prerequisites:** Node.js v18+, Firebase Project, Google Sheet + GAS deployment URL, Google Cloud Project (Gemini API enabled)

```bash
git clone <REPOSITORY_URL>
cd expense-tracker
npm install
cp .env.example .env   # กรอกค่าทั้งหมด
npm run dev            # http://localhost:3000
```

---

## 📦 Build & Deployment

```bash
npm run build
```

**Vercel:**
1. เชื่อม GitHub Repo กับ Vercel Dashboard
2. Framework Preset = `Next.js` (auto-detected)
3. เพิ่ม Environment Variables ใน Vercel Settings
4. Deploy อัตโนมัติ

---

## 🔧 Google Apps Script Setup

1. เปิด Google Sheet → **Extensions → Apps Script**
2. วางโค้ดจาก `google-apps-script/Code.js`
3. **Deploy → New Deployment → Web App** (Execute as: Me, Who has access: Anyone)
4. คัดลอก Web App URL → ใส่ใน `.env` ที่ `NEXT_PUBLIC_GAS_WEBAPP_URL`
5. เพิ่ม Gemini API Key ใน **Script Properties** (ไม่ใช่ใน Code)

---

## 📱 PWA / iOS Setup

1. `public/manifest.json` ต้องมี `display: "standalone"` และ icons ขนาด 192×192 และ 512×512
2. Safari บน iPhone → Share → **Add to Home Screen**
3. Receipt capture: `<input type="file" accept="image/*">` — iOS Safari แสดง picker กล้อง/Photo Library อัตโนมัติ

---

## 🗓️ ลำดับการ Build

| Phase | งาน |
| --- | --- |
| **1 — Core Capture** | เพิ่ม schema columns (`reimbursable`, `batch_id`, `dedup_hash`) + `quick-confirm.js` + `ingestNotification` ใน GAS |
| **2 — iOS Shortcut** | สร้าง Shortcut จับ noti → POST (spec แยก) |
| **3 — Reimburse** | `Batches` table + `reimburse.js` + `reimburseText.js` |
| **4 — Dashboard** | การ์ด "รอเบิก" + แยก flag ก้อนใหญ่ออกจากกราฟ |

> Phase 1 + 3 สามารถ build ก่อนได้เลยโดยไม่ต้องรอ Shortcut (กรอกมือผ่าน quick-confirm ก็เร็วอยู่แล้ว)

---

## 🛡️ Contributing Guidelines

### Separation of Concerns (กฎเหล็ก)

| Layer | อนุญาต | ห้ามเด็ดขาด |
| --- | --- | --- |
| `src/pages/` | import service → render UI | เขียน `fetch()` หรือ Firebase logic ตรงๆ |
| `src/services/` | เชื่อม API, return data | `document.getElementById()`, จัดการ DOM |
| `src/components/` | สร้าง/อัปเดต DOM ภายในตัวเอง | เรียก API ตรงๆ |

### Code Style

- ✅ ES Modules (`import`/`export`) เสมอ
- ✅ Tailwind utility classes ใน JSX
- ❌ ห้ามใช้ inline style `style={{...}}` (ยกเว้นจำเป็นจริงๆ)
- ❌ ห้ามเขียน Firebase/GAS query ตรงใน component

### Git Workflow

- ❌ ห้าม push ตรงเข้า `main`
- ✅ แตก branch ทุกครั้ง: `feature/[name]`, `fix/[name]`, `chore/[name]`
- ✅ commit message: `feat: add slip scanner`, `fix: gemini timeout`

### AI / Vibe Coding Rules

- ✅ ยึดโครงสร้าง `services/` ↔ `pages/` เสมอ
- ✅ ชื่อ column ทุกตัวต้องตรงกับ DATABASE SCHEMA ด้านบน
- ✅ GAS fetch ต้องอยู่ใน `gas.service.js` เท่านั้น
- ❌ ห้ามสร้างไฟล์นอกโครงสร้างที่กำหนดโดยไม่ได้รับอนุมัติ
- ❌ ห้ามเพิ่ม column ใน Sheets โดยไม่อัปเดต schema ใน README นี้

---

## 🗂️ .gitignore Checklist

```
node_modules/
.next/
out/
.env
.env.local
.env.*.local
.DS_Store
Thumbs.db
*.log
.vscode/
.idea/
```

---

## 📝 License & Credits

[MIT / Private] — © 2026 [ชื่อทีม/ผู้พัฒนา]
