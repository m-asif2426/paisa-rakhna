// ─────────────────────────────────────────────────────────────────────────────
// Paisa Rakhna — Auth Storage Service
// AsyncStorage se token permanently save hota hai — app restart pe bhi rehta hai
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './api';

export interface StoredUser {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    initials: string;
    kyc_status: 'pending' | 'verified' | 'rejected';
    has_mpin: boolean;
}

const STORAGE_KEY_TOKEN = '@paisa_token';
const STORAGE_KEY_USER  = '@paisa_user';

// In-memory cache (fast access after hydration)
let _token: string | null = null;
let _user: StoredUser | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────────────────────

/** Call on app start to restore session from disk */
export async function hydrateSession(): Promise<{ token: string; user: StoredUser } | null> {
    try {
        const [storedToken, storedUser] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY_TOKEN),
            AsyncStorage.getItem(STORAGE_KEY_USER),
        ]);
        if (storedToken && storedUser) {
            _token = storedToken;
            _user = JSON.parse(storedUser) as StoredUser;
            setAuthToken(_token);
            return { token: _token, user: _user };
        }
    } catch { /* storage read failed — stay logged out */ }
    return null;
}

export function saveSession(token: string, user: StoredUser): void {
    _token = token;
    _user = user;
    setAuthToken(token);
    // Persist to disk (fire-and-forget — no need to await)
    AsyncStorage.setItem(STORAGE_KEY_TOKEN, token).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user)).catch(() => {});
}

export function clearSession(): void {
    _token = null;
    _user = null;
    setAuthToken(null);
    AsyncStorage.multiRemove([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]).catch(() => {});
}

export function getSession(): { token: string; user: StoredUser } | null {
    if (_token && _user) {
        return { token: _token, user: _user };
    }
    return null;
}

export function isLoggedIn(): boolean {
    return _token !== null;
}

export function getCurrentUser(): StoredUser | null {
    return _user;
}

export function updateUserMpinStatus(mpinSet: boolean): void {
    if (_user) {
        _user = { ..._user, has_mpin: mpinSet };
        AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(_user)).catch(() => {});
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}

export function formatPhone(phone: string): string {
    // 03001234567 → +92 300-1234567
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        return `+92 ${cleaned.slice(1, 4)}-${cleaned.slice(4)}`;
    }
    return phone;
}

export function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return /^03[0-9]{9}$/.test(cleaned);
}

export function isValidPin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
}
