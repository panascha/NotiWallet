# iOS Shortcut Automation — NotiWallet

Automates "bank notification received → 2-tap expense confirm" by bridging iOS Shortcuts with the GAS `ingestNotification` endpoint.

---

## Prerequisites

| Item | Where to get it |
|---|---|
| GAS Web App URL | `NEXT_PUBLIC_GAS_WEBAPP_URL` in `.env.local` / Vercel env |
| User ID (Firebase UID) | Settings → tap the iOS Shortcut card → shown on setup page |
| PWA installed | Safari → Share → Add to Home Screen |

---

## Flow

```
Bank notification (Kbank / Truemoney / เป๋าตัง)
        │  iOS Shortcut Automation fires
        ▼
GET Notification Content text
        │
        ▼
POST /gas/exec  { action: "ingestNotification", userId, rawText, capturedAt }
        │
        ▼
GAS → Gemini parses amount / account_id / date / recipient
GAS → checks dedup_hash (returns duplicate:true if already saved)
        │
        ▼
Open /quick-confirm?amount=…&account_id=…&date=…&recipient=…&dedup_hash=…&duplicate=…
        │
        ▼
User picks category + reimbursable toggle → taps Save  (2 taps total)
```

---

## Shortcut Action Sequence

Use stable iOS action names; exact menu labels shift across iOS versions.

### Trigger
- Type: **App**
- App: your bank app (set one Automation per bank app you use)
- Event: **Notification Received**
- iOS 17+: Enable **Run Immediately** (disables the confirmation banner)

### Action 1 — Capture notification text
| Field | Value |
|---|---|
| Action | **Text** |
| Content | Magic variable: `Notification Content` (from the trigger) |

Store this as a named variable `rawText`.

### Action 2 — POST to GAS
| Field | Value |
|---|---|
| Action | **Get Contents of URL** |
| URL | `[GAS_WEBAPP_URL]` |
| Method | `POST` |
| Request Body | `JSON` |

JSON body (replace bracketed values with literals or magic variables):

```json
{
  "action": "ingestNotification",
  "userId": "[YOUR_FIREBASE_UID]",
  "rawText": "[rawText variable from Action 1]",
  "capturedAt": "[Current Date → ISO 8601 format]"
}
```

> `capturedAt`: use the **Current Date** magic variable. Set its format to **ISO 8601** in the date format picker.

Store the result as a named variable `gasResponse`.

### Action 3 — Extract `parsed` dictionary
| Field | Value |
|---|---|
| Action | **Get Dictionary Value** |
| Key | `parsed` |
| Dictionary | `gasResponse` variable |

Store as `parsed`.

### Action 4 — Extract each field
For each of the 6 fields, add a **Get Dictionary Value** action:

| Key | Variable name |
|---|---|
| `amount` | `amount` |
| `account_id` | `accountId` |
| `date` | `txDate` |
| `recipient` | `recipient` |
| `dedup_hash` | `dedupHash` |
| `duplicate` | `isDuplicate` |

### Action 5 — Build redirect URL
Use **Text** to build the URL string, inserting the variables above:

```
https://[YOUR_APP_DOMAIN]/quick-confirm?amount=[amount]&account_id=[accountId]&date=[txDate]&recipient=[recipient]&dedup_hash=[dedupHash]&duplicate=[isDuplicate]
```

> **Critical**: query param names must match exactly. `quick-confirm.js` reads:
> `amount`, `account_id`, `date`, `recipient`, `dedup_hash`, `duplicate`

### Action 6 — Open PWA
| Field | Value |
|---|---|
| Action | **Open URLs** |
| URL | Text variable from Action 5 |

---

## Query Param → `quick-confirm.js` Mapping

```
GAS parsed.amount      →  ?amount=
GAS parsed.account_id  →  ?account_id=      (e.g. acc_kbank)
GAS parsed.date        →  ?date=            (ISO 8601 UTC)
GAS parsed.recipient   →  ?recipient=
GAS parsed.dedup_hash  →  ?dedup_hash=
GAS parsed.duplicate   →  ?duplicate=       (true | false)
```

If `duplicate=true`, `quick-confirm.js` shows "รายการนี้บันทึกแล้ว" and blocks re-entry.

---

## GAS Account Mapping (current)

`ingestNotification` uses Gemini to detect the bank from `rawText`:

| Notification keyword | `account_id` returned |
|---|---|
| `K PLUS`, `KBANK`, `กสิกร` | `acc_kbank` |
| `TrueMoney`, `ทรูมันนี่` | `acc_truemoney` |
| `เป๋าตัง`, `Pao Tang` | `acc_paotang` |

> These mappings are currently hardcoded in the GAS Gemini prompt. See open-source roadmap for making them data-driven.

---

## Testing

1. Run the Automation manually with this sample text:
   ```
   K PLUS: รายการโอนเงิน 350.00 บาท วันที่ 12/06/69 เวลา 19:20 น.
   ```
2. Expected: browser opens `/quick-confirm` with amount 350, account_id `acc_kbank` pre-filled.
3. If `duplicate=true` appears: expected for repeat runs — try a different amount.
4. If nothing opens: check GAS URL is correct, Gemini API key is in Script Properties.

---

## Known Limitations

- iOS Shortcuts notification automation requires a **manual tap** on some iOS versions (especially for bank apps flagged as having sensitive notifications). This cannot be bypassed without Jailbreak — the "2-tap" flow becomes "1-banner-tap + 2 in-app taps."
- Notifications from Kbank that describe **Kbank → เป๋าตัง transfers** should NOT be logged as expenses (internal transfer). GAS `ingestNotification` currently returns the parsed data regardless — the user must choose not to save at the `quick-confirm` screen, or close the page. A future `is_internal_transfer` flag in the GAS response would let `quick-confirm` auto-dismiss these.
- `capturedAt` is the time the Shortcut runs, not the exact notification timestamp. Typically within seconds — no practical impact on dedup.
