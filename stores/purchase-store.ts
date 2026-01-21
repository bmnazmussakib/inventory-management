import { create } from 'zustand';
import { db, type Purchase } from '@/lib/db';
import { useProductStore } from './product-store';
import { useSupplierStore } from './supplier-store';

interface PurchaseStore {
    purchases: Purchase[];
    isLoading: boolean;
    fetchPurchases: () => Promise<void>;
    addPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
    purchases: [],
    isLoading: false,

    fetchPurchases: async () => {
        set({ isLoading: true });
        try {
            const purchases = await db.purchases.orderBy('date').reverse().toArray();
            set({ purchases });
        } catch (error) {
            console.error('Failed to fetch purchases:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addPurchase: async (purchaseData) => {
        try {
            await db.transaction('rw', db.purchases, db.products, db.suppliers, async () => {
                // 1. Add Purchase Record
                await db.purchases.add(purchaseData as Purchase);

                // 2. Update Product Stock & Buy Price
                for (const item of purchaseData.items) {
                    const product = await db.products.get(item.productId);
                    if (product) {
                        // Weighted Average Price Calculation (Optional, forcing new price for now as requested or simple)
                        // Request said: "update product buyPrice to latest purchase price"
                        await db.products.update(item.productId, {
                            stock: product.stock + item.qty,
                            buyPrice: item.buyPrice // Update to latest cost
                        });
                    }
                }

                // 3. Update Supplier Balance
                // Shop owes supplier the due amount (Credit purchase)
                // Balance = Payable. so Due adds to Balance.
                const due = purchaseData.dueAmount || 0;
                if (due > 0 && purchaseData.supplierId) {
                    const supplier = await db.suppliers.get(purchaseData.supplierId);
                    if (supplier) {
                        await db.suppliers.update(supplier.id!, {
                            currentBalance: supplier.currentBalance + due
                        });
                    }
                }
            });

            // Refresh stores
            await get().fetchPurchases();
            await useProductStore.getState().fetchProducts();
            await useSupplierStore.getState().fetchSuppliers();

        } catch (error) {
            console.error('Failed to add purchase:', error);
            throw error;
        }
    }
}));
