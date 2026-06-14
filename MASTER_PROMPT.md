# 🏦 PAISA RAKHNA — COMPLETE MASTER PROMPT
### (Paste this at the start of any new AI session for full context)
**Last Updated:** April 12, 2026 | **Version:** 4.0

---

```
=======================================================================
           PAISA RAKHNA — PAKISTANI FINTECH / DIGITAL WALLET APP
                     COMPLETE PROJECT CONTEXT & FLOW
=======================================================================
```

---

## ═══ SECTION 1: PROJECT IDENTITY ═══

| Field | Value |
|---|---|
| **App Name** | Paisa Rakhna (پیسہ رکھنا) |
| **App Type** | Pakistani Digital Wallet / Fintech App |
| **Inspiration** | Like EasyPaisa, JazzCash, Meezan Bank |
| **Bundle ID** | `pk.paisarakhna.app` |
| **Primary Color** | Green `#16a265` (Islamic green) |
| **Currency** | PKR (Pakistani Rupee) |
| **Language** | English UI + Urdu support |
| **Platform** | Android + iOS (React Native / Expo) |
| **Deployment** | LOCAL NETWORK ONLY (same WiFi) |
| **Status** | Frontend ✅ Done | Backend ✅ Done | Admin ✅ Done |

---

## ═══ SECTION 2: WHAT HAS ALREADY BEEN BUILT ═══

### 2.1 — Frontend (React Native + Expo + TypeScript)
**Location:** `c:\Users\muham\Downloads\Paisa_Rakhna`

```
📁 PROJECT STRUCTURE (COMPLETE)
│
├── App.tsx                    ← Root navigator + session control
├── index.ts                   ← Entry point
├── app.json                   ← Expo config (bundle ID, splash, orientation)
├── eas.json                   ← EAS Build config (APK generation ready)
├── package.json               ← All dependencies installed
│
├── screens/ (9 screens)
│   ├── LoginScreen.tsx        ← Phone + PIN login (2 steps)
│   ├── RegisterScreen.tsx     ← FULL 6-step signup (largest file: 43KB)
│   ├── ForgotPinScreen.tsx    ← OTP-based PIN reset
│   ├── PendingApprovalScreen.tsx ← KYC review waiting screen
│   ├── HomeScreen.tsx         ← Dashboard (balance, transactions, services)
│   ├── CardsScreen.tsx        ← Virtual card management
│   ├── StoreScreen.tsx        ← Offers + transaction history
│   ├── MoreScreen.tsx         ← Profile + settings + security
│   └── ZakatScreen.tsx        ← Islamic Zakat calculator
│
├── components/ (6 components)
│   ├── ChatBot.tsx            ← AI chatbot (floating)
│   ├── BottomModal.tsx        ← Reusable animated bottom sheet
│   ├── UIKit.tsx              ← Design system (Field, BtnPrimary, etc.)
│   ├── MPinModal.tsx          ← 6-dot M-PIN entry modal
│   ├── QrScannerModal.tsx     ← Camera QR scanner
│   └── TransactionSlipModal.tsx ← Transaction receipt
│
├── context/ (3 contexts)
│   ├── AuthContext.tsx        ← Login state + session persistence (AsyncStorage)
│   ├── ThemeContext.tsx       ← Dark/Light mode + color system
│   └── LangContext.tsx        ← Language (English/Urdu) toggle
│
├── services/ (2 services)
│   ├── api.ts                 ← ALL API calls (AuthAPI, WalletAPI, MPinAPI, etc.)
│   └── auth.ts                ← Token save/load from AsyncStorage
│
└── constants/
    ├── Colors.ts              ← Full color palette
    ├── Config.ts              ← API_BASE_URL (change this for backend)
    └── DummyData.ts           ← Chatbot responses only (legacy)
```

---

### 2.2 — Backend (Laravel)
**Location:** `c:\Users\muham\Downloads\Paisa_Rakhna\paisa-rakhna-api`
**Status:** Laravel 12 installed — database migrations and API routes need to be completed

---

## ═══ SECTION 3: FULL NAVIGATION & SESSION FLOW ═══

### How App.tsx Works (The Brain of Navigation):

```
APP OPENS
    ↓
AuthContext reads AsyncStorage
    ├── Loading? → Show Green Splash Screen (Paisa Rakhna + spinner)
    ↓
Session check complete
    ├── No token saved → Show LOGIN screen (not registered or logged out)
    ├── Token found + KYC = 'verified' → Show DASHBOARD (Home tabs)
    └── Token found + KYC = 'pending' → Show PENDING APPROVAL screen
```

**This is already coded in `App.tsx` lines 127–183.** Works exactly like EasyPaisa.

---

## ═══ SECTION 4: COMPLETE SIGNUP / REGISTRATION FLOW ═══
### (Like EasyPaisa — Step by Step)

The `RegisterScreen.tsx` has **6 complete steps**, all built and UI-ready:

---

### STEP 1 — Enter Mobile Number + Email

```
┌─────────────────────────────────┐
│    📱 Create Account            │
│                                 │
│  Mobile Number                  │
│  [  03XX-XXXXXXX              ] │
│                                 │
│  Email Address (optional)       │
│  [  user@gmail.com            ] │
│                                 │
│  [    CONTINUE →    ]           │
└─────────────────────────────────┘
```

**What happens:**
- User enters Pakistani number (e.g. `0300-1234567`)
- User enters email (optional — for OTP fallback)
- App calls: `POST /api/auth/otp/send` → backend generates 6-digit OTP
- Backend sends OTP via SMS (if backend has SMS provider) OR email
- Move to Step 2

---

### STEP 2 — Verify OTP

```
┌─────────────────────────────────┐
│    🔐 Enter OTP                 │
│    Sent to 0300-XXXXXXX         │
│                                 │
│    [ _ ] [ _ ] [ _ ] [ _ ]      │
│    [ _ ] [ _ ]                  │
│                                 │
│    ⏱ Expires in 04:59           │
│    Resend OTP                   │
│                                 │
│    [   VERIFY OTP   ]           │
└─────────────────────────────────┘
```

**What happens:**
- App calls: `POST /api/auth/otp/verify`
- Backend checks: correct code? not expired? not used before?
- If ✅ pass → move to Step 3
- If ❌ fail → "Wrong OTP" error, shake animation
- OTP expires in 5 minutes (set on backend)

---

### STEP 3 — Enter Full Name

```
┌─────────────────────────────────┐
│    👤 Your Name                 │
│                                 │
│  Full Name                      │
│  [  Muhammad Ali              ] │
│                                 │
│    [    CONTINUE →    ]         │
└─────────────────────────────────┘
```

---

### STEP 4 — CNIC / ID Card Verification

```
┌─────────────────────────────────┐
│    🪪 Identity Verification     │
│                                 │
│  OPTION A: Manual Entry         │
│  CNIC Number                    │
│  [ XXXXX-XXXXXXX-X           ]  │
│  Date of Birth                  │
│  [ DD/MM/YYYY                ]  │
│  Issue Date                     │
│  [ DD/MM/YYYY                ]  │
│                                 │
│  - OR -                         │
│                                 │
│  [📷 Scan CNIC Card]            │
│  (Camera reads CNIC info        │
│   automatically — OCR)          │
│                                 │
│    [    CONTINUE →    ]         │
└─────────────────────────────────┘
```

**Two options — MANUAL or SCAN:**

| Method | How it works |
|---|---|
| **Manual** | User types CNIC number, DOB, issue date manually |
| **Scan** | Camera points at CNIC card → OCR (Google Vision API) reads text → auto-fills fields |

> ⚠️ **Note:** Scan (OCR) feature needs Google Vision API key. For now, manual method is enough. Scan can be added later.

---

### STEP 5 — Set 6-Digit PIN

```
┌─────────────────────────────────┐
│    🔑 Set Your PIN              │
│    This will be your login PIN  │
│                                 │
│    Create PIN                   │
│    [ • ] [ • ] [ • ]            │
│    [ • ] [ • ] [ • ]            │
│                                 │
│    Confirm PIN                  │
│    [ • ] [ • ] [ • ]            │
│    [ • ] [ • ] [ • ]            │
│                                 │
│    [  CREATE MY ACCOUNT  ]      │
└─────────────────────────────────┘
```

**What happens:**
- App calls: `POST /api/auth/register` with `{ name, phone, pin }`
- Backend saves user, hashes PIN with bcrypt (NEVER plain text)
- Backend creates wallet (PKR, balance = 0)
- Backend returns: `{ token, user }` (Sanctum token)
- App saves token to AsyncStorage
- Show success → move to Step 6

---

### STEP 6 — Account Created! Awaiting Verification

```
┌─────────────────────────────────┐
│         🎉                      │
│    Account Created!             │
│                                 │
│    Your KYC (CNIC photos) are   │
│    under review by our team.    │
│                                 │
│    You'll receive a             │
│    notification when verified.  │
│                                 │
│    ⏳ Usually takes 24-48 hours │
│                                 │
│    [  OK  ]                     │
└─────────────────────────────────┘
```

**What happens:**
- App automatically navigates to `PendingApprovalScreen`
- User waits for admin to approve their CNIC
- When admin approves → push notification sent → `kyc_status = 'verified'`
- Next time user opens app → goes straight to Dashboard

---

## ═══ SECTION 5: COMPLETE LOGIN FLOW ═══

### Already built in `LoginScreen.tsx` — 2 Steps:

---

### LOGIN STEP 1 — Enter Phone Number + OTP

```
┌─────────────────────────────────┐
│    Welcome Back! 👋             │
│                                 │
│    Mobile Number                │
│    [  03XX-XXXXXXX           ]  │
│                                 │
│    [   SEND OTP   ]             │
│                                 │
│    ─────────── OR ───────────   │
│    Don't have account?          │
│    [  SIGN UP  ]                │
└─────────────────────────────────┘
```

**What happens:**
- App calls: `POST /api/auth/otp/send`
- Backend generates OTP, sends via SMS/email
- Move to Step 2

---

### LOGIN STEP 2 — Enter PIN

```
┌─────────────────────────────────┐
│    Enter Your PIN               │
│                                 │
│    [ • ] [ • ] [ • ]            │
│    [ • ] [ • ] [ • ]            │
│                                 │
│    ❌ Wrong PIN (shake effect)   │
│    3 attempts remaining          │
│                                 │
│    Forgot PIN?                  │
└─────────────────────────────────┘
```

**What happens:**
- App calls: `POST /api/auth/login` with `{ phone, pin }`
- Backend checks PIN (bcrypt verify)
- ✅ Correct → returns `{ token, user }` → save to AsyncStorage → Dashboard
- ❌ Wrong → shake animation + error message
- After 3 fails → short lockout

---

### FORGOT PIN FLOW (ForgotPinScreen.tsx — fully built)

```
Enter Phone → OTP sent → Verify OTP → Enter New PIN → Done
```

API call: `POST /api/auth/reset-pin`

---

## ═══ SECTION 6: SESSION MANAGEMENT — "STAY LOGGED IN" ═══

### The Problem You Described:
> "Jab main app band karta hoon aur dobara kholta hoon, login page nahi dikhna chahiye. Dashboard dikhe."

### How It's Solved (Already Coded):

```
FIRST LOGIN:
Backend returns → token: "eyJhbGc..."
                          ↓
React Native saves to AsyncStorage (phone's permanent storage)
phone storage: { token: "eyJhbGc...", user: { name, phone, kyc_status... } }

APP CLOSES (even force-close)

APP OPENS AGAIN:
AuthContext.tsx runs:
  hydrateSession() → reads AsyncStorage
    ├── Token found → setUser(data) → isAuthenticated = true → DASHBOARD ✅
    └── No token → isAuthenticated = false → LOGIN PAGE ✅
```

**AuthContext.tsx already has this logic at line 42–49.** ✅

### Token Lifetime:
- **30 days** — user stays logged in for 30 days automatically
- After 30 days → token expires → next time they open app, they see login
- If user clicks "Logout" → `clearSession()` → AsyncStorage cleared → login page

---

## ═══ SECTION 7: TRANSACTION SECURITY — M-PIN ═══

### Rule:
> Every financial transaction requires an M-PIN (6-digit transaction PIN).

### What Requires M-PIN:
- Send Money ✅
- Add Money ✅  
- Easy Load ✅
- Easy Loan ✅
- Bill Payment ✅
- Currency Exchange ✅

### What Does NOT Require M-PIN:
- View balance ✅ (no PIN needed)
- View transactions ✅ (no PIN needed)
- View profile ✅ (no PIN needed)
- Zakat calculator ✅ (no PIN needed)

### M-PIN Flow (Already in HomeScreen.tsx):

```
User taps "Send Money"
    ↓
MPinModal appears (6 black dots + custom numpad)
    ↓
User enters 6-digit M-PIN
    ↓
App calls: POST /api/mpin/verify
    ├── ✅ Correct → M-PIN modal closes → Send Money modal opens
    └── ❌ Wrong → Shake animation + "Incorrect M-PIN" error
        → 3 wrong = 30 min lock
```

### M-PIN vs Login PIN — They Are Different:
| | Login PIN | M-PIN |
|---|---|---|
| Purpose | Log into app | Authorize transactions |
| When set | During registration (Step 5) | First time a transaction is attempted |
| What it does | Opens the app | Confirms each transaction |

---

## ═══ SECTION 8: HOW OTP IS SENT — FULL EXPLANATION ═══

### Q: "OTP phone pe ya email pe kaise jaata hai?"

**Answer: You use a third-party API service. You never connect directly to Jazz/Zong/Telenor yourself.**

---

### 8.1 — SMS OTP (Phone Number):

```
Your Laravel Backend
    ↓ (calls API)
[Twilio / Firebase / Africa's Talking]
    ↓ (these companies are already connected to all telecoms)
Jazz Network / Zong Network / Telenor / Ufone
    ↓
📱 User receives SMS: "Your Paisa Rakhna OTP is 847291. Valid for 5 minutes."
```

**You write this in Laravel backend:**
```php
// Using Twilio:
$twilio->messages->create('+923001234567', [
    'from' => '+1234567890',
    'body' => 'Your OTP is ' . $otp,
]);
```
**That's it.** Twilio handles routing to Pakistani networks.

---

### 8.2 — Email OTP:

```
Your Laravel Backend
    ↓ (calls Gmail SMTP or Mailgun SMTP)
Gmail servers / Mailgun servers
    ↓
📧 User's inbox: "Your Paisa Rakhna OTP is 847291"
```

**Laravel already has email built in.** Just configure `.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
```

---

### 8.3 — Free OTP Options for Development:

| Service | Type | Free Limit | Pakistani Numbers | Recommendation |
|---|---|---|---|---|
| **Firebase Phone Auth** | SMS | 10,000/month | ✅ Yes | ✅ **Best for dev** |
| **Gmail SMTP** | Email | Unlimited | N/A | ✅ **Free forever** |
| **Mailgun** | Email | 1,000/month | N/A | ✅ Good option |
| **Twilio** | SMS | Pay-as-you-go (~PKR 2/SMS) | ✅ Yes | ✅ **Best for production** |
| **Africa's Talking** | SMS | Test credits free | ✅ Yes | Good alternative |

> 🟢 **For now:** Use Firebase Phone Auth (SMS) + Gmail SMTP (Email)  
> 🔵 **For production:** Switch to Twilio

---

### 8.4 — OTP Security Rules (Backend Must Enforce):

```
OTP is generated:
  - 6 random digits (e.g. 847291)
  - Saved to database: otps table
  - expires_at = NOW + 5 minutes
  - used = false

When user submits OTP:
  1. Does code match? ✅
  2. Is it not expired? ✅ (expires_at > NOW)
  3. Is used = false? ✅
  → All pass: mark used = true → proceed
  → Any fail: "Invalid or expired OTP" error

Rate limiting (protect from abuse):
  - Max 3 OTP requests per phone per 10 minutes
  - Max 5 OTP verify attempts per OTP
```

---

## ═══ SECTION 9: ALL API ENDPOINTS (Already Coded in app) ═══

**File: `services/api.ts` — All API calls ready, waiting for backend**

### Auth APIs:
```
POST /api/auth/otp/send      ← Send OTP (phone + purpose + channel)
POST /api/auth/otp/verify    ← Verify OTP code
POST /api/auth/register      ← Create account (name, phone, pin)
POST /api/auth/login         ← Login (phone, pin) → returns token
POST /api/auth/reset-pin     ← Reset PIN via OTP
POST /api/auth/logout        ← Revoke token
GET  /api/auth/me            ← Get current user info
```

### Wallet APIs:
```
GET  /api/wallet             ← Balance + account number
POST /api/wallet/topup       ← Add money
GET  /api/transactions       ← Transaction history (paginated)
POST /api/transactions/send  ← Send money to another user
```

### M-PIN APIs:
```
GET  /api/mpin/status        ← Is M-PIN set? Is locked?
POST /api/mpin/set           ← Set M-PIN (first time)
POST /api/mpin/verify        ← Verify M-PIN (before transaction)
POST /api/mpin/otp           ← Send OTP to reset M-PIN
POST /api/mpin/reset         ← Reset M-PIN with OTP
```

### Other APIs:
```
GET  /api/cards              ← List virtual cards
POST /api/cards/{id}/toggle  ← Freeze/unfreeze, toggle NFC, ATM, etc.
POST /api/kyc/submit         ← Upload CNIC front + back + selfie
GET  /api/kyc                ← KYC status check
GET  /api/rates/zakat        ← Gold/silver rates for Zakat calculator
POST /api/chatbot            ← AI chatbot message
POST /api/device/register    ← Register FCM token (push notifications)
GET  /api/statement          ← Monthly bank statement
```

---

## ═══ SECTION 10: LOCAL NETWORK SETUP (NO EXPO GO) ═══

### Architecture:
> App runs on LOCAL WiFi network only. No Railway, no public server, no Expo Go.

```
YOUR LAPTOP (Windows)
    ├── Laravel API Server (php artisan serve --host=0.0.0.0 --port=8000)
    ├── SQLite Database (local file)
    ├── Admin Panel (http://localhost:8000/admin — browser)
    ↓
Same WiFi Network
    ↓
📱 PHONE (Android — native APK installed)
    └── Connects to http://LAPTOP_IP:8000/api
```

### How It Works:
1. **start.ps1** auto-detects your laptop's WiFi IP address
2. Updates `constants/Config.ts` with the correct IP
3. Starts Laravel server accessible on the network
4. Opens Admin Panel in the browser

### How to Build APK (ONE TIME — then never need USB again):

**Option A — Android Studio (Recommended):**
```
1. Open the android/ folder in Android Studio
2. USB connect your phone
3. Enable USB Debugging on phone (Settings → Developer Options)
4. Click green "Run" button in Android Studio
5. Wait for build + install on phone
6. DISCONNECT USB — app works on WiFi from now on
```

**Option B — Terminal Command:**
```
npx expo run:android --variant release
```
This builds a RELEASE APK (JavaScript embedded, no Metro needed).
After install, phone works completely over WiFi — no USB, no Expo Go.

### When WiFi IP Changes:
If your laptop's IP changes (new WiFi network etc.):
1. Run `start.ps1` again (auto-updates Config.ts with new IP)
2. Rebuild APK: either Android Studio Run or `npm run android:release`
3. App connects to the new IP automatically

### Config.ts modes:
```
'local-ip'  → Same WiFi: http://LAPTOP_IP:8000/api  ← DEFAULT (recommended)
'usb'       → USB cable: http://localhost:8000/api    (adb reverse required)
'emulator'  → Android Studio emulator: http://10.0.2.2:8000/api
```

---

## ═══ SECTION 11: TECH STACK FINAL DECISIONS ═══

| Layer | Technology | Status |
|---|---|---|
| **Mobile Frontend** | React Native + Expo + TypeScript | ✅ Built |
| **Backend** | Laravel 12 (PHP 8.3) | ✅ Built |
| **Database** | PostgreSQL (local) | ✅ Working |
| **API Auth** | Laravel Sanctum (token-based) | ✅ Built |
| **Email OTP** | Gmail SMTP | ⚠️ Need Gmail app password |
| **Push Notifications** | Firebase FCM | ⚠️ Need Firebase project |
| **AI Chatbot** | OpenAI GPT-4o mini (via Laravel) | ⚠️ Need API key |
| **Admin Panel** | Laravel Blade + Bootstrap 5 | ✅ Built |
| **Hosting** | LOCAL NETWORK (same WiFi) | ✅ Working |
| **APK Build** | Android Studio / expo run:android --variant release | ✅ Ready |

---

## ═══ SECTION 12: WHAT IS STILL MISSING ═══

### Backend (Laravel) — DONE ✅:
- [x] Database migrations (users, wallets, transactions, otps, kyc_documents, cards, mpins)
- [x] Auth controller (send OTP, verify OTP, register, login)
- [x] Wallet controller (balance, topup, send, transactions)
- [x] M-PIN controller (set, verify, reset)
- [x] KYC controller (upload CNIC photos, admin approve)
- [x] Chatbot controller (receive message → call AI → return reply)
- [x] Laravel Sanctum token auth
- [x] Admin panel with full dashboard, users, transactions, KYC, audit logs, security logs, settings, notifications, reports

### Backend — STILL NEEDED:
- [ ] Gmail SMTP config (for email OTPs) — just set `.env` values
- [ ] OpenAI API key (for real chatbot) — just set `.env` value
- [ ] Firebase setup (for push notifications) — optional

### Frontend — DONE ✅:
- [x] All 9 screens built and navigating correctly
- [x] All API calls written in `services/api.ts`
- [x] Session persistence (AsyncStorage) — login stays after app close
- [x] M-PIN modal before transactions
- [x] QR scanner (Scan & Pay)
- [x] Transaction slip / receipt
- [x] Zakat calculator
- [x] ChatBot (keyword matching — waiting for real AI backend)
- [x] Dark mode toggle UI
- [x] Config.ts set up for local network
- [x] Android native build ready (android/ folder)

### Frontend — STILL NEEDED:
- [ ] Dark mode full implementation (toggle UI exists, logic pending)
- [ ] Real push notification receiver (FCM token registration)

---

## ═══ SECTION 13: HOW TO RUN THE APP ═══

### Step 1: Start Backend + Admin Panel
```powershell
# Double-click start.ps1 OR run from terminal:
.\start.ps1
```
This auto-detects WiFi IP, updates Config.ts, starts Laravel, opens Admin Panel.

### Step 2: Run Database Migrations (first time only)
```bash
cd paisa-rakhna-api
php artisan migrate --seed
```

### Step 3: Build & Install APK on Phone (first time only)
```bash
# Option A — Android Studio:
# Open android/ folder → USB connect → Run 'app'

# Option B — Terminal (release build, no Metro needed):
npm run android:release
```

### Step 4: Use the App
- Disconnect USB cable
- App runs on same WiFi network
- Admin panel: http://localhost:8000/admin
- API: http://LAPTOP_IP:8000/api

### Admin Login:
```
Email:    admin@paisa.pk
Password: Admin@1234
```

---

```
=======================================================================
END OF MASTER PROMPT
Project: Paisa Rakhna | Updated: April 12, 2026
LOCAL NETWORK ONLY — No Railway, No Expo Go, No Public Server
Paste this at the start of any new AI session for full project context
=======================================================================
```
