'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePurchaseStore } from '@/stores/purchase-store';
import { useProductStore } from '@/stores/product-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft, Search, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';

export default function NewPurchasePage() {
    const router = useRouter();
    const { addPurchase } = usePurchaseStore();
    const { products, fetchProducts } = useProductStore();
    const locale = useLocale();

    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

    // Line Items
    const [lines, setLines] = useState<Array<{
        productId: number;
        name: string;
        currentStock: number;
        qty: number;
        buyPrice: number;
        total: number;
    }>>([]);

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);

    // Payment State
    const [paidAmount, setPaidAmount] = useState<string>('');

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.ean?.includes(productSearch)
    ).slice(0, 5); // Limit results

    const handleAddProduct = (product: any) => {
        const existing = lines.find(l => l.productId === product.id);
        if (existing) {
            toast.info('Product already in list');
            return;
        }

        setLines([...lines, {
            productId: product.id,
            name: product.name,
            currentStock: product.stock,
            qty: 1,
            buyPrice: product.buyPrice || 0,
            total: product.buyPrice || 0
        }]);
        setProductSearch('');
        setShowProductResults(false);
    };

    const updateLine = (index: number, field: 'qty' | 'buyPrice', value: number) => {
        const newLines = [...lines];
        newLines[index] = {
            ...newLines[index],
            [field]: value,
            total: (field === 'qty' ? value : newLines[index].qty) * (field === 'buyPrice' ? value : newLines[index].buyPrice)
        };
        setLines(newLines);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const grandTotal = lines.reduce((sum, line) => sum + line.total, 0);
    const dueAmount = Math.max(0, grandTotal - (Number(paidAmount) || 0));

    const handleSave = async () => {
        if (!supplierId) {
            toast.error('Please select a supplier');
            return;
        }
        if (lines.length === 0) {
            toast.error('Add at least one product');
            return;
        }

        try {
            await addPurchase({
                date: new Date().toISOString(),
                supplierId,
                items: lines.map(l => ({
                    productId: l.productId,
                    name: l.name,
                    qty: l.qty,
                    buyPrice: l.buyPrice,
                    total: l.total
                })),
                grandTotal,
                paidAmount: Number(paidAmount) || 0,
                dueAmount,
                notes: 'Purchase Entry'
            });
            toast.success('Purchase saved successfully');
            router.push('/purchases');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save purchase');
        }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-col flex">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Purchase (নতুন ক্রয়)</h1>
                    <p className="text-slate-500 text-xs">Record stock entry from supplier</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Supplier & Product Input */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-4 space-y-4">
                        <Label>Supplier</Label>
                        <SupplierSelect
                            value={supplierId}
                            onChange={setSupplierId}
                            onAddNew={() => setIsAddSupplierOpen(true)}
                        />
                    </Card>

                    <Card className="p-4 space-y-4 overflow-visible">
                        <Label>Add Products</Label>
                        <div className="relative">
                            <div className="flex gap-2">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search product by name or barcode..."
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setShowProductResults(true);
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            {showProductResults && productSearch && (
                                <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleAddProduct(p)}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                                                <p className="text-xs text-slate-500">Stock: {p.stock}</p>
                                            </div>
                                            <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-3 text-center text-slate-500 text-sm">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[120px]">Buy Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line, idx) => (
                                        <TableRow key={line.productId}>
                                            <TableCell className="font-medium">
                                                {line.name}
                                                <div className="text-xs text-slate-400">Curr Stock: {line.currentStock}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={line.qty}
                                                    onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))}
                                                    className="h-8 w-20"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={line.buyPrice}
                                                    onChange={(e) => updateLine(idx, 'buyPrice', Number(e.target.value))}
                                                    className="h-8 w-24"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatPrice(line.total, locale)}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" onClick={() => removeLine(idx)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {lines.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                                <div className="flex flex-col items-center">
                                                    <Package className="h-8 w-8 mb-2 opacity-50" />
                                                    Add products to purchase list
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Right: Summary & Payment */}
                <div className="space-y-6">
                    <Card className="p-6 bg-slate-50 dark:bg-slate-800 border-none shadow-md">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Purchase Summary</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                <span>Items</span>
                                <span>{lines.length}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                <span>Total Qty</span>
                                <span>{lines.reduce((s, l) => s + l.qty, 0)}</span>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">Grand Total</span>
                                <span className="font-bold text-2xl text-primary">{formatPrice(grandTotal, locale)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Paid Amount (জমা)</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter amount paid"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    className="h-12 text-lg font-bold"
                                />
                            </div>

                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Due (বকেয়া)</span>
                                <span className="font-bold text-red-600">{formatPrice(dueAmount, locale)}</span>
                            </div>

                            <Button onClick={handleSave} className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white">
                                <Save className="mr-2 h-5 w-5" /> Save Purchase
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <AddSupplierDialog
                open={isAddSupplierOpen}
                onOpenChange={setIsAddSupplierOpen}
            />
        </div>
    );
}
