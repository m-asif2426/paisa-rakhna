// ─── Zakat Calculator Data ────────────────────────────────────────────────────
export const NISAB_DATA = {
    goldRatePerTola: 220000,    // PKR per tola (approx current)
    silverRatePerTola: 2500,    // PKR per tola (approx current)
    goldNisabTolas: 7.5,        // 87.48g
    silverNisabTolas: 52.5,     // 612.36g
};

// ─── Dummy Cards (Cards Screen) ───────────────────────────────────────────────
export const DUMMY_CARDS = [
    {
        id: '1',
        type: 'Visa',
        label: 'Silver Card',
        number: '**** **** **** 9027',
        expiry: '12/27',
        holder: 'My Account',
        color1: '#1a1a2e',
        color2: '#16213e',
    },
];

// ─── Dummy Transactions (Store Screen preview) ────────────────────────────────
export const DUMMY_TRANSACTIONS = [
    {
        id: '1',
        title: 'Daraz Shopping',
        date: 'Today, 2:30 PM',
        amount: -3499,
        type: 'debit',
        icon: 'shopping',
        color: '#e5373a',
        bgColor: '#fdeaea',
        refNo: 'TXN2026040521',
        card: 'Silver •9027',
        status: 'Success',
    },
    {
        id: '2',
        title: 'Salary Credit',
        date: 'Mar 1, 9:00 AM',
        amount: 120000,
        type: 'credit',
        icon: 'salary',
        color: '#22c55e',
        bgColor: '#f0fdf4',
        refNo: 'TXN2026030101',
        card: 'Silver •9027',
        status: 'Success',
    },
];

// ─── Chatbot Local Fallback Responses ─────────────────────────────────────────
export const CHATBOT_RESPONSES: Record<string, string> = {
    hello:    'Hello! Welcome to Paisa Rakhna. How can I help you today?',
    balance:  'You can check your balance on the Home screen. Pull down to refresh.',
    send:     'To send money: tap "Send" on Home → enter phone number & amount → confirm with M-PIN.',
    receive:  'Share your account number or phone number with the sender. Money will appear instantly.',
    zakat:    'Use the Zakat Calculator in the More section to calculate your annual Zakat.',
    card:     'Manage your cards in the Cards section — freeze, unfreeze, and control online/ATM usage.',
    bill:     'Bill payments and mobile top-ups are coming soon!',
    loan:     'Loan feature is not available yet. Stay tuned for future updates.',
    otp:      'OTP is sent to your registered phone number. It expires in 5 minutes.',
    security: 'Your account is secured with OTP, M-PIN, and login lockout after failed attempts.',
    help:     'You can ask me about: balance, sending money, Zakat, cards, security, or OTP.',
    default:  'I am not sure about that. Please contact support or ask me something else.',
};
