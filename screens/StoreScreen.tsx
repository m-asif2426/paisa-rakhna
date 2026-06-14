import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import BottomModal from '../components/BottomModal';
import TransactionSlipModal from '../components/TransactionSlipModal';
import MPinModal from '../components/MPinModal';
import { Pill } from '../components/UIKit';
import { WalletAPI, MPinAPI } from '../services/api';
import type { Transaction, TransactionSlip } from '../services/api';

const CATEGORIES = ['All', 'Food', 'Shopping', 'Travel', 'Bills', 'Send', 'Receive'];
const OFFERS = [
    { name: 'Daraz',      desc: '10% cashback on all orders',   icon: 'cart' as const,          color: '#e53935', status: 'Active' },
    { name: 'Careem',    desc: 'Ride discount PKR 200 off',     icon: 'car-sport' as const,     color: '#00b14f', status: 'Active' },
    { name: 'Foodpanda', desc: 'Free delivery for 1 month',     icon: 'fast-food' as const,     color: '#d6246d', status: 'Expiring' },
    { name: 'Jazz/Zong', desc: '5% bonus on recharge',          icon: 'phone-portrait' as const, color: '#7c3aed', status: 'Active' },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function txIcon(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
        case 'send':      return 'paper-plane';
        case 'receive':   return 'download';
        case 'add_money': return 'add-circle';
        case 'bill':      return 'flash';
        case 'easyload':  return 'phone-portrait';
        default:          return 'cash';
    }
}
function txColor(type: string, C: AppColors): string {
    switch (type) {
        case 'receive': case 'add_money': return C.greenl;
        case 'send':    return C.redl;
        default:        return C.amberl;
    }
}
function isCredit(type: string): boolean {
    return type === 'receive' || type === 'add_money';
}
function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
}

// Match category filter to transaction type
function matchCategory(tx: Transaction, cat: string): boolean {
    if (cat === 'All') return true;
    if (cat === 'Send')    return tx.type === 'send';
    if (cat === 'Receive') return tx.type === 'receive';
    return tx.description?.toLowerCase().includes(cat.toLowerCase()) ?? false;
}

// Build a TransactionSlip from a Transaction object (for detail view)
function txToSlip(tx: Transaction): TransactionSlip {
    return {
        reference:        tx.reference,
        type:             tx.type,
        amount:           tx.amount,
        currency:         tx.currency ?? 'PKR',
        status:           tx.status,
        description:      tx.description ?? '',
        sender_name:      isCredit(tx.type) ? (tx.recipient_name ?? 'Sender') : 'You',
        sender_phone:     isCredit(tx.type) ? (tx.recipient_phone ?? '') : '',
        sender_account:   '',
        receiver_name:    isCredit(tx.type) ? 'You' : (tx.recipient_name ?? 'Receiver'),
        receiver_phone:   isCredit(tx.type) ? '' : (tx.recipient_phone ?? ''),
        receiver_account: null,
        fee:              tx.fee ?? 0,
        timestamp:        tx.created_at,
    };
}

// Group transactions by date label
function groupByDate(txns: Transaction[]): { label: string; items: Transaction[] }[] {
    const today     = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const groups: Record<string, Transaction[]> = {};

    txns.forEach(tx => {
        const d = new Date(tx.created_at); d.setHours(0,0,0,0);
        let label: string;
        if (d.getTime() === today.getTime())     label = 'Today';
        else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
        else label = d.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// ── component ─────────────────────────────────────────────────────────────────
export default function StoreScreen() {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery]       = useState('');
    const [modal, setModal]                   = useState<string | null>(null);
    const [transactions, setTransactions]     = useState<Transaction[]>([]);
    const [loading, setLoading]               = useState(false);
    const [refreshing, setRefreshing]         = useState(false);
    const [loadingMore, setLoadingMore]       = useState(false);
    const [page, setPage]                     = useState(1);
    const [lastPage, setLastPage]             = useState(1);
    const [selectedTx, setSelectedTx]         = useState<Transaction | null>(null);

    // M-PIN gate — transactions are locked until verified each session
    const [isUnlocked, setIsUnlocked]         = useState(false);
    const [mpinVisible, setMpinVisible]       = useState(true); // show on screen open
    const [mpinError, setMpinError]           = useState('');

    const loadTransactions = useCallback(async (pg = 1, append = false) => {
        try {
            const res = await WalletAPI.getTransactions(pg);
            if (res.success) {
                const newData = res.data.data;
                setTransactions(prev => append ? [...prev, ...newData] : newData);
                setPage(res.data.current_page);
                setLastPage(res.data.last_page);
            }
        } catch { /* silently fail */ }
    }, []);

    const handleMPinSuccess = useCallback(async (mpin: string) => {
        try {
            await MPinAPI.verify(mpin);
            setMpinVisible(false);
            setIsUnlocked(true);
            setMpinError('');
            setLoading(true);
            loadTransactions(1).finally(() => setLoading(false));
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMpinError(e.message ?? 'Incorrect M-PIN. Please try again.');
        }
    }, [loadTransactions]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTransactions(1);
        setRefreshing(false);
    };

    const handleLoadMore = async () => {
        if (loadingMore || page >= lastPage) return;
        setLoadingMore(true);
        await loadTransactions(page + 1, true);
        setLoadingMore(false);
    };

    // Filter transactions
    const filtered = transactions
        .filter(tx => matchCategory(tx, activeCategory))
        .filter(tx => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                tx.description?.toLowerCase().includes(q) ||
                tx.reference?.toLowerCase().includes(q) ||
                tx.recipient_name?.toLowerCase().includes(q) ||
                tx.recipient_phone?.includes(q)
            );
        });

    const groups = groupByDate(filtered);

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* M-PIN gate — must verify before viewing transaction history */}
            <MPinModal
                visible={mpinVisible}
                onClose={() => setMpinVisible(false)}
                onSuccess={handleMPinSuccess}
                title="View Transactions"
                subtitle="Enter M-PIN to view your transaction history"
            />

            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Store</Text>
                    <Text style={s.headerSub}>Offers, vouchers & more</Text>
                </View>
                <TouchableOpacity style={s.searchBtn} onPress={() => setModal('search')}>
                    <Ionicons name="search" size={18} color={Colors.g1} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.g1} />}
                onScrollEndDrag={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 60) {
                        handleLoadMore();
                    }
                }}
                scrollEventThrottle={400}
            >
                {/* Featured Banner */}
                <View style={s.banner}>
                    <Text style={s.bannerBadge}>Special Offer</Text>
                    <Text style={s.bannerTitle}>Cashback 10%</Text>
                    <Text style={s.bannerSub}>Shop with your Paisa Rakhna card</Text>
                    <TouchableOpacity style={s.claimBtn}>
                        <Text style={s.claimText}>Claim Now →</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity
                            key={c}
                            style={[s.chip, activeCategory === c && s.chipSel]}
                            onPress={() => setActiveCategory(c)}
                        >
                            <Text style={[s.chipText, activeCategory === c && s.chipTextSel]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Offers List */}
                <View style={s.card}>
                    {OFFERS.map((offer, i) => (
                        <TouchableOpacity key={offer.name} style={[s.offerRow, i < OFFERS.length - 1 && s.borderBottom]}>
                            <View style={s.offerLeft}>
                                <View style={[s.offerIcon, { backgroundColor: offer.color + '18' }]}>
                                    <Ionicons name={offer.icon} size={22} color={offer.color} />
                                </View>
                                <View>
                                    <Text style={s.offerName}>{offer.name}</Text>
                                    <Text style={s.offerDesc}>{offer.desc}</Text>
                                </View>
                            </View>
                            <Pill
                                label={offer.status}
                                bg={offer.status === 'Expiring' ? Colors.amberl : Colors.greenl}
                                color={offer.status === 'Expiring' ? Colors.amber : Colors.green}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transaction History */}
                <View style={[s.card, { marginBottom: 20 }]}>
                    <Text style={s.txHeader}>Transaction History</Text>

                    {/* Category filter */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                        {CATEGORIES.map(c => (
                            <TouchableOpacity key={c} style={[s.chip, activeCategory === c && s.chipSel]} onPress={() => setActiveCategory(c)}>
                                <Text style={[s.chipText, activeCategory === c && s.chipTextSel]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {!isUnlocked ? (
                        /* Locked state — tap to enter M-PIN */
                        <TouchableOpacity
                            style={{ padding: 32, alignItems: 'center' }}
                            onPress={() => setMpinVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="lock-closed" size={40} color={Colors.ink3} style={{ marginBottom: 10 }} />
                            <Text style={{ color: Colors.ink, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
                                Transactions Locked
                            </Text>
                            <Text style={{ color: Colors.ink3, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
                                Enter your M-PIN to view transaction history
                            </Text>
                            <View style={{ backgroundColor: Colors.g1, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20 }}>
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enter M-PIN</Text>
                            </View>
                        </TouchableOpacity>
                    ) : loading ? (
                        <View style={{ padding: 32, alignItems: 'center' }}>
                            <ActivityIndicator color={Colors.g1} />
                            <Text style={{ color: Colors.ink3, marginTop: 10, fontSize: 12 }}>Loading transactions...</Text>
                        </View>
                    ) : groups.length === 0 ? (
                        <View style={{ padding: 32, alignItems: 'center' }}>
                            <Ionicons name="mail-open" size={36} color={Colors.ink3} style={{ marginBottom: 10 }} />
                            <Text style={{ color: Colors.ink3, fontSize: 13 }}>No transactions yet</Text>
                        </View>
                    ) : (
                        groups.map(group => (
                            <View key={group.label}>
                                <View style={s.txGroup}><Text style={s.txGroupLabel}>{group.label}</Text></View>
                                {group.items.map((tx, i) => (
                                    <TouchableOpacity
                                        key={tx.id}
                                        style={[s.txRow, i > 0 && s.borderTop]}
                                        onPress={() => { setSelectedTx(tx); setModal('txDetail'); }}
                                    >
                                        <View style={[s.txIconBox, { backgroundColor: txColor(tx.type, Colors) }]}>
                                            <Ionicons name={txIcon(tx.type)} size={17} color={isCredit(tx.type) ? Colors.green : Colors.ink} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 11 }}>
                                            <Text style={s.txTitle} numberOfLines={1}>{tx.description ?? tx.type}</Text>
                                            <Text style={s.txDate}>{formatTime(tx.created_at)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[s.txAmt, { color: isCredit(tx.type) ? Colors.green : Colors.red }]}>
                                                {isCredit(tx.type) ? '+' : '-'}{tx.amount.toLocaleString()}
                                            </Text>
                                            <Pill
                                                label={isCredit(tx.type) ? 'Credit' : 'Debit'}
                                                bg={isCredit(tx.type) ? Colors.greenl : Colors.redl}
                                                color={isCredit(tx.type) ? Colors.green : Colors.red}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))
                    )}

                    {loadingMore && (
                        <View style={{ padding: 16, alignItems: 'center' }}>
                            <ActivityIndicator color={Colors.g1} size="small" />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Transaction Slip */}
            <TransactionSlipModal
                visible={modal === 'txDetail' && selectedTx !== null}
                slip={selectedTx ? txToSlip(selectedTx) : null}
                onClose={() => { setModal(null); setSelectedTx(null); }}
            />

            {/* Search Modal */}
            <BottomModal visible={modal === 'search'} onClose={() => setModal(null)} title="Search Transactions" subtitle="">
                <TextInput
                    style={{ backgroundColor: Colors.bg, borderRadius: 13, padding: 13, marginBottom: 14, fontSize: 14, color: Colors.ink }}
                    placeholder="Reference, description, phone..."
                    placeholderTextColor={Colors.ink3}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                />
                {searchQuery.trim().length > 0 && (
                    <Text style={{ fontSize: 12, color: Colors.ink3 }}>
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                    </Text>
                )}
                {searchQuery.trim().length === 0 && (
                    <>
                        <Text style={{ fontSize: 12, color: Colors.ink3, marginBottom: 8 }}>Recent Searches</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {['Send', 'Receive', 'Top-up'].map(t => (
                                <TouchableOpacity key={t} onPress={() => { setSearchQuery(t); setModal(null); }}
                                    style={{ backgroundColor: Colors.gl, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                                    <Text style={{ color: Colors.g1, fontSize: 12, fontWeight: '600' }}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </BottomModal>
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1.5, borderBottomColor: Colors.ink4 },
    headerTitle: { fontWeight: '900', fontSize: 19, color: Colors.ink, letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: Colors.ink3 },
    searchBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    banner: { margin: 14, borderRadius: 18, padding: 18, backgroundColor: Colors.g1, overflow: 'hidden' },
    bannerBadge: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
    bannerTitle: { fontWeight: '900', fontSize: 20, color: '#fff', marginBottom: 4 },
    bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 14 },
    claimBtn: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
    claimText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    chipsRow: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
    chip: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.ink4, backgroundColor: Colors.white },
    chipSel: { backgroundColor: Colors.g1, borderColor: Colors.g1 },
    chipText: { fontSize: 11, fontWeight: '600', color: Colors.ink3 },
    chipTextSel: { color: '#fff' },
    card: { backgroundColor: Colors.white, marginHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: Colors.ink4, marginBottom: 14, overflow: 'hidden' },
    offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    offerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    offerIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    offerName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
    offerDesc: { fontSize: 11, color: Colors.ink3 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.ink4 },
    txHeader: { fontWeight: '900', fontSize: 15, color: Colors.ink, padding: 14, paddingBottom: 8 },
    txGroup: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.bg },
    txGroupLabel: { fontSize: 10, fontWeight: '700', color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.6 },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
    borderTop: { borderTopWidth: 1, borderTopColor: Colors.ink4 },
    txIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink },
    txDate: { fontSize: 11, color: Colors.ink3, marginTop: 1 },
    txAmt: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
});
