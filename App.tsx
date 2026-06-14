import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPinScreen from './screens/ForgotPinScreen';
import HomeScreen from './screens/HomeScreen';
import CardsScreen from './screens/CardsScreen';
import StoreScreen from './screens/StoreScreen';
import MoreScreen from './screens/MoreScreen';
import ZakatScreen from './screens/ZakatScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import KycScreen from './screens/KycScreen';
import { Colors } from './constants/Colors';
import ChatBot from './components/ChatBot';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './services/notifications';

function StatusBarWrapper() {
  const { isDark, Colors } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.white} />;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPin: undefined;
  Pending: undefined;
  Main: undefined;
  Zakat: undefined;
  Kyc: undefined;
};

export type TabParamList = {
  Home: undefined;
  Cards: undefined;
  Store: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();



function MainTabs() {
  const { Colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 68 + insets.bottom, backgroundColor: Colors.white,
            borderTopWidth: 0,
            paddingBottom: insets.bottom + 4, paddingTop: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 18,
          },
          tabBarActiveTintColor: Colors.g1,
          tabBarInactiveTintColor: Colors.ink,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Cards"
          component={CardsScreen}
          options={{
            tabBarLabel: 'Cards',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'card' : 'card-outline'} size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="Store"
          component={StoreScreen}
          options={{
            tabBarLabel: 'Store',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarLabel: 'Menu',
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />,
          }}
        />
      </Tab.Navigator>
      <ChatBot />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LangProvider>
            <ThemeProvider>
              <StatusBarWrapper />
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </ThemeProvider>
          </LangProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { isAuthenticated, isHydrated, login, user } = useAuth();
  const { Colors } = useTheme();
  const didRegisterPush = useRef(false);

  // Register FCM push token once after login
  useEffect(() => {
    if (isAuthenticated && !didRegisterPush.current) {
      didRegisterPush.current = true;
      registerForPushNotifications();
    }
    if (!isAuthenticated) {
      didRegisterPush.current = false;
    }
  }, [isAuthenticated]);

  // Handle foreground notifications (show an Alert)
  useEffect(() => {
    const sub = addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? 'Paisa Rakhna';
      const body  = notification.request.content.body  ?? '';
      if (body) {
        require('react-native').Alert.alert(title, body);
      }
    });
    return () => sub.remove();
  }, []);

  // Show green splash while AsyncStorage session is being read
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.g1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>💚</Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.5 }}>Paisa Rakhna</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 28 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLogin={(token, user) => login(token, user)}
                onGoRegister={() => props.navigation.navigate('Register')}
                onGoForgotPin={() => props.navigation.navigate('ForgotPin')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => (
              <RegisterScreen
                onRegistered={(token, user) => login(token, user)}
                onGoLogin={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ForgotPin">
            {(props) => (
              <ForgotPinScreen
                onBack={() => props.navigation.goBack()}
                onResetSuccess={() => props.navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
        </>
      ) : user?.kyc_status === 'verified' ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Zakat" component={ZakatScreen} />
          <Stack.Screen name="Kyc">
            {(props) => (
              <KycScreen
                onBack={() => props.navigation.goBack()}
                onSubmitted={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="Pending" component={PendingApprovalScreen} />
      )}
    </Stack.Navigator>
  );
}
