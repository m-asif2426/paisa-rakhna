import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'en' | 'ur';

// ─── All app strings ──────────────────────────────────────────────────────────
const strings = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    welcomeBack:    { en: 'Welcome Back! 👋',              ur: 'Wapis Aaiye! 👋' },
    welcomeSub:     { en: 'Access your account securely',  ur: 'Apna account secure tareeqe se access karein' },
    phoneNumber:    { en: 'Mobile Number',                 ur: 'Mobile Number' },
    pinLogin:       { en: 'PIN Login',                     ur: 'PIN Login' },
    pinLoginSub:    { en: 'Login with 4-digit security PIN', ur: '4-digit security PIN se login karein' },
    biometric:      { en: 'Biometric Login',               ur: 'Biometric Login' },
    biometricSub:   { en: 'Use fingerprint or Face ID',    ur: 'Fingerprint ya Face ID use karein' },
    forgotPin:      { en: 'Forgot PIN? Reset it',          ur: 'PIN bhool gaye? Reset karein' },
    register:       { en: 'New account?  Register',        ur: 'Naya account? Register karein' },
    enterPin:       { en: 'Enter Your PIN',                ur: 'Apna PIN Darj Karein' },
    enterPinSub:    { en: 'Enter your 4-digit security PIN', ur: 'Apna 4-digit security PIN darj karein' },
    wrongPin:       { en: 'Wrong PIN. (Demo: 1234)',        ur: 'Galat PIN. (Demo: 1234)' },

    // ── Register ──────────────────────────────────────────────────────────────
    registerTitle:  { en: 'Create Account',                ur: 'Account Banayein' },
    otpSent:        { en: 'OTP Sent',                      ur: 'OTP Bheja Gaya' },
    verifyOtp:      { en: 'Verify OTP',                    ur: 'OTP Verify Karein' },
    resendOtp:      { en: 'OTP not received? Resend',      ur: 'OTP nahi aya? Resend karein' },
    changeNumber:   { en: '← Change number',               ur: '← Number badlein' },

    // ── Home ──────────────────────────────────────────────────────────────────
    availableBalance: { en: 'Available Balance',           ur: 'Maujood Bakiya' },
    refresh:          { en: 'Refresh',                     ur: 'Refresh' },
    transactions:     { en: 'Transactions',                ur: 'Transactions' },
    seeAll:           { en: 'See All →',                   ur: 'Sab Dekhein →' },
    noTransactions:   { en: 'No transactions yet',         ur: 'Abhi koi transaction nahi hui' },
    send:             { en: 'Send',                        ur: 'Bhejein' },
    addMoney:         { en: 'Add Money',                   ur: 'Paisa Daalein' },
    receive:          { en: 'Receive',                     ur: 'Lein' },
    exchange:         { en: 'Exchange',                    ur: 'Exchange' },

    // ── More ─────────────────────────────────────────────────────────────────
    language:         { en: 'Language',                    ur: 'Zaban' },
    languageSub:      { en: 'English / Roman Urdu',        ur: 'English / Roman Urdu' },
    logout:           { en: 'Logout',                      ur: 'Logout' },
    settings:         { en: 'Settings',                    ur: 'Settings' },

    // ── Misc ──────────────────────────────────────────────────────────────────
    cancel:           { en: 'Cancel',                      ur: 'Hatao' },
    confirm:          { en: 'Confirm',                     ur: 'Tasdeeq Karein' },
    sendNow:          { en: 'Send Now',                    ur: 'Abhi Bhejein' },
    loading:          { en: 'Please wait...',              ur: 'Intezaar karein...' },
    goodDay:          { en: 'Good day 👋',                 ur: 'Salam 👋' },
} as const;

export type StringKey = keyof typeof strings;

// ─── Context ──────────────────────────────────────────────────────────────────
type LangContextType = {
    lang: Lang;
    setLang: (l: Lang) => void;
    T: (key: StringKey) => string;
    toggle: () => void;
};

const LangContext = createContext<LangContextType>({
    lang: 'en',
    setLang: () => {},
    T: (key) => strings[key].en,
    toggle: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>('en');

    // Load persisted language on mount
    useEffect(() => {
        AsyncStorage.getItem('@paisa_lang').then(v => {
            if (v === 'ur' || v === 'en') setLangState(v);
        });
    }, []);

    const setLang = useCallback((l: Lang) => {
        setLangState(l);
        AsyncStorage.setItem('@paisa_lang', l);
    }, []);

    const T = useCallback((key: StringKey): string => strings[key][lang], [lang]);
    const toggle = useCallback(() => setLang(lang === 'en' ? 'ur' : 'en'), [lang, setLang]);

    return (
        <LangContext.Provider value={{ lang, setLang, T, toggle }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}

export { strings };
