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
            await db.transaction('rw', db.sales, db.products, db.customers, async () => {
                // 1. Add the sale record
                await db.sales.add(saleData as Sale);

                // 2. Batch update product stocks
                for (const item of saleData.items) {
                    const product = await db.products.get(item.productId);
                    if (product) {
                        // Deduct from main stock
                        let newStock = product.stock - item.qty;

                        // Deduct from specific batch if batchId is updated
                        if (item.batchId) {
                            const batch = await db.product_batches.get(item.batchId);
                            if (batch) {
                                await db.product_batches.update(item.batchId, {
                                    currentStock: batch.currentStock - item.qty
                                });
                            }
                        }

                        // Update product total stock
                        await db.products.update(item.productId, {
                            stock: newStock
                        });
                    }
                }

                // 3. Update customer balance if linked
                if (saleData.customerId) {
                    const customer = await db.customers.get(saleData.customerId);
                    if (customer && customer.id) {
                        // If credit sale or partial payment, add the due amount to balance
                        // Even if full payment (cash), we might want to track volume, but balance change is 0
                        // Logic defined: dueAmount is what remains to be paid.
                        // If paymentType is 'credit', dueAmount = total usually.

                        // We rely on dueAmount passed from UI. 
                        // If dueAmount is undefined, assume 0 change (fully paid).

                        const due = saleData.dueAmount || 0;
                        if (due > 0) {
                            await db.customers.update(customer.id, {
                                currentBalance: customer.currentBalance + due
                            });
                        }
                    }
                }
            });

            // 3. Refresh stores
            await get().fetchSales();
            await useProductStore.getState().fetchProducts();
            await import('./customer-store').then(m => m.useCustomerStore.getState().fetchCustomers());
        } catch (error) {
            console.error('Failed to process sale:', error);
            throw error; // Re-throw to handle in UI (e.g., show toast)
        }
    },
}));
