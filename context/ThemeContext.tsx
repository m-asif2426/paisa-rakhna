import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, AppColors } from '../constants/Colors';

export type { AppColors };

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    Colors: AppColors;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => {},
    Colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('@paisa_dark').then(v => {
            if (v === '1') setIsDark(true);
        });
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const next = !prev;
            AsyncStorage.setItem('@paisa_dark', next ? '1' : '0');
            return next;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, Colors: isDark ? darkColors : lightColors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

// Convenience hook — drop-in replacement for `import { Colors } from '../constants/Colors'`
export function useColors(): AppColors {
    return useContext(ThemeContext).Colors;
}
