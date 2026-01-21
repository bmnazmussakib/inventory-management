import { create } from 'zustand';
import { db, type Customer, type Payment } from '@/lib/db';

interface CustomerStore {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;

    fetchCustomers: () => Promise<void>;
    addCustomer: (customer: Customer) => Promise<number | undefined>;
    updateCustomer: (id: number, data: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;

    // Ledger actions
    addPayment: (payment: Payment) => Promise<void>;
    getCustomer: (id: number) => Promise<Customer | undefined>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customers: [],
    isLoading: false,
    error: null,

    fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            const customers = await db.customers.toArray();
            set({ customers });
        } catch (error) {
            set({ error: 'Failed to fetch customers' });
            console.error(error);
        } finally {
            set({ isLoading: false });
        }
    },

    getCustomer: async (id: number) => {
        return await db.customers.get(id);
    },

    addCustomer: async (customer: Customer) => {
        try {
            const id = await db.customers.add(customer);
            await get().fetchCustomers(); // Refresh list
            return id as number;
        } catch (error) {
            set({ error: 'Failed to add customer' });
            console.error(error);
        }
    },

    updateCustomer: async (id: number, data: Partial<Customer>) => {
        try {
            await db.customers.update(id, data);
            await get().fetchCustomers();
        } catch (error) {
            set({ error: 'Failed to update customer' });
            console.error(error);
        }
    },

    deleteCustomer: async (id: number) => {
        try {
            await db.customers.delete(id);
            await get().fetchCustomers();
        } catch (error) {
            set({ error: 'Failed to delete customer' });
            console.error(error);
        }
    },

    addPayment: async (payment: Payment) => {
        try {
            await db.transaction('rw', db.customers, db.payments, async () => {
                await db.payments.add(payment);

                const customer = await db.customers.get(payment.customerId);
                if (customer && customer.id) {
                    let newBalance = customer.currentBalance;

                    if (payment.type === 'received') {
                        // Customer paying us, balance decreases
                        newBalance -= payment.amount;
                    } else {
                        // We paying customer / refund, balance increases (credit increases or advance decreases)
                        newBalance += payment.amount;
                    }

                    await db.customers.update(customer.id, { currentBalance: newBalance });
                }
            });
            await get().fetchCustomers(); // Refresh to show new balance
        } catch (error) {
            set({ error: 'Failed to add payment' });
            console.error(error);
            throw error;
        }
    }
}));
