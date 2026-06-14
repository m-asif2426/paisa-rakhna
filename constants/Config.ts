// ─────────────────────────────────────────────────────────────────────────────
// Paisa Rakhna — App Configuration (LOCAL NETWORK ONLY)
// ─────────────────────────────────────────────────────────────────────────────
//
// HOW TO USE:
//   1. ipconfig → find "IPv4 Address" of your laptop (e.g. 192.168.1.5)
//   2. Paste that IP in LOCAL_IP below
//   3. Run Laravel: php artisan serve --host=0.0.0.0 --port=8000
//   4. Build & install APK once via Android Studio (USB se)
//   5. USB hata do — app same WiFi se chalegi
//
// MODE OPTIONS:
//   'local-ip'  → Same WiFi network (recommended)
//   'usb'       → USB cable connected (adb reverse required)
//   'emulator'  → Android Studio emulator only
//
// ─────────────────────────────────────────────────────────────────────────────

type ApiMode = 'usb' | 'local-ip' | 'emulator';

// ✅ CHANGE THIS to switch mode
const MODE: ApiMode = 'usb';

// ── Your Laptop's Local IP (update if your WiFi IP changes) ─────────────────
// CMD → ipconfig → "IPv4 Address"
const LOCAL_IP = '192.168.0.109';

const HOST_MAP: Record<ApiMode, string> = {
    'local-ip': `http://${LOCAL_IP}:8000`,      // ✅ WiFi — USB ki zaroorat nahi
    'usb':      'http://localhost:8000',         // USB cable (adb reverse required)
    'emulator': 'http://10.0.2.2:8000',          // Android emulator
};

export const API_BASE_URL = `${HOST_MAP[MODE]}/api`;
