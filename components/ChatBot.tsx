import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
    Animated, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, AppColors } from '../context/ThemeContext';
import { ChatbotAPI } from '../services/api';

type Message = { id: string; text: string; isUser: boolean };

function getLocalResponse(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('balance') || lower.includes('kitna')) return 'Backend se connect nahi ho saka. App mein balance Home screen par dikhai deta hai.';
    if (lower.includes('send') || lower.includes('bhej')) return 'Paise bhejna: Home → Send → Phone number dalein → Amount → M-PIN se confirm karein.';
    if (lower.includes('receive') || lower.includes('lo')) return 'Paise receive karne ke liye apna QR code share karein ya account number dijiye.';
    if (lower.includes('zakat') || lower.includes('zakah')) return 'Zakat Calculator More tab mein milega. Gold/Silver rates aur nisab automatically calculate hota hai.';
    if (lower.includes('card') || lower.includes('kard')) return 'Cards tab mein apne virtual aur physical cards manage kar sakte hain.';
    if (lower.includes('bill') || lower.includes('lesco') || lower.includes('bijli')) return 'Bill payments Store tab se kar sakte hain — utilities, mobile top-up wagaira.';
    if (lower.includes('loan') || lower.includes('qarz')) return 'Loan feature abhi available nahi. Paisa Rakhna saving aur transfer ke liye hai.';
    if (lower.includes('otp') || lower.includes('verify')) return 'OTP aapke registered mobile number par bheja jata hai. Kuch minutes mein aa jata hai.';
    if (lower.includes('secur') || lower.includes('safe') || lower.includes('mehfooz')) return 'Aapka account 256-bit encryption se secure hai. M-PIN aur biometric login available hai.';
    if (lower.includes('help') || lower.includes('madad')) return 'Main aapki madad ke liye yahan hoon! Balance, send/receive, cards, ya koi bhi sawaal poochein.';
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('assalam') || lower.includes('salam')) return 'Assalamu Alaikum! Paisa Rakhna AI assistant mein khush amdeed. Kya madad kar sakta hoon?';
    return 'Mujhe samajh nahi aaya. Kripya balance, send, receive, cards, ya zakat ke bare mein poochhein.';
}

export default function ChatBot() {
    const Colors = useColors();
    const insets = useSafeAreaInsets();
    const s = makeStyles(Colors);
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', text: 'Hi! I\'m the Paisa Rakhna AI assistant. How can I help you today?', isUser: false }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg: Message = { id: Date.now().toString(), text: input.trim(), isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);
        try {
            const res = await ChatbotAPI.send(userMsg.text);
            const botMsg: Message = { id: (Date.now() + 1).toString(), text: res.reply, isUser: false };
            setMessages(prev => [...prev, botMsg]);
        } catch {
            // Backend not available — use local keyword matching
            const botMsg: Message = { id: (Date.now() + 1).toString(), text: getLocalResponse(userMsg.text), isUser: false };
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setTyping(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const toggleOpen = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 8 }),
        ]).start();
        setOpen(o => !o);
    };

    return (
        <View style={[s.container, { bottom: 76 + insets.bottom }]} pointerEvents="box-none">
            {open && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.panel}>
                    <View style={s.panelHeader}>
                        <View style={s.headerLeft}>
                            <View style={s.avatar}><Ionicons name="hardware-chip" size={18} color={Colors.g1} /></View>
                            <View>
                                <Text style={s.botName}>Paisa Rakhna AI</Text>
                                <View style={s.onlineRow}>
                                    <View style={s.onlineDot} />
                                    <Text style={s.onlineText}>Online — 24/7</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={toggleOpen} style={s.closeBtn}>
                            <Ionicons name="close" size={16} color={Colors.ink3} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={{ padding: 12, gap: 8 }} showsVerticalScrollIndicator={false}>
                        {messages.map(m => (
                            <View key={m.id} style={[s.bubble, m.isUser ? s.userBubble : s.botBubble]}>
                                <Text style={[s.bubbleText, m.isUser ? s.userText : s.botText]}>{m.text}</Text>
                            </View>
                        ))}
                        {typing && (
                            <View style={s.botBubble}>
                                <View style={s.typingRow}>
                                    {[0, 1, 2].map(i => <TypingDot key={i} delay={i * 200} />)}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                    <View style={s.inputRow}>
                        <TextInput
                            style={s.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Kuch poochein..."
                            placeholderTextColor={Colors.ink3}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                        />
                        <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
                            <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity style={s.fab} onPress={toggleOpen}>
                    <Ionicons name={open ? 'close' : 'chatbubble-ellipses'} size={22} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function TypingDot({ delay }: { delay: number }) {
    const Colors = useColors();
    const anim = useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: -5, duration: 300, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.delay(600 - delay),
            ])
        ).start();
    }, []);
    return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.g1 }, { transform: [{ translateY: anim }] }]} />;
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    container: { position: 'absolute', right: 14, alignItems: 'flex-end' },
    fab: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.g1, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.gd, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    panel: { width: 300, height: 400, backgroundColor: Colors.white, borderRadius: 20, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 15, overflow: 'hidden' },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: Colors.g1 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    botName: { color: '#fff', fontWeight: '800', fontSize: 14 },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4fffb0' },
    onlineText: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
    closeBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
    messages: { flex: 1 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 14 },
    botBubble: { backgroundColor: Colors.gl, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    userBubble: { backgroundColor: Colors.g1, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    botText: { color: Colors.ink, fontSize: 13 },
    userText: { color: '#fff', fontSize: 13 },
    bubbleText: { lineHeight: 19 },
    typingRow: { flexDirection: 'row', gap: 5, padding: 4 },
    inputRow: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: Colors.ink4 },
    input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.ink },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.g1, alignItems: 'center', justifyContent: 'center' },
});
