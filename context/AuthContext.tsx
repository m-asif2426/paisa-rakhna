import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { StoredUser } from '../services/auth';
import { saveSession, clearSession, getCurrentUser, hydrateSession, getSession } from '../services/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: StoredUser | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    login: (token: string, user: StoredUser) => void;
    logout: () => void;
    updateMpinStatus: (mpinSet: boolean) => void;
    updateKycStatus: (status: StoredUser['kyc_status']) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isAuthenticated: false,
    isHydrated: false,
    login: () => {},
    logout: () => {},
    updateMpinStatus: () => {},
    updateKycStatus: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<StoredUser | null>(getCurrentUser());
    const [isHydrated, setIsHydrated] = useState(false);

    // On app start — restore saved session from AsyncStorage
    useEffect(() => {
        hydrateSession().then(session => {
            if (session) {
                setUser(session.user);
            }
            setIsHydrated(true);
        });
    }, []);

    const login = useCallback((token: string, userData: StoredUser) => {
        saveSession(token, userData);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    const updateMpinStatus = useCallback((mpinSet: boolean) => {
        setUser(prev => prev ? { ...prev, has_mpin: mpinSet } : null);
    }, []);

    const updateKycStatus = useCallback((kyc_status: StoredUser['kyc_status']) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, kyc_status };
            // Persist to AsyncStorage so the status survives app restart
            const session = getSession();
            if (session) saveSession(session.token, updated);
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: user !== null,
            isHydrated,
            login,
            logout,
            updateMpinStatus,
            updateKycStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
