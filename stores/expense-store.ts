import { create } from 'zustand';
import { db, type Expense } from '@/lib/db';
import { liveQuery } from 'dexie';

interface ExpenseState {
    expenses: Expense[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchExpenses: () => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: number, expense: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => {
    // Setup live query subscription
    const expensesSubscription = liveQuery(() =>
        db.expenses.orderBy('date').reverse().toArray()
    );

    expensesSubscription.subscribe({
        next: (data) => set({ expenses: data }),
        error: (err) => set({ error: err.message })
    });

    return {
        expenses: [],
        isLoading: true,
        error: null,

        fetchExpenses: async () => {
            set({ isLoading: true });
            try {
                const data = await db.expenses.orderBy('date').reverse().toArray();
                set({ expenses: data, isLoading: false });
            } catch (error) {
                set({ error: (error as Error).message, isLoading: false });
            }
        },

        addExpense: async (expense) => {
            set({ isLoading: true });
            try {
                await db.expenses.add(expense);
                set({ isLoading: false });
            } catch (error) {
                set({ error: (error as Error).message, isLoading: false });
                throw error;
            }
        },

        updateExpense: async (id, expense) => {
            set({ isLoading: true });
            try {
                await db.expenses.update(id, expense);
                set({ isLoading: false });
            } catch (error) {
                set({ error: (error as Error).message, isLoading: false });
                throw error;
            }
        },

        deleteExpense: async (id) => {
            set({ isLoading: true });
            try {
                await db.expenses.delete(id);
                set({ isLoading: false });
            } catch (error) {
                set({ error: (error as Error).message, isLoading: false });
                throw error;
            }
        }
    };
});
