'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const { theme, setTheme } = useThemeStore();

    // Sync Zustand store with next-themes if needed, 
    // but next-themes is usually sufficient. 
    // We'll provide it here to satisfy the requirement.

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme={theme}
            enableSystem
            disableTransitionOnChange
            value={{
                light: 'light',
                dark: 'dark',
                system: 'system'
            }}
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
