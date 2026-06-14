# Paisa Rakhna — Project Analysis Report
**Taiyaar kiya gaya:** April 7, 2026  
**Project Path:** `c:\Users\muham\Downloads\Paisa_Rakhna`

---

## 1. Project Overview

**Paisa Rakhna** (پیسہ رکھنا) ek Pakistani digital banking / fintech mobile application hai jo React Native aur Expo framework par bana hua hai. Is app ka maqsad Pakistani users ko ek modern, secure aur user-friendly banking experience dena hai. App ka naam "Paisa Rakhna" yani "paise sambhalna" — financial wellness ko reflect karta hai.

- **Platform:** iOS, Android, Web (cross-platform)
- **Currency:** PKR (Pakistani Rupee)
- **Language Support:** English UI + Urdu text (Chatbot, button labels)
- **Bundle ID:** `pk.paisarakhna.app`
- **Version:** 1.0.0
- **App Theme Color:** Green (`#16a265`) — islamically symbolic

---

## 2. Technology Stack

| Category | Technology | Version |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Build Tool | Expo | ~54.0.33 |
| Language | TypeScript | ~5.9.2 |
| UI Library | React | 19.1.0 |
| Navigation | React Navigation (Bottom Tabs + Native Stack) | ^7.x |
| Animations | React Native Reanimated | ~4.1.1 |
| Gradients | Expo Linear Gradient | ~15.0.8 |
| Auth (Biometric) | Expo Local Authentication | ~17.0.8 |
| Camera | Expo Camera | ~17.0.10 |
| Gestures | React Native Gesture Handler | ~2.28.0 |
| Safe Area | React Native Safe Area Context | ~5.6.0 |
| Web Support | React Native Web | ^0.21.0 |

---

## 3. Project Structure

```
Paisa_Rakhna/
├── App.tsx                  ← Root component, Navigation setup
├── index.ts                 ← Entry point
├── app.json                 ← Expo config (app name, bundle ID, splash)
├── package.json             ← Dependencies
├── tsconfig.json            ← TypeScript config
├── babel.config.js
├── eas.json                 ← EAS Build config
│
├── screens/                 ← 6 Screens
│   ├── LoginScreen.tsx      ← Authentication
│   ├── HomeScreen.tsx       ← Main dashboard
│   ├── CardsScreen.tsx      ← Card management
│   ├── StoreScreen.tsx      ← Offers & transactions
│   ├── MoreScreen.tsx       ← Profile & settings
│   └── ZakatScreen.tsx      ← Islamic Zakat calculator
│
├── components/              ← Reusable components
│   ├── ChatBot.tsx          ← AI chatbot (floating)
│   ├── BottomModal.tsx      ← Swipeable bottom sheet
│   └── UIKit.tsx            ← Design system components
│
├── constants/
│   ├── Colors.ts            ← Color palette
│   └── DummyData.ts         ← Mock data (transactions, cards)
│
├── assets/                  ← Icons, splash screen
└── android/                 ← Native Android project
```

---

## 4. Navigation Architecture

```
App (Stack Navigator)
├── LoginScreen              ← Initial screen
├── Main (Bottom Tabs)
│   ├── HomeScreen  🏠
│   ├── CardsScreen 💳
│   ├── StoreScreen 🛍
│   └── MoreScreen  ☰
└── ZakatScreen              ← Modal-style (navigated from Home & More)

+ ChatBot (Floating overlay, available on all tabs)
```

- Stack navigator authentication flow use karta hai (`isLoggedIn` state)
- Bottom tab bar custom `TabIcon` component use karta hai
- `headerShown: false` sab screens par — fully custom headers

---

## 5. Screens Ka Detailed Analysis

### 5.1 LoginScreen (`screens/LoginScreen.tsx`)
3 sub-screens hain:
- **Welcome Screen:** Biometric login + PIN + Face Scan buttons
- **PIN Screen:** 4-digit numeric keypad, shake animation on wrong PIN
  - Demo PIN: `1234`
- **Face Scan Screen:** Animated progress bar (simulated scan)

**Authentication Features:**
- `expo-local-authentication` se real biometric (fingerprint/Face ID)
- PIN validation with animated error feedback
- Loading indicator during login

### 5.2 HomeScreen (`screens/HomeScreen.tsx`)
App ka main dashboard — sabse feature-rich screen.

**Sections:**
1. **Header** — Avatar, greeting, search & notification buttons
2. **Balance Card** — PKR 4,82,350 balance with show/hide toggle + refresh animation
   - Income: PKR 1,20,000 | Expenses: PKR 84,200
3. **Quick Actions** — Send, Add Money, Receive, Exchange (4 cards)
4. **Transactions** — Latest 3 transactions from dummy data
5. **More with Paisa Rakhna** — 8 service icons:
   - Easy Load, Easy Loan, Saving Account, Scan & Pay
   - Biometric, Utility Bills, Insurance, **Zakat Calc**
6. **My Wallet** — Savings, Fixed Deposit, Investments breakdown

**Modals (15 total):** Send, Add Money, Receive, Exchange, Bill, Easy Load, Easy Loan, Saving, Scanning, Biometric, Insurance, Tx Detail, Search, Notifications, Account

### 5.3 CardsScreen (`screens/CardsScreen.tsx`)
Virtual card management screen.

**Features:**
- Horizontal scrollable card carousel (paginated with `FlatList`)
- Multiple cards with different gradients (Silver, Platinum, etc.)
- Card balance + spending limit with progress bar
- **Card Actions:** Preview, Manage Limit, Freeze/Unfreeze, Change PIN, Physical Card, Custom Design
- **Quick Controls (Toggles):** Online Payments, International, ATM Withdrawals, NFC/Tap Pay

### 5.4 StoreScreen (`screens/StoreScreen.tsx`)
Offers aur transaction history screen.

**Features:**
- Featured cashback banner (10% offer)
- Category filter chips (All, Food, Shopping, Travel, Bills)
- 4 merchant offers: Daraz, Careem, Foodpanda, Jazz/Zong
- Transaction history with month filter

### 5.5 MoreScreen (`screens/MoreScreen.tsx`)
Profile aur settings screen.

**Sections:**
- Profile hero with gradient (Avatar "AK", Premium badge, KYC Verified)
- **Account:** Edit Profile, KYC/Verification, Bank Statement, Zakat Calculator
- **Security:** Password, Biometric Login (toggle), 2FA, OTP Settings, Face Recognition
- **Preferences:** Notifications, Dark Mode, Hide Balance (toggles)
- **Support:** Help Center, About, Logout

### 5.6 ZakatScreen (`screens/ZakatScreen.tsx`)
Islamic Zakat calculator — unique Pakistan-specific feature.

**Calculation Logic:**
- Gold tolas × gold rate per tola
- Silver tolas × silver rate per tola
- Cash + Bank Balance
- Business Goods (market value)
- Receivables / Loans Given
- **Nisab:** Silver-based (lower threshold, safer)
- **Zakat Rate:** 2.5% of total eligible assets

**Result:** Shows total assets, nisab comparison, zakat due, eligibility verdict in Urdu ("Zakat Wajib Hai / Nahi")

---

## 6. Components Ka Analysis

### 6.1 ChatBot (`components/ChatBot.tsx`)
Floating AI assistant — app ke andar hamesha accessible.

- **Trigger:** Bottom-right floating button
- **Keyword Matching:** balance, send, receive, zakat, card, bill, loan, otp, security, help
- **Bilingual:** Urdu + English inputs support karta hai
- **Typing indicator:** Animated dots
- **Response time:** 900–1500ms (realistic feel)
- Initial greeting: Urdu mein "Assalamu Alaikum"

### 6.2 BottomModal (`components/BottomModal.tsx`)
Reusable animated bottom sheet.

- Spring animation (open) + timing animation (close)
- Drag-to-dismiss (PanResponder, dy > 80px)
- Backdrop tap se bhi close
- Max height: 85% of screen

### 6.3 UIKit (`components/UIKit.tsx`)
Design system — reusable components:

| Component | Description |
|---|---|
| `Field` | Labeled text input |
| `BtnPrimary` | Green filled button |
| `BtnOutline` | Bordered button |
| `Pill` | Status badge (colored) |
| `Toggle` | iOS-style switch |
| `SectionLabel` | Section divider text |
| `ListItem` | List row with icon and arrow |

---

## 7. Design System

**Color Palette (`constants/Colors.ts`):**

| Name | Hex | Use |
|---|---|---|
| `g1` (Primary) | `#16a265` | Brand green, buttons, header |
| `gd` (Dark Green) | `#094d30` | Gradient end, dark accents |
| `gl` (Light Green) | `#e6f7f0` | Backgrounds, service icons |
| `bg` | `#f0f5f2` | App background |
| `ink` | `#080f0a` | Primary text |
| `ink3` | `#7a9e8c` | Placeholder, secondary text |
| `red` / `redl` | `#e5373a` / `#fdeaea` | Debit, errors |
| `green` / `greenl` | `#00b87c` / `#dcf7ee` | Credit, success |
| `amber` / `amberl` | `#f5a623` / `#fef3dc` | Bills, warnings |
| `blue` / `bluel` | `#3b82f6` / `#dbeafe` | Info, links |
| `purple` / `purplel` | `#7c3aed` / `#ede9fe` | Special features |

**Border Radius:** `r: 18`, `rs: 12`

---

## 8. Data Layer (Dummy/Mock Data)

`constants/DummyData.ts` mein:

**Transactions (6):**
- Daraz Shopping: -PKR 3,499
- Salary Credit: +PKR 1,20,000
- LESCO Bill: -PKR 8,200
- Foodpanda: -PKR 1,250
- Careem Ride: -PKR 650
- Freelance Payment: +PKR 45,000

**Cards (2):**
- Silver Card — •9027, Balance: PKR 2,15,000
- Platinum Card — •4411

**Chatbot Responses:** balance, send, receive, zakat, card, bill, loan, otp, security, help, hello, default

**NISAB_DATA:** Gold rate, silver rate, nisab tolas (for Zakat calculator)

---

## 9. Security Features

| Feature | Implementation |
|---|---|
| Biometric Auth | `expo-local-authentication` (real fingerprint/Face ID) |
| PIN Login | 4-digit with shake animation + error message |
| Face Scan | Animated progress simulation |
| Balance Hide | Toggle — balance ko dots se replace karta hai |
| Forgot PIN | Alert dialog (demo mode) |
| Card Freeze | Toggle freeze karne se transactions block |
| 2FA | UI present (demo placeholder) |
| OTP Settings | UI present (demo placeholder) |

> **Note:** App abhi demo/prototype mode mein hai — actual backend API calls nahi hain. `DEMO_PIN = '1234'` hardcoded hai.

---

## 10. App Configuration

**`app.json` highlights:**
- Splash background: `#16a265` (green)
- Orientation: Portrait only
- New Architecture: Disabled (`newArchEnabled: false`)
- Bundle ID: `pk.paisarakhna.app` (iOS + Android dono)

**EAS Build:** `eas.json` present — production build ke liye ready

---

## 11. Kya Acha Hai (Strengths)

1. **Professional UI Design** — LinearGradient cards, smooth animations, consistent color palette
2. **Pakistani Market Focus** — PKR currency, Urdu language, Zakat calculator (unique Islamic finance feature)
3. **Rich Feature Set** — 15+ modal screens, complete banking flow
4. **Bilingual Chatbot** — Urdu + English keyword matching
5. **TypeScript Usage** — Type-safe navigation params (`RootStackParamList`, `TabParamList`)
6. **Reusable Components** — UIKit, BottomModal properly abstracted
7. **Animations** — Shake, spin, scale, spring animations throughout
8. **Real Biometric** — Actual device biometric, sirf fallback demo mode hai
9. **Card Controls** — Online, international, ATM, NFC toggles — real banking feature
10. **Cross-Platform** — iOS, Android, Web sab support

---

## 12. Issues aur Improvements (Weaknesses)

### Critical:
1. **No Backend/API** — Sab data hardcoded/dummy hai, koi real data fetch nahi
2. **Hardcoded PIN** — `DEMO_PIN = '1234'` source code mein visible — production mein yeh remove hona chahiye
3. **No State Management** — Redux/Zustand/Context API nahi — large scale par mushkil hoga
4. **No Error Boundaries** — App crash handling nahi hai

### Important:
5. **No Data Persistence** — AsyncStorage/SQLite nahi — app restart par sab reset ho jata hai
6. **`any` Types** — `navigation: any` multiple screens mein — TypeScript benefits kam ho rahe hain
7. **Hardcoded User** — "Asif Khan" hardcoded hai har jagah
8. **No Loading States** — Network calls ke liye proper loading UI nahi (besides login)
9. **No Input Validation** — Zakat calculator mein negative values bhi enter ho sakti hain

### Minor:
10. **No Dark Mode** — Toggle UI mein hai lekin functionality implement nahi
11. **No Internationalization (i18n)** — Language switching properly implemented nahi
12. **Console Errors** — Possible issues with `newArchEnabled: false` aur newer React 19

---

## 13. Missing Features (Potential Next Steps)

- [ ] Real backend API integration (Node.js / Firebase)
- [ ] User authentication (JWT / OAuth)
- [ ] Secure PIN storage (Keychain/Keystore)
- [ ] Transaction filtering & search
- [ ] Push notifications
- [ ] Dark mode implementation
- [ ] Urdu/English language toggle
- [ ] Charts/graphs for spending analysis
- [ ] QR code scanner (Scan & Pay)
- [ ] Bill payment integration (LESCO, etc.)
- [ ] Money send/receive actual flow

---

## 14. Summary

| Metric | Value |
|---|---|
| Total Screens | 6 |
| Total Components | 3 (+ UIKit sub-components: 7) |
| Total Constants Files | 2 |
| Lines of Code (approx.) | ~2,500+ |
| Dependencies | 16 production, 2 dev |
| Platform Support | Android ✅ iOS ✅ Web ✅ |
| State | Demo/Prototype |
| Backend Integration | ❌ None |
| Build System | Expo EAS |

**Overall:** Paisa Rakhna ek well-designed, feature-rich **fintech prototype** hai jo Pakistani market ke liye tailored hai. UI/UX professional level ka hai lekin production ke liye backend integration, proper auth, aur state management zaroori hai.

---
*Report generated by GitHub Copilot — April 7, 2026*

---

---

# PART 2 — Real World App ka Plan
**Updated:** April 7, 2026 — Stack Decision + Full Roadmap

---

## 15. Real App ke liye Final Tech Stack

> **Decision:** Tumhare paas React Native frontend already ready hai. Backend Laravel mein banana best choice hai kyunki woh tumhe aata hai. Yeh full-stack plan hai.

### 15.1 Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PAISA RAKHNA - REAL APP                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📱 MOBILE APP           🌐 ADMIN PANEL                     │
│  React Native            Laravel + Inertia.js + React       │
│  Expo + TypeScript       (web dashboard for admin)          │
│           │                        │                        │
│           └──────────┬─────────────┘                        │
│                       │                                      │
│              🔌 REST API (HTTPS)                            │
│                       │                                      │
│           ┌───────────▼──────────────┐                      │
│           │   LARAVEL 11 BACKEND     │                      │
│           │   - Auth (Sanctum)       │                      │
│           │   - Business Logic       │                      │
│           │   - API Routes           │                      │
│           │   - Queue Jobs           │                      │
│           └───────────┬──────────────┘                      │
│                       │                                      │
│        ┌──────────────┼──────────────────┐                  │
│        │              │                  │                  │
│   PostgreSQL        Redis            AWS S3                 │
│   (Main DB)    (Cache+Queue)    (Files/KYC Docs)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 Technology Stack — Final Decision

| Layer | Technology | Version | Reason |
|---|---|---|---|
| **Mobile Frontend** | React Native + Expo | Already ✅ | Already built |
| **Mobile Language** | TypeScript | Already ✅ | Already using |
| **Backend Framework** | **Laravel** | 11.x | Tumhe aata hai |
| **Backend Language** | PHP | 8.3 | Laravel ke saath |
| **Admin Panel** | **Inertia.js + React** | Latest | Ek backend, no separate server |
| **Database** | **PostgreSQL** | 16.x | ACID compliance — finance ke liye must |
| **Cache** | **Redis** | 7.x | Fast sessions, rate limiting |
| **Queue** | Laravel Queue + Redis | — | Background jobs (OTP, emails) |
| **API Auth** | **Laravel Sanctum** | — | Mobile token authentication |
| **OTP/SMS** | **Twilio** or Jazz SMS | — | Pakistani numbers pe OTP |
| **Push Notifications** | **Firebase FCM** | — | React Native support perfect hai |
| **Real-time** | **Laravel Echo + Pusher** | — | Live transaction alerts |
| **File Storage** | **AWS S3 / Cloudflare R2** | — | KYC documents, profile photos |
| **Deployment** | **DigitalOcean** or Railway | — | Affordable, reliable |
| **CI/CD** | GitHub Actions | — | Auto deploy on push |

---

## 16. Kya Add Karna Hai (What to Build)

### ✅ ZAROOR ADD KARO (Must Have)

| Feature | Details |
|---|---|
| **Real Authentication** | Phone number + OTP (SMS) se register/login |
| **Secure PIN Storage** | NEVER hardcode PIN — Laravel encrypted store |
| **User Profiles** | CNIC number, full name, address, profile photo |
| **KYC Verification** | CNIC front/back photo upload, admin approve kare |
| **Real Transaction Ledger** | Har credit/debit database mein save ho |
| **Wallet System** | Internal balance — topup, send, receive |
| **JWT/Sanctum Tokens** | Mobile app ke liye secure API tokens |
| **RAAST Integration** | SBP ka free instant payment — Pakistani banks |
| **Push Notifications** | Transaction alerts, OTP, security alerts |
| **Admin Panel** | User manage karo, KYC approve karo, transactions dekho |
| **Rate Limiting** | OTP ke liye — brute force se bachao |
| **Input Validation** | Server side — React Native pe trust mat karo |
| **Dark Mode** | UI mein toggle already hai — implement karo |
| **Zakat Calculator** | Backend se gold/silver rates fetch karo (live API) |

### ❌ MAT ADD KARO (Must Avoid / Not Yet)

| Feature | Reason |
|---|---|
| **Actual Card Issuance** | Banking license chahiye — without it illegal |
| **Raw Card Numbers Store** | PCI-DSS compliance needed — bohot complex |
| **ACH / Real Bank Transfers** | 1LINK ya SBP license ke bina nahi kar sakte |
| **Redux (right now)** | Over-engineering — Context API + React Query enough hai |
| **Microservices** | Monolith Laravel pehle — scale karo baad mein |
| **Crypto/Blockchain** | Out of scope + SBP regulations |
| **Multiple Languages Backend** | Node.js ya Python mat pakro — Laravel pe rehna |
| **Firebase Auth** | Laravel Sanctum already karo — Firebase Auth redundant |
| **GraphQL** | REST API simple aur fast — GraphQL over-engineering |

---

## 17. Development Phases — Step by Step Roadmap

### PHASE 1 — Foundation (Week 1-2)
> **Goal:** Laravel project setup, database, aur basic API running

```
✅ Checklist:
□ Laravel 11 install karo (composer create-project)
□ PostgreSQL connect karo (.env setup)
□ Redis install + configure karo
□ Sanctum install karo (php artisan install:api)
□ GitHub repo banao (separate backend repo)
□ Postman collection banao API test ke liye
□ Basic folder structure:
   app/
   ├── Models/
   ├── Http/Controllers/Api/
   ├── Http/Resources/        ← API response format
   ├── Services/              ← Business logic yahan
   └── Http/Requests/         ← Validation yahan
```

**Database Tables (Phase 1):**
```sql
users           - id, name, phone, cnic, email, pin_hash, status
wallets         - id, user_id, balance, currency (PKR)
transactions    - id, wallet_id, type, amount, ref_no, status, meta
otps            - id, phone, code, expires_at, used
kyc_documents   - id, user_id, cnic_front, cnic_back, status
```

---

### PHASE 2 — Authentication (Week 3-4)
> **Goal:** Real phone number based login + PIN + Biometric

**Flow:**
```
Register:
1. Phone number enter karo
2. OTP SMS aaye (Twilio)
3. OTP verify karo
4. CNIC + Name enter karo
5. 6-digit PIN set karo (bcrypt se hash)
6. Sanctum token return ho → Mobile mein save

Login:
1. Phone number enter karo
2. OTP ya PIN
3. Biometric (device level — already React Native mein hai)
4. Token refresh
```

**Laravel APIs needed:**
```
POST /api/auth/register          ← Send OTP
POST /api/auth/verify-otp        ← Verify OTP + create user
POST /api/auth/login             ← PIN login
POST /api/auth/refresh           ← Token refresh
POST /api/auth/logout            ← Token revoke
POST /api/auth/forgot-pin        ← OTP se PIN reset
```

**Frontend changes (React Native):**
- `DummyData.ts` ki zaroorat nahi rahegi — API se aayega
- `DEMO_PIN = '1234'` hata dena — real API call hogi
- `AsyncStorage` mein Sanctum token store karna
- Axios instance banani hogi (with token header)

---

### PHASE 3 — Core Banking Features (Week 5-8)
> **Goal:** Real wallet, transactions, send/receive

**Wallet APIs:**
```
GET  /api/wallet/balance         ← Real balance
GET  /api/wallet/transactions    ← Transaction history (paginated)
POST /api/wallet/topup           ← Add money (via payment gateway)
POST /api/wallet/send            ← Internal transfer (user to user)
POST /api/wallet/receive         ← Generate receive QR
GET  /api/wallet/statement       ← Monthly PDF statement
```

**Transaction Logic (Laravel Service):**
```php
// Yeh logic WalletService mein hogi
// - Balance check
// - Debit sender wallet (atomic)
// - Credit receiver wallet (atomic)
// - Log transaction
// - Send push notification
// - All in DB Transaction (beginTransaction / commit / rollback)
```

> ⚠️ **Critical:** Database transactions use karna ZAROOR hai — partial transfers se account balance corrupt ho sakta hai.

---

### PHASE 4 — Admin Panel (Week 9-10)
> **Goal:** Web dashboard — users, KYC, transactions

**Stack:** Laravel + Inertia.js + React (same Laravel project, alag routes)

```
Admin Panel Features:
├── Dashboard       ← Total users, transactions, volume
├── Users           ← List, search, ban/unban
├── KYC Approval    ← CNIC photos dekho, approve/reject
├── Transactions    ← All transactions, filter by date/user
├── Wallets         ← Balance audit
└── Settings        ← OTP config, rates, maintenance mode
```

**Admin Routes (Laravel):**
```
/admin/*  → Inertia.js React pages
/api/*    → Sanctum protected mobile APIs
```

---

### PHASE 5 — Security Hardening (Week 11)
> **Goal:** Production-ready security

```
Security Checklist:
□ Rate limiting on all auth endpoints (5 attempts/min)
□ OTP expiry (5 minutes)
□ PIN bcrypt hash — NEVER plaintext
□ Sanctum token expiry (30 days, refresh on use)
□ HTTPS only (SSL certificate)
□ SQL injection — Laravel Eloquent handles it ✅
□ XSS — API-only, no HTML output ✅
□ CORS — only your app's domain allowed
□ Logging — all failed auth attempts log karo
□ Sensitive data encrypt — CNIC numbers
□ IP-based suspicious activity flag
```

---

### PHASE 6 — Deployment (Week 12)
> **Goal:** Live server pe deploy

```
Server Setup (DigitalOcean $12/mo Droplet):
├── Ubuntu 24.04
├── Nginx
├── PHP 8.3 + PHP-FPM
├── PostgreSQL
├── Redis
├── SSL (Let's Encrypt — free)
└── Supervisor (Queue workers)

Mobile App:
├── EAS Build (already configured ✅)
├── Update .env: API_URL = https://api.paisarakhna.pk
└── Google Play Store / App Store submit
```

---

## 18. React Native Frontend — Kya Badalna Hoga

Tumhara current React Native frontend achha hai — sirf yeh changes karni hain:

| Change | File | Type |
|---|---|---|
| Remove `DummyData.ts` | `constants/DummyData.ts` | Delete eventually |
| Add Axios / API service | New: `services/api.ts` | Add |
| Add AsyncStorage (token) | New: `services/auth.ts` | Add |
| Add React Query | `package.json` | New dependency |
| Real auth flow | `screens/LoginScreen.tsx` | Modify |
| API calls for balance | `screens/HomeScreen.tsx` | Modify |
| API calls for transactions | `screens/StoreScreen.tsx` | Modify |
| Add loading + error states | All screens | Modify |
| Remove hardcoded "Asif Khan" | All screens | Modify |
| Fix `navigation: any` | All screens | Modify (TypeScript) |

**New packages needed (React Native):**
```
axios                    ← HTTP requests
@react-native-async-storage/async-storage  ← Token store
@tanstack/react-query    ← Server state management
react-hook-form          ← Form handling + validation
```

---

## 19. Pakistani Banking Reality Check

> ⚠️ **Important:** Yeh cheezein aapko pata honi chahiye

| Scenario | Reality |
|---|---|
| **Actual bank transfers** | SBP (State Bank) se license chahiye — EMI license |
| **RAAST integration** | SBP se approval + technical onboarding needed |
| **EasyPaisa/JazzCash** | Their API available hai — partnership ke baad |
| **Internal wallet** | Legal — users apas mein transfer kar sakte hain |
| **Demo/Prototype** | Koi issue nahi — abhi yahi stage pe ho |
| **Startup path** | Pehle fintech startup register karo → SBP EMI license → partnership |

**Short-term realistic goal:** Internal wallet app jahan users topup kar sakein aur apas mein transfer kar sakein — yeh bina banking license ke bhi legal hai.

---

## 20. Conversation Summary — Session 1 (April 7, 2026)

### Is Session Mein Finalize Kiya:

✅ **Stack Finalized:**
- Frontend: React Native + Expo + TypeScript (existing)
- Backend: Laravel 11 (PHP)
- Admin Panel: Laravel + Inertia.js + React
- Database: PostgreSQL
- Cache/Queue: Redis
- Auth: Laravel Sanctum (mobile tokens)
- SMS OTP: Twilio
- Push Notifications: Firebase FCM
- Storage: AWS S3 / Cloudflare R2
- Real-time: Laravel Echo + Pusher
- Deployment: DigitalOcean

✅ **Architecture Finalized:** Monolith Laravel backend (scale later)

✅ **6 Development Phases Defined** (12 weeks estimated)

✅ **What to Build vs What to Avoid** — documented above

✅ **Pakistani banking reality** — internal wallet first, licensing later

### Agle Session Mein Yeh Karo:
1. Laravel 11 project create karo
2. PostgreSQL database setup
3. `.env` configure karo
4. Phase 1 database migrations banao
5. Basic folder structure set karo

---

## 21. M-PIN Feature — Transaction Security

> **Inspired by:** JazzCash / EasyPaisa M-PIN system — same concept, same UX

### 21.1 Kya Hai M-PIN?

M-PIN (Mobile PIN) ek **4-digit transaction password** hai jo sirf transactions ke liye use hota hai. Login PIN alag hota hai, M-PIN alag hota hai. Jaise ATM mein PIN dete ho — waise hi har transaction pe M-PIN dena hoga.

**Fayda:**
- OTP baar baar nahi mangi — sirf pehli baar registration pe
- Fast transactions — PIN dalo, kaam ho
- Security layer — koi aur phone pakad le toh bhi transaction nahi kar sakta

---

### 21.2 M-PIN Setup Flow (First Time)

```
USER PEHLI BAAR M-PIN REGISTER KARTA HAI:
──────────────────────────────────────────

Step 1: User "Send Money" ya koi bhi transaction attempt karta hai
        ↓
Step 2: App detect karta hai — "M-PIN registered nahi hai"
        ↓
Step 3: Screen aati hai: "Set Your M-PIN"
        ↓
Step 4: OTP generate hoti hai — SMS aati hai phone pe
        ↓
Step 5: OTP enter karo (verify karo — Laravel backend)
        ↓
Step 6: OTP sahi — "Choose your 4-digit M-PIN" screen
        ↓
Step 7: M-PIN enter karo → Confirm M-PIN enter karo
        ↓
Step 8: Laravel backend mein M-PIN bcrypt se hash ho ke save
        ↓
Step 9: "M-PIN Set Ho Gaya!" ✅
        ↓
Step 10: Transaction proceed hoti hai
```

---

### 21.3 M-PIN Use Flow (Har Transaction Pe)

```
REGISTERED USER TRANSACTION KARTA HAI:
───────────────────────────────────────

User "Send Money" press karta hai
        ↓
Receiver detail enter karta hai (phone/account)
        ↓
Amount enter karta hai
        ↓
"Confirm" press karta hai
        ↓
M-PIN screen aati hai (bottom modal — 4 dot PIN pad)
        ↓
User M-PIN enter karta hai
        ↓
Laravel API verify karta hai (bcrypt check)
        ↓
✅ Sahi — Transaction process hoti hai + notification
❌ Galat — "Incorrect M-PIN" shake animation (3 attempts)
           3 attempts fail — account 30 minutes lock
```

---

### 21.4 M-PIN Reset Flow

```
User "Forgot M-PIN" press karta hai
        ↓
OTP generate — SMS aati hai
        ↓
OTP verify
        ↓
New M-PIN set karo + confirm
        ↓
Done ✅
```

---

### 21.5 Database — M-PIN Fields

```sql
-- users table mein yeh columns add honge:
m_pin_hash          VARCHAR(255)   NULL     ← bcrypt hashed M-PIN
m_pin_set_at        TIMESTAMP      NULL     ← kab set kiya
m_pin_attempts      INTEGER        DEFAULT 0 ← failed attempts counter
m_pin_locked_until  TIMESTAMP      NULL     ← lock expiry time

-- m_pin_otps table (alag — login OTP se alag):
id
user_id
otp_code          ← 6 digit, bcrypt stored
purpose           ← 'set_mpin' | 'reset_mpin'
expires_at
used              ← boolean
created_at
```

---

### 21.6 Laravel APIs — M-PIN

```
POST /api/mpin/request-otp     ← OTP bhejo (SMS)
POST /api/mpin/verify-otp      ← OTP verify karo
POST /api/mpin/set             ← M-PIN save karo (first time)
POST /api/mpin/verify          ← Transaction ke waqt verify
POST /api/mpin/reset           ← OTP se reset
GET  /api/mpin/status          ← Set hai ya nahi (app check kare)
```

---

### 21.7 React Native — M-PIN Component

```
components/
└── MPinModal.tsx    ← New component (bottom modal style)
                        4-dot display
                        Custom numpad
                        Shake on wrong
                        "Forgot M-PIN" link
```

**Trigger kab hoga:** Har transaction se pehle — Send, Add Money, Bill Payment, Easy Load — sab mein.

---

### 21.8 Security Rules — M-PIN

| Rule | Detail |
|---|---|
| Storage | bcrypt hash — NEVER plaintext |
| Attempts | Max 3 wrong → 30 min lock |
| OTP expiry | 5 minutes |
| OTP reuse | One-time only — `used = true` after verify |
| Different from login PIN | Alag table field — confusion nahi |
| Change requires OTP | Security ke liye — no silent change |

---

## 22. AI Chatbot — Real AI Integration

> **Current state:** Keyword matching (dummy responses) — `ChatBot.tsx` already UI ready hai
> **Target state:** Real AI — OpenAI GPT / Gemini API connected

### 22.1 Current vs Future

| | Current (Dummy) | Future (Real AI) |
|---|---|---|
| Engine | `if/else` keyword matching | OpenAI GPT-4o mini API |
| Responses | Hardcoded strings | Dynamic, context-aware |
| Languages | Basic Urdu/English | Full bilingual support |
| Knowledge | 10 keywords | Full app knowledge |
| User data | No | Yes — balance, transactions (with auth) |

---

### 22.2 AI Chatbot Architecture

```
USER TYPES MESSAGE
        ↓
React Native (ChatBot.tsx)
        ↓
POST /api/chatbot/message  → Laravel Backend
        ↓
Laravel Controller:
  1. User authenticate check (Sanctum token)
  2. User ka balance, recent transactions fetch karo
  3. System prompt banao (user data + app context)
  4. OpenAI API call (GPT-4o mini — cheapest, fast)
  5. Response return karo
        ↓
React Native → Message display
```

---

### 22.3 Why Backend Se AI Call Karo (Not Direct from App)?

**9 reasons:**
1. **API Key secure** — React Native mein OpenAI key dalna DANGEROUS hai (anyone can extract it)
2. **User data inject** — Laravel se user ka balance, transactions AI ko dے sakte hain
3. **Rate limiting** — Ek user spam nahi kar sakta
4. **Cost control** — Token usage monitor kar sakte hain
5. **Logging** — Conversations save kar sakte hain (support ke liye)
6. **Model switch** — Kal GPT se Gemini pe switch — sirf backend change
7. **Content filtering** — Inappropriate requests block kar sakte hain
8. **Caching** — Same sawaal pe same jawab — Redis cache
9. **Free tier management** — Limits control kar sakte hain

---

### 22.4 System Prompt Design (Laravel)

```
Laravel chatbot controller yeh system prompt banayega:

"You are 'Paisa Rakhna AI', a helpful banking assistant for 
a Pakistani fintech app called Paisa Rakhna. 

User's name: {user.name}
Current balance: PKR {wallet.balance}
Recent transactions: {last_3_transactions}
M-PIN status: {mpin_set ? 'Set' : 'Not set'}

Rules:
- Reply in the same language the user writes (Urdu or English)
- For Urdu, use Roman Urdu (not Arabic script)  
- Never share sensitive data (full card numbers, passwords)
- Keep responses short — 2-3 sentences max
- For transactions, always say to use the app buttons
- If asked about balance, show the real balance from context"
```

---

### 22.5 Laravel API

```
POST /api/chatbot/message
Body: { "message": "mera balance kitna hai?" }
Headers: Authorization: Bearer {sanctum_token}

Response: { "reply": "Aapka current balance PKR 4,82,350 hai." }
```

---

### 22.6 React Native Changes (ChatBot.tsx)

```
Current:   getResponse(text) — local function, dummy
Future:    apiService.chatbot(text) — axios call to Laravel
```

Sirf ek function replace hogi — baaki poora UI same rahega.

---

### 22.7 AI Service Options (Cost Comparison)

| Service | Cost | Speed | Quality |
|---|---|---|---|
| **OpenAI GPT-4o mini** | ~$0.00015/msg | Fast | Best ✅ |
| Google Gemini 1.5 Flash | Free tier available | Fast | Good |
| Anthropic Claude Haiku | ~$0.00025/msg | Fast | Good |

**Recommendation:** OpenAI GPT-4o mini — cheapest, fastest, best for fintech.

---

## 23. MASTER HANDOFF PROMPT
### (Naya Session Shuru Hote Hi Yeh Paste Karo)

```
=================================================================
PAISA RAKHNA — PROJECT CONTEXT FOR NEW SESSION
=================================================================

PROJECT: Paisa Rakhna — Pakistani Fintech / Digital Banking App
DATE STARTED: April 7, 2026
STATUS: Frontend 70% done (prototype). Backend not started yet.

─────────────────────────────────────────────────────────────────
WHAT HAS BEEN BUILT (FRONTEND — React Native):
─────────────────────────────────────────────────────────────────

Framework: React Native + Expo + TypeScript
Path: c:\Users\muham\Downloads\Paisa_Rakhna

Screens (6):
- LoginScreen.tsx   → 3 sub-screens: Welcome, PIN (4-digit, hardcoded 1234), Face
- HomeScreen.tsx    → Balance card, Quick Actions, Services, Transactions, Wallet
- CardsScreen.tsx   → Card carousel, Controls (freeze, limits, NFC, ATM toggle)
- StoreScreen.tsx   → Offers, Transaction history
- MoreScreen.tsx    → Profile, Settings, Security toggles
- ZakatScreen.tsx   → Islamic Zakat calculator (unique Pakistan feature)

Components:
- ChatBot.tsx       → Floating AI chatbot (currently DUMMY keyword matching)
- BottomModal.tsx   → Reusable animated bottom sheet
- UIKit.tsx         → Design system (Field, BtnPrimary, BtnOutline, Toggle etc.)

Constants:
- Colors.ts         → Full color palette (primary: #16a265 green)
- DummyData.ts      → Fake transactions, cards, chatbot responses

Key issues in current frontend:
- DEMO_PIN = '1234' hardcoded — remove when backend ready
- "Asif Khan" hardcoded everywhere — make dynamic
- Face scan is fake animation — need real implementation or remove
- ChatBot is keyword-matching only — need real AI
- No API calls anywhere — all dummy data
- navigation: any in all screens — TypeScript not proper
- Card width breaks on web — need Math.min clamp fix

─────────────────────────────────────────────────────────────────
FINALIZED TECH STACK:
─────────────────────────────────────────────────────────────────

Mobile App:      React Native + Expo + TypeScript (EXISTING)
Backend:         Laravel 12 (PHP 8.3) — developer knows Laravel well
Admin Panel:     Laravel + Inertia.js + React (same Laravel project)
Database:        PostgreSQL (developer is installing it)
Cache/Queue:     Redis
Auth (Mobile):   Laravel Sanctum (token-based)
OTP/SMS:         Twilio
Push Notif:      Firebase FCM
AI Chatbot:      OpenAI GPT-4o mini (called via Laravel backend)
File Storage:    AWS S3 or Cloudflare R2 (KYC documents)
Real-time:       Laravel Echo + Pusher (transaction alerts)
Deployment:      DigitalOcean Droplet

─────────────────────────────────────────────────────────────────
SPECIAL FEATURES DECIDED:
─────────────────────────────────────────────────────────────────

1. M-PIN (Transaction PIN):
   - 4-digit PIN for every transaction (like JazzCash M-PIN)
   - First time setup requires OTP verification via SMS
   - After setup, only M-PIN needed (no OTP every time)
   - Stored as bcrypt hash in database
   - 3 wrong attempts = 30 min account lock
   - Reset via OTP
   - New component needed: MPinModal.tsx

2. AI Chatbot (Real):
   - Current ChatBot.tsx UI stays — only logic changes
   - Backend: Laravel receives message → adds user context
     (balance, transactions) → calls OpenAI API → returns reply
   - API Key stored ONLY in Laravel .env — never in app
   - Bilingual: Roman Urdu + English
   - Endpoint: POST /api/chatbot/message

─────────────────────────────────────────────────────────────────
DATABASE TABLES PLANNED:
─────────────────────────────────────────────────────────────────

users:
  id, name, phone, cnic, email, pin_hash, m_pin_hash,
  m_pin_attempts, m_pin_locked_until, status, created_at

wallets:
  id, user_id, balance (decimal 15,2), currency (PKR), created_at

transactions:
  id, wallet_id, type (credit/debit), amount, ref_no,
  description, status, meta (JSON), created_at

otps:
  id, user_id, otp_code (hashed), purpose
  (login/set_mpin/reset_mpin), expires_at, used

kyc_documents:
  id, user_id, cnic_front (S3 URL), cnic_back (S3 URL),
  status (pending/approved/rejected), admin_note

personal_access_tokens: (Sanctum — auto created)

─────────────────────────────────────────────────────────────────
API ENDPOINTS PLANNED:
─────────────────────────────────────────────────────────────────

AUTH:
 POST /api/auth/register          → Send OTP
 POST /api/auth/verify-otp        → Verify + create user + token
 POST /api/auth/login             → PIN login + token
 POST /api/auth/logout            → Revoke token
 POST /api/auth/forgot-pin        → OTP se PIN reset

WALLET:
 GET  /api/wallet/balance         → Current balance
 GET  /api/wallet/transactions    → History (paginated)
 POST /api/wallet/send            → Internal transfer
 POST /api/wallet/topup           → Add money

M-PIN:
 GET  /api/mpin/status            → Set hai ya nahi
 POST /api/mpin/request-otp       → OTP bhejo (SMS)
 POST /api/mpin/verify-otp        → OTP verify
 POST /api/mpin/set               → M-PIN save (first time)
 POST /api/mpin/verify            → Transaction ke waqt check
 POST /api/mpin/reset             → OTP se reset

CHATBOT:
 POST /api/chatbot/message        → AI response (OpenAI via Laravel)

ADMIN (web routes):
 /admin/dashboard
 /admin/users
 /admin/kyc
 /admin/transactions

─────────────────────────────────────────────────────────────────
FRONTEND → BACKEND CONNECTION PLAN:
─────────────────────────────────────────────────────────────────

New files to create in React Native:
 services/api.ts     → Axios instance with base URL + token header
 services/auth.ts    → Login, logout, token save/load (AsyncStorage)

New packages to install (React Native):
 axios
 @react-native-async-storage/async-storage
 @tanstack/react-query
 react-hook-form

Auth Flow (After backend ready):
 1. Phone number → OTP SMS → Verify → Set PIN → Sanctum Token
 2. Token stored in AsyncStorage
 3. All API calls: Authorization: Bearer {token}
 4. Token expire → auto logout → login screen

─────────────────────────────────────────────────────────────────
DEVELOPMENT PHASES:
─────────────────────────────────────────────────────────────────

PHASE 1 (Week 1-2):   Laravel 12 setup, PostgreSQL, Redis,
                       migrations, folder structure, Sanctum install
PHASE 2 (Week 3-4):   Auth APIs (register, OTP, login, token)
PHASE 3 (Week 5-8):   Wallet, Transactions, M-PIN, Send/Receive
PHASE 4 (Week 9-10):  Admin Panel (Inertia.js + React)
PHASE 5 (Week 11):    Security hardening, rate limiting, encryption
PHASE 6 (Week 12):    DigitalOcean deploy, EAS build, Play Store

─────────────────────────────────────────────────────────────────
FRONTEND IMPROVEMENTS PLANNED (Before/During Backend):
─────────────────────────────────────────────────────────────────

HIGH PRIORITY:
 1. Register Screen (new) — phone → OTP → PIN set → onboarding
 2. Remove Face Scan screen — replace with "Biometric only"
 3. Add MPinModal.tsx component — for all transactions
 4. Fix card width on web — Math.min(SCREEN_W - 62, 380)
 5. Skeleton loaders — while API loading
 6. Error states — network errors, wrong PIN messages
 7. Empty states — no transactions, no cards

MEDIUM PRIORITY:
 8. Onboarding slides (3 screens, first launch only)
 9. Dynamic user name (from API, not hardcoded)
 10. Pull to refresh on Home + Store
 11. Transaction detail full screen
 12. Session expire auto-logout

─────────────────────────────────────────────────────────────────
WHAT NOT TO BUILD (DECIDED):
─────────────────────────────────────────────────────────────────

❌ Real card issuance (banking license needed)
❌ Real bank transfers via 1LINK (SBP license needed)
❌ Redux (React Query + Context enough)
❌ Microservices (monolith first)
❌ Crypto features (out of scope + SBP regulations)
❌ Multiple backend languages (stay on Laravel)
❌ GraphQL (REST API sufficient)
❌ Firebase Auth (Sanctum is enough)
❌ Face recognition (too complex for now)
❌ Dark mode (implement later, after backend)

─────────────────────────────────────────────────────────────────
CURRENT STATUS (April 7, 2026):
─────────────────────────────────────────────────────────────────

✅ Frontend prototype complete (React Native)
✅ Tech stack finalized
✅ Database schema designed
✅ All API endpoints planned
✅ M-PIN feature designed
✅ AI Chatbot architecture designed
✅ PostgreSQL installation in progress
✅ Laravel 12 installed

NEXT IMMEDIATE STEP:
→ Laravel 12 project setup (paisa-rakhna-api)
→ Connect PostgreSQL in .env
→ Run first 5 migrations
→ Install Sanctum

=================================================================
END OF CONTEXT
=================================================================
```

---
*M-PIN + AI Chatbot + Master Prompt added by GitHub Copilot — April 7, 2026*
