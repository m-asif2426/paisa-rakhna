// ─────────────────────────────────────────────────────────────────────────────
// Paisa Rakhna — Push Notification Service (FCM via Expo)
//
// HOW IT WORKS:
//   1. User logs in → registerForPushNotifications() called
//   2. App requests permission from user
//   3. Expo generates a push token (uses FCM under the hood on Android)
//   4. Token sent to backend: POST /api/device/register
//   5. Backend stores token in users.fcm_token column
//   6. Laravel backend sends notifications via this token
//
// REQUIRES (one-time setup):
//   - Firebase project: https://console.firebase.google.com
//   - Download google-services.json → place in project root
//   - Add FCM_SERVER_KEY to Laravel .env
//
// ─────────────────────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { DeviceAPI } from './api';

// ── Configure how notifications appear while app is open ─────────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert:   true,
        shouldPlaySound:   true,
        shouldSetBadge:    true,
        shouldShowBanner:  true,
        shouldShowList:    true,
    }),
});

// ── Register device and send token to backend ─────────────────────────────────
export async function registerForPushNotifications(): Promise<void> {
    // Push notifications only work on real devices (not emulator/simulator)
    if (!Device.isDevice) {
        console.log('[Push] Skipping — not a real device');
        return;
    }

    // Android: create notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('paisa-rakhna', {
            name:               'Paisa Rakhna Notifications',
            importance:         Notifications.AndroidImportance.MAX,
            vibrationPattern:   [0, 250, 250, 250],
            lightColor:         '#16a265',
            sound:              'default',
            enableVibrate:      true,
            showBadge:          true,
        });
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[Push] Permission denied by user');
        return;
    }

    // Get Expo push token (wraps FCM token on Android)
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    console.log('[Push] Token obtained:', expoPushToken.substring(0, 30) + '...');

    // Send to backend — stored in users.fcm_token
    try {
        await DeviceAPI.registerFcmToken(expoPushToken);
        console.log('[Push] Token registered with backend ✓');
    } catch (err) {
        // Non-fatal — notifications can be set up again on next launch
        console.warn('[Push] Could not register token with backend:', err);
    }
}

// ── Listen for incoming notifications (app open) ──────────────────────────────
export function addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(handler);
}

// ── Listen for notification taps (user tapped it) ────────────────────────────
export function addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
}
