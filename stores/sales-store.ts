import { create } from 'zustand';
import { db, type Sale } from '@/lib/db';
import { useProductStore } from './product-store';

interface SalesState {
    sales: Sale[];
    isLoading: boolean;
    fetchSales: () => Promise<void>;
    addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
    sales: [],
    isLoading: false,

    fetchSales: async () => {
        set({ isLoading: true });
        try {
            const allSales = await db.sales.orderBy('date').reverse().toArray();
            set({ sales: allSales });
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addSale: async (saleData) => {
        try {
            await db.transaction('rw', db.sales, db.products, async () => {
                // 1. Add the sale record
                await db.sales.add(saleData as Sale);

                // 2. Batch update product stocks
                for (const item of saleData.items) {
                    const product = await db.products.get(item.productId);
                    if (product) {
                        await db.products.update(item.productId, {
                            stock: product.stock - item.qty
                        });
                    }
                }
            });

            // 3. Refresh stores
            await get().fetchSales();
            await useProductStore.getState().fetchProducts();
        } catch (error) {
            console.error('Failed to process sale:', error);
            throw error; // Re-throw to handle in UI (e.g., show toast)
        }
    },
}));
