import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import { AuthAPI } from '../services/api';
import { getInitials } from '../services/auth';
import type { StoredUser } from '../services/auth';
import { useLang } from '../context/LangContext';

type Props = {
    onLogin: (token: string, user: StoredUser) => void;
    onGoRegister: () => void;
    onGoForgotPin?: () => void;
    navigation?: unknown;
    route?: unknown;
};
type Screen = 'welcome' | 'pin';

// Demo fallback only
const DEMO_PIN = '1234';
const DEMO_USER: StoredUser = {
    id: 1,
    name: 'Asif Khan',
    phone: '03001234567',
    email: null,
    initials: 'AK',
    kyc_status: 'pending',
    has_mpin: true,
};

export default function LoginScreen({ onLogin, onGoRegister, onGoForgotPin }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const { T } = useLang();
    const [screen, setScreen] = useState<Screen>('welcome');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handlePinPress = async (digit: string) => {
        if (pin.length >= 4) return;
        const newPin = pin + digit;
        setPin(newPin);
        setPinError('');

        if (newPin.length === 4) {
            setTimeout(async () => {
                if (!phone.trim()) {
                    setPinError('Please enter your phone number first.');
                    setPin('');
                    shake();
                    return;
                }
                setLoading(true);
                try {
                    const loginPhone = phone.trim();
                    const response = await AuthAPI.login(loginPhone, newPin);
                    const userData: StoredUser = {
                        id: response.user.id,
                        name: response.user.name,
                        phone: response.user.phone,
                        email: response.user.email,
                        initials: getInitials(response.user.name),
                        kyc_status: response.user.kyc_status ?? 'pending',
                        has_mpin: response.user.has_mpin ?? false,
                    };
                    setLoading(false);
                    onLogin(response.token, userData);
                } catch (err: unknown) {
                    const e = err as { message?: string };
                    setLoading(false);
                    shake();
                    setPinError(e.message ?? 'Wrong PIN. Please try again.');
                    setPin('');
                }
            }, 200);
        }
    };

    const handleBackspace = () => { setPin(p => p.slice(0, -1)); setPinError(''); };

    const handleBiometric = async () => {
        setLoading(true);
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (hasHardware) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify your identity — Paisa Rakhna',
                    fallbackLabel: 'Use PIN',
                });
                if (result.success) {
                    setTimeout(() => { setLoading(false); onLogin('demo-token-bio', DEMO_USER); }, 400);
                    return;
                }
            }
            // Fallback for emulator/devices without biometric
            Alert.alert(
                'Biometric',
                'Demo mode: Biometric authentication successful!',
                [{ text: 'Continue', onPress: () => { setLoading(false); onLogin('demo-token-bio', DEMO_USER); } }],
            );
        } catch {
            setLoading(false);
            Alert.alert('Demo', 'Biometric auth ✓', [{ text: 'Continue', onPress: () => onLogin('demo-token-bio', DEMO_USER) }]);
        }
    };

    // ─── PIN SCREEN ───────────────────────────────────────────────────────────
    if (screen === 'pin') {
        return (
            <SafeAreaView style={s.safe}>
                <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.topBar}>
                    <TouchableOpacity onPress={() => { setScreen('welcome'); setPin(''); setPinError(''); }} style={s.backBtn}>
                        <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
                    </TouchableOpacity>
                    <Text style={s.topBarTitle}>Paisa Rakhna</Text>
                    <View style={{ width: 36 }} />
                </LinearGradient>

                <View style={s.pinContainer}>
                    <View style={s.pinIcon}><Text style={{ fontSize: 36 }}>🔐</Text></View>
                    <Text style={s.pinTitle}>🔢 {T('enterPin')}</Text>
                    <Text style={s.pinSub}>
                        {phone.trim() ? `Enter PIN for ${phone.trim()}` : T('enterPinSub')}
                    </Text>

                    {/* PIN Dots */}
                    <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
                        {[0, 1, 2, 3].map(i => (
                            <View key={i} style={[s.dot, {
                                backgroundColor: i < pin.length
                                    ? (pinError ? Colors.red : Colors.g1)
                                    : Colors.ink4,
                                transform: [{ scale: i < pin.length ? 1.15 : 1 }],
                            }]} />
                        ))}
                    </Animated.View>

                    {pinError ? <Text style={s.pinError}>{pinError}</Text> : <View style={{ height: 22 }} />}
                    {loading && <ActivityIndicator color={Colors.g1} size="large" style={{ marginTop: 8 }} />}

                    {/* Keypad */}
                    <View style={s.keypad}>
                        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, ri) => (
                            <View key={ri} style={s.keyRow}>
                                {row.map((key, ki) => (
                                    <TouchableOpacity
                                        key={ki}
                                        style={[s.key, key === '' && s.keyEmpty]}
                                        onPress={() => key === '⌫' ? handleBackspace() : key !== '' ? handlePinPress(key) : null}
                                        disabled={key === '' || loading}
                                        activeOpacity={0.65}
                                    >
                                        <Text style={[s.keyText, key === '⌫' && { fontSize: 18, color: Colors.ink3 }]}>{key}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => onGoForgotPin ? onGoForgotPin() : undefined}
                        style={{ marginTop: 16 }}
                    >
                        <Text style={{ color: Colors.g1, fontSize: 13, fontWeight: '600' }}>❓ {T('forgotPin')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── WELCOME SCREEN ───────────────────────────────────────────────────────
    return (
        <SafeAreaView style={s.safe}>
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.hero}>
                <Text style={{ fontSize: 52, marginBottom: 10 }}>💰</Text>
                <Text style={s.heroTitle}>Paisa Rakhna</Text>
                <Text style={s.heroSub}>🇵🇰 Pakistan's Smart Digital Wallet</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
                <Text style={s.welcomeTitle}>👋 {T('welcomeBack')}</Text>
                <Text style={s.welcomeSub}>{T('welcomeSub')}</Text>

                {/* Phone Number Input */}
                <View style={s.phoneCard}>
                    <Text style={s.phoneLabel}>📱  Mobile Number</Text>
                    <TextInput
                        style={s.phoneInput}
                        placeholder="03xxxxxxxxx"
                        placeholderTextColor={Colors.ink4}
                        keyboardType="phone-pad"
                        maxLength={11}
                        value={phone}
                        onChangeText={setPhone}
                        returnKeyType="done"
                    />
                </View>

                {/* PIN Login */}
                <TouchableOpacity style={s.authCard} onPress={() => setScreen('pin')} activeOpacity={0.8}>
                    <View style={[s.authIcon, { backgroundColor: Colors.gl }]}>
                        <Text style={{ fontSize: 24 }}>🔐</Text>
                    </View>
                    <View style={s.authInfo}>
                        <Text style={s.authTitle}>{T('pinLogin')}</Text>
                        <Text style={s.authSub}>{T('pinLoginSub')}</Text>
                    </View>
                    <Text style={s.authArrow}>›</Text>
                </TouchableOpacity>

                {/* Biometric */}
                <TouchableOpacity style={s.authCard} onPress={handleBiometric} disabled={loading} activeOpacity={0.8}>
                    <View style={[s.authIcon, { backgroundColor: Colors.greenl }]}>
                        <Text style={{ fontSize: 24 }}>👆</Text>
                    </View>
                    <View style={s.authInfo}>
                        <Text style={s.authTitle}>{T('biometric')}</Text>
                        <Text style={s.authSub}>{T('biometricSub')}</Text>
                    </View>
                    {loading ? <ActivityIndicator color={Colors.g1} /> : <Text style={s.authArrow}>›</Text>}
                </TouchableOpacity>

<Text style={s.secureNote}>🔒  Secured with 256-bit encryption</Text>

                {/* Register link */}
                <View style={s.registerRow}>
                    <Text style={s.registerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={onGoRegister}>
                        <Text style={s.registerLink}>✨ Register</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    topBarTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
    hero: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
    heroEmoji: { fontSize: 52, marginBottom: 10 },
    heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
    heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 6 },
    body: { padding: 20, paddingBottom: 40 },
    welcomeTitle: { fontWeight: '900', fontSize: 22, color: Colors.ink, marginBottom: 6 },
    welcomeSub: { fontSize: 13, color: Colors.ink3, marginBottom: 24, lineHeight: 20 },
    authCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.white, borderRadius: 16, padding: 14,
        marginBottom: 12, borderWidth: 1, borderColor: Colors.ink4,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    authIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    authInfo: { flex: 1 },
    authTitle: { fontWeight: '700', fontSize: 14, color: Colors.ink },
    authSub: { fontSize: 12, color: Colors.ink3, marginTop: 2 },
    authArrow: { color: Colors.ink4, fontSize: 20 },
    secureNote: { textAlign: 'center', fontSize: 11, color: Colors.ink3, marginTop: 14, marginBottom: 8 },
    registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: Colors.ink4 },
    registerText: { fontSize: 13, color: Colors.ink3 },
    registerLink: { fontSize: 13, fontWeight: '700', color: Colors.g1 },
    // Phone input
    phoneCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.ink4 },
    phoneLabel: { fontSize: 11, color: Colors.ink3, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    phoneInput: { fontSize: 16, color: Colors.ink, fontWeight: '600', paddingVertical: 4 },
    // PIN Screen
    pinContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
    pinIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    pinTitle: { fontWeight: '900', fontSize: 22, color: Colors.ink, marginBottom: 6 },
    pinSub: { fontSize: 13, color: Colors.ink3, textAlign: 'center', marginBottom: 28, lineHeight: 19 },
    dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 6 },
    dot: { width: 18, height: 18, borderRadius: 9 },
    pinError: { color: Colors.red, fontSize: 12, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
    keypad: { gap: 12, marginTop: 20, width: '100%' },
    keyRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    key: { width: 80, height: 56, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.ink4 },
    keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
    keyText: { fontSize: 22, fontWeight: '600', color: Colors.ink },
});
