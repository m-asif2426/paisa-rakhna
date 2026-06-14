import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, ActivityIndicator, TextInput, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import { AuthAPI } from '../services/api';

type Step = 'phone' | 'otp' | 'newPin' | 'done';

type Props = {
    onBack: () => void;
    onResetSuccess: () => void;
};

export default function ForgotPinScreen({ onBack, onResetSuccess }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone]       = useState('');
    const [otp, setOtp]           = useState('');
    const [newPin, setNewPin]     = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
    const [otpEmail, setOtpEmail]   = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();

    const startTimer = () => {
        setResendTimer(30);
        const interval = setInterval(() => {
            setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
        }, 1000);
    };

    // ── STEP 1: Send OTP ───────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) { setError('Please enter a valid phone number'); shake(); return; }
        if (otpChannel === 'email') {
            if (!otpEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail.trim())) {
                setError('Please enter a valid email address'); shake(); return;
            }
        }
        setLoading(true); setError('');
        try {
            const res = await AuthAPI.sendOtp(cleaned, 'reset_pin', otpChannel, otpChannel === 'email' ? otpEmail.trim() : undefined);
            setPhone(cleaned);
            // Dev mode: backend returns OTP in response (APP_ENV=local)
            if (res.otp) setOtp(res.otp);
            setStep('otp');
            startTimer();
        } catch (e: unknown) {
            const err = e as { message?: string };
            setError(err.message ?? 'Could not send OTP. Please try again.');
            shake();
        }
        setLoading(false);
    };

    // ── STEP 2: Verify OTP ─────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setError('Please enter the 6-digit OTP'); shake(); return; }
        setLoading(true); setError('');
        try {
            await AuthAPI.verifyOtp(phone, otp, 'reset_pin', otpChannel, otpChannel === 'email' ? otpEmail.trim() : undefined);
            setStep('newPin');
        } catch (e: unknown) {
            const err = e as { message?: string };
            setError(err.message ?? 'Invalid or expired OTP. Please try again.');
            shake();
        }
        setLoading(false);
    };

    // ── STEP 3: Set New PIN ────────────────────────────────────────────────────
    const handlePinKey = (digit: string, target: 'new' | 'confirm') => {
        if (target === 'new') {
            if (newPin.length >= 4) return;
            setNewPin(p => p + digit);
        } else {
            if (confirmPin.length >= 4) return;
            const updated = confirmPin + digit;
            setConfirmPin(updated);
            if (updated.length === 4) {
                setTimeout(() => handleResetPin(updated), 200);
            }
        }
        setError('');
    };

    const handlePinBack = (target: 'new' | 'confirm') => {
        if (target === 'new') setNewPin(p => p.slice(0, -1));
        else setConfirmPin(p => p.slice(0, -1));
        setError('');
    };

    const handleResetPin = async (confirm: string) => {
        if (newPin.length < 4) return;
        if (newPin !== confirm) {
            setError('PINs do not match. Please try again.');
            shake(); setConfirmPin(''); return;
        }
        setLoading(true); setError('');
        try {
            await AuthAPI.resetPin(phone, otp, newPin);
            setStep('done');
        } catch (e: unknown) {
            const err = e as { message?: string };
            setError(err.message ?? 'Could not reset PIN. Please try again.');
            shake(); setLoading(false);
        }
    };

    const pinTarget: 'new' | 'confirm' = newPin.length < 4 ? 'new' : 'confirm';
    const currentPin = pinTarget === 'new' ? newPin : confirmPin;

    // ── STEP INDICATOR ─────────────────────────────────────────────────────────
    const steps = [
        { key: 'phone', label: 'Phone' },
        { key: 'otp',   label: 'OTP' },
        { key: 'newPin', label: 'New PIN' },
    ];
    const stepIdx = steps.findIndex(s => s.key === step);

    return (
        <SafeAreaView style={s.safe}>
            {/* Header */}
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.header}>
                <TouchableOpacity onPress={onBack} style={s.backBtn}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>Reset PIN</Text>
                <View style={{ width: 36 }} />
            </LinearGradient>

            {/* Step dots */}
            {step !== 'done' && (
                <View style={s.stepRow}>
                    {steps.map((st, i) => (
                        <React.Fragment key={st.key}>
                            <View style={[s.stepDot, i <= stepIdx && s.stepDotActive]}>
                                <Text style={[s.stepDotTxt, i <= stepIdx && s.stepDotTxtActive]}>
                                    {i < stepIdx ? '✓' : i + 1}
                                </Text>
                            </View>
                            {i < steps.length - 1 && (
                                <View style={[s.stepLine, i < stepIdx && s.stepLineActive]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>
            )}

            <View style={s.body}>

                {/* ── DONE ── */}
                {step === 'done' && (
                    <View style={s.center}>
                        <Ionicons name="checkmark-circle" size={64} color={Colors.green} style={{ marginBottom: 16 }} />
                        <Text style={s.doneTitle}>PIN Reset Successful!</Text>
                        <Text style={s.doneSub}>You can now log in with your new PIN</Text>
                        <TouchableOpacity style={s.bigBtn} onPress={onResetSuccess}>
                            <Text style={s.bigBtnTxt}>Login →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── PHONE ── */}
                {step === 'phone' && (
                    <View>
                        <Text style={s.title}>Registered Number</Text>
                        <Text style={s.sub}>
                            Enter your registered phone number and choose how to receive your OTP.
                        </Text>
                        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                            <View style={s.inputCard}>
                                <Text style={s.inputLabel}><Ionicons name="call" size={14} color={Colors.ink2} />  Mobile Number</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="03xxxxxxxxx"
                                    placeholderTextColor={Colors.ink4}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    value={phone}
                                    onChangeText={t => { setPhone(t); setError(''); }}
                                    autoFocus
                                />
                            </View>

                            {/* Channel selector */}
                            <Text style={s.channelLabel}>Send OTP via</Text>
                            <View style={s.channelRow}>
                                <TouchableOpacity
                                    style={[s.channelBtn, otpChannel === 'email' && s.channelBtnActive]}
                                    onPress={() => { setOtpChannel('email'); setError(''); }}
                                >
                                    <Text style={[s.channelBtnText, otpChannel === 'email' && s.channelBtnTextActive]}>
                                        <Ionicons name="mail" size={13} /> Email
                                    </Text>
                                    {otpChannel === 'email' && (
                                        <Text style={s.channelBadge}>Recommended</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.channelBtn, otpChannel === 'sms' && s.channelBtnActive]}
                                    onPress={() => { setOtpChannel('sms'); setError(''); }}
                                >
                                    <Text style={[s.channelBtnText, otpChannel === 'sms' && s.channelBtnTextActive]}>
                                        <Ionicons name="chatbubble" size={13} /> SMS
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {otpChannel === 'email' && (
                                <View style={s.inputCard}>
                                    <Text style={s.inputLabel}><Ionicons name="mail" size={14} color={Colors.ink2} />  Email Address</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="youremail@example.com"
                                        placeholderTextColor={Colors.ink4}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={otpEmail}
                                        onChangeText={t => { setOtpEmail(t); setError(''); }}
                                    />
                                </View>
                            )}

                            {error ? <Text style={s.error}>{error}</Text> : null}
                        </Animated.View>
                        <TouchableOpacity style={s.bigBtn} onPress={handleSendOtp} disabled={loading}>
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.bigBtnTxt}>Send OTP →</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── OTP ── */}
                {step === 'otp' && (
                    <View>
                        <Text style={s.title}>Enter OTP</Text>
                        <Text style={s.sub}>
                            {otpChannel === 'email'
                                ? <>6-digit code sent to{'\n'}<Text style={{ fontWeight: '700', color: Colors.ink }}>{otpEmail}</Text></>
                                : <>6-digit code sent to{'\n'}<Text style={{ fontWeight: '700', color: Colors.ink }}>{phone}</Text>{'  '}(Local/demo: 123456)</>
                            }
                        </Text>
                        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                            <View style={s.inputCard}>
                                <Text style={s.inputLabel}><Ionicons name="keypad" size={14} color={Colors.ink2} />  OTP Code</Text>
                                <TextInput
                                    style={[s.input, { letterSpacing: 8, fontSize: 22, fontWeight: '700' }]}
                                    placeholder="123456"
                                    placeholderTextColor={Colors.ink4}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={otp}
                                    onChangeText={t => { setOtp(t); setError(''); }}
                                    autoFocus
                                />
                            </View>
                            {error ? <Text style={s.error}>{error}</Text> : null}
                        </Animated.View>
                        <TouchableOpacity style={s.bigBtn} onPress={handleVerifyOtp} disabled={loading}>
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.bigBtnTxt}>Verify →</Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.resendBtn}
                            onPress={() => { if (resendTimer === 0) { handleSendOtp(); } }}
                            disabled={resendTimer > 0}
                        >
                            <Text style={[s.resendTxt, resendTimer > 0 && { color: Colors.ink4 }]}>
                                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Did not receive OTP? Resend'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── NEW PIN ── */}
                {step === 'newPin' && (
                    <View style={s.center}>
                        <View style={s.pinIcon}><Ionicons name="lock-closed" size={36} color={Colors.g1} /></View>
                        <Text style={s.title}>
                            {newPin.length < 4 ? 'Set New PIN' : 'Confirm PIN'}
                        </Text>
                        <Text style={s.sub}>
                            {newPin.length < 4
                                ? 'Choose a memorable 4-digit PIN'
                                : 'Enter the same PIN again to confirm'}
                        </Text>
                        <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
                            {[0, 1, 2, 3].map(i => (
                                <View key={i} style={[s.dot, {
                                    backgroundColor: i < currentPin.length
                                        ? (error ? Colors.red : Colors.g1)
                                        : Colors.ink4,
                                }]} />
                            ))}
                        </Animated.View>
                        {error ? <Text style={s.error}>{error}</Text> : <View style={{ height: 20 }} />}
                        {loading && <ActivityIndicator color={Colors.g1} style={{ marginBottom: 8 }} />}
                        <View style={s.keypad}>
                            {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
                                <View key={ri} style={s.keyRow}>
                                    {row.map((key, ki) => (
                                        <TouchableOpacity
                                            key={ki}
                                            style={[s.key, key === '' && s.keyEmpty]}
                                            onPress={() => key === '⌫' ? handlePinBack(pinTarget) : key !== '' ? handlePinKey(key, pinTarget) : null}
                                            disabled={key === '' || loading}
                                            activeOpacity={0.65}
                                        >
                                            <Text style={[s.keyText, key === '⌫' && { fontSize: 18, color: Colors.ink3 }]}>{key}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 40 },
    stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.ink4, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { backgroundColor: Colors.g1 },
    stepDotTxt: { fontSize: 12, fontWeight: '700', color: Colors.ink3 },
    stepDotTxtActive: { color: '#fff' },
    stepLine: { flex: 1, height: 2, backgroundColor: Colors.ink4, marginHorizontal: 4 },
    stepLineActive: { backgroundColor: Colors.g1 },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    title: { fontWeight: '900', fontSize: 22, color: Colors.ink, marginBottom: 8, textAlign: 'center' },
    sub: { fontSize: 13, color: Colors.ink3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    inputCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.ink4, marginBottom: 6 },
    inputLabel: { fontSize: 11, color: Colors.ink3, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { fontSize: 16, color: Colors.ink, fontWeight: '600', paddingVertical: 4 },
    error: { color: Colors.red, fontSize: 12, textAlign: 'center', fontWeight: '600', marginTop: 4, marginBottom: 8 },
    bigBtn: { backgroundColor: Colors.g1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    bigBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
    resendBtn: { alignItems: 'center', marginTop: 14 },
    resendTxt: { fontSize: 13, color: Colors.g1, fontWeight: '600' },
    channelLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink2, marginTop: 12, marginBottom: 8 },
    channelRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    channelBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink4, backgroundColor: Colors.white, alignItems: 'center' },
    channelBtnActive: { borderColor: Colors.g1, backgroundColor: Colors.gl },
    channelBtnText: { fontSize: 13, fontWeight: '600', color: Colors.ink3 },
    channelBtnTextActive: { color: Colors.g1 },
    channelBadge: { fontSize: 9, color: Colors.g1, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    center: { alignItems: 'center' },
    doneTitle: { fontWeight: '900', fontSize: 24, color: Colors.ink, marginBottom: 8 },
    doneSub: { fontSize: 14, color: Colors.ink3, marginBottom: 32 },
    pinIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 6, marginTop: 16 },
    dot: { width: 18, height: 18, borderRadius: 9 },
    keypad: { gap: 12, marginTop: 12, width: '100%' },
    keyRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    key: { width: 80, height: 56, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.ink4 },
    keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
    keyText: { fontSize: 22, fontWeight: '600', color: Colors.ink },
});
