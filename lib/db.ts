import Dexie, { type Table } from 'dexie';

export interface Category {
    id?: number;
    name: string;
    parentId?: number; // null for top-level
    description?: string;
}

export interface Product {
    id?: number;
    name: string;
    description?: string;
    brand?: string;
    buyPrice: number;
    sellPrice: number;
    discountPercent?: number; // 0-100
    scheme?: string; // e.g. "Buy 2 get 1 free"
    currency?: string;
    stock: number;
    category: string;
    categoryId?: number;
    reorderLevel: number;
    ean?: string;
    color?: string;
    size?: string;
    availability?: string;
    internalId?: string;
    expiryDate?: string | null;
}

export interface Sale {
    id?: number;
    date: string;
    items: Array<{
        productId: number;
        name: string;
        qty: number;
        price: number;
        itemDiscount?: number; // Discount per item if any
    }>;
    subtotal: number;
    discount: number; // Bill level discount amount
    total: number;
}

export class InventoryDB extends Dexie {
    products!: Table<Product>;
    sales!: Table<Sale>;
    categories!: Table<Category>;

    constructor() {
        super('InventoryDB');
        this.version(6).stores({
            products: '++id, name, category, categoryId, brand, ean, internalId, expiryDate, discountPercent, scheme',
            sales: '++id, date, total, discount',
            categories: '++id, name, parentId'
        });
    }
}

export const db = new InventoryDB();
