import React, { useRef, useEffect, useState } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
    ScrollView, Animated, Dimensions, PanResponder, Keyboard, Platform
} from 'react-native';
import { useColors, AppColors } from '../context/ThemeContext';

type Props = {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

const { height: SCREEN_H } = Dimensions.get('window');

export default function BottomModal({ visible, onClose, title, subtitle, children }: Props) {
    const Colors = useColors();
    const s = makeStyles(Colors);
    const translateY = useRef(new Animated.Value(SCREEN_H)).current;
    const [kbHeight, setKbHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKbHeight(0));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
        } else {
            Animated.timing(translateY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }).start();
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, { dy }) => { if (dy > 0) translateY.setValue(dy); },
            onPanResponderRelease: (_, { dy }) => {
                if (dy > 80) { onClose(); }
                else { Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }).start(); }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={s.overlay} />
            </TouchableWithoutFeedback>
            <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
                <View {...panResponder.panHandlers} style={s.handleArea}>
                    <View style={s.handle} />
                </View>
                <ScrollView contentContainerStyle={[s.content, kbHeight > 0 && { paddingBottom: kbHeight }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={s.title}>{title}</Text>
                    {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
                    {children}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

const makeStyles = (Colors: AppColors) => StyleSheet.create({
    overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,15,10,0.55)' },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.white, borderRadius: 28, maxHeight: '85%',
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20,
        elevation: 20,
    },
    handleArea: { alignItems: 'center', paddingTop: 14, paddingBottom: 8 },
    handle: { width: 40, height: 4, backgroundColor: Colors.ink4, borderRadius: 2 },
    content: { paddingHorizontal: 20, paddingBottom: 36 },
    title: { fontWeight: '900', fontSize: 20, color: Colors.ink, marginBottom: 4 },
    sub: { fontSize: 13, color: Colors.ink3, marginBottom: 20 },
});
