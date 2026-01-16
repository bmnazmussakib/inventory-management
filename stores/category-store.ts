import { create } from 'zustand';
import { db, type Category, type Product } from '@/lib/db';

export interface CategoryWithStats extends Category {
    productCount: number;
    depth: number;
    children?: CategoryWithStats[];
}

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    fetchCategories: () => Promise<void>;
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: number, category: Omit<Category, 'id'>) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    isLoading: false,

    fetchCategories: async () => {
        set({ isLoading: true });
        try {
            const categories = await db.categories.toArray();
            set({ categories });
        } catch (error) {
            console.error('Fetch categories error:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addCategory: async (category) => {
        try {
            await db.categories.add(category);
            await get().fetchCategories();
        } catch (error) {
            console.error('Add category error:', error);
        }
    },

    updateCategory: async (id, category) => {
        try {
            await db.categories.update(id, category);
            await get().fetchCategories();
        } catch (error) {
            console.error('Update category error:', error);
        }
    },

    deleteCategory: async (id) => {
        try {
            // Check for children
            const children = await db.categories.where('parentId').equals(id).count();
            if (children > 0) {
                throw new Error('HAS_CHILDREN');
            }

            // Move products to uncategorized (id: undefined or 0)
            await db.products.where('categoryId').equals(id).modify({ categoryId: undefined });

            await db.categories.delete(id);
            await get().fetchCategories();
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    }
}));

// Helper to build the hierarchical tree
export const buildCategoryTree = (
    categories: Category[],
    allProducts: Product[],
    parentId: number | undefined = undefined,
    depth = 0
): CategoryWithStats[] => {
    return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => {
            const children = buildCategoryTree(categories, allProducts, cat.id, depth + 1);
            const productCount = allProducts.filter(p => p.categoryId === cat.id).length;

            return {
                ...cat,
                depth,
                productCount,
                children: children.length > 0 ? children : undefined
            };
        });
};

// Flatten tree for table display (with indentation info)
export const flattenCategoryTree = (tree: CategoryWithStats[]): CategoryWithStats[] => {
    let flattened: CategoryWithStats[] = [];
    tree.forEach(node => {
        flattened.push(node);
        if (node.children) {
            flattened = flattened.concat(flattenCategoryTree(node.children));
        }
    });
    return flattened;
};
