'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProductStore } from '@/stores/product-store';
import { useSalesStore } from '@/stores/sales-store';
import { useCategoryStore } from '@/stores/category-store'; // Added for category management
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Search,
    CheckCircle2,
    Scan,
    Package,
    AlertTriangle,
    Printer,
    FileText,
    CreditCard,
    Banknote,
    Smartphone,
    LayoutGrid,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { bnNumber, formatPrice } from '@/lib/format';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Receipt } from '@/components/Receipt';
import { exportReceiptToPDF } from '@/lib/export-utils';
import { useNotificationStore } from '@/stores/notification-store';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CartItem {
    productId: number;
    name: string;
    qty: number;
    price: number;
    stock: number;
    discountPercent: number;
    discountedPrice: number;
    scheme?: string;
}

export default function SalesPage() {
    const t = useTranslations('Sales');
    const commonT = useTranslations('Common');
    const nt = useTranslations('Notifications');
    const locale = useLocale();

    const { products, fetchProducts } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { addSale } = useSalesStore();
    const { addNotification } = useNotificationStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [billDiscountType, setBillDiscountType] = useState<'percent' | 'amount'>('amount');
    const [billDiscountValue, setBillDiscountValue] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.barcode?.includes(searchTerm) ||
                p.category?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory ? p.categoryId === Number(selectedCategory) : true;

            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const handleScan = (code: string) => {
        setIsScanning(false);
        const product = products.find(p => p.barcode === code || p.id?.toString() === code);
        if (product) {
            addToCart(product);
            toast.success('Product added to cart');
        } else {
            toast.error(nt('notFound'));
        }
    };

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast.error(nt('outOfStock', { name: product.name }));
            return;
        }

        if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
            toast.error(nt('expired', { name: product.name }));
            return;
        }

        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
            if (existing.qty >= product.stock) {
                toast.warning(nt('limitReached'));
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            const discountPercent = product.discountPercent || 0;
            const discountedPrice = product.price * (1 - discountPercent / 100);
            setCart([...cart, {
                productId: product.id!,
                name: product.name,
                qty: 1,
                price: product.price,
                stock: product.stock,
                discountPercent: discountPercent,
                discountedPrice: discountedPrice,
                scheme: product.scheme
            }]);
        }
    };

    const updateQty = (id: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.productId === id) {
                const newQty = Math.max(1, item.qty + delta);
                if (newQty > item.stock) {
                    toast.warning(nt('limitReached'));
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.productId !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.discountedPrice), 0);
    const billDiscountAmount = useMemo(() => {
        if (billDiscountType === 'amount') return billDiscountValue;
        return (subtotal * billDiscountValue) / 100;
    }, [subtotal, billDiscountType, billDiscountValue]);
    const total = Math.max(0, subtotal - billDiscountAmount);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            const saleData = {
                date: new Date().toISOString(),
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    qty: item.qty,
                    price: item.discountedPrice,
                    itemDiscount: (item.price - item.discountedPrice) * item.qty,
                    scheme: item.scheme
                })),
                subtotal,
                discount: billDiscountAmount,
                total,
                paymentMethod
            };
            await addSale(saleData);
            setLastSale(saleData);
            setIsReceiptModalOpen(true);
            setCart([]);
            setBillDiscountValue(0);
            toast.success(nt('saveSuccess'));

            // Check for low stock notification
            cart.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && (product.stock - item.qty) <= product.reorderLevel) {
                    addNotification({
                        type: 'low_stock',
                        productId: item.productId,
                        productName: item.name,
                        message: `${item.name} low stock!`
                    });
                }
            });

        } catch (err) {
            toast.error('Failed to complete sale');
            console.error(err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6 p-6 bg-[#f8fafc] dark:bg-slate-900 overflow-hidden">
            {isScanning && (
                <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
            )}

            {/* Left Side: Product Discovery */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Search & Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder={t('searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-base bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90 h-11 px-6 font-bold"
                            onClick={() => setIsScanning(true)}
                        >
                            <Scan className="mr-2 h-4 w-4" /> {t('scanBarcode')}
                        </Button>
                    </div>
                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                selectedCategory === null
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                            )}
                        >
                            All Products
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(String(cat.id))}
                                className={cn(
                                    "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                    selectedCategory === String(cat.id)
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => {
                            const isLowStock = product.stock <= product.reorderLevel;
                            const isOutOfStock = product.stock <= 0;
                            return (
                                <button
                                    key={product.id}
                                    disabled={isOutOfStock}
                                    onClick={() => addToCart(product)}
                                    className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col text-left relative overflow-hidden disabled:opacity-50"
                                >
                                    {isLowStock && !isOutOfStock && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Low Stock
                                            </span>
                                        </div>
                                    )}

                                    <div className="aspect-[4/3] rounded-lg bg-slate-100 dark:bg-slate-900 mb-3 flex items-center justify-center relative group-hover:scale-[1.02] transition-transform">
                                        <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                    </div>

                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 line-clamp-2 min-h-[2.5em]">
                                        {product.name}
                                    </h3>
                                    <div className="mt-auto flex items-end justify-between w-full">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Stock: {product.stock}</p>
                                            <p className="text-primary font-bold">{formatPrice(product.price, locale)}</p>
                                        </div>
                                        <div className="bg-primary/10 text-primary p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50">
                                <Search className="h-12 w-12 mb-2" />
                                <p>No products found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Cart Panel */}
            <div className="w-[400px] flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <h2 className="font-bold text-lg text-slate-800 dark:text-white">{t('cart')}</h2>
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCart([])}
                        disabled={cart.length === 0}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8"
                    >
                        <Trash2 className="h-4 w-4 mr-1" /> Clear
                    </Button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.productId} className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 group">
                            <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <Package className="h-6 w-6 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{item.name}</p>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white shrink-0">
                                        {formatPrice(item.qty * item.discountedPrice, locale)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">{formatPrice(item.discountedPrice, locale)} x {item.qty}</p>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                                        <button onClick={() => updateQty(item.productId, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><Minus className="h-3 w-3" /></button>
                                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.productId, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><Plus className="h-3 w-3" /></button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => removeFromCart(item.productId)} className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 text-red-400 hover:text-red-500 bg-white/80 rounded-full shadow-sm">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <ShoppingCart className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Cart is empty</p>
                        </div>
                    )}
                </div>

                {/* Footer / Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal, locale)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={billDiscountValue || ''}
                            onChange={(e) => setBillDiscountValue(Number(e.target.value))}
                            placeholder="Discount"
                            className="h-8 text-sm bg-white dark:bg-slate-800"
                        />
                        <div className="flex bg-slate-200 dark:bg-slate-800 rounded p-1 shrink-0">
                            <button
                                onClick={() => setBillDiscountType('amount')}
                                className={cn("px-2 py-0.5 text-xs rounded font-bold", billDiscountType === 'amount' ? "bg-white shadow text-slate-900" : "text-slate-500")}
                            >৳</button>
                            <button
                                onClick={() => setBillDiscountType('percent')}
                                className={cn("px-2 py-0.5 text-xs rounded font-bold", billDiscountType === 'percent' ? "bg-white shadow text-slate-900" : "text-slate-500")}
                            >%</button>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Discount</span>
                        <span>- {formatPrice(billDiscountAmount, locale)}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                        <span className="text-2xl font-black text-primary">{formatPrice(total, locale)}</span>
                    </div>

                    <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="cash" className="text-xs">Cash</TabsTrigger>
                            <TabsTrigger value="card" className="text-xs">Card</TabsTrigger>
                            <TabsTrigger value="mobile" className="text-xs">Mobile</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        size="lg"
                        className="w-full font-bold text-lg h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                    >
                        Checkout
                    </Button>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sale Complete</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {lastSale && <Receipt sale={lastSale} />}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => exportReceiptToPDF(lastSale, 'receipt.pdf')}>
                            <FileText className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
