import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TouchableWithoutFeedback, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useColors, AppColors } from '../context/ThemeContext';

interface Props {
    visible: boolean;
    onClose: () => void;
    /** Called with scanned value — e.g. phone number or PR-account */
    onScanned: (value: string) => void;
    title?: string;
}

export default function QrScannerModal({ visible, onClose, onScanned, title = 'Scan QR Code' }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const didScan = useRef(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
            didScan.current = false;
            Camera.requestCameraPermissionsAsync().then(({ status }) => {
                setHasPermission(status === 'granted');
            });
        }
    }, [visible]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (didScan.current) return;
        didScan.current = true;
        setScanned(true);
        // Small delay so camera UI doesn't flash
        setTimeout(() => {
            onScanned(data.trim());
            onClose();
        }, 300);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                        <Ionicons name="close" size={16} color={Colors.ink3} />
                        <Text style={s.closeText}> Close</Text>
                    </TouchableOpacity>
                </View>

                {/* Camera / Permission states */}
                {hasPermission === null && (
                    <View style={s.center}>
                        <ActivityIndicator color={Colors.g1} size="large" />
                        <Text style={s.statusText}>Requesting camera access...</Text>
                    </View>
                )}

                {hasPermission === false && (
                    <View style={s.center}>
                        <Ionicons name="camera-reverse" size={64} color={Colors.ink3} style={{ marginBottom: 12 }} />
                        <Text style={s.statusText}>Camera permission denied.</Text>
                        <Text style={s.statusSub}>Please enable it in your device Settings.</Text>
                        <TouchableOpacity style={s.btn} onPress={onClose}>
                            <Text style={s.btnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {hasPermission === true && !scanned && (
                    <>
                        <CameraView
                            style={s.camera}
                            facing="back"
                            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            onBarcodeScanned={handleBarCodeScanned}
                        />
                        {/* Scanning overlay */}
                        <View style={s.overlay} pointerEvents="none">
                            <View style={s.scanFrame}>
                                <View style={[s.corner, s.tl]} />
                                <View style={[s.corner, s.tr]} />
                                <View style={[s.corner, s.bl]} />
                                <View style={[s.corner, s.br]} />
                            </View>
                            <Text style={s.hint}>Point your camera at a Paisa Rakhna QR code</Text>
                        </View>
                    </>
                )}

                {scanned && (
                    <View style={s.center}>
                        <Ionicons name="checkmark-circle" size={64} color={Colors.green} style={{ marginBottom: 8 }} />
                        <Text style={s.statusText}>QR Code scanned!</Text>
                        <ActivityIndicator color={Colors.g1} style={{ marginTop: 12 }} />
                    </View>
                )}
            </View>
        </Modal>
    );
}

const FRAME = 240;
const CORNER = 24;
const BORDER = 3;

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#000' },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#111', paddingTop: 52 },
    title:       { color: '#fff', fontWeight: '800', fontSize: 17 },
    closeBtn:    { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
    closeText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
    camera:      { flex: 1 },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emoji:       { fontSize: 52, marginBottom: 16 },
    statusText:  { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    statusSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 24 },
    btn:         { backgroundColor: Colors.g1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
    btnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
    overlay:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    scanFrame:   { width: FRAME, height: FRAME, position: 'relative' },
    hint:        { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 24, textAlign: 'center', paddingHorizontal: 32 },
    corner:      { position: 'absolute', width: CORNER, height: CORNER, borderColor: Colors.g1 },
    tl:          { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
    tr:          { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
    bl:          { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
    br:          { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
});
