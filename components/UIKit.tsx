import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useColors, AppColors } from '../context/ThemeContext';

function useF() {
    const Colors = useColors();
    return { f: makeF(Colors), Colors };
}

// ── Field + Label ────────────────────────────────────────────────────────────
type FieldProps = { label: string; value?: string; onChange?: (v: string) => void; placeholder?: string; type?: 'default' | 'numeric' | 'phone-pad' | 'email-address'; secureText?: boolean; multiline?: boolean; rows?: number; children?: React.ReactNode; };

export function Field({ label, value, onChange, placeholder, type = 'default', secureText, multiline, rows, children }: FieldProps) {
    const { f, Colors } = useF();
    return (
        <View style={f.field}>
            <Text style={f.label}>{label}</Text>
            {children ? children : (
                <TextInput
                    style={[f.input, multiline && { height: (rows || 3) * 36 }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.ink3}
                    keyboardType={type as any}
                    secureTextEntry={secureText}
                    multiline={multiline}
                />
            )}
        </View>
    );
}

// ── Primary Button ───────────────────────────────────────────────────────────
export function BtnPrimary({ title, onPress }: { title: string; onPress?: () => void }) {
    const { f } = useF();
    return (
        <TouchableOpacity style={f.bp} onPress={onPress}>
            <Text style={f.bpText}>{title}</Text>
        </TouchableOpacity>
    );
}

// ── Outline Button ────────────────────────────────────────────────────────────
export function BtnOutline({ title, onPress }: { title: string; onPress?: () => void }) {
    const { f } = useF();
    return (
        <TouchableOpacity style={f.bo} onPress={onPress}>
            <Text style={f.boText}>{title}</Text>
        </TouchableOpacity>
    );
}

// ── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
    const { f } = useF();
    return <View style={[f.pill, { backgroundColor: bg }]}><Text style={[f.pillText, { color }]}>{label}</Text></View>;
}

// ── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    const { f, Colors } = useF();
    return (
        <TouchableOpacity
            onPress={() => onChange(!value)}
            style={[f.tog, { backgroundColor: value ? Colors.g1 : Colors.ink4 }]}
        >
            <View style={[f.togThumb, { left: value ? 24 : 4 }]} />
        </TouchableOpacity>
    );
}

// ── Section Divider ──────────────────────────────────────────────────────────
export function SectionLabel({ label }: { label: string }) {
    const { f } = useF();
    return <Text style={f.sectionLabel}>{label}</Text>;
}

// ── List Item ────────────────────────────────────────────────────────────────
export function ListItem({ icon, title, onPress, right }: { icon: string; title: string; onPress?: () => void; right?: React.ReactNode }) {
    const { f } = useF();
    return (
        <TouchableOpacity style={f.li} onPress={onPress}>
            <View style={f.liLeft}>
                <View style={f.lic}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
                <Text style={f.liTitle}>{title}</Text>
            </View>
            {right || <Text style={f.liArrow}>›</Text>}
        </TouchableOpacity>
    );
}

const makeF = (Colors: AppColors) => StyleSheet.create({
    field: { marginBottom: 14 },
    label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: Colors.ink3, marginBottom: 6 },
    input: { width: '100%', padding: 13, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.ink4, borderRadius: 13, fontSize: 14, color: Colors.ink },
    bp: { backgroundColor: Colors.g1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    bpText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    bo: { backgroundColor: 'transparent', paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.ink4, marginTop: 8 },
    boText: { color: Colors.ink, fontWeight: '600', fontSize: 14 },
    pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    pillText: { fontSize: 10, fontWeight: '700' },
    tog: { width: 46, height: 26, borderRadius: 13, position: 'relative' },
    togThumb: { position: 'absolute', top: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
    sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: Colors.ink3, paddingVertical: 12, paddingBottom: 6 },
    li: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.ink4 },
    liLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lic: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.gl, alignItems: 'center', justifyContent: 'center' },
    liTitle: { fontSize: 14, color: Colors.ink },
    liArrow: { color: Colors.ink4, fontSize: 18 },
});
