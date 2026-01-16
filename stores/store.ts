import { create } from 'zustand';

interface UIState {
    isLoading: boolean;
    isMobileMenuOpen: boolean;
    theme: 'light' | 'dark';
    setLoading: (loading: boolean) => void;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
    isLoading: false,
    isMobileMenuOpen: false,
    theme: 'light',
    setLoading: (loading) => set({ isLoading: loading }),
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    setTheme: (theme) => set({ theme }),
}));
