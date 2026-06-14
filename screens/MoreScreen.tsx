import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
    ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, AppColors } from '../context/ThemeContext';
import BottomModal from '../components/BottomModal';
import { Field, BtnPrimary, BtnOutline, Toggle, SectionLabel } from '../components/UIKit';
import MPinModal from '../components/MPinModal';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { KycAPI, StatementAPI, MPinAPI, AuthAPI } from '../services/api';

export default function MoreScreen({ navigation }: { navigation: any }) {
    const { user, logout, updateKycStatus } = useAuth();
    const { Colors, isDark, toggleTheme } = useTheme();
    const { lang, toggle: toggleLang, T } = useLang();
    const s = makeStyles(Colors);
    const [modal, setModal] = useState<string | null>(null);
    const [mpinVisible, setMpinVisible] = useState(false);
    const [zakatMpinVisible, setZakatMpinVisible] = useState(false);
    const [prefs, setPrefs] = useState({ bio: true, notif: true, dark: false, hbal: false });

    // ── Edit Profile state ─────────────────────────────────────────────────
    const [editName, setEditName] = useState(user?.name ?? '');
    const [editEmail, setEditEmail] = useState(user?.email ?? '');
    const [profileLoading, setProfileLoading] = useState(false);

    // ── Statement state ────────────────────────────────────────────────────
    const [stmtFrom, setStmtFrom] = useState('');
    const [stmtTo,   setStmtTo]   = useState('');
    const [stmtLoading, setStmtLoading] = useState(false);

    // ── KYC state ──────────────────────────────────────────────────────────
    const [kycStatus, setKycStatus] = useState<string | null>(null);
    const [kycLoading, setKycLoading] = useState(false);

    const open = (k: string) => {
        setModal(k);
        if (k === 'kyc') {
            // Load KYC status when modal opens
            setKycLoading(true);
            KycAPI.getStatus()
                .then(r => setKycStatus(r.kyc_status))
                .catch(() => {})
                .finally(() => setKycLoading(false));
        }
    };
    const close = () => setModal(null);

    const togglePref = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

    const handleDownloadStatement = async () => {
        if (!stmtFrom || !stmtTo) {
            Alert.alert('Required', 'Please enter both From and To dates (YYYY-MM-DD).');
            return;
        }
        setStmtLoading(true);
        try {
            const data = await StatementAPI.get(stmtFrom, stmtTo);
            const lines = [
                `Paisa Rakhna — Account Statement`,
                `Period: ${data.period.from} to ${data.period.to}`,
                `Account: ${data.user.account}`,
                `\nSummary`,
                `Total Credited: PKR ${data.summary.total_in.toLocaleString()}`,
                `Total Debited:  PKR ${data.summary.total_out.toLocaleString()}`,
                `Closing Balance: PKR ${Number(data.closing_balance).toLocaleString()}`,
                `\nTransactions (${data.summary.count}):`,
                ...data.transactions.map(t =>
                    `${t.date}  ${t.reference}  ${t.type}  PKR ${t.amount}  ${t.status}`
                ),
            ].join('\n');
            Alert.alert(
                'Statement Ready',
                `${data.summary.count} transactions\nPKR ${Number(data.summary.total_in).toLocaleString()} in / PKR ${Number(data.summary.total_out).toLocaleString()} out\n\nFull PDF available on web portal.`,
                [{ text: 'Close' }]
            );
        } catch (e: unknown) {
            const err = e as { message?: string };
            Alert.alert('Error', err.message ?? 'Could not load statement.');
        } finally {
            setStmtLoading(false);
        }
    };

    const handleLogout = () => Alert.alert('Log Out', 'Are you sure?', [
        { text: 'Cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.profileHero}>
                    <View style={s.avatarCircle}>
                        <Text style={s.avatarText}>{user?.initials ?? 'U'}</Text>
                    </View>
                    <Text style={s.name}>{user?.name ?? 'User'}</Text>
                    <Text style={s.email}>{user?.email ?? user?.phone ?? ''}</Text>
                    <View style={s.badgeRow}>
                        <View style={s.badge}><Text style={s.badgeText}>Premium ★</Text></View>
                        <View style={s.badge}><Text style={s.badgeText}>
                            {user?.kyc_status === 'verified'
                                ? 'KYC Verified ✓'
                                : user?.kyc_status === 'rejected'
                                ? 'KYC Rejected ✗'
                                : 'KYC Pending ⏳'}
                        </Text></View>
                    </View>
                </LinearGradient>

                {/* Account */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>ACCOUNT</Text>
                    {([
                        { icon: 'person', label: 'Edit Profile',       key: 'editProfile', color: '#16a265' },
                        { icon: 'id-card', label: 'KYC / Verification', key: '__kyc',       color: '#3b82f6' },
                        { icon: 'document-text', label: 'Bank Statement', key: 'statements', color: '#7c3aed' },
                        { icon: 'calculator', label: 'Zakat Calculator', key: '__zakat',    color: '#f5a623' },
                    ] as { icon: keyof typeof Ionicons.glyphMap; label: string; key: string; color: string }[]).map((item, i) => (
                        <TouchableOpacity key={item.key} style={[s.row, i > 0 && s.borderTop]}
                            onPress={() => {
                                if (item.key === '__zakat') setZakatMpinVisible(true);
                                else if (item.key === '__kyc') navigation.navigate('Kyc');
                                else open(item.key);
                            }}>
                            <View style={s.rowLeft}>
                                <View style={[s.lic, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <Text style={s.rowLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Security */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>SECURITY</Text>
                    <TouchableOpacity style={s.row} onPress={() => open('security')}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#e5373a18' }]}>
                                <Ionicons name="lock-closed" size={18} color="#e5373a" />
                            </View>
                            <Text style={s.rowLabel}>Password & Security</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                    </TouchableOpacity>
                    <View style={[s.row, s.borderTop]}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#16a26518' }]}>
                                <Ionicons name="finger-print" size={18} color="#16a265" />
                            </View>
                            <Text style={s.rowLabel}>Biometric Login</Text>
                        </View>
                        <Toggle value={prefs.bio} onChange={() => togglePref('bio')} />
                    </View>
                    <TouchableOpacity style={[s.row, s.borderTop]} onPress={() => open('2fa')}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#3b82f618' }]}>
                                <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                            </View>
                            <Text style={s.rowLabel}>Two-Factor Auth</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.row, s.borderTop]} onPress={() => open('otp')}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#7c3aed18' }]}>
                                <Ionicons name="phone-portrait" size={18} color="#7c3aed" />
                            </View>
                            <Text style={s.rowLabel}>OTP Settings</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.row, s.borderTop]} onPress={() => setMpinVisible(true)}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#f5a62318' }]}>
                                <Ionicons name="keypad" size={18} color="#f5a623" />
                            </View>
                            <Text style={s.rowLabel}>Transaction M-PIN</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                    </TouchableOpacity>
                </View>

                {/* Preferences */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>PREFERENCES</Text>
                    <View style={s.row}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#f5a62318' }]}>
                                <Ionicons name="notifications" size={18} color="#f5a623" />
                            </View>
                            <Text style={s.rowLabel}>Notifications</Text>
                        </View>
                        <Toggle value={prefs.notif} onChange={() => togglePref('notif')} />
                    </View>
                    <View style={[s.row, s.borderTop]}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#7c3aed18' }]}>
                                <Ionicons name="moon" size={18} color="#7c3aed" />
                            </View>
                            <Text style={s.rowLabel}>Dark Mode</Text>
                        </View>
                        <Toggle value={isDark} onChange={toggleTheme} />
                    </View>
                    <View style={[s.row, s.borderTop]}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#3b82f618' }]}>
                                <Ionicons name="eye-off" size={18} color="#3b82f6" />
                            </View>
                            <Text style={s.rowLabel}>Hide Balance Default</Text>
                        </View>
                        <Toggle value={prefs.hbal} onChange={() => togglePref('hbal')} />
                    </View>
                    <View style={[s.row, s.borderTop]}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: '#16a26518' }]}>
                                <Ionicons name="language" size={18} color="#16a265" />
                            </View>
                            <View>
                                <Text style={s.rowLabel}>{T('language')}</Text>
                                <Text style={{ fontSize: 11, color: Colors.ink3 }}>{lang === 'en' ? 'English' : 'Roman Urdu'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={toggleLang}
                            style={{ backgroundColor: Colors.g1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                                {lang === 'en' ? 'Roman Urdu' : 'English'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Support */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>SUPPORT</Text>
                    {([
                        { icon: 'chatbubble-ellipses', label: 'Help & Support', key: 'support', color: '#16a265' },
                        { icon: 'star',                label: 'Rate Us',        key: 'feedback', color: '#f5a623' },
                    ] as { icon: keyof typeof Ionicons.glyphMap; label: string; key: string; color: string }[]).map((item, i) => (
                        <TouchableOpacity key={item.key} style={[s.row, i > 0 && s.borderTop]} onPress={() => open(item.key)}>
                            <View style={s.rowLeft}>
                                <View style={[s.lic, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <Text style={s.rowLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[s.row, s.borderTop]} onPress={handleLogout}>
                        <View style={s.rowLeft}>
                            <View style={[s.lic, { backgroundColor: Colors.redl }]}>
                                <Ionicons name="log-out" size={18} color={Colors.red} />
                            </View>
                            <Text style={[s.rowLabel, { color: Colors.red, fontWeight: '700' }]}>Log Out</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.red} />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Modals */}
    <BottomModal visible={modal === 'editProfile'} onClose={close} title="Edit Profile" subtitle="Update personal info">
                <Field label="Full Name" placeholder="Asif Khan" value={editName} onChange={setEditName} />
                <Field label="Email" placeholder="asif@paisarakhna.pk" type="email-address" value={editEmail} onChange={setEditEmail} />
                <Text style={{ fontSize: 11, color: Colors.ink3, marginBottom: 10 }}>Phone number cannot be changed.</Text>
                {profileLoading
                    ? <ActivityIndicator color={Colors.g1} style={{ marginVertical: 8 }} />
                    : <BtnPrimary title="Save Changes" onPress={async () => {
                        if (editName.trim().length < 3) { Alert.alert('Error', 'Name must be at least 3 characters'); return; }
                        setProfileLoading(true);
                        try {
                            await AuthAPI.updateProfile({ name: editName.trim(), email: editEmail.trim() || undefined });
                            close();
                            Alert.alert('Updated', 'Profile updated successfully.');
                        } catch (e: unknown) {
                            const err = e as { message?: string };
                            Alert.alert('Error', err.message ?? 'Could not update profile.');
                        } finally { setProfileLoading(false); }
                    }} />
                }
            </BottomModal>

            <BottomModal visible={modal === 'kyc'} onClose={close} title="KYC Verification" subtitle="Verify your identity">
                {kycLoading ? (
                    <ActivityIndicator color={Colors.g1} style={{ marginVertical: 24 }} />
                ) : kycStatus === 'verified' ? (
                    <View style={{ backgroundColor: Colors.greenl, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <Text style={{ fontSize: 13, color: Colors.green, fontWeight: '700' }}>✓ KYC Verified</Text>
                        <Text style={{ fontSize: 12, color: Colors.green, marginTop: 4 }}>Your identity has been verified successfully.</Text>
                    </View>
                ) : kycStatus === 'under_review' ? (
                    <View style={{ backgroundColor: Colors.gl, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <Text style={{ fontSize: 13, color: Colors.g1, fontWeight: '700' }}>⏳ Under Review</Text>
                        <Text style={{ fontSize: 12, color: Colors.g2, marginTop: 4 }}>Your documents are being reviewed. This usually takes 1-2 business days.</Text>
                    </View>
                ) : kycStatus === 'rejected' ? (
                    <View style={{ backgroundColor: Colors.redl, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <Text style={{ fontSize: 13, color: Colors.red, fontWeight: '700' }}>✗ KYC Rejected</Text>
                        <Text style={{ fontSize: 12, color: Colors.red, marginTop: 4 }}>Please resubmit your documents below.</Text>
                    </View>
                ) : (
                    <View style={{ backgroundColor: Colors.gl, borderRadius: 12, padding: 12, marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: Colors.g2 }}><Ionicons name="camera" size={12} color={Colors.g2} /> Upload CNIC (front + back) and a selfie to verify your account.</Text>
                    </View>
                )}
                <Field label="CNIC Number" placeholder="XXXXX-XXXXXXX-X" />
                <View style={{ gap: 10, marginBottom: 14 }}>
                    <TouchableOpacity
                        style={{ borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 12, padding: 14, borderStyle: 'dashed', alignItems: 'center' }}
                        onPress={() => Alert.alert('Document Upload', 'This feature requires expo-image-picker. Install it with: expo install expo-image-picker')}
                    >
                        <Ionicons name="card" size={20} style={{ marginBottom: 4 }} color={Colors.ink2} />
                        <Text style={{ fontSize: 12, color: Colors.ink3 }}>Tap to upload CNIC Front</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 12, padding: 14, borderStyle: 'dashed', alignItems: 'center' }}
                        onPress={() => Alert.alert('Document Upload', 'This feature requires expo-image-picker. Install it with: expo install expo-image-picker')}
                    >
                        <Ionicons name="card-outline" size={20} style={{ marginBottom: 4 }} color={Colors.ink2} />
                        <Text style={{ fontSize: 12, color: Colors.ink3 }}>Tap to upload CNIC Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 12, padding: 14, borderStyle: 'dashed', alignItems: 'center' }}
                        onPress={() => Alert.alert('Document Upload', 'This feature requires expo-image-picker. Install it with: expo install expo-image-picker')}
                    >
                        <Ionicons name="person-circle" size={20} style={{ marginBottom: 4 }} color={Colors.ink2} />
                        <Text style={{ fontSize: 12, color: Colors.ink3 }}>Tap to upload Selfie</Text>
                    </TouchableOpacity>
                </View>
                <BtnPrimary title="Submit for Review" onPress={() => { Alert.alert('KYC', 'Install expo-image-picker first, then documents can be uploaded.'); close(); }} />
            </BottomModal>

            <BottomModal visible={modal === 'statements'} onClose={close} title="Bank Statement" subtitle="Download your statement">
                <View style={{ gap: 10 }}>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.ink2, marginBottom: 6 }}>From Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={{ borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.ink, backgroundColor: Colors.white }}
                            placeholder="2026-01-01"
                            placeholderTextColor={Colors.ink3}
                            value={stmtFrom}
                            onChangeText={setStmtFrom}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.ink2, marginBottom: 6 }}>To Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={{ borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.ink, backgroundColor: Colors.white }}
                            placeholder="2026-04-30"
                            placeholderTextColor={Colors.ink3}
                            value={stmtTo}
                            onChangeText={setStmtTo}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>
                </View>
                <View style={{ height: 14 }} />
                <BtnPrimary
                    title={stmtLoading ? 'Loading...' : 'Get Statement'}
                    onPress={handleDownloadStatement}
                />
            </BottomModal>

            <BottomModal visible={modal === 'security'} onClose={close} title="Security" subtitle="Account secure rakhein">
                <Field label="Current Password" placeholder="••••••••" secureText />
                <Field label="New Password" placeholder="••••••••" secureText />
                <Field label="Confirm Password" placeholder="••••••••" secureText />
                <BtnPrimary title="Update Password" onPress={close} />
            </BottomModal>

            <BottomModal visible={modal === '2fa'} onClose={close} title="Two-Factor Auth" subtitle="Extra security layer">
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.purplel, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="shield-checkmark" size={32} color={Colors.purple} />
                    </View>
                    <Text style={{ fontSize: 13, color: Colors.ink2, marginBottom: 14, textAlign: 'center' }}>Verify via SMS or authenticator app</Text>
                </View>
                <Field label="Mobile Number" placeholder="+92 3XX XXXXXXX" type="phone-pad" />
                <BtnPrimary title="Enable 2FA" onPress={close} />
            </BottomModal>

            <BottomModal visible={modal === 'otp'} onClose={close} title="OTP Settings" subtitle="Verification preferences">
                <View style={{ backgroundColor: Colors.gl, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 13, color: Colors.g2, fontWeight: '600' }}>OTP will be sent to your registered number</Text>
                </View>
                <Field label="Registered Mobile" placeholder="+92 3XX XXXXXXX" type="phone-pad" />
                <Field label="OTP Expiry" placeholder="60 seconds (default)" />
                <BtnPrimary title="Update Settings" onPress={close} />
            </BottomModal>

            <BottomModal visible={modal === 'faceId'} onClose={close} title="Face Recognition" subtitle="Facial identification setup">
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.purplel, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.purple, marginBottom: 16 }}>
                        <Ionicons name="id-card" size={48} color={Colors.purple} />
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.ink2, textAlign: 'center', marginBottom: 8 }}>Face ID active hai aur secure hai</Text>
                    <Text style={{ fontSize: 12, color: Colors.ink3, textAlign: 'center' }}>Aapka face data encrypted aur local stored hai</Text>
                </View>
                <BtnPrimary title="Re-register Face ID" onPress={close} />
                <BtnOutline title="Disable Face Recognition" onPress={close} />
            </BottomModal>

            <BottomModal visible={modal === 'support'} onClose={close} title="Help & Support" subtitle="24/7 haazir hain">
                {[
                    { icon: 'chatbubble-ellipses' as const, label: 'Live Chat' },
                    { icon: 'call' as const,                label: 'Call: 0800-PAISA' },
                    { icon: 'mail' as const,                label: 'Email Support' },
                ].map((item, i) => (
                    <TouchableOpacity key={item.label} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.ink4 }]} onPress={() => Alert.alert(item.label, 'Connecting...')}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name={item.icon} size={16} color={Colors.g1} />
                            </View>
                            <Text style={{ fontSize: 14, color: Colors.ink }}>{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.ink4} />
                    </TouchableOpacity>
                ))}
            </BottomModal>

            <BottomModal visible={modal === 'feedback'} onClose={close} title="Rate Us" subtitle="Aapki raay hamari taaqat hai">
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Text style={{ fontSize: 32, letterSpacing: 8, marginBottom: 16 }}>★★★★★</Text>
                </View>
                <Field label="Your Review" placeholder="Aapka feedback likhein..." multiline rows={3} />
                <BtnPrimary title="Submit" onPress={() => { Alert.alert('Thank you!', 'Your feedback has been received ⭐'); close(); }} />
            </BottomModal>

            <MPinModal
                visible={mpinVisible}
                onClose={() => setMpinVisible(false)}
                onSuccess={() => { setMpinVisible(false); Alert.alert('M-PIN Updated', 'Your M-PIN has been set ✓'); }}
                title="Set Transaction M-PIN"
                subtitle="Set a 4-digit PIN for transactions"
                isSetup={true}
            />

            {/* Zakat Calculator — M-PIN gate */}
            <MPinModal
                visible={zakatMpinVisible}
                onClose={() => setZakatMpinVisible(false)}
                onSuccess={async (mpin) => {
                    try {
                        await MPinAPI.verify(mpin);
                        setZakatMpinVisible(false);
                        navigation.navigate('Zakat');
                    } catch (e: unknown) {
                        const err = e as { message?: string };
                        Alert.alert('Incorrect M-PIN', err.message ?? 'Please try again.');
                    }
                }}
                title="Zakat Calculator"
                subtitle="Enter M-PIN to open Zakat Calculator"
            />
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    profileHero: { paddingTop: 30, paddingBottom: 28, alignItems: 'center' },
    avatarCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 12 },
    avatarText: { fontWeight: '900', fontSize: 22, color: '#fff' },
    name: { fontWeight: '900', fontSize: 18, color: '#fff' },
    email: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    section: { backgroundColor: Colors.white, marginTop: 10, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.ink3, letterSpacing: 0.7, paddingTop: 12, paddingBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lic: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: 14, color: Colors.ink },
    arrow: { color: Colors.ink4, fontSize: 18 },
    borderTop: { borderTopWidth: 1, borderTopColor: Colors.ink4 },
});
