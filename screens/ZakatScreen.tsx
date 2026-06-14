import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';
import { RatesAPI } from '../services/api';
import type { ZakatRates } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Zakat'>;

// Static fallback if API unreachable
const FALLBACK_RATES: ZakatRates = {
    gold_rate_per_tola:   245000,
    silver_rate_per_tola: 2800,
    gold_nisab_tolas:     7.5,
    silver_nisab_tolas:   52.5,
    usd_to_pkr:           278,
    source:               'static',
    updated_at:           new Date().toISOString(),
};

type FormData = {
    gold: string; silver: string; cash: string; goods: string; receivables: string;
};

export default function ZakatScreen({ navigation }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [rates, setRates]   = useState<ZakatRates>(FALLBACK_RATES);
    const [loading, setLoading] = useState(true);
    const [form, setForm]     = useState<FormData>({ gold: '', silver: '', cash: '', goods: '', receivables: '' });
    const [result, setResult] = useState<null | { total: number; nisab: number; zakat: number; eligible: boolean }>(null);

    useEffect(() => {
        RatesAPI.getZakatRates()
            .then(res => { if (res.success) setRates(res.rates); })
            .catch(() => { /* use fallback */ })
            .finally(() => setLoading(false));
    }, []);

    const calculate = () => {
        const goldVal      = (parseFloat(form.gold)        || 0) * rates.gold_rate_per_tola;
        const silverVal    = (parseFloat(form.silver)      || 0) * rates.silver_rate_per_tola;
        const cashVal      = parseFloat(form.cash)         || 0;
        const goodsVal     = parseFloat(form.goods)        || 0;
        const receivables  = parseFloat(form.receivables)  || 0;
        const total        = goldVal + silverVal + cashVal + goodsVal + receivables;
        const nisab        = rates.silver_nisab_tolas * rates.silver_rate_per_tola;
        const eligible     = total >= nisab;
        const zakat        = eligible ? total * 0.025 : 0;
        setResult({ total, nisab, zakat, eligible });
    };

    const reset = () => {
        setForm({ gold: '', silver: '', cash: '', goods: '', receivables: '' });
        setResult(null);
    };

    const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

    const fields: { key: keyof FormData; label: string; placeholder: string; sub: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }[] = [
        { key: 'gold',        label: 'Gold',                    placeholder: 'e.g. 7.5',    sub: `Rate: ${fmt(rates.gold_rate_per_tola)} / tola`,   icon: 'ellipse',           iconColor: '#f9a825' },
        { key: 'silver',      label: 'Silver',                  placeholder: 'e.g. 52.5',   sub: `Rate: ${fmt(rates.silver_rate_per_tola)} / tola`, icon: 'ellipse-outline',   iconColor: '#90a4ae' },
        { key: 'cash',        label: 'Cash & Bank Balance',     placeholder: 'e.g. 100000', sub: 'Savings + current accounts',                      icon: 'cash',              iconColor: '#16a265' },
        { key: 'goods',       label: 'Business Goods',          placeholder: 'e.g. 50000',  sub: 'Market value of trade goods',                     icon: 'cube',              iconColor: '#3b82f6' },
        { key: 'receivables', label: 'Receivables / Loans Given', placeholder: 'e.g. 20000', sub: 'Money others owe you',                           icon: 'people',            iconColor: '#7c3aed' },
    ];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerTitle}>Zakat Calculator</Text>
                    <Text style={s.headerSub}>2.5% of total eligible assets</Text>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                {/* Nisab Banner */}
                <View style={s.infoBanner}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={s.infoTitle}>Today's Nisab Threshold</Text>
                            <Text style={s.infoValue}>{fmt(rates.silver_nisab_tolas * rates.silver_rate_per_tola)}</Text>
                            <Text style={s.infoSub}>
                                Based on silver rate • {rates.silver_nisab_tolas} tolas × {fmt(rates.silver_rate_per_tola)}/tola
                            </Text>
                            {rates.source === 'live' && (
                                <View style={s.liveBadge}>
                                    <Ionicons name="radio-button-on" size={11} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={s.liveBadgeText}>Live Rates</Text>
                                </View>
                            )}
                            {rates.source === 'static' && (
                                <View style={[s.liveBadge, { backgroundColor: 'rgba(245,166,35,0.25)' }]}>
                                    <Ionicons name="warning" size={11} color={Colors.amber} style={{ marginRight: 4 }} />
                                    <Text style={[s.liveBadgeText, { color: Colors.amber }]}>Estimated Rates</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Fields */}
                <Text style={s.sectionLabel}>Enter Your Assets</Text>
                {fields.map(f => (
                    <View key={f.key} style={s.inputCard}>
                        <View style={s.inputRow}>
                            <View style={[s.inputIcon, { backgroundColor: f.iconColor + '22' }]}>
                                <Ionicons name={f.icon} size={20} color={f.iconColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.inputLabel}>{f.label}</Text>
                                <Text style={s.inputSub}>{f.sub}</Text>
                            </View>
                        </View>
                        <TextInput
                            style={s.input}
                            value={form[f.key]}
                            onChangeText={v => {
                                if (/^\d*\.?\d*$/.test(v)) setForm(prev => ({ ...prev, [f.key]: v }));
                            }}
                            placeholder={f.key === 'cash' || f.key === 'goods' || f.key === 'receivables' ? `PKR — ${f.placeholder}` : `${f.placeholder} tolas`}
                            placeholderTextColor={Colors.ink3}
                            keyboardType="numeric"
                        />
                    </View>
                ))}

                {/* Result */}
                {result && (
                    <View style={s.resultCard}>
                        <Text style={s.resultTitle}>{result.eligible ? 'Zakat Wajib Hai ✓' : 'Zakat Nahi ✕'}</Text>
                        <View style={s.resultGrid}>
                            <View style={s.resultItem}>
                                <Text style={s.resultLabel}>Total Assets</Text>
                                <Text style={s.resultValue}>{fmt(result.total)}</Text>
                            </View>
                            <View style={s.resultItem}>
                                <Text style={s.resultLabel}>Nisab</Text>
                                <Text style={s.resultValue}>{fmt(result.nisab)}</Text>
                            </View>
                            <View style={[s.resultItem, { borderTopWidth: 1, borderTopColor: Colors.ink4, paddingTop: 12 }]}>
                                <Text style={s.resultLabel}>Zakat Due (2.5%)</Text>
                                <Text style={[s.resultValue, { color: result.eligible ? Colors.g1 : Colors.ink3, fontSize: 22 }]}>{fmt(result.zakat)}</Text>
                            </View>
                        </View>
                        {result.eligible ? (
                            <View style={s.zakatMsg}>
                                <Text style={s.zakatMsgText}>
                                    Alhamdulillah! Aap par {fmt(result.zakat)} Zakat wajib hai. Apne zarooratmand bhai-behenon mein taqseem karein.
                                </Text>
                            </View>
                        ) : (
                            <View style={[s.zakatMsg, { backgroundColor: Colors.amberl }]}>
                                <Text style={[s.zakatMsgText, { color: Colors.amber }]}>
                                    Aapki total assets Nisab se kam hain. Is saal aap par Zakat farz nahi.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Buttons */}
                <TouchableOpacity style={s.calcBtn} onPress={calculate} disabled={loading}>
                    <Text style={s.calcBtnText}>Calculate Zakat</Text>
                </TouchableOpacity>
                {result && (
                    <TouchableOpacity style={s.resetBtn} onPress={reset}>
                        <Text style={s.resetBtnText}>Reset</Text>
                    </TouchableOpacity>
                )}
                {result?.eligible && (
                    <TouchableOpacity
                        style={s.shareBtn}
                        onPress={() => Alert.alert('Share', `Total Zakat: ${fmt(result.zakat)}\n(Calculated via Paisa Rakhna)`)}
                    >
                        <Text style={s.shareBtnText}>Share Calculation</Text>
                    </TouchableOpacity>
                )}

                {/* Rates Info */}
                {!loading && (
                    <View style={s.ratesCard}>
                        <Text style={s.ratesTitle}>
                            Today's Rates {rates.source === 'live' ? '(Live)' : '(Estimated)'}
                        </Text>
                        <View style={s.ratesRow}><Text style={s.ratesLabel}>Gold</Text><Text style={s.ratesVal}>{fmt(rates.gold_rate_per_tola)} / tola</Text></View>
                        <View style={[s.ratesRow, { borderTopWidth: 1, borderTopColor: Colors.ink4 }]}><Text style={s.ratesLabel}>Silver</Text><Text style={s.ratesVal}>{fmt(rates.silver_rate_per_tola)} / tola</Text></View>
                        <View style={[s.ratesRow, { borderTopWidth: 1, borderTopColor: Colors.ink4 }]}><Text style={s.ratesLabel}>Nisab (Silver)</Text><Text style={s.ratesVal}>{rates.silver_nisab_tolas} tolas</Text></View>
                        <View style={[s.ratesRow, { borderTopWidth: 1, borderTopColor: Colors.ink4 }]}><Text style={s.ratesLabel}>Zakat Rate</Text><Text style={s.ratesVal}>2.5%</Text></View>
                        <View style={[s.ratesRow, { borderTopWidth: 1, borderTopColor: Colors.ink4 }]}><Text style={s.ratesLabel}>USD → PKR</Text><Text style={s.ratesVal}>{rates.usd_to_pkr}</Text></View>
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    safe:           { flex: 1, backgroundColor: Colors.bg },
    header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
    backBtn:        { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
    headerTitle:    { color: '#fff', fontWeight: '900', fontSize: 18 },
    headerSub:      { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    content:        { padding: 14 },
    infoBanner:     { backgroundColor: Colors.g1, borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 18, minHeight: 80, justifyContent: 'center' },
    infoTitle:      { color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
    infoValue:      { color: '#fff', fontWeight: '900', fontSize: 26, letterSpacing: -0.5 },
    infoSub:        { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4, textAlign: 'center' },
    liveBadge:      { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    liveBadgeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
    sectionLabel:   { fontSize: 12, fontWeight: '700', color: Colors.ink2, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
    inputCard:      { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.ink4 },
    inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    inputIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    inputLabel:     { fontWeight: '700', fontSize: 14, color: Colors.ink },
    inputSub:       { fontSize: 11, color: Colors.ink3, marginTop: 2 },
    input:          { backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink4, padding: 12, fontSize: 15, color: Colors.ink, fontWeight: '600' },
    resultCard:     { backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginVertical: 14, borderWidth: 1.5, borderColor: Colors.g1 },
    resultTitle:    { fontWeight: '900', fontSize: 18, color: Colors.ink, marginBottom: 14, textAlign: 'center' },
    resultGrid:     { gap: 10, marginBottom: 14 },
    resultItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultLabel:    { fontSize: 13, color: Colors.ink3 },
    resultValue:    { fontWeight: '800', fontSize: 15, color: Colors.ink },
    zakatMsg:       { backgroundColor: Colors.gl, borderRadius: 12, padding: 12 },
    zakatMsgText:   { fontSize: 12, color: Colors.g2, lineHeight: 18 },
    calcBtn:        { backgroundColor: Colors.g1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
    calcBtnText:    { color: '#fff', fontWeight: '900', fontSize: 15 },
    resetBtn:       { backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.ink4, marginBottom: 10 },
    resetBtnText:   { color: Colors.ink, fontWeight: '600', fontSize: 14 },
    shareBtn:       { backgroundColor: Colors.bluel, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 14 },
    shareBtnText:   { color: Colors.blue, fontWeight: '700', fontSize: 14 },
    ratesCard:      { backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.ink4 },
    ratesTitle:     { fontWeight: '700', fontSize: 13, color: Colors.ink, marginBottom: 10 },
    ratesRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    ratesLabel:     { fontSize: 13, color: Colors.ink3 },
    ratesVal:       { fontSize: 13, fontWeight: '700', color: Colors.ink },
});
