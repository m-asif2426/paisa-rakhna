// ─────────────────────────────────────────────────────────────────────────────
// Paisa Rakhna — API Service (with timeout, retry & resilience)
// URL change karne ke liye constants/Config.ts mein jao
// ─────────────────────────────────────────────────────────────────────────────
import { API_BASE_URL as CONFIGURED_URL } from '../constants/Config';

export const API_BASE_URL = CONFIGURED_URL;

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
    authToken = token;
}

export function getAuthToken(): string | null {
    return authToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: timeout + retry
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 15000;   // 15 seconds max per attempt
const MAX_RETRIES = 2;           // up to 2 retries (3 total attempts)
const RETRY_DELAYS = [1000, 2500]; // wait 1s then 2.5s between retries

function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper — with timeout + automatic retry
// ─────────────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
    method?: HttpMethod;
    body?: Record<string, unknown> | FormData;
    isFormData?: boolean;
    timeout?: number;   // override default timeout (ms)
    retries?: number;   // override retry count (0 = no retry)
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status: number;
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
        method = 'GET',
        body,
        isFormData = false,
        timeout = DEFAULT_TIMEOUT,
        retries = MAX_RETRIES,
    } = options;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'bypass-tunnel-reminder': 'true',
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOpts: RequestInit = {
        method,
        headers,
        body: body
            ? (isFormData ? body as any : JSON.stringify(body))
            : undefined,
    };

    let lastError: any = null;
    const maxAttempts = 1 + retries;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetchWithTimeout(
                `${API_BASE_URL}${endpoint}`,
                fetchOpts,
                timeout,
            );

            const data = await response.json();

            if (!response.ok) {
                const error: ApiError = {
                    message: data.message || 'Something went wrong. Please try again.',
                    errors: data.errors,
                    status: response.status,
                };
                // Don't retry 4xx errors (client errors) — only retry 5xx / network
                if (response.status >= 400 && response.status < 500) {
                    throw error;
                }
                lastError = error;
            } else {
                return data as T;
            }
        } catch (err: any) {
            // If it's a client error (4xx), throw immediately — no retry
            if (err?.status && err.status >= 400 && err.status < 500) {
                throw err;
            }

            // Timeout or network error — will retry
            if (err?.name === 'AbortError') {
                lastError = {
                    message: 'Server is taking too long. Please check your connection and try again.',
                    status: 0,
                };
            } else if (err?.message?.includes('Network request failed') || err?.message?.includes('Failed to fetch')) {
                lastError = {
                    message: 'Cannot reach server. Please check if the server is running.',
                    status: 0,
                };
            } else {
                lastError = err;
            }
        }

        // Wait before retrying (if not last attempt)
        if (attempt < maxAttempts - 1) {
            await sleep(RETRY_DELAYS[attempt] || 2000);
        }
    }

    throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: number;
        name: string;
        phone: string;
        email: string | null;
        initials: string;
        kyc_status: 'pending' | 'verified' | 'rejected';
        has_mpin: boolean;
        wallet: {
            balance: number;
            account_number: string;
            currency: string;
            status: string;
        } | null;
    };
}

export const AuthAPI = {
    sendOtp: (
        phone: string,
        purpose: 'register' | 'reset_pin' = 'register',
        channel: 'email' | 'sms' = 'email',
        email?: string,
    ) =>
        apiCall<{ success: boolean; message: string; channel: string; destination: string; otp?: string }>('/auth/otp/send', {
            method: 'POST',
            body: { phone, purpose, channel, ...(channel === 'email' && email ? { email } : {}) },
        }),

    verifyOtp: (
        phone: string,
        code: string,
        purpose: 'register' | 'reset_pin' = 'register',
        channel: 'email' | 'sms' = 'sms',
        email?: string,
    ) =>
        apiCall<{ success: boolean; message: string }>('/auth/otp/verify', {
            method: 'POST',
            body: {
                phone, code, purpose, channel,
                ...(channel === 'email' && email ? { email } : {}),
            },
        }),

    register: (name: string, phone: string, pin: string) =>
        apiCall<LoginResponse>('/auth/register', {
            method: 'POST', body: { name, phone, pin },
        }),

    login: (phone: string, pin: string) =>
        apiCall<LoginResponse>('/auth/login', { method: 'POST', body: { phone, pin } }),

    resetPin: (phone: string, code: string, newPin: string) =>
        apiCall<{ success: boolean; message: string }>('/auth/reset-pin', {
            method: 'POST', body: { phone, code, new_pin: newPin },
        }),

    logout: () =>
        apiCall<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),

    me: () =>
        apiCall<LoginResponse>('/auth/me'),

    updateProfile: (data: { name?: string; email?: string }) =>
        apiCall<LoginResponse>('/auth/profile', { method: 'PATCH', body: data as Record<string, unknown> }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Wallet Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletData {
    balance: number;
    account_number: string;
    currency: string;
    status: string;
}

export interface Transaction {
    id: number;
    reference: string;
    type: string;
    status: string;
    amount: number;
    fee: number;
    currency: string;
    description: string;
    recipient_phone: string | null;
    recipient_name: string | null;
    created_at: string;
}

export interface TransactionSlip {
    reference: string;
    type: string;          // 'send' | 'topup' | 'receive'
    amount: number;
    currency: string;
    status: string;
    description: string;
    sender_name: string;
    sender_phone: string;
    sender_account: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_account: string | null;
    fee: number;
    timestamp: string;
}

export const WalletAPI = {
    getBalance: () =>
        apiCall<{ success: boolean; wallet: WalletData }>('/wallet'),

    topup: (amount: number) =>
        apiCall<{ success: boolean; message: string; balance: number; slip: TransactionSlip }>('/wallet/topup', {
            method: 'POST', body: { amount },
        }),

    getTransactions: (page = 1) =>
        apiCall<{ success: boolean; data: { data: Transaction[]; current_page: number; last_page: number } }>(`/transactions?page=${page}`),

    send: (recipientPhone: string, amount: number, description?: string) =>
        apiCall<{ success: boolean; message: string; balance: number; slip: TransactionSlip }>('/transactions/send', {
            method: 'POST',
            body: { recipient_phone: recipientPhone, amount, ...(description ? { description } : {}) },
        }),
};

// ─────────────────────────────────────────────────────────────────────────────
// M-PIN Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const MPinAPI = {
    status: () =>
        apiCall<{ success: boolean; is_set: boolean; is_locked: boolean }>('/mpin/status'),

    set: (pin: string) =>
        apiCall<{ success: boolean; message: string }>('/mpin/set', { method: 'POST', body: { pin } }),

    verify: (pin: string) =>
        apiCall<{ success: boolean; message: string }>('/mpin/verify', { method: 'POST', body: { pin } }),

    requestResetOtp: () =>
        apiCall<{ success: boolean; message: string; otp?: string }>('/mpin/otp', { method: 'POST', body: { purpose: 'reset_mpin' } }),

    reset: (otp: string, newPin: string) =>
        apiCall<{ success: boolean; message: string }>('/mpin/reset', { method: 'POST', body: { otp, new_pin: newPin } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Cards Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface CardData {
    id: number;
    label: string;
    card_number_masked: string;
    expiry: string;
    network: string;
    balance: number;
    spending_limit: number;
    color1: string;
    color2: string;
    is_frozen: boolean;
    online_payments: boolean;
    international: boolean;
    atm_withdrawals: boolean;
    nfc_tap_pay: boolean;
    status: string;
}

export const CardsAPI = {
    list: () =>
        apiCall<{ success: boolean; cards: CardData[] }>('/cards'),

    toggle: (cardId: number, field: string) =>
        apiCall<{ success: boolean; message: string; card: CardData }>(`/cards/${cardId}/toggle`, {
            method: 'POST', body: { field },
        }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Rates Endpoint (public — no token needed)
// ─────────────────────────────────────────────────────────────────────────────

export interface ZakatRates {
    gold_rate_per_tola: number;
    silver_rate_per_tola: number;
    gold_nisab_tolas: number;
    silver_nisab_tolas: number;
    usd_to_pkr: number;
    source: 'live' | 'static';
    updated_at: string;
}

export const RatesAPI = {
    getZakatRates: () =>
        apiCall<{ success: boolean; rates: ZakatRates }>('/rates/zakat'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Chatbot Endpoint
// ─────────────────────────────────────────────────────────────────────────────

export const ChatbotAPI = {
    send: (message: string) =>
        apiCall<{ success: boolean; reply: string }>('/chatbot', {
            method: 'POST', body: { message }, timeout: 30000, retries: 1,
        }),
};

// ─────────────────────────────────────────────────────────────────────────────
// KYC Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface KycStatus {
    success: boolean;
    kyc_status: 'pending' | 'under_review' | 'verified' | 'rejected';
    document: {
        id: number;
        cnic: string;
        status: string;
        rejection_reason: string | null;
        has_front: boolean;
        has_back: boolean;
        has_selfie: boolean;
        submitted_at: string;
    } | null;
}

export const KycAPI = {
    getStatus: () =>
        apiCall<KycStatus>('/kyc'),

    submit: (cnic: string, frontUri: string, backUri: string, selfieUri: string) => {
        const form = new FormData();
        form.append('cnic', cnic);
        form.append('cnic_front', { uri: frontUri, type: 'image/jpeg', name: 'front.jpg' } as any);
        form.append('cnic_back',  { uri: backUri,  type: 'image/jpeg', name: 'back.jpg'  } as any);
        form.append('selfie',     { uri: selfieUri, type: 'image/jpeg', name: 'selfie.jpg' } as any);
        return apiCall<{ success: boolean; message: string; status: string }>('/kyc/submit', {
            method: 'POST', body: form as any, isFormData: true, timeout: 30000,
        });
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Statement Endpoint
// ─────────────────────────────────────────────────────────────────────────────

export interface StatementTxn {
    reference: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    date: string;
}

export interface StatementData {
    success: boolean;
    user: { name: string; phone: string; account: string };
    period: { from: string; to: string };
    summary: { total_in: number; total_out: number; count: number };
    opening_balance: number;
    closing_balance: number;
    transactions: StatementTxn[];
}

export const StatementAPI = {
    get: (from: string, to: string) =>
        apiCall<StatementData>(`/statement?from=${from}&to=${to}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Device / Push Notification
// ─────────────────────────────────────────────────────────────────────────────

export const DeviceAPI = {
    registerFcmToken: (fcmToken: string) =>
        apiCall<{ success: boolean; message: string }>('/device/register', {
            method: 'POST', body: { fcm_token: fcmToken },
        }),
};
