import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    ScrollView, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useColors, AppColors } from '../context/ThemeContext';
import type { TransactionSlip } from '../services/api';

interface Props {
    visible: boolean;
    slip: TransactionSlip | null;
    onClose: () => void;
}

function fmt(n: number) {
    return 'PKR ' + n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('en-PK', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return iso; }
}

function typeLabel(type: string, C: AppColors) {
    switch (type) {
        case 'send':    return { label: 'Money Sent',       icon: 'paper-plane' as const, color: C.red };
        case 'topup':   return { label: 'Wallet Top-Up',    icon: 'add-circle' as const,  color: C.g1 };
        case 'receive': return { label: 'Money Received',   icon: 'download' as const,    color: C.green };
        default:        return { label: 'Transaction',      icon: 'cash' as const,        color: C.ink };
    }
}

export default function TransactionSlipModal({ visible, slip, onClose }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const receiptRef = useRef<View>(null);
    const [sharing, setSharing] = useState(false);

    const onShow = () => {
        Animated.spring(scaleAnim, {
            toValue: 1, useNativeDriver: true,
            damping: 14, stiffness: 180,
        }).start();
    };

    const handleShare = async () => {
        if (!slip || !receiptRef.current) return;
        setSharing(true);
        try {
            const uri = await captureRef(receiptRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Paisa Rakhna — Transaction Receipt',
            });
        } catch {
            Alert.alert('Share', 'Could not share receipt image.');
        } finally {
            setSharing(false);
        }
    };

    if (!slip) return null;

    const { label, icon, color } = typeLabel(slip.type, Colors);
    const rows = [
        { l: 'Sender Name',    v: slip.sender_name },
        { l: 'Sender Phone',   v: slip.sender_phone },
        { l: 'Sender Account', v: slip.sender_account },
        { l: 'Receiver Name',  v: slip.receiver_name },
        { l: 'Receiver Phone', v: slip.receiver_phone },
        ...(slip.receiver_account ? [{ l: 'Receiver Account', v: slip.receiver_account }] : []),
        { l: 'Description',    v: slip.description },
        { l: 'Transaction Fee',v: fmt(slip.fee) },
        { l: 'Date & Time',    v: formatDate(slip.timestamp) },
    ];

    return (
        <Modal visible={visible} transparent animationType="none" onShow={onShow} onRequestClose={onClose}>
            <View style={s.overlay}>
                <Animated.View style={[s.sheet, { transform: [{ scale: scaleAnim }] }]}>
                    {/* ── Capturable receipt area ── */}
                    <View ref={receiptRef} collapsable={false} style={{ backgroundColor: Colors.white }}>
                        {/* Header */}
                        <LinearGradient colors={[Colors.g1, Colors.gd]} style={s.header}>
                            {/* Ticket notch top */}
                            <View style={s.notchTop} />
                            <View style={s.successCircle}>
                                <Ionicons name={icon} size={30} color="#fff" />
                            </View>
                            <Text style={s.successTitle}>Transaction Successful!</Text>
                            <Text style={s.txType}>{label}</Text>
                            <Text style={s.amount}>{fmt(slip.amount)}</Text>
                            <View style={s.refBadge}>
                                <Text style={s.refText}>Ref: {slip.reference}</Text>
                            </View>
                        </LinearGradient>

                        {/* Ticket dashed divider */}
                        <View style={s.dividerRow}>
                            <View style={s.notchLeft} />
                            <View style={s.dashed} />
                            <View style={s.notchRight} />
                        </View>

                        {/* Slip body */}
                        <View style={s.bodyCapture}>
                            {rows.map((row, i) => (
                                <View key={row.l} style={[s.row, i > 0 && s.rowBorder]}>
                                    <Text style={s.rowLabel}>{row.l}</Text>
                                    <Text style={s.rowValue} numberOfLines={1} ellipsizeMode="middle">{row.v}</Text>
                                </View>
                            ))}

                            {/* Status badge */}
                            <View style={s.statusRow}>
                                <View style={[s.statusBadge, { backgroundColor: Colors.greenl }]}>
                                    <Ionicons name="checkmark-circle" size={14} color={Colors.green} style={{ marginRight: 4 }} />
                                    <Text style={{ color: Colors.green, fontWeight: '800', fontSize: 13 }}>
                                        {slip.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Watermark */}
                            <Text style={s.watermark}>Paisa Rakhna — Official Receipt</Text>
                        </View>
                    </View>

                    {/* Buttons (outside capture area) */}
                    <View style={s.btnRow}>
                        <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={sharing}>
                            {sharing
                                ? <ActivityIndicator size="small" color={Colors.g1} />
                                : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="image-outline" size={16} color={Colors.g1} />
                                    <Text style={s.shareTxt}>Share as Image</Text>
                                  </View>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
                            <Text style={s.doneTxt}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const NOTCH = 14;

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.62)',
        alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    sheet: {
        width: '100%', maxWidth: 400, backgroundColor: Colors.white,
        borderRadius: 22, overflow: 'hidden', maxHeight: '90%',
    },
    header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 36, paddingBottom: 28 },
    notchTop: { position: 'absolute', top: -NOTCH, alignSelf: 'center', width: NOTCH * 2, height: NOTCH * 2, borderRadius: NOTCH, backgroundColor: 'rgba(0,0,0,0.62)' },
    successCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    successTitle: { color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 4 },
    txType: { color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
    amount: { color: '#fff', fontWeight: '900', fontSize: 32, letterSpacing: -0.5, marginBottom: 12 },
    refBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    refText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.5 },
    // Ticket divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white },
    notchLeft: { width: NOTCH, height: NOTCH * 2, borderTopRightRadius: NOTCH, borderBottomRightRadius: NOTCH, backgroundColor: 'rgba(0,0,0,0.62)', marginLeft: -1 },
    notchRight: { width: NOTCH, height: NOTCH * 2, borderTopLeftRadius: NOTCH, borderBottomLeftRadius: NOTCH, backgroundColor: 'rgba(0,0,0,0.62)', marginRight: -1 },
    dashed: { flex: 1, borderTopWidth: 2, borderTopColor: Colors.ink4, borderStyle: 'dashed', marginHorizontal: 8 },
    // Body
    bodyCapture: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    rowBorder: { borderTopWidth: 1, borderTopColor: Colors.ink4 },
    rowLabel: { fontSize: 12, color: Colors.ink3, flex: 1 },
    rowValue: { fontSize: 13, fontWeight: '700', color: Colors.ink, flex: 1.4, textAlign: 'right' },
    statusRow: { alignItems: 'center', paddingVertical: 14 },
    statusBadge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
    watermark: { textAlign: 'center', fontSize: 10, color: Colors.ink4, paddingBottom: 12, letterSpacing: 0.4 },
    // Buttons
    btnRow: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: Colors.ink4 },
    shareBtn: { flex: 1, backgroundColor: Colors.gl, borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
    shareTxt: { color: Colors.g1, fontWeight: '700', fontSize: 14 },
    doneBtn: { flex: 1, backgroundColor: Colors.g1, borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
    doneTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
