import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SettingsState {
    shopName: string;
    shopAddress: string;
    shopPhone: string;
    shopEmail: string;
    currency: string;
    taxRate: number;
    invoiceFooter: string;
    setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            shopName: 'Inventory Shop',
            shopAddress: 'Dhaka, Bangladesh',
            shopPhone: '+880 1234-567890',
            shopEmail: 'info@inventorybd.com',
            currency: 'BDT (৳)',
            taxRate: 0,
            invoiceFooter: 'Thank you for shopping with us!',
            setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: 'shop-settings-store', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);
