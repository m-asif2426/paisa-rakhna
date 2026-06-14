import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Dimensions, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import BottomModal from '../components/BottomModal';
import { Field, BtnPrimary, BtnOutline, Toggle, SectionLabel } from '../components/UIKit';
import { CardsAPI } from '../services/api';
import type { CardData } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 62, 380);

export default function CardsScreen() {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [cards, setCards]       = useState<CardData[]>([]);
    const [loading, setLoading]   = useState(true);
    const [activeCard, setActiveCard] = useState(0);
    const [modal, setModal]       = useState<string | null>(null);

    const openModal = (k: string) => setModal(k);
    const closeModal = () => setModal(null);

    const card = cards[activeCard] ?? null;

    useEffect(() => {
        CardsAPI.list()
            .then(res => { if (res.success) setCards(res.cards); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (field: string, currentValue: boolean) => {
        if (!card) return;
        // Optimistic update
        setCards(prev => prev.map((c, i) => i === activeCard ? { ...c, [field]: !currentValue } : c));
        try {
            const res = await CardsAPI.toggle(card.id, field);
            if (res.success) {
                setCards(prev => prev.map((c, i) => i === activeCard ? res.card : c));
            }
        } catch {
            // Revert on failure
            setCards(prev => prev.map((c, i) => i === activeCard ? { ...c, [field]: currentValue } : c));
            Alert.alert('Error', 'Could not update card setting.');
        }
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>My Cards</Text>
                    <Text style={s.headerSub}>Swipe to switch cards</Text>
                </View>
                <TouchableOpacity style={s.addBtn} onPress={() => openModal('newCard')}>
                    <Text style={s.addBtnText}>+ New Card</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={Colors.g1} size="large" />
                    <Text style={{ color: Colors.ink3, marginTop: 12 }}>Loading cards...</Text>
                </View>
            ) : cards.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                    <Ionicons name="card" size={48} color={Colors.ink3} style={{ marginBottom: 16 }} />
                    <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.ink, marginBottom: 8 }}>No Cards Yet</Text>
                    <Text style={{ color: Colors.ink3, textAlign: 'center', marginBottom: 24 }}>Your first card will be created automatically on registration.</Text>
                    <TouchableOpacity style={{ backgroundColor: Colors.g1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }} onPress={() => openModal('newCard')}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Request a Card</Text>
                    </TouchableOpacity>
                </View>
            ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* Card Slider */}
                <FlatList
                    data={cards}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_W + 12}
                    decelerationRate="fast"
                    onMomentumScrollEnd={e => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
                        setActiveCard(idx);
                    }}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    renderItem={({ item }) => (
                        <LinearGradient
                            colors={[item.color1, item.color2] as [string, string]}
                            style={[s.cardItem, { width: CARD_W }]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <View style={s.cardCircle} />
                            <View style={s.cardTop}>
                                <LinearGradient colors={['#d4a853', '#f5d27a']} style={s.chip} />
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={s.cardBrand}>Paisa Rakhna</Text>
                                    <Text style={[s.cardType, { color: '#ccc' }]}>{item.label}</Text>
                                </View>
                            </View>
                            <Text style={s.cardNum}>{item.card_number_masked}</Text>
                            <View style={s.cardBottom}>
                                <View>
                                    <Text style={s.cardExpLabel}>EXPIRES</Text>
                                    <Text style={s.cardExpiry}>{item.expiry}</Text>
                                </View>
                                <View style={[s.activePill, { backgroundColor: item.is_frozen ? '#444' : 'rgba(255,255,255,0.15)' }]}>
                                    <Text style={[s.activePillText, { color: '#fff' }]}>{item.is_frozen ? 'Frozen ❄️' : 'Active ●'}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    )}
                    keyExtractor={item => String(item.id)}
                />

                {/* Dots */}
                <View style={s.dotsRow}>
                    {cards.map((_, i) => (
                        <View key={i} style={[s.dot, { width: i === activeCard ? 20 : 6, backgroundColor: i === activeCard ? Colors.g1 : Colors.ink4 }]} />
                    ))}
                </View>

                {/* Card Info */}
                <View style={s.infoCard}>
                    <Text style={s.infoLabel}>Card Balance</Text>
                    <Text style={s.infoBalance}>PKR {(card?.balance ?? 0).toLocaleString()}</Text>
                    <Text style={s.infoLabel}>Spending Limit</Text>
                    <View style={s.limitRow}>
                        <Text style={s.limitText}>PKR 0</Text>
                        <Text style={{ color: Colors.ink3, fontSize: 12 }}>/</Text>
                        <Text style={s.limitText}>PKR {(card?.spending_limit ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={s.progressBg}>
                        <View style={[s.progressFill, { width: '0%' as any }]} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={s.limitSub}>0% used</Text>
                        <Text style={s.limitSub}>100% remaining</Text>
                    </View>
                </View>

                {/* Card Actions */}
                <View style={[s.actionCard, { paddingHorizontal: 16 }]}>
                    <SectionLabel label="Card Actions" />
                    {([
                        { icon: 'eye',        label: 'Card Preview',      key: 'cardPreview', color: '#16a265' },
                        { icon: 'bar-chart',  label: 'Manage Limit',      key: 'manageLimit', color: '#3b82f6' },
                        { icon: card?.is_frozen ? 'lock-open' : 'snow', label: card?.is_frozen ? 'Unfreeze Card' : 'Freeze Card', key: '__freeze', color: card?.is_frozen ? '#16a265' : '#3b82f6' },
                        { icon: 'lock-closed', label: 'Change PIN',       key: 'changePin',   color: '#e5373a' },
                        { icon: 'cube',       label: 'Physical Card',     key: 'physicalCard', color: '#7c3aed' },
                        { icon: 'color-palette', label: 'Custom Design',  key: 'customCard',  color: '#f5a623' },
                    ] as { icon: keyof typeof Ionicons.glyphMap; label: string; key: string; color: string }[]).map((item, i) => (
                        <TouchableOpacity key={item.key} style={[s.listRow, i > 0 && s.borderTop]}
                            onPress={() => item.key === '__freeze' ? handleToggle('is_frozen', card?.is_frozen ?? false) : openModal(item.key)}>
                            <View style={s.listLeft}>
                                <View style={[s.lic, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon} size={17} color={item.color} />
                                </View>
                                <Text style={s.listLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Controls */}
                <View style={[s.actionCard, { paddingHorizontal: 16, marginBottom: 20 }]}>
                    <SectionLabel label="Quick Controls" />
                    {([
                        { field: 'online_payments', label: 'Online Payments', sub: 'E-commerce & web',     icon: 'globe',      color: '#16a265' },
                        { field: 'international',   label: 'International',   sub: 'Foreign transactions', icon: 'airplane',   color: '#3b82f6' },
                        { field: 'atm_withdrawals', label: 'ATM Withdrawals', sub: 'Cash withdrawals',     icon: 'cash',       color: '#f5a623' },
                        { field: 'nfc_tap_pay',     label: 'NFC / Tap Pay',   sub: 'Contactless',         icon: 'radio',      color: '#7c3aed' },
                    ] as { field: string; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap; color: string }[]).map((ctrl, i) => (
                        <View key={ctrl.field} style={[s.controlRow, i > 0 && s.borderTop]}>
                            <View style={s.listLeft}>
                                <View style={[s.lic, { backgroundColor: ctrl.color + '18' }]}>
                                    <Ionicons name={ctrl.icon} size={17} color={ctrl.color} />
                                </View>
                                <View>
                                    <Text style={s.listLabel}>{ctrl.label}</Text>
                                    <Text style={{ fontSize: 11, color: Colors.ink3 }}>{ctrl.sub}</Text>
                                </View>
                            </View>
                            <Toggle
                                value={card ? (card[ctrl.field as keyof CardData] as boolean) : false}
                                onChange={() => handleToggle(ctrl.field, card ? (card[ctrl.field as keyof CardData] as boolean) : false)}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
            )}  {/* end loading/empty/cards conditional */}

            {/* Modals */}
            <BottomModal visible={modal === 'newCard'} onClose={closeModal} title="New Card" subtitle="Apply for a new card">
                <Field label="Card Type" placeholder="Silver / Platinum / Black / Golden" />
                <Field label="Card Label" placeholder="Shopping, Travel..." />
                <BtnPrimary title="Create Card" onPress={() => { Alert.alert('Coming Soon', 'Card creation will be available soon.'); closeModal(); }} />
            </BottomModal>
            <BottomModal visible={modal === 'cardPreview'} onClose={closeModal} title="Card Details" subtitle="Poori info dekhein">
                <View style={{ backgroundColor: Colors.bg, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: Colors.ink3, marginBottom: 5 }}>Card Number</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: Colors.ink, letterSpacing: 3 }}>{card?.card_number_masked}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    {[{ l: 'CVV', v: '•••' }, { l: 'Expiry', v: card?.expiry ?? '' }].map(it => (
                        <View key={it.l} style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: 14, padding: 12, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: Colors.ink3 }}>{it.l}</Text>
                            <Text style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: '700', color: Colors.ink }}>{it.v}</Text>
                        </View>
                    ))}
                </View>
                <BtnOutline title="Copy Card Number" onPress={() => Alert.alert('Copied!', `${card?.card_number_masked} copied.`)} />
            </BottomModal>
            <BottomModal visible={modal === 'manageLimit'} onClose={closeModal} title="Manage Limit" subtitle="Daily aur monthly cap">
                <Field label="Daily Limit (PKR)" placeholder="50,000" type="numeric" />
                <Field label="Monthly Limit (PKR)" placeholder="2,00,000" type="numeric" />
                <BtnPrimary title="Save Limits" onPress={closeModal} />
            </BottomModal>
            <BottomModal visible={modal === 'changePin'} onClose={closeModal} title="Change PIN" subtitle="Update your card PIN">
                <Field label="Current PIN" placeholder="••••" secureText />
                <Field label="New PIN" placeholder="••••" secureText />
                <Field label="Confirm PIN" placeholder="••••" secureText />
                <BtnPrimary title="Update PIN" onPress={closeModal} />
            </BottomModal>
            <BottomModal visible={modal === 'physicalCard'} onClose={closeModal} title="Physical Card" subtitle="Ghar pe delivery">
                <Field label="Delivery Address" placeholder="Street address" />
                <Field label="City" placeholder="Multan, Lahore..." />
                <View style={{ backgroundColor: Colors.amberl, borderRadius: 11, padding: 10, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: Colors.amber, fontWeight: '600' }}>Delivery: 5–7 working days</Text>
                </View>
                <BtnPrimary title="Request Card" onPress={closeModal} />
            </BottomModal>
            <BottomModal visible={modal === 'customCard'} onClose={closeModal} title="Custom Card Design" subtitle="Upload your own design">
                <View style={{ backgroundColor: Colors.bg, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink4 }}>
                    <Text style={{ fontSize: 11, color: Colors.ink3 }}>Tap image to upload</Text>
                    <Ionicons name="color-palette" size={26} color={Colors.ink2} style={{ marginVertical: 8 }} />
                </View>
                <Field label="Card Color Theme" placeholder="#hex ya color naam" />
                <BtnPrimary title="Apply Design" onPress={closeModal} />
            </BottomModal>
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1.5, borderBottomColor: Colors.ink4 },
    headerTitle: { fontWeight: '900', fontSize: 19, color: Colors.ink, letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: Colors.ink3, marginTop: 1 },
    addBtn: { backgroundColor: Colors.g1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    cardItem: { borderRadius: 22, padding: 22, marginVertical: 16, overflow: 'hidden' },
    cardCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -20 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
    chip: { width: 36, height: 24, borderRadius: 4 },
    cardBrand: { fontWeight: '900', fontSize: 13, color: '#fff', textAlign: 'right' },
    cardType: { fontSize: 9, opacity: 0.8, letterSpacing: 1, textAlign: 'right' },
    cardNum: { fontFamily: 'monospace', fontSize: 15, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', marginBottom: 18 },
    cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    cardExpLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' },
    cardHolder: { fontSize: 12, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 },
    cardExpiry: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
    activePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    activePillText: { fontSize: 10, fontWeight: '700' },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 },
    dot: { height: 5, borderRadius: 3 },
    infoCard: { backgroundColor: Colors.white, marginHorizontal: 14, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.ink4, marginBottom: 12 },
    infoLabel: { fontSize: 11, color: Colors.ink3, fontWeight: '600', marginBottom: 4 },
    infoBalance: { fontWeight: '900', fontSize: 20, color: Colors.g1, marginBottom: 12, letterSpacing: -0.5 },
    limitRow: { flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 8 },
    limitText: { fontSize: 13, fontWeight: '700', color: Colors.ink },
    progressBg: { height: 7, backgroundColor: Colors.bg, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.g1, borderRadius: 4 },
    limitSub: { fontSize: 11, color: Colors.ink3 },
    actionCard: { backgroundColor: Colors.white, marginHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: Colors.ink4, marginBottom: 12 },
    listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
    listLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    lic: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    listLabel: { fontSize: 14, color: Colors.ink },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
    borderTop: { borderTopWidth: 1, borderTopColor: Colors.ink4 },
});
