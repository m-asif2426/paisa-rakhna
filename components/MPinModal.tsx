import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TouchableWithoutFeedback, Animated, ActivityIndicator,
} from 'react-native';
import { useColors, AppColors } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MPinModalProps {
    visible: boolean;
    onClose: () => void;
    /** Called when correct M-PIN is entered. Backend verify karo yahan. */
    onSuccess: (mpin: string) => void | Promise<void>;
    /** Title to show — e.g. "Confirm Send" or "Set M-PIN" */
    title?: string;
    subtitle?: string;
    /** If true, shows confirm step (for set flow) */
    isSetup?: boolean;
    /** If true, shows loading spinner on dots */
    isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keypad rows
// ─────────────────────────────────────────────────────────────────────────────
const KEYS: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MPinModal({
    visible,
    onClose,
    onSuccess,
    title = 'Enter M-PIN',
    subtitle = 'Enter your 4-digit transaction PIN',
    isSetup = false,
    isLoading = false,
}: MPinModalProps) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [pin, setPin] = useState('');
    const [firstPin, setFirstPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const shake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();
    }, [shakeAnim]);

    const resetState = useCallback(() => {
        setPin('');
        setFirstPin('');
        setStep('enter');
        setError('');
        setLoading(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    const handleKey = useCallback(async (key: string) => {
        if (loading || isLoading) return;

        if (key === '⌫') {
            setPin(p => p.slice(0, -1));
            setError('');
            return;
        }
        if (key === '') return;

        const newPin = pin + key;
        setPin(newPin);
        setError('');

        if (newPin.length < 4) return;

        // PIN entry complete
        setTimeout(async () => {
            if (isSetup) {
                if (step === 'enter') {
                    // First entry — confirm step pe jao
                    setFirstPin(newPin);
                    setPin('');
                    setStep('confirm');
                } else {
                    // Confirm step — match check
                    if (newPin === firstPin) {
                        setLoading(true);
                        try {
                            await onSuccess(newPin);
                            resetState();
                        } catch {
                            setLoading(false);
                            setPin('');
                            setError('Could not set M-PIN. Please try again.');
                            shake();
                        }
                    } else {
                        setPin('');
                        setError('PINs do not match. Please try again.');
                        shake();
                    }
                }
            } else {
                // Verify mode
                setLoading(true);
                try {
                    await onSuccess(newPin);
                    resetState();
                } catch (err: unknown) {
                    setLoading(false);
                    setPin('');
                    const msg = (err as { message?: string })?.message ?? 'Incorrect M-PIN. Please try again.';
                    setError(msg);
                    shake();
                }
            }
        }, 120);
    }, [pin, loading, isLoading, isSetup, step, firstPin, onSuccess, resetState, shake]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={s.overlay} />
            </TouchableWithoutFeedback>

            <View style={s.sheet}>
                {/* Handle */}
                <View style={s.handleArea}>
                    <View style={s.handle} />
                </View>

                {/* Header */}
                <View style={s.header}>
                    <View style={s.iconWrap}>
                        <Ionicons name="lock-closed" size={26} color="#fff" />
                    </View>
                    <Text style={s.title}>
                        {isSetup
                            ? (step === 'enter' ? 'Set M-PIN' : 'Confirm M-PIN')
                            : title}
                    </Text>
                    <Text style={s.subtitle}>
                        {isSetup
                            ? (step === 'enter'
                                ? 'Choose a new 4-digit M-PIN'
                                : 'Enter the same M-PIN again to confirm')
                            : subtitle}
                    </Text>

                    {/* Step indicator (setup only) */}
                    {isSetup && (
                        <View style={s.stepsRow}>
                            <View style={[s.stepDot, step === 'enter' && s.stepDotActive]} />
                            <View style={[s.stepDot, step === 'confirm' && s.stepDotActive]} />
                        </View>
                    )}
                </View>

                {/* PIN Dots */}
                <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
                    {[0, 1, 2, 3].map(i => (
                        <View
                            key={i}
                            style={[
                                s.dot,
                                {
                                    backgroundColor: i < pin.length
                                        ? (error ? Colors.red : Colors.g1)
                                        : Colors.ink4,
                                    transform: [{ scale: i < pin.length ? 1.15 : 1 }],
                                },
                            ]}
                        />
                    ))}
                </Animated.View>

                {/* Error or loading */}
                {(loading || isLoading) ? (
                    <ActivityIndicator color={Colors.g1} style={{ marginTop: 12 }} />
                ) : error ? (
                    <Text style={s.error}>{error}</Text>
                ) : (
                    <View style={{ height: 28 }} />
                )}

                {/* Keypad */}
                <View style={s.keypad}>
                    {KEYS.map((row, ri) => (
                        <View key={ri} style={s.keyRow}>
                            {row.map((key, ki) => (
                                <TouchableOpacity
                                    key={ki}
                                    style={[s.key, key === '' && s.keyEmpty]}
                                    onPress={() => handleKey(key)}
                                    disabled={key === '' || loading || isLoading}
                                    activeOpacity={0.65}
                                >
                                    <Text style={[s.keyText, key === '⌫' && s.backText]}>
                                        {key}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Forgot link (verify mode only) */}
                {!isSetup && (
                    <TouchableOpacity style={s.forgotBtn} onPress={handleClose}>
                        <Text style={s.forgotText}>Forgot M-PIN? Reset it</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 20 }} />
            </View>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    overlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(8,15,10,0.6)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 24,
    },
    handleArea: { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
    handle: { width: 40, height: 4, backgroundColor: Colors.ink4, borderRadius: 2 },
    header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 8 },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.gl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: { fontWeight: '900', fontSize: 20, color: Colors.ink, textAlign: 'center' },
    subtitle: { fontSize: 13, color: Colors.ink3, textAlign: 'center', marginTop: 4, lineHeight: 19 },
    stepsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.ink4,
    },
    stepDotActive: { backgroundColor: Colors.g1, width: 20 },
    dotsRow: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 4,
    },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    error: {
        color: Colors.red,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    keypad: {
        paddingHorizontal: 30,
        paddingTop: 12,
        gap: 10,
    },
    keyRow: {
        flexDirection: 'row',
        gap: 14,
        justifyContent: 'center',
    },
    key: {
        width: 80,
        height: 54,
        borderRadius: 16,
        backgroundColor: Colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.ink4,
    },
    keyEmpty: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    keyText: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.ink,
    },
    backText: {
        fontSize: 18,
        color: Colors.ink3,
    },
    forgotBtn: {
        alignSelf: 'center',
        marginTop: 16,
        padding: 8,
    },
    forgotText: {
        color: Colors.g1,
        fontSize: 13,
        fontWeight: '600',
    },
});
