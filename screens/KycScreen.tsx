import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { useColors, AppColors } from '../context/ThemeContext';
import { BtnPrimary, BtnOutline } from '../components/UIKit';
import { KycAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    onBack: () => void;
    /** Called after KYC docs successfully submitted */
    onSubmitted?: () => void;
}

type PhotoKey = 'front' | 'back' | 'selfie';

interface PhotoState {
    front:  string | null;
    back:   string | null;
    selfie: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function KycScreen({ onBack, onSubmitted }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const { updateKycStatus } = useAuth();

    const [photos, setPhotos] = useState<PhotoState>({ front: null, back: null, selfie: null });
    const [cnic, setCnic] = useState('');
    const [cameraTarget, setCameraTarget] = useState<PhotoKey | null>(null);
    const [cameraRef, setCameraRef] = useState<any>(null);
    const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'info' | 'camera' | 'review'>('info');

    // ── Open camera for a target slot ────────────────────────────────────────
    const openCamera = async (target: PhotoKey) => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Needed', 'Camera access is required to take photos.');
            return;
        }
        setHasCamPermission(true);
        setCameraTarget(target);
        setStep('camera');
    };

    // ── Capture photo ─────────────────────────────────────────────────────────
    const takePhoto = async () => {
        if (!cameraRef) return;
        try {
            const photo = await cameraRef.takePictureAsync({ quality: 0.7, base64: false });
            setPhotos(prev => ({ ...prev, [cameraTarget!]: photo.uri }));
            setStep('info');
            setCameraTarget(null);
        } catch {
            Alert.alert('Error', 'Could not capture photo. Please try again.');
        }
    };

    // ── Submit docs ───────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const cleanCnic = cnic.replace(/\D/g, '');
        if (cleanCnic.length < 13) {
            Alert.alert('Required', 'Please enter a valid 13-digit CNIC number.');
            return;
        }
        if (!photos.front || !photos.back || !photos.selfie) {
            Alert.alert('Required', 'Please take all 3 photos:\n• CNIC Front\n• CNIC Back\n• Selfie');
            return;
        }
        setSubmitting(true);
        try {
            await KycAPI.submit(cleanCnic, photos.front, photos.back, photos.selfie);
            updateKycStatus('pending');
            Alert.alert(
                'Documents Submitted!',
                'Your KYC documents have been submitted for review.\nYou\'ll be notified once approved (1–2 business days).',
                [{ text: 'OK', onPress: onSubmitted ?? onBack }],
            );
        } catch (err: unknown) {
            const e = err as { message?: string };
            Alert.alert('Submission Failed', e.message ?? 'Could not submit documents. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Camera screen ─────────────────────────────────────────────────────────
    if (step === 'camera') {
        const labels: Record<PhotoKey, string> = {
            front:  'CNIC Front Side',
            back:   'CNIC Back Side',
            selfie: 'Your Selfie',
        };
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView
                    style={{ flex: 1 }}
                    ref={(ref) => setCameraRef(ref)}
                    facing={cameraTarget === 'selfie' ? 'front' : 'back'}
                >
                    {/* Overlay frame */}
                    <View style={s.camOverlay}>
                        <View style={s.camTopRow}>
                            <TouchableOpacity onPress={() => { setStep('info'); setCameraTarget(null); }} style={s.camClose}>
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✕ Cancel</Text>
                            </TouchableOpacity>
                            <Text style={s.camTitle}>{labels[cameraTarget!]}</Text>
                        </View>

                        <View style={s.camFrame} />

                        <Text style={s.camHint}>
                            {cameraTarget === 'selfie'
                                ? 'Position your face in the frame and ensure good lighting'
                                : 'Place your CNIC flat — all four corners must be visible'}
                        </Text>

                        <TouchableOpacity style={s.captureBtn} onPress={takePhoto}>
                            <View style={s.captureBtnInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    // ── Info / upload screen ──────────────────────────────────────────────────
    const photoSlots: { key: PhotoKey; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
        { key: 'front',  label: 'CNIC Front',  icon: 'card',          hint: 'Front side of your CNIC card' },
        { key: 'back',   label: 'CNIC Back',   icon: 'card-outline',  hint: 'Back side of your CNIC card'  },
        { key: 'selfie', label: 'Selfie',       icon: 'person-circle', hint: 'Clear photo of your face'     },
    ];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.header}>
                <TouchableOpacity onPress={onBack} style={s.backBtn}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={s.headerTitle}>KYC Verification</Text>
                    <Text style={s.headerSub}>Identity verification required</Text>
                </View>
            </LinearGradient>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {/* Why KYC banner */}
                <View style={s.infoBanner}>
                    <Text style={s.infoTitle}>Why do we need this?</Text>
                    <Text style={s.infoText}>
                        This is a one-time process to verify your identity as per SBP regulations.
                        Your data is encrypted and securely stored.
                    </Text>
                </View>

                {/* CNIC Number */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>CNIC Number</Text>
                    <View style={s.inputWrap}>
                        <Text style={s.inputIcon}><Ionicons name="card" size={18} color={Colors.g1} /></Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="XXXXX-XXXXXXX-X"
                            placeholderTextColor={Colors.ink3}
                            value={cnic}
                            onChangeText={v => {
                                // Auto-format: 12345-1234567-1
                                const raw = v.replace(/\D/g, '').slice(0, 13);
                                let formatted = raw;
                                if (raw.length > 5 && raw.length <= 12) {
                                    formatted = raw.slice(0, 5) + '-' + raw.slice(5);
                                } else if (raw.length === 13) {
                                    formatted = raw.slice(0, 5) + '-' + raw.slice(5, 12) + '-' + raw.slice(12);
                                }
                                setCnic(formatted);
                            }}
                            keyboardType="numeric"
                            maxLength={15}
                        />
                    </View>
                </View>

                {/* Photo slots */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Required Photos</Text>
                    <Text style={s.sectionSub}>Take clear, well-lit photos in a bright area</Text>

                    {photoSlots.map(slot => (
                        <TouchableOpacity
                            key={slot.key}
                            style={s.photoSlot}
                            onPress={() => openCamera(slot.key)}
                            activeOpacity={0.85}
                        >
                            {photos[slot.key] ? (
                                <View style={s.photoPreviewWrap}>
                                    <Image source={{ uri: photos[slot.key]! }} style={s.photoPreview} />
                                    <View style={s.photoCheck}>
                                        <Text style={{ color: '#fff', fontSize: 15 }}>✓</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={[s.photoEmpty, { backgroundColor: Colors.gl }]}>
                                    <Ionicons name={slot.icon} size={28} color={Colors.g1} />
                                    <Ionicons name="camera" size={18} color={Colors.g1} style={{ marginTop: 4 }} />
                                </View>
                            )}
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={s.slotLabel}>{slot.label}</Text>
                                <Text style={s.slotHint}>{slot.hint}</Text>
                                <Text style={[s.slotStatus, { color: photos[slot.key] ? Colors.green : Colors.amber }]}>
                                    {photos[slot.key] ? '✓ Photo taken — tap to retake' : 'Tap to open camera'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Checklist */}
                <View style={s.checklistCard}>
                    <Text style={s.checklistTitle}>Before you submit:</Text>
                    {[
                        'CNIC is valid and not expired',
                        'All 4 corners of CNIC visible in photos',
                        'Photos are clear and not blurry',
                        'Selfie clearly shows your face',
                        'CNIC number matches card photos',
                    ].map((item, i) => (
                        <View key={i} style={s.checkItem}>
                            <Text style={{ color: Colors.g1, fontSize: 13 }}>✓ </Text>
                            <Text style={s.checkText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Submit */}
                <View style={{ marginTop: 8 }}>
                    {submitting ? (
                        <View style={s.submittingRow}>
                            <ActivityIndicator color={Colors.g1} />
                            <Text style={{ color: Colors.ink3, marginLeft: 10, fontSize: 13 }}>
                                Uploading documents...
                            </Text>
                        </View>
                    ) : (
                        <BtnPrimary
                            title="Submit for Verification →"
                            onPress={handleSubmit}
                        />
                    )}
                    <BtnOutline title="Cancel" onPress={onBack} />
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// We need TextInput separately (UIKit's Field doesn't expose raw ref styling we need here)
import { TextInput } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 18,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

    content: { padding: 20 },

    infoBanner: {
        backgroundColor: Colors.bluel, borderRadius: 14,
        padding: 16, marginBottom: 20,
    },
    infoTitle: { fontWeight: '700', color: Colors.blue, fontSize: 13, marginBottom: 5 },
    infoText:  { color: Colors.blue, fontSize: 12, lineHeight: 18 },

    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    sectionSub:   { fontSize: 12, color: Colors.ink3, marginBottom: 12 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.white, borderRadius: 14,
        padding: 4, borderWidth: 1.5, borderColor: Colors.ink4,
    },
    inputIcon: { fontSize: 18, paddingHorizontal: 10 },
    textInput: {
        flex: 1, fontSize: 15, color: Colors.ink,
        paddingVertical: 12, paddingRight: 12,
        fontFamily: 'monospace',
    },

    photoSlot: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.white, borderRadius: 14,
        padding: 14, marginBottom: 12,
        borderWidth: 1.5, borderColor: Colors.ink4,
        shadowColor: '#000', shadowOpacity: 0.04,
        shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    photoEmpty: {
        width: 64, height: 64, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', gap: 2,
    },
    photoPreviewWrap: { position: 'relative' },
    photoPreview: { width: 64, height: 64, borderRadius: 12 },
    photoCheck: {
        position: 'absolute', bottom: -4, right: -4,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#00b87c', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: Colors.white,
    },

    slotLabel:  { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 2 },
    slotHint:   { fontSize: 11, color: Colors.ink3, marginBottom: 4 },
    slotStatus: { fontSize: 11, fontWeight: '600' },

    checklistCard: {
        backgroundColor: Colors.gl, borderRadius: 14, padding: 16, marginBottom: 20,
    },
    checklistTitle: { fontWeight: '700', color: Colors.ink, fontSize: 13, marginBottom: 10 },
    checkItem: { flexDirection: 'row', marginBottom: 6 },
    checkText: { color: Colors.ink, fontSize: 12, flex: 1 },

    submittingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16,
    },

    // Camera overlay
    camOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
    camTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    camClose: {
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14,
        paddingVertical: 8, borderRadius: 20,
    },
    camTitle: {
        flex: 1, color: '#fff', fontWeight: '700', fontSize: 15,
        textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    camFrame: {
        alignSelf: 'center',
        width: 280, height: 180,
        borderWidth: 2.5, borderColor: '#fff',
        borderRadius: 14,
        backgroundColor: 'transparent',
    },
    camHint: {
        color: '#fff', textAlign: 'center', fontSize: 12,
        paddingHorizontal: 20,
        textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    captureBtn: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: '#fff',
        marginBottom: 20,
    },
    captureBtnInner: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#fff',
    },
});
