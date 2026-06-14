<div align="center">

<img src="./assets/icon.png" alt="Paisa Rakhna Logo" width="120" height="120" style="border-radius: 24px;" />

# 💰 Paisa Rakhna

### A Full-Stack Fintech Application for Personal Finance Management

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-13.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)

**Paisa Rakhna** (Urdu: *پیسہ رکھنا* — "Keep Your Money") is a secure, feature-rich digital wallet and personal finance tracker built for Pakistani users. It enables seamless peer-to-peer transfers, expense tracking, KYC verification, and AI-powered financial assistance — all in one app.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Mobile App Setup](#mobile-app-setup)
  - [Backend (API) Setup](#backend-api-setup)
- [🔌 API Reference](#-api-reference)
- [🖥️ Admin Panel](#️-admin-panel)
- [📱 App Screens](#-app-screens)
- [🔐 Security](#-security)
- [📦 Database Models](#-database-models)
- [🌐 Deployment](#-deployment)
- [👨‍💻 Author](#-author)
- [📄 License](#-license)

---

## ✨ Features

### 👤 User App (React Native)
| Feature | Description |
|---------|-------------|
| 🔐 **Secure Registration** | OTP-based phone verification with multi-step onboarding |
| 🔑 **M-PIN Login** | 4-digit PIN authentication with biometric support |
| 💳 **Digital Wallet** | Real-time balance tracking and top-up functionality |
| 💸 **Send & Receive Money** | Instant peer-to-peer transfers via QR code or phone number |
| 📊 **Expense Tracking** | Categorized spending insights with visual breakdowns |
| 🧾 **Transaction History** | Full statement with filtering and PDF export |
| 🪪 **KYC Verification** | In-app document upload for identity verification |
| 🕌 **Zakat Calculator** | Built-in Islamic finance tool with live gold/silver rates |
| 🛍️ **Store / Marketplace** | Browse featured products and services |
| 🤖 **AI Chatbot** | Gemini-powered financial assistant |
| 🔔 **Push Notifications** | Real-time alerts via Firebase Cloud Messaging (FCM) |
| 📷 **QR Scanner** | Scan-to-pay functionality for fast transfers |
| 📄 **Transaction Slip** | Downloadable and shareable transaction receipts |

### 🛠️ Admin Panel (Web Dashboard)
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard Overview** | Real-time stats: users, transactions, revenue, KYC status |
| 👥 **User Management** | View, edit, activate/deactivate, and export all users |
| 💰 **Transaction Monitoring** | Full transaction log with export to CSV |
| 🪪 **KYC Management** | Review, approve, or reject user identity documents |
| 💹 **Rates Management** | Configure Zakat gold/silver rates dynamically |
| 📋 **Audit Logs** | Full activity log for admin accountability |
| 🔒 **Security Logs** | Track and resolve suspicious login attempts |
| ⚙️ **System Settings** | Manage app-wide configuration from the dashboard |
| 🔔 **Admin Notifications** | In-app notification center for admin alerts |
| 📈 **Reports & Analytics** | Revenue charts and platform performance metrics |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Paisa Rakhna                      │
├──────────────────────┬──────────────────────────────┤
│   Mobile App         │   Backend (paisa-rakhna-api) │
│   React Native       │   Laravel 13 + PostgreSQL    │
│   (TypeScript)       │   Sanctum Auth + REST API    │
│   Expo SDK 54        │   Railway Cloud Deployment   │
└──────────────────────┴──────────────────────────────┘
           │                        │
           └──────── REST API ──────┘
                   (HTTPS/JSON)
```

---

## 🛠️ Tech Stack

### Frontend — Mobile App
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | 54.0.33 | Development toolchain & build system |
| TypeScript | 5.9 | Type-safe JavaScript |
| React Navigation | 7.x | App navigation (Stack + Bottom Tabs) |
| Expo Linear Gradient | 15.0 | UI gradient effects |
| Expo Local Authentication | 17.0 | Biometric / fingerprint login |
| Expo Notifications | 0.32 | Push notification handling |
| Expo Camera | 17.0 | QR code scanning |
| AsyncStorage | 2.2 | Local data persistence |
| React Native Reanimated | 4.1 | Smooth animations |

### Backend — REST API
| Technology | Version | Purpose |
|------------|---------|---------|
| Laravel | 13.0 | PHP web framework |
| Laravel Sanctum | 4.0 | API token authentication |
| PHP | 8.3+ | Backend runtime |
| PostgreSQL | 16 | Primary relational database |
| Predis | 3.4 | Redis client for caching & queues |
| Laravel Queue | Built-in | Background job processing |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Railway | Cloud hosting for backend + database |
| Firebase (FCM) | Push notifications to mobile devices |
| Google Gemini AI | Chatbot / AI assistant |

---

## 📁 Project Structure

```
Paisa_Rakhna/
├── 📱 Mobile App (Root)
│   ├── App.tsx                    # Root navigator & app entry
│   ├── index.ts                   # Expo entry point
│   ├── app.json                   # Expo configuration
│   ├── package.json               # JS dependencies
│   ├── tsconfig.json              # TypeScript config
│   │
│   ├── screens/                   # App screens
│   │   ├── HomeScreen.tsx         # Main dashboard
│   │   ├── RegisterScreen.tsx     # User registration flow
│   │   ├── LoginScreen.tsx        # PIN-based login
│   │   ├── ForgotPinScreen.tsx    # PIN recovery via OTP
│   │   ├── CardsScreen.tsx        # Virtual card management
│   │   ├── KycScreen.tsx          # KYC document upload
│   │   ├── MoreScreen.tsx         # Settings & profile
│   │   ├── StoreScreen.tsx        # In-app marketplace
│   │   ├── ZakatScreen.tsx        # Zakat calculator
│   │   └── PendingApprovalScreen.tsx  # Awaiting KYC screen
│   │
│   ├── components/                # Reusable UI components
│   │   ├── UIKit.tsx              # Design system components
│   │   ├── ChatBot.tsx            # AI chatbot interface
│   │   ├── MPinModal.tsx          # M-PIN entry modal
│   │   ├── QrScannerModal.tsx     # QR code scanner
│   │   ├── TransactionSlipModal.tsx # Transaction receipt
│   │   └── BottomModal.tsx        # Reusable bottom sheet
│   │
│   ├── context/                   # React Context (global state)
│   ├── services/                  # API service layer
│   ├── constants/                 # App constants & config
│   └── assets/                    # Images, fonts, icons
│
└── 🖥️ paisa-rakhna-api/           # Laravel Backend
    ├── app/
    │   ├── Http/Controllers/
    │   │   ├── Api/               # Mobile API controllers
    │   │   │   ├── AuthController.php
    │   │   │   ├── WalletController.php
    │   │   │   ├── TransactionController.php
    │   │   │   ├── CardController.php
    │   │   │   ├── KycController.php
    │   │   │   ├── MpinController.php
    │   │   │   ├── ChatbotController.php
    │   │   │   ├── StatementController.php
    │   │   │   ├── DeviceController.php
    │   │   │   └── RatesController.php
    │   │   └── Admin/             # Admin panel controllers
    │   │       ├── AdminController.php
    │   │       ├── AdminAuthController.php
    │   │       ├── AdminKycController.php
    │   │       ├── AdminReportsController.php
    │   │       ├── AdminAuditController.php
    │   │       ├── AdminSecurityController.php
    │   │       ├── AdminSettingsController.php
    │   │       └── AdminNotificationController.php
    │   ├── Models/                # Eloquent database models
    │   └── Services/              # Business logic services
    ├── routes/
    │   ├── api.php                # Mobile REST API routes
    │   └── web.php                # Admin panel web routes
    ├── database/                  # Migrations & seeders
    └── resources/                 # Blade views (Admin panel UI)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org/)
- **npm** v9+
- **Expo CLI** → `npm install -g expo-cli`
- **PHP** 8.3+ → [php.net](https://www.php.net/)
- **Composer** → [getcomposer.org](https://getcomposer.org/)
- **PostgreSQL** 14+ → [postgresql.org](https://www.postgresql.org/)
- **Android Studio** (for Android development)

---

### Mobile App Setup

**1. Clone the repository**
```bash
git clone https://github.com/m-asif2426/paisa-rakhna.git
cd paisa-rakhna
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure the API URL**

Open `services/` or `constants/` and update the backend URL:
```js
export const API_BASE_URL = "https://your-backend-url.railway.app/api";
```

**4. Start the development server**
```bash
# Start Expo development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

**5. Build APK (Android Release)**
```bash
npx expo run:android --variant release
```

---

### Backend (API) Setup

**1. Navigate to the API directory**
```bash
cd paisa-rakhna-api
```

**2. Install PHP dependencies**
```bash
composer install
```

**3. Configure environment**
```bash
cp .env.example .env
php artisan key:generate
```

**4. Update `.env` with your database and services**
```env
APP_NAME="Paisa Rakhna"
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=paisa_rakhna
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Firebase (FCM) - Push Notifications
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CREDENTIALS=path/to/firebase-credentials.json

# Google Gemini AI - Chatbot
GEMINI_API_KEY=your_gemini_api_key
```

**5. Run database migrations**
```bash
php artisan migrate
```

**6. Start the development server**
```bash
php artisan serve
```

> The API will be available at `http://localhost:8000`

**7. (Optional) Run all services together**
```bash
composer run dev
```

---

## 🔌 API Reference

Base URL: `https://your-api.railway.app/api`

### 🔓 Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/otp/send` | Send OTP to phone number |
| `POST` | `/auth/otp/verify` | Verify OTP code |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive Sanctum token |
| `POST` | `/auth/reset-pin` | Reset forgotten PIN via OTP |
| `GET` | `/rates/zakat` | Get current Zakat gold/silver rates |

### 🔒 Protected Endpoints (Require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/me` | Get authenticated user profile |
| `PATCH` | `/auth/profile` | Update user profile |
| `POST` | `/auth/logout` | Logout and revoke token |
| `GET` | `/wallet` | Get wallet balance |
| `POST` | `/wallet/topup` | Add funds to wallet |
| `GET` | `/transactions` | Get transaction history |
| `POST` | `/transactions/send` | Send money to another user |
| `GET` | `/mpin/status` | Check if M-PIN is set |
| `POST` | `/mpin/set` | Set a new M-PIN |
| `POST` | `/mpin/verify` | Verify M-PIN |
| `POST` | `/mpin/reset` | Reset M-PIN via OTP |
| `GET` | `/cards` | List virtual cards |
| `POST` | `/cards/{id}/toggle` | Activate/deactivate a card |
| `GET` | `/kyc` | Get KYC status |
| `POST` | `/kyc/submit` | Submit KYC documents |
| `GET` | `/statement` | Download account statement |
| `POST` | `/device/register` | Register FCM push token |
| `POST` | `/chatbot` | Send message to AI assistant |

---

## 🖥️ Admin Panel

The admin panel is a web-based dashboard accessible at `/admin`.

**Default Admin Login:**
```
URL:      https://your-api.railway.app/admin/login
```
> ⚠️ Admin credentials are configured in the database. Create an admin user via `php artisan tinker` or database seeder.

### Admin Panel Features
- **Dashboard** — Live platform statistics
- **Users** — Full user management with wallet adjustment
- **Transactions** — Monitor all platform transactions
- **KYC** — Review and approve user identity documents
- **Rates** — Manage Zakat calculation rates
- **Audit Logs** — Track admin actions
- **Security Logs** — Monitor and resolve security alerts
- **Settings** — Configure system-wide settings
- **Reports** — Analytics and revenue charts

---

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| **Register** | Multi-step registration: phone → OTP → personal info → M-PIN |
| **Login** | Phone number + 4-digit M-PIN authentication |
| **Home** | Dashboard with balance, quick actions, and recent transactions |
| **Cards** | Manage virtual debit cards |
| **KYC** | Upload CNIC front/back for identity verification |
| **Store** | Browse featured products and services |
| **Zakat** | Calculate Zakat based on live gold/silver rates |
| **More** | Profile settings, statement download, logout |
| **Pending Approval** | Screen shown while KYC is under review |

---

## 🔐 Security

Paisa Rakhna implements multiple layers of security:

- **Laravel Sanctum** — Stateless token-based API authentication
- **OTP Verification** — Phone number verified via one-time passcode
- **M-PIN** — 4-digit hashed PIN for transaction authorization
- **Biometric Auth** — Fingerprint / Face ID via Expo Local Authentication
- **Rate Limiting** — All auth endpoints are throttled to prevent brute-force:
  - OTP Send: 3 requests/minute
  - Login: 5 requests/minute
  - Transactions: 20 requests/minute
- **Audit Logging** — All admin actions are logged
- **Security Logs** — Suspicious activity is tracked and flagged

---

## 📦 Database Models

| Model | Description |
|-------|-------------|
| `User` | App user account (phone, name, status) |
| `Wallet` | User's digital wallet with balance |
| `Transaction` | Money transfer records |
| `Otp` | OTP codes for verification |
| `Mpin` | Hashed M-PIN for transaction auth |
| `Card` | Virtual debit cards |
| `KycDocument` | Identity verification documents |
| `AuditLog` | Admin action audit trail |
| `SecurityLog` | Suspicious activity records |
| `AdminNotification` | Admin panel notifications |
| `SystemSetting` | Key-value app configuration |

---

## 🌐 Deployment

This project is deployed on **Railway** cloud platform.

### Backend Deployment
- Platform: [Railway.app](https://railway.app)
- Database: PostgreSQL (Railway managed)
- Environment variables set via Railway dashboard
- Auto-deploy on `git push` to main branch

### Mobile App Build
- Build system: **Expo EAS Build**
- Android: `.apk` / `.aab` release build
- Configuration: `eas.json`

```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK
eas build -p android --profile preview
```

---

## 👨‍💻 Author

**Muhammad Asif Khan**
- 🎓 Computer Science Student
- 🌍 Pakistan
- 💼 [LinkedIn](https://linkedin.com/in/muhammad-asif-khan-114335312)
- 🐙 [GitHub](https://github.com/m-asif2426)

---

## 📄 License

This project is developed for educational purposes as part of a Computer Science degree project.

---

<div align="center">

Made with ❤️ in Pakistan 🇵🇰

**پیسہ رکھنا — اپنا پیسہ محفوظ رکھیں**

*"Keep Your Money Safe"*

</div>
