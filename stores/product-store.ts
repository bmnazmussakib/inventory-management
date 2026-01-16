import { create } from 'zustand';
import { db, type Product } from '@/lib/db';

interface ProductState {
    products: Product[];
    isLoading: boolean;
    searchQuery: string;
    fetchProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    setSearchQuery: (query: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    searchQuery: '',

    fetchProducts: async () => {
        set({ isLoading: true });
        try {
            const allProducts = await db.products.toArray();
            set({ products: allProducts });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addProduct: async (product) => {
        try {
            await db.products.add(product as Product);
            await get().fetchProducts();
        } catch (error) {
            console.error('Failed to add product:', error);
        }
    },

    updateProduct: async (id, product) => {
        try {
            await db.products.update(id, product);
            await get().fetchProducts();
        } catch (error) {
            console.error('Failed to update product:', error);
        }
    },

    deleteProduct: async (id) => {
        try {
            await db.products.delete(id);
            await get().fetchProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    },

    setSearchQuery: (query) => set({ searchQuery: query }),
}));
