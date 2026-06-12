# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NotiWallet is an AI-powered expense tracker PWA for iPhone with a reimbursement batch workflow. It captures transactions three ways: (1) photographing bank transfer slips via Gemini OCR, (2) intercepting bank push notifications via iOS Shortcuts Automation, and (3) manual entry. Grouped "reimbursable" transactions can be closed into a batch and exported as a LINE-ready summary text.

The stack is intentionally serverless: Next.js on Vercel handles the frontend, Google Apps Script (GAS) is the sole backend/API layer, and Google Sheets is the database.

## Commands

```bash
npm install          # Install dependencies (Node.js v18+ required)
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm start            # Serve production build
```

## Architecture

### Data Flow

```
OCR:           iPhone (slip image) → Next.js (Base64) → GAS → Gemini → Sheets
Notification:  iOS Shortcut (noti text) → GAS → Gemini parse → PWA quick-confirm → Sheets
Reimbursement: reimburse.js → createBatch GAS action → copy text → mark paid
```

All backend communication goes through a single GAS Web App URL (`NEXT_PUBLIC_GAS_WEBAPP_URL`). There is no separate server.

### Layer Responsibilities (strict — do not mix)

| Layer | Allowed | Forbidden |
|---|---|---|
| `src/pages/` | Import services, render UI | Direct `fetch()` or Firebase calls |
| `src/services/` | Call APIs, return data | Any DOM access |
| `src/components/` | Render and update own DOM | Direct API calls |

**All GAS `fetch()` calls must live exclusively in `src/services/gas.service.js`.**

### Key Files

- `gas.service.js` — `scanSlip()`, `ingestNotification()`, `createTransaction()`, `getTransactions()`, `createBatch()`, `markBatchPaid()`
- `auth.service.js` — Firebase Auth (Google Sign-In, `onAuthStateChanged`, logout)
- `utils/reimburseText.js` — generates the LINE-ready reimbursement summary from a transaction array
- `pages/quick-confirm.js` — receives pre-filled amount/account from `ingestNotification` response; user picks category + reimbursable toggle, saves in 2 taps
- `pages/reimburse.js` — lists pending reimbursable items, closes batches, copies summary, marks paid

### GAS API Actions

All requests are `POST /exec` with `{ action, userId, ... }`:

| action | Input | Purpose |
|---|---|---|
| `scanSlip` | `imageBase64` | OCR receipt image → `{ amount, date, recipient, bank, category }` |
| `ingestNotification` | `rawText`, `capturedAt` | Parse bank notification text → pre-fill data + `dedup_hash` |
| `createTransaction` | `data` object | Write transaction row to Sheets |
| `createBatch` | `transactionIds[]`, `title` | Close reimbursement batch, link `batch_id` to transactions |
| `markBatchPaid` | `batchId` | Set `batch.status = "paid"` |

`GET /exec?action=getTransactions&userId=xxx&month=YYYY-MM` fetches transactions.

### Google Sheets Schema (locked — never rename columns without updating this file)

**Transactions:** `id`, `user_id`, `date` (ISOString), `type` (`income`/`expense`), `amount`, `category`, `account_id`, `recipient`, `bank`, `note`, `source` (`ocr`/`manual`/`notification`), `reimbursable` (Boolean), `batch_id`, `dedup_hash`, `created_at`

**Accounts:** `id`, `user_id`, `name`, `type` (`cash`/`bank`/`wallet`), `balance`, `updated_at`

**Categories:** `id`, `user_id`, `name`, `budget_limit`, `icon`

**Batches:** `id`, `user_id`, `title`, `status` (`open`/`sent`/`paid`), `total`, `created_at`, `paid_at`

### Key Invariants

- **Double-count guard**: Kbank→เป๋าตัง transfers are internal — record as transfer, not expense. Expense records only when เป๋าตัง pays a merchant.
- **Dedup**: `dedup_hash = hash(amount + minute + account_id)` — GAS checks this before writing; `ingestNotification` returns `duplicate: true` if already recorded.
- **Date format**: DB always stores ISO UTC. The reimbursement summary text renders dates as Thai Buddhist Era short form (`d/m/yy` พ.ศ.) — conversion happens only in `reimburseText.js`.
- **Large expenses** (ค่าเทอม, lump sums): flag separately to avoid skewing the monthly pie chart.

### Reimbursement Text Format

`reimburseText.js` must produce:
```
กาแฟหมูแหนม 2/6/69 90
เปลี่ยนเลนส์แว่น 5/6/69 2500

รวม 2590
```
One line per item: `[note/recipient] [d/m/yy BE] [amount]`, then `รวม [total]`.

### PWA / iOS

- `public/manifest.json` must have `display: "standalone"` and icons at 192×192 and 512×512.
- Receipt capture: `<input type="file" accept="image/*">` — iOS Safari shows camera/photo library picker automatically.
- PWA service worker is disabled in development (`disable: process.env.NODE_ENV === 'development'`).

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_GAS_WEBAPP_URL        # GAS Web App deployment URL
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN  # Optional: restrict sign-in by domain
```

## Google Apps Script Setup

1. Open linked Google Sheet → **Extensions → Apps Script**
2. Paste code from `google-apps-script/Code.js`
3. **Deploy → New Deployment → Web App** (Execute as: Me, Who has access: Anyone)
4. Copy Web App URL into `.env` as `NEXT_PUBLIC_GAS_WEBAPP_URL`
5. Add Gemini API key to GAS **Script Properties** — never hardcode it in `Code.js`

## Build Phases

| Phase | Scope |
|---|---|
| 1 — Core Capture | New schema columns + `quick-confirm.js` + `ingestNotification` GAS action |
| 2 — iOS Shortcut | iOS Shortcuts Automation spec (captures notification text → POST) |
| 3 — Reimburse | `Batches` table + `reimburse.js` + `reimburseText.js` |
| 4 — Dashboard | "รอเบิก" summary card + large-expense flag |

Phase 1 and 3 can be built without Phase 2 (manual quick-confirm entry works standalone).

## Git Workflow

- Never push directly to `main`
- Branch naming: `feature/[name]`, `fix/[name]`, `chore/[name]`
- Commit style: `feat: add quick-confirm page`, `fix: dedup hash collision`

## Code Style

- ES Modules (`import`/`export`) throughout
- Tailwind utility classes in JSX — no `style={{...}}` inline styles
