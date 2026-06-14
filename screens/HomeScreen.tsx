import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, AppColors } from '../context/ThemeContext';
import BottomModal from '../components/BottomModal';
import MPinModal from '../components/MPinModal';
import QrScannerModal from '../components/QrScannerModal';
import { Field, BtnPrimary, BtnOutline, Pill } from '../components/UIKit';
import { useAuth } from '../context/AuthContext';
import { WalletAPI, MPinAPI } from '../services/api';
import type { Transaction, TransactionSlip } from '../services/api';
import TransactionSlipModal from '../components/TransactionSlipModal';

export default function HomeScreen({ navigation }: { navigation: any }) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const { user } = useAuth();
    const displayName = user?.name ?? 'User';
    const initials = user?.initials ?? '??';

    const [balVisible, setBalVisible] = useState(true);
    const [modal, setModal] = useState<string | null>(null);
    const [mpinVisible, setMpinVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const spinAnim = useRef(new Animated.Value(0)).current;

    const [balance, setBalance] = useState(0);
    const [walletAccountNumber, setWalletAccountNumber] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [slip, setSlip] = useState<TransactionSlip | null>(null);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [offline, setOffline] = useState(false);

    const loadWallet = async () => {
        try {
            const [walletRes, txRes] = await Promise.all([
                WalletAPI.getBalance(),
                WalletAPI.getTransactions(),
            ]);
            setBalance(walletRes.wallet.balance);
            setWalletAccountNumber(walletRes.wallet.account_number);
            setTransactions(txRes.data.data);
            setOffline(false);
        } catch {
            setOffline(true);
        }
    };

    useEffect(() => { loadWallet(); }, []);

    // Auto-retry every 10s when offline
    useEffect(() => {
        if (!offline) return;
        const timer = setInterval(loadWallet, 10000);
        return () => clearInterval(timer);
    }, [offline]);

    const openModal = (key: string) => setModal(key);
    const closeModal = () => setModal(null);

    // Actions that require M-PIN confirmation before opening modal
    const MPIN_ACTIONS = ['send', 'addMoney', 'exchange', 'easyload', 'easyloan', 'bill', 'zakat'];

    const handleAction = (key: string) => {
        // QR scanner — open camera directly
        if (key === 'scanning') {
            setQrVisible(true);
            return;
        }
        if (MPIN_ACTIONS.includes(key)) {
            setPendingAction(key);
            setMpinVisible(true);
        } else {
            openModal(key);
        }
    };

    // Show balance requires M-PIN — only prompt when revealing (not hiding)
    const handleBalanceToggle = () => {
        if (!balVisible) {
            // Currently hidden → require M-PIN to reveal
            setPendingAction('showBalance');
            setMpinVisible(true);
        } else {
            // Currently visible → hide immediately (no PIN needed)
            setBalVisible(false);
        }
    };

    const handleQrScanned = (value: string) => {
        // QR data could be a phone number or account number PR-xxxxxxxxxx
        // Pre-fill the send modal with scanned recipient
        setPendingAction('send');
        setQrVisible(false);
        // Short delay then open M-PIN → then send modal will receive scanned value
        // Simple approach: show send modal directly with scanned value via Alert confirm
        Alert.alert(
            'QR Scanned',
            `Send money to:\n${value}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed to Send',
                    onPress: () => {
                        setPendingAction('send');
                        setMpinVisible(true);
                    },
                },
            ],
        );
    };

    const handleMPinSuccess = async (_mpin: string) => {
        try {
            await MPinAPI.verify(_mpin);
        } catch (err: unknown) {
            // Wrong M-PIN — block the action
            const e = err as { message?: string };
            Alert.alert('Incorrect M-PIN', e.message ?? 'Incorrect M-PIN. Please try again.');
            setMpinVisible(false);
            setPendingAction(null);
            return;
        }
        setMpinVisible(false);
        const action = pendingAction;
        setPendingAction(null);
        if (action === 'showBalance') {
            setBalVisible(true);
        } else if (action === 'zakat') {
            navigation.navigate('Zakat');
        } else if (action) {
            openModal(action);
        }
    };

    const doRefresh = async () => {
        Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => spinAnim.setValue(0));
        await loadWallet();
    };

    const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const fmtNum = (n: number) => {
        const abs = Math.abs(Math.round(n));
        const s = abs.toString();
        let result = '';
        const len = s.length;
        for (let i = 0; i < len; i++) {
            if (i > 0 && (len - i) % 2 === 0 && i > 1 || (i === 1 && len > 3)) {
                // skip
            }
            result += s[i];
        }
        // Simple comma insertion: Indian/PK style (1,00,000)
        if (abs >= 1000) {
            const [intPart] = abs.toFixed(0).split('.');
            let formatted = '';
            let count = 0;
            for (let i = intPart.length - 1; i >= 0; i--) {
                if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
                    formatted = ',' + formatted;
                }
                formatted = intPart[i] + formatted;
                count++;
            }
            return formatted;
        }
        return abs.toString();
    };
    const fmt = (n: number) => `PKR ${fmtNum(n)}`;
    const txShow = (n: number) => balVisible ? (n > 0 ? `+${fmtNum(n)}` : `-${fmtNum(n)}`) : '•••';

    const totalIn  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type !== 'credit').reduce((s, t) => s + t.amount, 0);

    const quickActions: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }[] = [
        { key: 'send',     label: 'Send',       icon: 'paper-plane',    iconColor: '#16a265', bg: '#e8f5ef' },
        { key: 'addMoney', label: 'Add Money',  icon: 'add-circle',     iconColor: '#3b82f6', bg: '#e8f0fe' },
        { key: 'receive',  label: 'Receive',    icon: 'download',       iconColor: '#f5a623', bg: '#fef3dc' },
        { key: 'exchange', label: 'Exchange',   icon: 'swap-horizontal', iconColor: '#7c3aed', bg: '#ede9fe' },
    ];
    const services: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }[] = [
        { key: 'easyload',  label: 'Easy\nLoad',      icon: 'phone-portrait',  iconColor: '#16a265', bg: Colors.gl },
        { key: 'easyloan',  label: 'Easy\nLoan',      icon: 'cash',            iconColor: '#f5a623', bg: '#fef3dc' },
        { key: 'saving',    label: 'Saving\nAccount', icon: 'business',        iconColor: '#3b82f6', bg: Colors.bluel },
        { key: 'scanning',  label: 'Scan &\nPay',     icon: 'qr-code',         iconColor: '#7c3aed', bg: Colors.purplel },
        { key: 'biometric', label: 'Bio\nmetric',     icon: 'finger-print',    iconColor: '#e5373a', bg: Colors.redl },
        { key: 'bill',      label: 'Utility\nBills',  icon: 'flash',           iconColor: '#f5a623', bg: '#fef3dc' },
        { key: 'insurance', label: 'Insurance',       icon: 'shield-checkmark', iconColor: '#16a265', bg: Colors.gl },
        { key: 'zakat',     label: 'Zakat\nCalc',     icon: 'calculator',       iconColor: '#f5a623', bg: '#fef3dc' },
    ];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* M-PIN Modal — shown before any transaction */}
            <MPinModal
                visible={mpinVisible}
                onClose={() => { setMpinVisible(false); setPendingAction(null); }}
                onSuccess={handleMPinSuccess}
                title="Confirm Transaction"
                subtitle="Enter M-PIN to confirm transaction"
            />

            {/* Header */}
            <View style={s.header}>
                <View style={s.headerLeft}>
                    <TouchableOpacity onPress={() => openModal('account')} activeOpacity={0.85}>
                        <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.avatar}>
                            <Text style={s.avatarText}>{initials}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <View>
                        <Text style={s.greeting}>Good day 👋</Text>
                        <Text style={s.name}>{displayName}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => openModal('search')}>
                        <Ionicons name="search" size={18} color={Colors.ink2} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.iconBtn} onPress={() => openModal('notif')}>
                        <Ionicons name="notifications" size={18} color={Colors.ink2} />
                        <View style={s.badge} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Offline Banner */}
            {offline && (
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef3cd', paddingVertical: 8, paddingHorizontal: 16 }}
                    onPress={loadWallet}
                    activeOpacity={0.7}
                >
                    <Ionicons name="cloud-offline" size={16} color="#856404" />
                    <Text style={{ color: '#856404', fontSize: 12, fontWeight: '600' }}>Cannot reach server — Tap to retry</Text>
                </TouchableOpacity>
            )}

            <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.balCard}>
                    <View style={s.balTopRow}>
                        <Text style={s.balLabel}>Available Balance</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity style={s.smallBtn} onPress={doRefresh}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Ionicons name="refresh" size={13} color="#fff" />
                                </Animated.View>
                                <Text style={s.smallBtnTxt}> Refresh</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.smallBtn} onPress={handleBalanceToggle}>
                                <Ionicons name={balVisible ? 'eye-off' : 'eye'} size={13} color="#fff" />
                                <Text style={s.smallBtnTxt}>{balVisible ? ' Hide' : ' Show'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={s.balAmount}>{balVisible ? fmt(balance) : 'PKR ••••••'}</Text>
                    <Text style={s.balVsMonth}>
                        <Text style={s.balBadge}>↑ +2.4%</Text> vs last month
                    </Text>
                    <View style={s.incExpRow}>
                        <View style={s.miniCard}>
                            <Text style={s.miniLabel}>Income</Text>
                            <Text style={s.miniAmt}>{balVisible ? `PKR ${fmtNum(totalIn)}` : 'PKR •••••'}</Text>
                            <Text style={s.greenBadge}>↑ Credits</Text>
                        </View>
                        <View style={s.miniCard}>
                            <Text style={s.miniLabel}>Expenses</Text>
                            <Text style={s.miniAmt}>{balVisible ? `PKR ${fmtNum(totalOut)}` : 'PKR •••••'}</Text>
                            <Text style={s.redBadge}>↓ Debits</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* New user — zero balance / no transactions prompt */}
                {balance === 0 && transactions.length === 0 && (
                    <View style={s.emptyCard}>
                        <Text style={{ fontSize: 34, marginBottom: 8 }}>🎉</Text>
                        <Text style={s.emptyTitle}>Welcome to Paisa Rakhna!</Text>
                        <Text style={s.emptySub}>Your wallet is ready. Add money to start sending, paying bills, and more.</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={() => handleAction('addMoney')}>
                            <Text style={s.emptyBtnTxt}>+ Add Money to Wallet</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={s.qaGrid}>
                    {quickActions.map(a => (
                        <TouchableOpacity key={a.key} style={s.qaCard} onPress={() => handleAction(a.key)}>
                            <View style={[s.qaIcon, { backgroundColor: a.bg }]}>
                                <Ionicons name={a.icon} size={22} color={a.iconColor} />
                            </View>
                            <Text style={s.qaLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transactions */}
                <View style={s.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text style={s.sectionTitle}>Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Store')}><Text style={{ color: Colors.g1, fontSize: 12, fontWeight: '600' }}>See All →</Text></TouchableOpacity>
                    </View>
                    {transactions.length === 0 ? (
                        <Text style={{ color: Colors.ink3, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>
                            No transactions yet
                        </Text>
                    ) : transactions.slice(0, 3).map((tx, i) => {
                        const isCredit = tx.type === 'credit';
                        const displayAmt = isCredit ? tx.amount : -tx.amount;
                        const iconName: keyof typeof Ionicons.glyphMap = isCredit ? 'arrow-down-circle' : tx.type === 'bill' ? 'flash' : tx.type === 'easyload' ? 'phone-portrait' : 'arrow-up-circle';
                        const iconColorVal = isCredit ? Colors.green : tx.type === 'bill' ? Colors.amber : Colors.red;
                        const iconBg = isCredit ? Colors.greenl : tx.type === 'bill' ? Colors.amberl : Colors.redl;
                        const title = tx.description || (tx.recipient_name ? `To: ${tx.recipient_name}` : tx.reference);
                        const date = new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
                        return (
                            <TouchableOpacity key={tx.id} style={[s.txRow, i > 0 && s.txBorder]} onPress={() => { setSelectedTx(tx); openModal('txDetail'); }}>
                                <View style={[s.txIcon, { backgroundColor: iconBg }]}>
                                    <Ionicons name={iconName} size={20} color={iconColorVal} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 11 }}>
                                    <Text style={s.txTitle}>{title}</Text>
                                    <Text style={s.txDate}>{date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[s.txAmt, { color: isCredit ? Colors.green : Colors.ink }]}>{txShow(displayAmt)}</Text>
                                    <Pill label={isCredit ? 'Credit' : tx.type === 'bill' ? 'Bill' : 'Debit'} bg={isCredit ? Colors.greenl : tx.type === 'bill' ? Colors.amberl : Colors.redl} color={isCredit ? Colors.green : tx.type === 'bill' ? Colors.amber : Colors.red} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* More with Paisa Rakhna */}
                <View style={s.section}>
                    <Text style={s.serviceHeader}>More with Paisa Rakhna</Text>
                    <View style={s.servicesGrid}>
                        {services.map(sv => (
                            <TouchableOpacity key={sv.key} style={s.svcItem} onPress={() => handleAction(sv.key)}>
                                <View style={[s.svcIcon, { backgroundColor: sv.bg }]}>
                                    <Ionicons name={sv.icon} size={24} color={sv.iconColor} />
                                </View>
                                <Text style={s.svcLabel}>{sv.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Wallet Section */}
                <View style={s.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Ionicons name="card" size={16} color={Colors.ink2} />
                        <Text style={s.sectionTitle}>My Wallet</Text>
                        {walletAccountNumber ? (
                            <Text style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 12, color: Colors.ink3 }}>
                                {walletAccountNumber.slice(-4).padStart(walletAccountNumber.length, '•')}
                            </Text>
                        ) : null}
                    </View>
                    {[
                        { label: 'Savings', amt: balVisible ? 'PKR 2,15,000' : 'PKR •••••', color: Colors.green },
                        { label: 'Fixed Deposit', amt: balVisible ? 'PKR 1,00,000' : 'PKR •••••', color: Colors.g1 },
                        { label: 'Investments', amt: balVisible ? 'PKR 67,350' : 'PKR •••••', color: Colors.amber },
                    ].map((item, i, arr) => (
                        <View key={item.label} style={[s.walletRow, i < arr.length - 1 && s.txBorder]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                                <Text style={{ fontSize: 13, color: Colors.ink2 }}>{item.label}</Text>
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: item.color }}>{item.amt}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modals */}
            <ModalSend visible={modal === 'send'} onClose={closeModal} onSendSuccess={(newBal, txSlip) => { setBalance(newBal); loadWallet(); if (txSlip) setSlip(txSlip); }} />
            <ModalAddMoney visible={modal === 'addMoney'} onClose={closeModal} onSuccess={(txSlip) => { loadWallet(); if (txSlip) setSlip(txSlip); }} />
            <ModalReceive visible={modal === 'receive'} onClose={closeModal} accountNumber={walletAccountNumber} />
            <ModalExchange visible={modal === 'exchange'} onClose={closeModal} />
            <ModalBill visible={modal === 'bill'} onClose={closeModal} />
            <ModalEasyLoad visible={modal === 'easyload'} onClose={closeModal} />
            <ModalEasyLoan visible={modal === 'easyloan'} onClose={closeModal} />
            <ModalSaving visible={modal === 'saving'} onClose={closeModal} />
            <ModalBiometric visible={modal === 'biometric'} onClose={closeModal} />
            <ModalInsurance visible={modal === 'insurance'} onClose={closeModal} />
            <ModalTxDetail visible={modal === 'txDetail'} onClose={() => { closeModal(); setSelectedTx(null); }} tx={selectedTx} />
            <ModalSearch visible={modal === 'search'} onClose={closeModal} />
            <ModalNotif visible={modal === 'notif'} onClose={closeModal} />
            <ModalAccount visible={modal === 'account'} onClose={closeModal} user={user} accountNumber={walletAccountNumber} />

            {/* Transaction Slip */}
            <TransactionSlipModal visible={slip !== null} slip={slip} onClose={() => setSlip(null)} />

            {/* Real QR Scanner */}
            <QrScannerModal
                visible={qrVisible}
                onClose={() => setQrVisible(false)}
                onScanned={handleQrScanned}
                title="Scan & Pay"
            />
        </SafeAreaView>
    );
}

// ── ACCOUNT MODAL ─────────────────────────────────────────────────────────────
function ModalAccount({ visible, onClose, user: u, accountNumber }: any) {
    const Colors = useColors();
    const info = [
        { label: 'Full Name',       value: u?.name ?? '—',                   icon: 'person' as const },
        { label: 'Phone',           value: u?.phone ?? '—',                  icon: 'call' as const },
        { label: 'Email',           value: u?.email ?? '—',                  icon: 'mail' as const },
        { label: 'Account Number',  value: accountNumber || '—',             icon: 'card' as const },
        { label: 'KYC Status',      value: u?.kyc_status === 'verified' ? 'Verified ✓' : (u?.kyc_status ?? 'Pending'), icon: 'shield-checkmark' as const },
        { label: 'Account Type',    value: 'Digital Wallet',                 icon: 'wallet' as const },
    ];
    return (
        <BottomModal visible={visible} onClose={onClose} title="My Account" subtitle="Your account information">
            <View style={{ backgroundColor: Colors.gl, borderRadius: 16, padding: 14, alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.g1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>{u?.initials ?? 'U'}</Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 17, color: Colors.ink }}>{u?.name ?? 'User'}</Text>
                <Text style={{ fontSize: 11, color: Colors.g1, fontWeight: '600', marginTop: 3 }}>Premium Member ★</Text>
            </View>
            {info.map((row, i) => (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Colors.ink4 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name={row.icon} size={16} color={Colors.g1} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{row.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.ink }}>{row.value}</Text>
                    </View>
                </View>
            ))}
        </BottomModal>
    );
}

// ── MODAL COMPONENTS ─────────────────────────────────────────────────────────
function ModalSend({ visible, onClose, onSendSuccess }: { visible: boolean; onClose: () => void; onSendSuccess?: (newBalance: number, slip: TransactionSlip) => void }) {
    const Colors = useColors();
    const [recipientPhone, setRecipientPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!recipientPhone.trim() || !amount.trim()) {
            Alert.alert('Error', 'Please enter phone number and amount'); return;
        }
        const amtNum = parseFloat(amount);
        if (isNaN(amtNum) || amtNum <= 0) {
            Alert.alert('Error', 'Please enter a valid amount'); return;
        }
        setSending(true);
        try {
            const res = await WalletAPI.send(recipientPhone.trim(), amtNum, note.trim() || undefined);
            setSending(false);
            setRecipientPhone(''); setAmount(''); setNote('');
            onClose();
            onSendSuccess?.(res.balance, res.slip);
        } catch (err: unknown) {
            setSending(false);
            const e = err as { message?: string };
            Alert.alert('Error', e.message ?? 'Transaction failed. Please try again.');
        }
    };

    return (
        <BottomModal visible={visible} onClose={onClose} title="Send Money" subtitle="Send to anyone">
            <Field label="Recipient Phone" placeholder="03xxxxxxxxx" type="phone-pad" value={recipientPhone} onChange={setRecipientPhone} />
            <Field label="Amount (PKR)" placeholder="0.00" type="numeric" value={amount} onChange={setAmount} />
            <Field label="Note (optional)" placeholder="What is this for?" value={note} onChange={setNote} />
            {sending ? <ActivityIndicator color={Colors.g1} style={{ marginVertical: 8 }} /> : <BtnPrimary title="Send Now" onPress={handleSend} />}
        </BottomModal>
    );
}
function ModalAddMoney({ visible, onClose, onSuccess }: { visible: boolean; onClose: () => void; onSuccess?: (slip: TransactionSlip) => void }) {
    const Colors = useColors();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTopup = async () => {
        const amtNum = parseFloat(amount);
        if (isNaN(amtNum) || amtNum < 100) {
            Alert.alert('Error', 'Minimum topup amount is PKR 100'); return;
        }
        if (amtNum > 100000) {
            Alert.alert('Error', 'Maximum topup amount is PKR 1,00,000'); return;
        }
        setLoading(true);
        try {
            const res = await WalletAPI.topup(amtNum);
            setLoading(false);
            setAmount('');
            onClose();
            onSuccess?.(res.slip);
        } catch (err: unknown) {
            setLoading(false);
            const e = err as { message?: string };
            Alert.alert('Error', e.message ?? 'Topup failed. Please try again.');
        }
    };

    return (
        <BottomModal visible={visible} onClose={onClose} title="Add Money" subtitle="Top up your wallet">
            <Field label="Amount (PKR)" placeholder="Min 100 — Max 1,00,000" type="numeric" value={amount} onChange={setAmount} />
            {[100, 500, 1000, 5000].map(preset => (
                <TouchableOpacity key={preset} onPress={() => setAmount(String(preset))}
                    style={{ backgroundColor: Colors.gl, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 6, alignItems: 'center' }}>
                    <Text style={{ color: Colors.g1, fontWeight: '700' }}>PKR {preset.toLocaleString()}</Text>
                </TouchableOpacity>
            ))}
            {loading
                ? <ActivityIndicator color={Colors.g1} style={{ marginVertical: 8 }} />
                : <BtnPrimary title="Add Money" onPress={handleTopup} />}
        </BottomModal>
    );
}
function ModalReceive({ visible, onClose, accountNumber }: { visible: boolean; onClose: () => void; accountNumber?: string }) {
    const Colors = useColors();
    const displayAccount = accountNumber || '—';
    return (
        <BottomModal visible={visible} onClose={onClose} title="Receive Money" subtitle="Share your payment details">
            <View style={{ backgroundColor: Colors.bg, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: Colors.ink3, marginBottom: 5 }}>Account Number</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: '700', color: Colors.ink, letterSpacing: 2 }}>{displayAccount}</Text>
            </View>
            <BtnPrimary title="Copy Account Number" onPress={() => Alert.alert('Copied!', `Account number copied: ${displayAccount}`)} />
        </BottomModal>
    );
}
function ModalExchange({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Currency Exchange" subtitle="Live rates">
            <Field label="From" placeholder="PKR — Pakistani Rupee" />
            <Field label="To" placeholder="USD — US Dollar" />
            <Field label="Amount" placeholder="0.00" type="numeric" />
            <View style={{ backgroundColor: Colors.greenl, borderRadius: 11, padding: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: Colors.g1, fontWeight: '600' }}>Rate: 1 USD = 278.50 PKR</Text>
            </View>
            <BtnPrimary title="Exchange Now" onPress={onClose} />
        </BottomModal>
    );
}
function ModalBill({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Pay Utilities" subtitle="LESCO, SNGPL, WAPDA">
            <Field label="Utility Type" placeholder="Electricity, Gas, Water..." />
            <Field label="Consumer Number" placeholder="Reference number" />
            <BtnPrimary title="Fetch Bill" onPress={onClose} />
            <BtnOutline title="Cancel" onPress={onClose} />
        </BottomModal>
    );
}
function ModalEasyLoad({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Easyload" subtitle="Mobile top-up">
            <Field label="Mobile Number" placeholder="0300-1234567" type="phone-pad" />
            <Field label="Network" placeholder="Jazz / Telenor / Zong / Ufone" />
            <Field label="Amount (PKR)" placeholder="100, 200, 500..." type="numeric" />
            <BtnPrimary title="Load Now" onPress={onClose} />
        </BottomModal>
    );
}
function ModalEasyLoan({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Easy Loan" subtitle="Quick loan application">
            <View style={{ backgroundColor: Colors.gl, borderRadius: 13, padding: 14, marginBottom: 14 }}>
                <Text style={{ fontSize: 12, color: Colors.g2, fontWeight: '600' }}>Your approved limit</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.gd }}>PKR 50,000</Text>
            </View>
            <Field label="Loan Amount" placeholder="Min 5,000 — Max 50,000" type="numeric" />
            <Field label="Duration" placeholder="3 / 6 / 12 months" />
            <BtnPrimary title="Apply Now" onPress={onClose} />
        </BottomModal>
    );
}
function ModalSaving({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Saving Account" subtitle="Grow your savings safely">
            <Field label="Account Type" placeholder="Standard / Premium Saving" />
            <Field label="Monthly Target (PKR)" placeholder="How much do you want to save?" type="numeric" />
            <View style={{ backgroundColor: Colors.gl, borderRadius: 11, padding: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: Colors.g1, fontWeight: '600' }}>Interest Rate: 8.5% p.a.</Text>
            </View>
            <BtnPrimary title="Open Account" onPress={onClose} />
        </BottomModal>
    );
}
function ModalScanning({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Scan & Pay" subtitle="Scan a QR code to pay">
            <View style={{ backgroundColor: Colors.bg, borderRadius: 16, padding: 30, alignItems: 'center', marginBottom: 14 }}>
                <Ionicons name="qr-code" size={60} color={Colors.g1} />
                <Text style={{ fontSize: 12, color: Colors.ink3, marginTop: 8 }}>Open camera or upload a QR image</Text>
            </View>
            <BtnPrimary title="Open Camera" onPress={onClose} />
        </BottomModal>
    );
}
function ModalBiometric({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Biometric Setup" subtitle="Fingerprint ya Face ID">
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.redl, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name="finger-print" size={34} color={Colors.red} />
                </View>
                <Text style={{ fontSize: 14, color: Colors.ink2 }}>Biometric is already active</Text>
            </View>
            <BtnPrimary title="Re-register" onPress={onClose} />
            <BtnOutline title="Disable" onPress={onClose} />
        </BottomModal>
    );
}
function ModalInsurance({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Insurance" subtitle="Secure your future">
            <Field label="Insurance Type" placeholder="Life / Health / Vehicle" />
            <Field label="Coverage Amount" placeholder="PKR 5,00,000" type="numeric" />
            <BtnPrimary title="Get Quote" onPress={onClose} />
        </BottomModal>
    );
}
function ModalTxDetail({ visible, onClose, tx }: { visible: boolean; onClose: () => void; tx: Transaction | null }) {
    const Colors = useColors();
    if (!tx) return null;
    const isCredit = tx.type === 'credit';
    const amtColor = isCredit ? Colors.green : Colors.red;
    const amtStr = isCredit
        ? `+PKR ${tx.amount.toLocaleString('en-PK')}`
        : `-PKR ${tx.amount.toLocaleString('en-PK')}`;
    const typeIconName = isCredit ? 'arrow-down-circle' : tx.type === 'bill' ? 'flash' : tx.type === 'easyload' ? 'phone-portrait' : 'paper-plane';
    const iconBg   = isCredit ? Colors.greenl : tx.type === 'bill' ? Colors.amberl : Colors.redl;
    const iconColor = isCredit ? Colors.green : tx.type === 'bill' ? Colors.amber : Colors.red;
    const date = new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const rows = [
        { label: 'Amount',      val: amtStr,           color: amtColor },
        { label: 'Status',      val: tx.status === 'completed' ? 'Success ✓' : tx.status, color: tx.status === 'completed' ? Colors.green : Colors.amber },
        { label: 'Reference',   val: tx.reference,     color: Colors.ink },
        { label: 'Type',        val: tx.type,          color: Colors.ink },
        ...(tx.recipient_name ? [{ label: 'Recipient', val: tx.recipient_name, color: Colors.ink }] : []),
        ...(tx.recipient_phone ? [{ label: 'Phone', val: tx.recipient_phone, color: Colors.ink }] : []),
        ...(tx.fee > 0 ? [{ label: 'Fee', val: `PKR ${tx.fee}`, color: Colors.ink }] : []),
    ];
    return (
        <BottomModal visible={visible} onClose={onClose} title="Transaction Detail" subtitle={date}>
            <View style={{ backgroundColor: Colors.bg, borderRadius: 16, padding: 18, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={typeIconName} size={24} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900', fontSize: 15, color: Colors.ink }} numberOfLines={1}>{tx.description || tx.reference}</Text>
                        <Text style={{ fontSize: 12, color: Colors.ink3 }}>{date}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {rows.map(item => (
                        <View key={item.label} style={{ flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: 11, padding: 10 }}>
                            <Text style={{ fontSize: 10, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: item.color, marginTop: 2 }} numberOfLines={1}>{item.val}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <BtnOutline title="Close" onPress={onClose} />
        </BottomModal>
    );
}
function ModalSearch({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Search" subtitle="Kuch bhi dhundein">
            <Field label="" placeholder="Transaction, service ya feature..." />
            <Text style={{ fontSize: 12, color: Colors.ink3, marginBottom: 8 }}>Recent Searches</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {['LESCO', 'Easyload', 'Send Money'].map(t => (
                    <TouchableOpacity key={t} style={{ backgroundColor: Colors.gl, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                        <Text style={{ color: Colors.g2, fontSize: 12 }}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </BottomModal>
    );
}
function ModalNotif({ visible, onClose }: any) {
    const Colors = useColors();
    return (
        <BottomModal visible={visible} onClose={onClose} title="Notifications" subtitle="Recent activity">
            {[
                { icon: 'cash' as const, bg: Colors.greenl, title: 'Salary Credit', sub: 'PKR 1,20,000 received' },
                { icon: 'warning' as const, bg: Colors.amberl, title: 'Bill Due', sub: 'LESCO bill due tomorrow' },
                { icon: 'shield-checkmark' as const, bg: Colors.bluel, title: 'New Login', sub: 'New device login detected' },
            ].map((n, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Colors.ink4 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: n.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={n.icon} size={18} color={i === 0 ? Colors.green : i === 1 ? Colors.amber : Colors.blue} />
                    </View>
                    <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.ink }}>{n.title}</Text>
                        <Text style={{ fontSize: 11, color: Colors.ink3 }}>{n.sub}</Text>
                    </View>
                </View>
            ))}
        </BottomModal>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: Colors.ink4 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '900', fontSize: 13 },
    greeting: { fontSize: 11, color: Colors.ink3 },
    name: { fontWeight: '900', fontSize: 16, color: Colors.ink, letterSpacing: -0.3 },
    iconBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    badge: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.white },
    balCard: { margin: 14, borderRadius: 22, padding: 20 },
    balTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    balLabel: { fontSize: 10, fontWeight: '600', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.9, color: '#fff' },
    smallBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
    smallBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
    balAmount: { fontSize: 29, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 4 },
    balVsMonth: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
    balBadge: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: '700' },
    incExpRow: { flexDirection: 'row', gap: 8 },
    miniCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 10 },
    miniLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    miniAmt: { fontSize: 14, fontWeight: '700', color: '#fff' },
    greenBadge: { color: '#aaffcc', fontSize: 9, fontWeight: '700', marginTop: 3 },
    redBadge: { color: '#ffbbbb', fontSize: 9, fontWeight: '700', marginTop: 3 },
    qaGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 14 },
    // Zero-balance empty state
    emptyCard: {
        marginHorizontal: 14,
        marginTop: 14,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.g1,
        borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 17, fontWeight: '900', color: Colors.ink, marginBottom: 8, textAlign: 'center' },
    emptySub: { fontSize: 13, color: Colors.ink3, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    emptyBtn: {
        backgroundColor: Colors.g1,
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 13,
    },
    emptyBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
    qaCard: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.ink4 },
    qaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    qaLabel: { fontSize: 10, fontWeight: '600', color: Colors.ink2 },
    section: { backgroundColor: Colors.white, margin: 14, marginBottom: 0, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.ink4 },
    sectionTitle: { fontWeight: '900', fontSize: 15, color: Colors.ink },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    txBorder: { borderTopWidth: 1, borderTopColor: Colors.ink4 },
    txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    txTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink },
    txDate: { fontSize: 11, color: Colors.ink3, marginTop: 1 },
    txAmt: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
    serviceHeader: { fontSize: 12, fontWeight: '700', color: Colors.g1, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    svcItem: { width: '22%', alignItems: 'center', gap: 6 },
    svcIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    svcLabel: { fontSize: 9, fontWeight: '600', color: Colors.ink2, textAlign: 'center', lineHeight: 13 },
    walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
