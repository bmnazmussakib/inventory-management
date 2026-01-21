import { create } from 'zustand';
import { db, type Supplier, type SupplierPayment } from '@/lib/db';

interface SupplierStore {
    suppliers: Supplier[];
    isLoading: boolean;
    error: string | null;

    fetchSuppliers: () => Promise<void>;
    addSupplier: (supplier: Supplier) => Promise<number | undefined>;
    updateSupplier: (id: number, data: Partial<Supplier>) => Promise<void>;
    deleteSupplier: (id: number) => Promise<void>;

    // Ledger actions
    addPayment: (payment: SupplierPayment) => Promise<void>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
    suppliers: [],
    isLoading: false,
    error: null,

    fetchSuppliers: async () => {
        set({ isLoading: true, error: null });
        try {
            const suppliers = await db.suppliers.toArray();
            set({ suppliers });
        } catch (error) {
            set({ error: 'Failed to fetch suppliers' });
            console.error(error);
        } finally {
            set({ isLoading: false });
        }
    },

    addSupplier: async (supplier: Supplier) => {
        try {
            const id = await db.suppliers.add(supplier);
            await get().fetchSuppliers();
            return id as number;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateSupplier: async (id: number, data: Partial<Supplier>) => {
        try {
            await db.suppliers.update(id, data);
            await get().fetchSuppliers();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    deleteSupplier: async (id: number) => {
        try {
            await db.suppliers.delete(id);
            await get().fetchSuppliers();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    addPayment: async (payment: SupplierPayment) => {
        try {
            await db.transaction('rw', db.suppliers, db.supplier_payments, async () => {
                await db.supplier_payments.add(payment);

                const supplier = await db.suppliers.get(payment.supplierId);
                if (supplier && supplier.id) {
                    let newBalance = supplier.currentBalance;

                    if (payment.type === 'paid') {
                        // Shop paying supplier -> Balance decreases (Liability decreases)
                        newBalance -= payment.amount;
                    } else {
                        // Refund received -> Balance increases (We got money back, or liability increases if we consider it as negative payment? 
                        // Actually easier: if we treat Balance as "Payable to Supplier", then Refund means we owe them MORE? No.
                        // Refund means they gave us money. 
                        // If we paid 1000 (Bal -1000). Refund 200. Bal +200?
                        // Let's stick to simple: CurrentBalance = What Shop Owes Supplier.
                        // Payment -> Reduces what we owe (-).
                        // Refund (Supplier gives money) -> Increases what we owe (we got cash, so if we returned goods, we owe less... wait).
                        // Let's assume 'received_refund' is rare. Usually 'paid'.
                        // If we return goods, we will handle that via 'Purchase Return' (not implemented yet) or negative purchase.
                        // For 'payment' table:
                        // Type 'paid' = We gave money. Liability decreases.
                        // Type 'received_refund' = They gave money back. Liability increases (we have their cash again).
                        newBalance += payment.amount;
                    }

                    await db.suppliers.update(supplier.id, { currentBalance: newBalance });
                }
            });
            await get().fetchSuppliers();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}));
