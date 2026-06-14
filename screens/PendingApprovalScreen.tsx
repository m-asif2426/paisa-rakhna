import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthAPI } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // check every 30 seconds

export default function PendingApprovalScreen() {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const { user, logout, updateKycStatus } = useAuth();

    // Pulse animation on the clock icon
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    // Poll /auth/me every 30s — when kyc_status flips to 'verified', unlock the app
    useEffect(() => {
        const checkApproval = async () => {
            try {
                const res = await AuthAPI.me();
                const status = res.user.kyc_status;
                if (status === 'verified') {
                    Alert.alert(
                        'Account Approved!',
                        'Your identity has been verified. Welcome to Paisa Rakhna!',
                        [{ text: 'Open App', onPress: () => updateKycStatus('verified') }],
                    );
                } else if (status === 'rejected') {
                    Alert.alert(
                        'Verification Unsuccessful',
                        'Your documents could not be verified. Please contact support or try re-submitting.',
                        [{ text: 'OK' }],
                    );
                }
            } catch { /* offline / demo — ignore */ }
        };

        // Check immediately on mount, then on interval
        checkApproval();
        const intervalId = setInterval(checkApproval, POLL_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [updateKycStatus]);

    const steps = [
        { icon: 'search' as const,        label: 'Account Created',    done: true },
        { icon: 'document-text' as const,  label: 'Documents Submitted', done: true },
        { icon: 'hourglass' as const,      label: 'Under Review',       done: false, active: true },
        { icon: 'checkmark-circle' as const, label: 'Account Activated', done: false },
    ];

    return (
        <SafeAreaView style={s.safe}>
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.topBar}>
                <Text style={s.topBarTitle}>Application Status</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
                {/* Animated icon */}
                <Animated.View style={[s.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="time" size={52} color={Colors.g1} />
                </Animated.View>

                <Text style={s.heading}>Documents Under Review</Text>
                <Text style={s.subText}>
                    Our team is verifying your identity documents.{'\n'}
                    This usually takes <Text style={s.bold}>1–2 business days</Text>.
                </Text>

                {/* Progress tracker */}
                <View style={s.stepsCard}>
                    {steps.map((st, idx) => (
                        <View key={idx} style={s.stepRow}>
                            <View style={[
                                s.stepCircle,
                                st.done && s.stepDone,
                                st.active && s.stepActive,
                            ]}>
                                <Text style={{ fontSize: st.active ? 15 : 14 }}>
                                    {st.done ? '✓' : st.active ? '⟳' : '○'}
                                </Text>
                            </View>

                            {idx < steps.length - 1 && (
                                <View style={[s.stepLine, st.done && s.stepLineDone]} />
                            )}

                            <Text style={[
                                s.stepLabel,
                                st.done && s.stepLabelDone,
                                st.active && s.stepLabelActive,
                            ]}>
                                {st.label}
                                {st.active && <Text style={s.stepActiveHint}> (in progress)</Text>}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Info card */}
                <View style={s.infoCard}>
                    <Text style={s.infoTitle}>What happens next?</Text>
                    {([
                        { icon: 'search' as const,       text: 'Our team reviews your CNIC photos and selfie' },
                        { icon: 'phone-portrait' as const, text: 'You\'ll receive a push notification when approved' },
                        { icon: 'rocket' as const,       text: 'Full app access unlocks automatically after approval' },
                    ] as const).map((item, i) => (
                        <View key={i} style={s.infoRow}>
                            <Ionicons name={item.icon} size={16} color={Colors.g1} style={s.infoIcon} />
                            <Text style={s.infoText}>{item.text}</Text>
                        </View>
                    ))}
                </View>

                {/* User info */}
                {user && (
                    <View style={s.userChip}>
                        <Text style={s.userChipText}>
                            Registered as <Text style={s.bold}>{user.name}</Text> ({user.phone})
                        </Text>
                    </View>
                )}

                <Text style={s.pollNote}>
                    App checks for approval every 30 seconds automatically.
                </Text>

                {/* Logout */}
                <TouchableOpacity style={s.logoutBtn} onPress={logout}>
                    <Text style={s.logoutText}>← Log out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    topBarTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
    body: { paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center' },

    iconWrap: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: Colors.gl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    heading: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.ink,
        textAlign: 'center',
        marginBottom: 10,
    },
    subText: {
        fontSize: 14,
        color: Colors.ink3,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    bold: { fontWeight: '700', color: Colors.ink },

    // Steps tracker
    stepsCard: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        gap: 0,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        position: 'relative',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.ink4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepDone: { backgroundColor: Colors.g1 },
    stepActive: { backgroundColor: Colors.amber ?? '#f59e0b' },
    stepLine: {
        position: 'absolute',
        left: 15,
        top: 42,
        width: 2,
        height: 20,
        backgroundColor: Colors.ink4,
    },
    stepLineDone: { backgroundColor: Colors.g1 },
    stepLabel: { fontSize: 14, color: Colors.ink3, fontWeight: '500' },
    stepLabelDone: { color: Colors.g1, fontWeight: '700' },
    stepLabelActive: { color: Colors.ink, fontWeight: '700' },
    stepActiveHint: { fontSize: 11, color: Colors.ink3, fontWeight: '400' },

    // Info card
    infoCard: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.ink,
        marginBottom: 14,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
    infoIcon: { fontSize: 18, marginTop: 1 },
    infoText: { flex: 1, fontSize: 13, color: Colors.ink2, lineHeight: 19 },

    // User chip
    userChip: {
        backgroundColor: Colors.gl,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 14,
    },
    userChipText: { fontSize: 12, color: Colors.g1, textAlign: 'center' },

    pollNote: {
        fontSize: 11,
        color: Colors.ink3,
        textAlign: 'center',
        marginBottom: 24,
    },
    logoutBtn: { paddingVertical: 10 },
    logoutText: { fontSize: 13, color: Colors.ink3, fontWeight: '600' },
});
