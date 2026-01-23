import Dexie, { type Table } from 'dexie';

export interface Category {
    id?: number;
    name: string;
    parentId?: number; // null for top-level
    description?: string;
}

export interface Customer {
    id?: number;
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    currentBalance: number; // +ve means customer owes shop (credit), -ve means shop owes customer (advance)
}

export interface ProductBatch {
    id?: number;
    productId: number;
    batchNumber: string;
    lotNumber?: string;
    purchaseDate: string;
    expiryDate: string;
    supplierId?: number;
    initialStock: number;
    currentStock: number;
    buyPrice: number;
    notes?: string;
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
    stock: number; // Total stock (sum of batches if tracked)
    category: string;
    categoryId?: number;
    reorderLevel: number;
    ean?: string;
    color?: string;
    size?: string;
    availability?: string;
    internalId?: string;
    expiryDate?: string | null; // Deprecated for batch-tracked items
    isBatchTracked?: boolean;
}

export interface Sale {
    id?: number;
    date: string;
    items: Array<{
        productId: number;
        batchId?: number; // Track which batch this item came from
        name: string;
        qty: number;
        price: number;
        itemDiscount?: number; // Discount per item if any
        scheme?: string;
    }>;
    subtotal: number;
    discount: number; // Bill level discount amount
    tax?: number;
    total: number;
    customerId?: number;
    paymentType?: 'cash' | 'credit' | 'card' | 'mobile';
    dueAmount?: number; // If credit sale, how much is due
}

export interface Payment {
    id?: number;
    customerId: number;
    amount: number;
    date: string;
    type: 'received' | 'given'; // received from customer, given to customer (refund/return)
    notes?: string;
}

export interface Supplier {
    id?: number;
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    currentBalance: number; // +ve: Shop owes Supplier (Payable), -ve: Supplier owes Shop (Advance)
}

export interface Purchase {
    id?: number;
    date: string;
    supplierId: number;
    supplierName?: string;
    items: Array<{
        productId: number;
        name: string;
        qty: number;
        buyPrice: number;
        total: number;
    }>;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    notes?: string;
}

export interface SupplierPayment {
    id?: number;
    supplierId: number;
    amount: number;
    date: string;
    type: 'paid' | 'received_refund'; // paid to supplier
    notes?: string;
}

export interface Expense {
    id?: number;
    date: string;
    category: string;
    amount: number;
    description?: string;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'bank_transfer';
}

export class InventoryDB extends Dexie {
    products!: Table<Product>;
    product_batches!: Table<ProductBatch>;
    sales!: Table<Sale>;
    categories!: Table<Category>;
    customers!: Table<Customer>;
    payments!: Table<Payment>;
    suppliers!: Table<Supplier>;
    purchases!: Table<Purchase>;
    supplier_payments!: Table<SupplierPayment>;
    expenses!: Table<Expense>;

    constructor() {
        super('InventoryDB');
        this.version(7).stores({
            products: '++id, name, category, categoryId, brand, ean, internalId, expiryDate, discountPercent, scheme',
            sales: '++id, date, total, discount, customerId, paymentType',
            categories: '++id, name, parentId',
            customers: '++id, name, phone, currentBalance',
            payments: '++id, customerId, date, type'
        });

        this.version(8).stores({
            suppliers: '++id, name, phone, currentBalance',
            purchases: '++id, date, supplierId, grandTotal',
            supplier_payments: '++id, supplierId, date'
        });

        this.version(9).stores({
            expenses: '++id, date, category'
        });

        this.version(10).stores({
            products: '++id, name, category, categoryId, brand, ean, internalId, expiryDate, discountPercent, scheme, isBatchTracked',
            product_batches: '++id, productId, batchNumber, expiryDate, supplierId'
        });
    }
}

export const db = new InventoryDB();
