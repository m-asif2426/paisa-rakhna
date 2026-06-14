import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Animated, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { useColors, AppColors } from '../context/ThemeContext';
import { AuthAPI, KycAPI, setAuthToken } from '../services/api';
import { getInitials, isValidPhone, isValidPin } from '../services/auth';
import type { StoredUser } from '../services/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp' | 'name' | 'pin' | 'kyc' | 'biometric';

interface Props {
    onRegistered: (token: string, user: StoredUser) => void;
    onGoLogin: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const KEYPAD_ROWS: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterScreen({ onRegistered, onGoLogin }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
    const [otpEmail, setOtpEmail] = useState('');

    // Registration result (stored until KYC + biometric done)
    const [registeredToken, setRegisteredToken] = useState<string | null>(null);
    const [registeredUser, setRegisteredUser] = useState<StoredUser | null>(null);

    // KYC state
    const [cnicNumber, setCnicNumber] = useState('');
    const [cnicFront, setCnicFront] = useState<string | null>(null);
    const [cnicBack, setCnicBack] = useState<string | null>(null);
    const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
    const [kycCamTarget, setKycCamTarget] = useState<'front' | 'back' | 'selfie' | null>(null);
    const [kycCamRef, setKycCamRef] = useState<any>(null);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    // ─── Step 1: Phone ───────────────────────────────────────────────────────

    const handleSendOtp = async () => {
        const cleaned = phone.replace(/\D/g, '');
        if (!isValidPhone(cleaned)) {
            setError('Enter a valid Pakistani number (e.g. 03001234567)');
            return;
        }
        if (otpChannel === 'email') {
            if (!otpEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail.trim())) {
                setError('Please enter a valid email address');
                return;
            }
        }
        setError('');
        setLoading(true);
        try {
            const res = await AuthAPI.sendOtp(cleaned, 'register', otpChannel, otpChannel === 'email' ? otpEmail.trim() : undefined);
            setPhone(cleaned);
            // Dev mode: backend returns OTP in response (APP_ENV=local)
            if (res.otp) setOtp(res.otp);
            setStep('otp');
            // Start 30s resend cooldown
            setResendTimer(30);
            const interval = setInterval(() => {
                setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
            }, 1000);
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message ?? 'Could not send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoOtp = () => {
        // Demo mode — skip actual API
        setPhone(phone.replace(/\D/g, '') || '03001234567');
        setStep('otp');
        setError('');
    };

    // ─── Step 2: OTP ─────────────────────────────────────────────────────────

    const handleOtpChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 6);
        setOtp(cleaned);
        setError('');
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await AuthAPI.verifyOtp(phone, otp, 'register', otpChannel, otpChannel === 'email' ? otpEmail.trim() : undefined);
            setStep('name');
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message ?? 'Invalid OTP. Please check and try again.');
            shake();
        } finally {
            setLoading(false);
        }
    };

    // Demo: any 6-digit OTP passes
    const handleDemoVerifyOtp = () => {
        if (otp.length !== 6) { setError('Please enter the 6-digit OTP'); return; }
        setStep('name');
        setError('');
    };

    // ─── Step 3: Name ─────────────────────────────────────────────────────────

    const handleNameNext = () => {
        if (name.trim().length < 3) {
            setError('Please enter your full name (minimum 3 characters)');
            return;
        }
        setError('');
        setStep('pin');
    };

    // ─── Step 4: PIN (enter + confirm) ───────────────────────────────────────

    const handlePinKey = async (key: string) => {
        if (key === '⌫') {
            if (pinStep === 'enter') setPin(p => p.slice(0, -1));
            else setConfirmPin(p => p.slice(0, -1));
            setError('');
            return;
        }
        if (key === '') return;

        if (pinStep === 'enter') {
            const newPin = pin + key;
            setPin(newPin);
            if (newPin.length === 4) {
                setTimeout(() => {
                    setPinStep('confirm');
                    setError('');
                }, 150);
            }
        } else {
            const newConfirm = confirmPin + key;
            setConfirmPin(newConfirm);
            if (newConfirm.length === 4) {
                setTimeout(async () => {
                    if (newConfirm !== pin) {
                        setConfirmPin('');
                        setError('PINs do not match. Please try again.');
                        shake();
                        return;
                    }
                    setLoading(true);
                    try {
                        const response = await AuthAPI.register(name.trim(), phone, newConfirm);
                        const userData: StoredUser = {
                            id: response.user.id,
                            name: response.user.name || name,
                            phone: response.user.phone || phone,
                            email: response.user.email,
                            initials: getInitials(response.user.name || name),
                            kyc_status: response.user.kyc_status ?? 'pending',
                            has_mpin: response.user.has_mpin ?? true,
                        };
                        setRegisteredToken(response.token);
                        setAuthToken(response.token);
                        setRegisteredUser(userData);
                        setStep('kyc');
                    } catch (err: unknown) {
                        const e = err as { message?: string };
                        setError(e.message ?? 'Registration failed. Please try again.');
                        shake();
                        setPin('');
                        setConfirmPin('');
                        setPinStep('enter');
                    } finally {
                        setLoading(false);
                    }
                }, 150);
            }
        }
    };

    const currentPin = pinStep === 'enter' ? pin : confirmPin;

    // ─── Step 5: KYC ─────────────────────────────────────────────────────────

    const handleKycCapture = async (type: 'front' | 'back' | 'selfie') => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Needed', 'Camera access is required to take photos.');
            return;
        }
        setKycCamTarget(type);
    };

    const handleKycTakePhoto = async () => {
        if (!kycCamRef || !kycCamTarget) return;
        try {
            const photo = await kycCamRef.takePictureAsync({ quality: 0.7, base64: false });
            if (kycCamTarget === 'front') setCnicFront(photo.uri);
            else if (kycCamTarget === 'back') setCnicBack(photo.uri);
            else setSelfiePhoto(photo.uri);
            setKycCamTarget(null);
        } catch {
            Alert.alert('Error', 'Could not capture photo. Please try again.');
        }
    };

    const cnicValid = /^\d{5}-\d{7}-\d{1}$/.test(cnicNumber);

    const handleKycSubmit = async () => {
        if (!cnicValid || !cnicFront || !cnicBack || !selfiePhoto) return;
        setError('');
        setLoading(true);
        try {
            await KycAPI.submit(cnicNumber, cnicFront, cnicBack, selfiePhoto);
            setStep('biometric');
        } catch (e: any) {
            setError(e?.message || 'KYC submission failed. Please try again.');
        }
        setLoading(false);
    };

    // ─── Step 6: Biometric ───────────────────────────────────────────────────

    const handleBiometricEnroll = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (hasHardware) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Enable biometric login — Paisa Rakhna',
                    fallbackLabel: 'Skip',
                });
                if (result.success) {
                    Alert.alert('✓ Biometric Enabled', 'Touch ID / Face ID is now set up for quick login.');
                }
            } else {
                Alert.alert('Not Supported', 'Biometric authentication is not available on this device.');
            }
        } catch { /* no-op */ }
        onRegistered(registeredToken!, registeredUser!);
    };

    const handleSkipBiometric = () => {
        onRegistered(registeredToken!, registeredUser!);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Step progress info
    // ─────────────────────────────────────────────────────────────────────────

    const steps = ['phone', 'otp', 'name', 'pin', 'kyc', 'biometric'];
    const stepIndex = steps.indexOf(step);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={s.safe}>
            {/* Top bar */}
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.topBar}>
                <TouchableOpacity onPress={onGoLogin} style={s.backBtn}>
                    <Text style={{ color: '#fff', fontSize: 17 }}>←</Text>
                </TouchableOpacity>
                <Text style={s.topBarTitle}>Create Account</Text>
                <View style={{ width: 36 }} />
            </LinearGradient>

            {/* Progress bar */}
            <View style={s.progressOuter}>
                <View style={[s.progressFill, { width: `${((stepIndex + 1) / steps.length) * 100}%` as `${number}%` }]} />
            </View>
            <Text style={s.progressLabel}>Step {stepIndex + 1} of {steps.length}</Text>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* ── STEP 1: Phone ── */}
                    {step === 'phone' && (
                        <>
                            <View style={s.stepIcon}><Ionicons name="phone-portrait" size={36} color={Colors.g1} /></View>
                            <Text style={s.stepTitle}>Enter Your Phone Number</Text>
                            <Text style={s.stepSub}>Choose how you want to receive your OTP</Text>

                            <Text style={s.fieldLabel}>Mobile Number</Text>
                            <View style={s.phoneInput}>
                                <Text style={s.phonePrefix}>+92</Text>
                                <TextInput
                                    style={s.phoneField}
                                    value={phone}
                                    onChangeText={v => { setPhone(v); setError(''); }}
                                    placeholder="3XX XXXXXXX"
                                    placeholderTextColor={Colors.ink3}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    autoFocus
                                />
                            </View>

                            {/* Channel selector */}
                            <Text style={[s.fieldLabel, { marginTop: 18 }]}>Send OTP via</Text>
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

                            {/* Email input — shown only when email channel selected */}
                            {otpChannel === 'email' && (
                                <>
                                    <Text style={[s.fieldLabel, { marginTop: 14 }]}>Email Address</Text>
                                    <TextInput
                                        style={s.textInput}
                                        value={otpEmail}
                                        onChangeText={v => { setOtpEmail(v); setError(''); }}
                                        placeholder="youremail@example.com"
                                        placeholderTextColor={Colors.ink3}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </>
                            )}

                            {error ? <Text style={s.errText}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[s.btn, (!phone || loading) && s.btnDisabled]}
                                onPress={handleSendOtp}
                                disabled={!phone || loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Send OTP →</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity style={s.demoBtn} onPress={handleDemoOtp}>
                                <Text style={s.demoText}>Demo Mode — Continue without backend</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── STEP 2: OTP ── */}
                    {step === 'otp' && (
                        <>
                            <View style={s.stepIcon}><Ionicons name="key" size={36} color={Colors.g1} /></View>
                            <Text style={s.stepTitle}>Enter OTP</Text>
                            <Text style={s.stepSub}>
                                {otpChannel === 'email'
                                    ? <>6-digit code sent to{'\n'}<Text style={{ color: Colors.g1, fontWeight: '700' }}>{otpEmail}</Text></>
                                    : <>6-digit code sent to{'\n'}<Text style={{ color: Colors.g1, fontWeight: '700' }}>+92 {phone.slice(0, 3)}-{phone.slice(3)}</Text></>
                                }
                            </Text>

                            <Animated.View style={[s.otpWrap, { transform: [{ translateX: shakeAnim }] }]}>
                                <TextInput
                                    style={s.otpInput}
                                    value={otp}
                                    onChangeText={handleOtpChange}
                                    placeholder="• • • • • •"
                                    placeholderTextColor={Colors.ink4}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                    textAlign="center"
                                />
                            </Animated.View>

                            {error ? <Text style={s.errText}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[s.btn, (otp.length < 6 || loading) && s.btnDisabled]}
                                onPress={handleVerifyOtp}
                                disabled={otp.length < 6 || loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Verify OTP →</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity style={s.demoBtn} onPress={handleDemoVerifyOtp}>
                                <Text style={s.demoText}>Demo Mode — Any 6-digit OTP will work</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.resendBtn} onPress={() => setStep('phone')}>
                                <Text style={s.resendText}>← Change number</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[s.resendBtn, { marginTop: 4 }]}
                                onPress={async () => {
                                    if (resendTimer > 0) return;
                                    setLoading(true);
                                    try {
                                        await AuthAPI.sendOtp(phone, 'register', otpChannel, otpChannel === 'email' ? otpEmail.trim() : undefined);
                                        setResendTimer(30);
                                        const iv = setInterval(() => {
                                            setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
                                        }, 1000);
                                    } catch { /* ignore */ }
                                    setLoading(false);
                                }}
                                disabled={resendTimer > 0}
                            >
                                <Text style={[s.resendText, { color: resendTimer > 0 ? Colors.ink4 : Colors.g1, fontWeight: '600' }]}>
                                    {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Did not receive OTP? Resend'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── STEP 3: Name ── */}
                    {step === 'name' && (
                        <>
                            <View style={s.stepIcon}><Ionicons name="person" size={36} color={Colors.g1} /></View>
                            <Text style={s.stepTitle}>Enter Your Name</Text>
                            <Text style={s.stepSub}>This name will appear on your account</Text>

                            <Text style={s.fieldLabel}>Full Name</Text>
                            <TextInput
                                style={s.textInput}
                                value={name}
                                onChangeText={v => { setName(v); setError(''); }}
                                placeholder="e.g. Muhammad Ali"
                                placeholderTextColor={Colors.ink3}
                                autoFocus
                                autoCapitalize="words"
                            />

                            {error ? <Text style={s.errText}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[s.btn, (!name.trim() || loading) && s.btnDisabled]}
                                onPress={handleNameNext}
                                disabled={!name.trim() || loading}
                            >
                                <Text style={s.btnText}>Continue →</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── STEP 4: PIN ── */}
                    {step === 'pin' && (
                        <>
                            <View style={s.stepIcon}>
                                <Ionicons name={pinStep === 'enter' ? 'lock-closed' : 'checkmark-circle'} size={36} color={Colors.g1} />
                            </View>
                            <Text style={s.stepTitle}>
                                {pinStep === 'enter' ? 'Set Your Login PIN' : 'Confirm PIN'}
                            </Text>
                            <Text style={s.stepSub}>
                                {pinStep === 'enter'
                                    ? 'Choose a memorable 4-digit PIN'
                                    : 'Enter the same PIN again to confirm'}
                            </Text>

                            {/* Step indicators */}
                            <View style={s.pinSteps}>
                                <View style={[s.pinStepDot, { backgroundColor: Colors.g1 }]} />
                                <View style={[s.pinStepDot, { backgroundColor: pinStep === 'confirm' ? Colors.g1 : Colors.ink4 }]} />
                            </View>

                            {/* Dots */}
                            <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
                                {[0, 1, 2, 3].map(i => (
                                    <View
                                        key={i}
                                        style={[s.dot, {
                                            backgroundColor: i < currentPin.length
                                                ? (error ? Colors.red : Colors.g1)
                                                : Colors.ink4,
                                        }]}
                                    />
                                ))}
                            </Animated.View>

                            {error ? <Text style={s.errText}>{error}</Text> : null}
                            {loading && <ActivityIndicator color={Colors.g1} style={{ marginTop: 10 }} />}

                            {/* Keypad */}
                            <View style={s.keypad}>
                                {KEYPAD_ROWS.map((row, ri) => (
                                    <View key={ri} style={s.keyRow}>
                                        {row.map((key, ki) => (
                                            <TouchableOpacity
                                                key={ki}
                                                style={[s.key, key === '' && s.keyEmpty]}
                                                onPress={() => handlePinKey(key)}
                                                disabled={key === '' || loading}
                                                activeOpacity={0.65}
                                            >
                                                <Text style={s.keyText}>{key}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* ── STEP 5: KYC Camera ── */}
                    {step === 'kyc' && kycCamTarget && (
                        <View style={{ flex: 1, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden', minHeight: 420 }}>
                            <CameraView
                                style={{ flex: 1 }}
                                ref={(ref: any) => setKycCamRef(ref)}
                                facing={kycCamTarget === 'selfie' ? 'front' : 'back'}
                            >
                                <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => setKycCamTarget(null)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                                            {kycCamTarget === 'front' ? 'CNIC Front' : kycCamTarget === 'back' ? 'CNIC Back' : 'Selfie'}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center', paddingBottom: 20 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 16 }}>
                                            {kycCamTarget === 'selfie' ? 'Position your face and ensure good lighting' : 'Place CNIC flat — all 4 corners visible'}
                                        </Text>
                                        <TouchableOpacity onPress={handleKycTakePhoto} style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                                            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </CameraView>
                        </View>
                    )}

                    {/* ── STEP 5: KYC Documents ── */}
                    {step === 'kyc' && !kycCamTarget && (
                        <>
                            <View style={s.stepIcon}><Ionicons name="id-card" size={36} color={Colors.g1} /></View>
                            <Text style={s.stepTitle}>Verify Your Identity</Text>
                            <Text style={s.stepSub}>We need photos of your CNIC and a selfie to verify your identity. Your documents are encrypted and secure.</Text>

                            {/* CNIC Number Input */}
                            <View style={{ marginBottom: 16, marginTop: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.ink, marginBottom: 6 }}>CNIC Number</Text>
                                <TextInput
                                    style={{
                                        backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 16,
                                        paddingVertical: 14, fontSize: 18, fontWeight: '600',
                                        color: Colors.ink, letterSpacing: 2, borderWidth: 1,
                                        borderColor: cnicNumber.length > 0
                                            ? (cnicValid ? '#16a34a' : Colors.ink4)
                                            : Colors.ink4,
                                        textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                    }}
                                    placeholder="XXXXX-XXXXXXX-X"
                                    placeholderTextColor={Colors.ink3}
                                    value={cnicNumber}
                                    onChangeText={v => {
                                        const raw = v.replace(/\D/g, '').slice(0, 13);
                                        let formatted = raw;
                                        if (raw.length > 5 && raw.length <= 12) {
                                            formatted = raw.slice(0, 5) + '-' + raw.slice(5);
                                        } else if (raw.length === 13) {
                                            formatted = raw.slice(0, 5) + '-' + raw.slice(5, 12) + '-' + raw.slice(12);
                                        }
                                        setCnicNumber(formatted);
                                    }}
                                    keyboardType="numeric"
                                    maxLength={15}
                                />
                                {cnicNumber.length > 0 && !cnicValid && (
                                    <Text style={{ fontSize: 11, color: Colors.red, marginTop: 4 }}>Format: XXXXX-XXXXXXX-X (13 digits)</Text>
                                )}
                            </View>

                            <View style={s.kycGrid}>
                                <TouchableOpacity
                                    style={[s.kycBox, cnicFront && s.kycBoxDone]}
                                    onPress={() => handleKycCapture('front')}
                                    activeOpacity={0.75}
                                >
                                    {cnicFront ? <Image source={{ uri: cnicFront }} style={{ width: 56, height: 36, borderRadius: 6 }} /> : <Ionicons name="camera" size={32} color={Colors.ink2} />}
                                    <Text style={[s.kycBoxLabel, cnicFront && { color: '#16a34a' }]}>
                                        {cnicFront ? 'Front Captured' : 'CNIC Front'}
                                    </Text>
                                    <Text style={s.kycBoxHint}>{cnicFront ? 'Tap to retake' : 'Tap to capture'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.kycBox, cnicBack && s.kycBoxDone]}
                                    onPress={() => handleKycCapture('back')}
                                    activeOpacity={0.75}
                                >
                                    {cnicBack ? <Image source={{ uri: cnicBack }} style={{ width: 56, height: 36, borderRadius: 6 }} /> : <Ionicons name="camera" size={32} color={Colors.ink2} />}
                                    <Text style={[s.kycBoxLabel, cnicBack && { color: '#16a34a' }]}>
                                        {cnicBack ? 'Back Captured' : 'CNIC Back'}
                                    </Text>
                                    <Text style={s.kycBoxHint}>{cnicBack ? 'Tap to retake' : 'Tap to capture'}</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[s.kycSelfieBox, selfiePhoto && s.kycBoxDone]}
                                onPress={() => handleKycCapture('selfie')}
                                activeOpacity={0.75}
                            >
                                {selfiePhoto ? <Image source={{ uri: selfiePhoto }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : <Ionicons name="person-circle" size={32} color={Colors.ink2} />}
                                <Text style={[s.kycBoxLabel, selfiePhoto && { color: '#16a34a' }]}>
                                    {selfiePhoto ? 'Selfie Captured' : 'Take a Selfie'}
                                </Text>
                                <Text style={s.kycBoxHint}>{selfiePhoto ? 'Tap to retake' : 'Tap to open camera'}</Text>
                            </TouchableOpacity>

                            <View style={s.kycNote}>
                                <Text style={s.kycNoteText}><Ionicons name="lock-closed" size={12} color={Colors.ink2} /> Your data is encrypted and only used for identity verification. We never share your documents.</Text>
                            </View>

                            {error ? <Text style={s.errText}>{error}</Text> : null}

                            <TouchableOpacity
                                style={[s.btn, (!cnicValid || !cnicFront || !cnicBack || !selfiePhoto || loading) && s.btnDisabled]}
                                onPress={handleKycSubmit}
                                disabled={!cnicValid || !cnicFront || !cnicBack || !selfiePhoto || loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Submit Documents →</Text>}
                            </TouchableOpacity>


                        </>
                    )}

                    {/* ── STEP 6: Biometric ── */}
                    {step === 'biometric' && (
                        <>
                            <View style={s.stepIcon}><Ionicons name="finger-print" size={36} color={Colors.g1} /></View>
                            <Text style={s.stepTitle}>Enable Biometric Login</Text>
                            <Text style={s.stepSub}>Log in faster with your fingerprint or Face ID — no PIN required next time.</Text>

                            <View style={s.bioCard}>
                                <Ionicons name="finger-print" size={48} color={Colors.g1} style={{ marginBottom: 12 }} />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 6 }}>Touch ID / Face ID</Text>
                                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 18 }}>
                                    Use your device biometrics to log in instantly and securely.
                                </Text>
                            </View>

                            <TouchableOpacity style={s.btn} onPress={handleBiometricEnroll}>
                                <Text style={s.btnText}>Enable Biometric →</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#ccc', marginTop: 12 }]} onPress={handleSkipBiometric}>
                                <Text style={[s.btnText, { color: '#888' }]}>Maybe Later</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Already have account */}
                    {step === 'phone' && (
                        <View style={s.loginRow}>
                            <Text style={s.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={onGoLogin}>
                                <Text style={s.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
    progressOuter: {
        height: 4,
        backgroundColor: Colors.ink4,
        marginHorizontal: 0,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.g1,
        borderRadius: 2,
    },
    progressLabel: {
        fontSize: 10,
        color: Colors.ink3,
        fontWeight: '600',
        textAlign: 'right',
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 2,
    },
    body: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
    stepIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.gl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stepTitle: {
        fontWeight: '900',
        fontSize: 22,
        color: Colors.ink,
        textAlign: 'center',
        marginBottom: 6,
    },
    stepSub: {
        fontSize: 13,
        color: Colors.ink3,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    fieldLabel: {
        alignSelf: 'flex-start',
        fontSize: 12,
        fontWeight: '700',
        color: Colors.ink2,
        marginBottom: 8,
    },
    phoneInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.ink4,
        width: '100%',
        overflow: 'hidden',
    },
    phonePrefix: {
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.ink,
        borderRightWidth: 1.5,
        borderRightColor: Colors.ink4,
        backgroundColor: Colors.bg,
    },
    phoneField: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.ink,
    },
    textInput: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.ink4,
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.ink,
        marginBottom: 4,
    },
    otpWrap: { width: '100%', marginBottom: 4 },
    otpInput: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Colors.g1,
        width: '100%',
        paddingVertical: 16,
        fontSize: 28,
        color: Colors.ink,
        fontWeight: '700',
        letterSpacing: 12,
    },
    errText: {
        color: Colors.red,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    btn: {
        backgroundColor: Colors.g1,
        borderRadius: 14,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginTop: 16,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    demoBtn: {
        marginTop: 14,
        paddingVertical: 8,
    },
    demoText: {
        fontSize: 11,
        color: Colors.ink3,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    resendBtn: { marginTop: 10 },
    resendText: { color: Colors.ink3, fontSize: 12 },
    // PIN styles
    pinSteps: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    pinStepDot: { width: 20, height: 6, borderRadius: 3 },
    dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 10, justifyContent: 'center' },
    dot: { width: 18, height: 18, borderRadius: 9 },
    keypad: { gap: 10, marginTop: 14, width: '100%' },
    keyRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    key: {
        width: 80,
        height: 54,
        borderRadius: 14,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.ink4,
    },
    keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
    keyText: { fontSize: 22, fontWeight: '600', color: Colors.ink },
    // Channel selector
    channelRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 4 },
    channelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.ink4,
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    channelBtnActive: {
        borderColor: Colors.g1,
        backgroundColor: Colors.gl,
    },
    channelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.ink3 },
    channelBtnTextActive: { color: Colors.g1 },
    channelBadge: { fontSize: 9, color: Colors.g1, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    // Login link
    loginRow: { flexDirection: 'row', marginTop: 28, alignItems: 'center' },
    loginText: { fontSize: 13, color: Colors.ink3 },
    loginLink: { fontSize: 13, fontWeight: '700', color: Colors.g1 },
    // KYC styles
    kycGrid: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
    kycBox: {
        flex: 1,
        paddingVertical: 22,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.ink4,
        borderStyle: 'dashed',
        backgroundColor: Colors.white,
        alignItems: 'center',
        gap: 6,
    },
    kycBoxDone: {
        borderColor: '#16a34a',
        borderStyle: 'solid',
        backgroundColor: '#f0fdf4',
    },
    kycSelfieBox: {
        width: '100%',
        paddingVertical: 22,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.ink4,
        borderStyle: 'dashed',
        backgroundColor: Colors.white,
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    kycBoxIcon: { fontSize: 28 },
    kycBoxLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink2 },
    kycBoxHint: { fontSize: 10, color: Colors.ink3 },
    kycNote: {
        width: '100%',
        backgroundColor: Colors.gl,
        borderRadius: 10,
        padding: 12,
        marginBottom: 4,
    },
    kycNoteText: { fontSize: 11, color: Colors.g1, lineHeight: 16 },
    // Biometric card
    bioCard: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.ink4,
        marginBottom: 20,
        marginTop: 8,
    },
});
