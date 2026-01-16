'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProductStore } from '@/stores/product-store';
import { useSalesStore } from '@/stores/sales-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Search,
    CheckCircle2,
    Scan,
    AlertCircle,
    Printer,
    FileText,
    MessageCircle,
    Package,
    CreditCard,
    Banknote,
    Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { bnNumber, formatPrice, formatBanglaDate } from '@/lib/format';
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
    const { addSale } = useSalesStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [billDiscountType, setBillDiscountType] = useState<'percent' | 'amount'>('amount');
    const [billDiscountValue, setBillDiscountValue] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');

    const { addNotification } = useNotificationStore();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products.slice(0, 12); // Show initial products
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.internalId?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 20);
    }, [products, searchTerm]);

    const handleScan = (code: string) => {
        setIsScanning(false);
        const product = products.find(p => p.id?.toString() === code || p.nan?.includes(code) || p.internalId === code);
        if (product) {
            addToCart(product);
        } else {
            toast.error(nt('notFound'));
        }
    };

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast.error(nt('outOfStock', { name: product.name }));
            return;
        }

        // Expiry Check
        if (product.expiryDate) {
            const expiry = new Date(product.expiryDate);
            if (expiry < new Date()) {
                toast.error(nt('expired', { name: product.name }), {
                    description: nt('expiredDesc')
                });
                return;
            }
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
            const discountedPrice = product.sellPrice * (1 - discountPercent / 100);
            setCart([...cart, {
                productId: product.id!,
                name: product.name,
                qty: 1,
                price: product.sellPrice,
                discountPercent: discountPercent,
                discountedPrice: discountedPrice,
                scheme: product.scheme,
                stock: product.stock
            }]);
        }
        // Don't clear search term on click for better workflow
        toast.success(nt('addSuccess', { name: product.name }));
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
                subtotal: subtotal,
                discount: billDiscountAmount,
                total: total,
                paymentMethod: paymentMethod
            };

            await addSale(saleData);

            setLastSale(saleData);
            setIsReceiptModalOpen(true);
            setCart([]);
            setBillDiscountValue(0);
            toast.success(nt('saveSuccess'));

            // Check for low stock
            cart.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && (product.stock - item.qty) <= product.reorderLevel) {
                    addNotification({
                        type: 'low_stock',
                        productId: item.productId,
                        productName: item.name,
                        message: nt('lowStock', { name: item.name, count: locale === 'bn' ? bnNumber(product.stock - item.qty) : (product.stock - item.qty) })
                    }, true);
                }
            });
        } catch (error) {
            toast.error("Error processing sale");
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 flex flex-col gap-6 max-w-[1920px] mx-auto">
            {isScanning && (
                <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <ShoppingCart className="h-6 w-6" />
                        </span>
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 ml-1">{t('description')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                {/* Left Side: Product Grid */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
                    {/* Search Bar */}
                    <div className="glass-card-warm p-4 rounded-2xl flex items-center gap-4 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder={t('searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-white/50 border-white/20 text-lg rounded-xl focus:bg-white transition-all shadow-sm font-bengali"
                            />
                        </div>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => setIsScanning(true)}
                            className="h-12 px-6 rounded-xl font-bold bg-white/80 hover:bg-white text-foreground shadow-sm"
                        >
                            <Scan className="h-5 w-5 mr-2" /> {t('scanBarcode')}
                        </Button>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map((product) => {
                                const isExpired = product.expiryDate && new Date(product.expiryDate) < new Date();
                                const isOutOfStock = product.stock <= 0;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => !isExpired && !isOutOfStock && addToCart(product)}
                                        className={cn(
                                            "glass-card-warm p-4 rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-vibrant hover:-translate-y-1 relative overflow-hidden",
                                            (isExpired || isOutOfStock) && "opacity-60 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <div className="aspect-square rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 flex items-center justify-center mb-3 relative group-hover:scale-105 transition-transform">
                                            <Package className="h-10 w-10 text-orange-300 dark:text-orange-700" />

                                            {/* Price Tag */}
                                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                                                <span className="text-xs font-black text-foreground">
                                                    {formatPrice(product.sellPrice, locale)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 font-bengali min-h-[2.5rem]">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="font-medium bg-white/50 px-1.5 py-0.5 rounded-md">{product.category}</span>
                                                <span className={cn("font-bold", product.stock <= 5 ? "text-red-500" : "text-emerald-600")}>
                                                    {t('qty')}: {locale === 'bn' ? bnNumber(product.stock) : product.stock}
                                                </span>
                                            </div>
                                        </div>

                                        {(isExpired || isOutOfStock) && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 uppercase tracking-wider">
                                                    {isExpired ? commonT('expired') : nt('outOfStock')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                <Search className="h-12 w-12 opacity-20 mb-4" />
                                <p className="font-medium text-lg">{t('searchPlaceholder')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Cart / POS Panel */}
                <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
                    <div className="glass-card-warm flex-1 rounded-[2rem] overflow-hidden flex flex-col shadow-soft border border-white/40 relative">
                        {/* Cart Header */}
                        <div className="p-6 pb-2 shrink-0 bg-white/30 backdrop-blur-md z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-primary-ui" />
                                    {t('cart')} <span className="text-sm font-bold text-muted-foreground bg-white/50 px-2 py-0.5 rounded-full">{locale === 'bn' ? bnNumber(cart.length) : cart.length}</span>
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCart([])}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    disabled={cart.length === 0}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> {t('clearCart')}
                                </Button>
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto px-6 py-2 content-start custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-3">
                                    <ShoppingCart className="h-16 w-16" />
                                    <p className="font-bold text-lg">{t('emptyCart')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pb-4">
                                    {cart.map((item) => (
                                        <div key={item.productId} className="bg-white/40 dark:bg-black/20 p-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                                            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                                                x{locale === 'bn' ? bnNumber(item.qty) : item.qty}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-foreground truncate font-bengali">{item.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-lg border-muted/50"
                                                            onClick={() => updateQty(item.productId, -1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-lg border-muted/50"
                                                            onClick={() => updateQty(item.productId, 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-right">
                                                        {item.discountPercent > 0 && <span className="text-[10px] line-through text-muted-foreground block">{formatPrice(item.qty * item.price, locale)}</span>}
                                                        <span className="text-sm font-black text-primary-ui">{formatPrice(item.qty * item.discountedPrice, locale)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeFromCart(item.productId)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bill Summary Section (Bottom) */}
                        <div className="p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl shrink-0 border-t border-white/20">
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">{t('subtotal')}</span>
                                    <span className="font-bold text-foreground">{formatPrice(subtotal, locale)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder={t('billDiscount')}
                                        className="h-9 text-xs rounded-lg bg-white/50 border-transparent focus:bg-white transition-all font-bengali"
                                        value={billDiscountValue || ''}
                                        onChange={(e) => setBillDiscountValue(Number(e.target.value))}
                                    />
                                    <div className="flex bg-muted/50 rounded-lg p-0.5 shrink-0">
                                        <button
                                            onClick={() => setBillDiscountType('amount')}
                                            className={cn("px-2 py-1 text-xs font-bold rounded-md transition-all", billDiscountType === 'amount' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
                                        >
                                            ৳
                                        </button>
                                        <button
                                            onClick={() => setBillDiscountType('percent')}
                                            className={cn("px-2 py-1 text-xs font-bold rounded-md transition-all", billDiscountType === 'percent' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
                                        >
                                            %
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-green-600 font-bold">
                                    <span>{t('discount')}</span>
                                    <span>- {formatPrice(billDiscountAmount, locale)}</span>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-lg font-black text-foreground uppercase tracking-tight">{t('grandTotal')}</span>
                                    <span className="text-2xl font-black text-primary-ui">{formatPrice(total, locale)}</span>
                                </div>
                            </div>

                            <Tabs defaultValue="cash" onValueChange={(v) => setPaymentMethod(v as any)} className="w-full mb-4">
                                <TabsList className="w-full grid grid-cols-3 bg-muted/30">
                                    <TabsTrigger value="cash" className="text-xs font-bold">{t('cash')}</TabsTrigger>
                                    <TabsTrigger value="card" className="text-xs font-bold">{t('card')}</TabsTrigger>
                                    <TabsTrigger value="mobile" className="text-xs font-bold">{t('mobileMoney')}</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Button
                                className="w-full h-14 rounded-xl text-lg font-black shadow-vibrant bg-gradient-primary hover:scale-[1.02] transition-transform text-white"
                                disabled={cart.length === 0}
                                onClick={handleCheckout}
                            >
                                {t('checkout')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
                <DialogContent className="max-w-[400px] p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl bg-[#fffcf5]">
                    <DialogHeader className="p-6 pb-2 bg-gradient-warm">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-soft text-green-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-xl font-black text-foreground font-bengali">
                            {t('confirmSale')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-4 bg-transparent max-h-[50vh] overflow-y-auto flex justify-center">
                        {lastSale && (
                            <div className="scale-90 origin-top">
                                <Receipt sale={lastSale} />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-orange-100 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button
                                className="rounded-xl flex-1 font-bold font-bengali h-12 bg-gray-900 text-white hover:bg-black"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4 mr-2" /> {t('receipt.print')}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl flex-1 font-bold font-bengali h-12 border-gray-200"
                                onClick={() => exportReceiptToPDF(lastSale, `Receipt-${Date.now()}.pdf`)}
                            >
                                <FileText className="h-4 w-4 mr-2" /> {t('receipt.download')}
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full rounded-xl font-bold font-bengali text-muted-foreground hover:bg-orange-50 hover:text-orange-600"
                            onClick={() => setIsReceiptModalOpen(false)}
                        >
                            {t('receipt.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

