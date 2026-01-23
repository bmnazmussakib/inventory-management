import { create } from 'zustand';
import { db, type Product, type ProductBatch } from '@/lib/db';

interface ProductState {
    products: Product[];
    isLoading: boolean;
    searchQuery: string;
    fetchProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<number>; // Returning ID
    updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    setSearchQuery: (query: string) => void;
    addBatch: (batch: ProductBatch) => Promise<void>;
    updateBatch: (id: number, batch: Partial<ProductBatch>) => Promise<void>;
    deleteBatch: (id: number) => Promise<void>;
    getBatchesByProductId: (productId: number) => Promise<ProductBatch[]>;
    getProduct: (id: number) => Promise<Product | undefined>;
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
            const id = await db.products.add(product as Product);
            await get().fetchProducts();
            return id as number;
        } catch (error) {
            console.error('Failed to add product:', error);
            throw error;
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

    addBatch: async (batch: ProductBatch) => {
        try {
            await db.product_batches.add(batch);
            // Update total stock for the product
            const allBatches = await db.product_batches.where('productId').equals(batch.productId).toArray();
            const totalStock = allBatches.reduce((sum, b) => sum + b.currentStock, 0);
            await db.products.update(batch.productId, { stock: totalStock });
            await get().fetchProducts();
        } catch (error) {
            console.error('Failed to add batch:', error);
        }
    },

    updateBatch: async (id: number, batch: Partial<ProductBatch>) => {
        try {
            await db.product_batches.update(id, batch);
            // Update total stock for the product if quantity changed
            const updatedBatch = await db.product_batches.get(id);
            if (updatedBatch) {
                const allBatches = await db.product_batches.where('productId').equals(updatedBatch.productId).toArray();
                const totalStock = allBatches.reduce((sum, b) => sum + b.currentStock, 0);
                await db.products.update(updatedBatch.productId, { stock: totalStock });
                await get().fetchProducts();
            }
        } catch (error) {
            console.error('Failed to update batch:', error);
        }
    },

    deleteBatch: async (id: number) => {
        try {
            const batch = await db.product_batches.get(id);
            if (batch) {
                await db.product_batches.delete(id);
                // Update total stock
                const allBatches = await db.product_batches.where('productId').equals(batch.productId).toArray();
                const totalStock = allBatches.reduce((sum, b) => sum + b.currentStock, 0);
                await db.products.update(batch.productId, { stock: totalStock });
                await get().fetchProducts();
            }
        } catch (error) {
            console.error('Failed to delete batch:', error);
        }
    },

    getBatchesByProductId: async (productId: number) => {
        try {
            return await db.product_batches.where('productId').equals(productId).toArray();
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            return [];
        }
    },

    getProduct: async (id: number) => {
        try {
            return await db.products.get(id);
        } catch (error) {
            console.error('Failed to fetch product:', error);
            return undefined;
        }
    }
}));
