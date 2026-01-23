'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
import { Product, ProductBatch } from '@/lib/db';
import {
    Save,
    Package,
    Barcode,
    DollarSign,
    Box,
    ChevronLeft,
    Calendar,
    Layers,
    FileText,
    AlertTriangle,
    PlusCircle,
    Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: productIdFromParams } = use(params);
    const router = useRouter();
    const { getProduct, updateProduct, addBatch, getBatchesByProductId } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        barcode: '',
        purchasePrice: '',
        sellingPrice: '',
        stock: '',
        reorderLevel: '5',
        description: '',
        expiryDate: ''
    });

    const [isBatchTracked, setIsBatchTracked] = useState(false);
    const [originalIsBatchTracked, setOriginalIsBatchTracked] = useState(false);

    // For new batches being added during conversion
    const [newBatches, setNewBatches] = useState([
        { batchNumber: '', expiryDate: '', stock: '', buyPrice: '' }
    ]);

    // Existing batches (read-only in this view for now, or editable? Let's keep simple: view existing, add new)
    const [existingBatches, setExistingBatches] = useState<ProductBatch[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchCategories();
            const product = await getProduct(Number(productIdFromParams));
            if (product) {
                setFormData({
                    name: product.name,
                    categoryId: String(product.categoryId || ''),
                    barcode: product.ean || '',
                    purchasePrice: String(product.buyPrice),
                    sellingPrice: String(product.sellPrice),
                    stock: String(product.stock),
                    reorderLevel: String(product.reorderLevel),
                    description: product.description || '',
                    expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
                });
                setIsBatchTracked(!!product.isBatchTracked);
                setOriginalIsBatchTracked(!!product.isBatchTracked);

                if (product.isBatchTracked) {
                    const batches = await getBatchesByProductId(Number(productIdFromParams));
                    setExistingBatches(batches);
                }
            } else {
                toast.error("Product not found");
                router.push('/products');
            }
            setLoading(false);
        };
        load();
    }, [productIdFromParams, getProduct, fetchCategories, getBatchesByProductId, router]);

    // Recalculate stock if converting to batch tracking
    useEffect(() => {
        if (isBatchTracked && !originalIsBatchTracked) {
            const totalFromNewBatches = newBatches.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);
            setFormData(prev => ({ ...prev, stock: totalFromNewBatches.toString() }));
        }
    }, [newBatches, isBatchTracked, originalIsBatchTracked]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBatchChange = (index: number, field: string, value: string) => {
        const batchList = [...newBatches];
        batchList[index] = { ...batchList[index], [field]: value };
        setNewBatches(batchList);
    };

    const addNewBatchRow = () => {
        setNewBatches([...newBatches, { batchNumber: '', expiryDate: '', stock: '', buyPrice: formData.purchasePrice }]);
    };

    const removeBatchRow = (index: number) => {
        if (newBatches.length > 1) {
            setNewBatches(newBatches.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const selectedCategory = categories.find(c => c.id === Number(formData.categoryId));

            // 1. Update Product
            await updateProduct(Number(productIdFromParams), {
                name: formData.name,
                category: selectedCategory?.name || 'Uncategorized',
                categoryId: Number(formData.categoryId),
                ean: formData.barcode,
                sellPrice: Number(formData.sellingPrice),
                buyPrice: Number(formData.purchasePrice),
                stock: Number(formData.stock),
                reorderLevel: Number(formData.reorderLevel),
                description: formData.description,
                expiryDate: isBatchTracked ? null : (formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined),
                isBatchTracked
            });

            // 2. Add New Batches if converting or just adding
            if (isBatchTracked) {
                // If converting from non-tracked to tracked, user MUST have added batches to cover stock
                // Or we allow stock mismatch? Better to enforce strictness if possible, but let's be flexible

                for (const batch of newBatches) {
                    if (batch.batchNumber && batch.stock) {
                        await addBatch({
                            productId: Number(productIdFromParams),
                            batchNumber: batch.batchNumber,
                            expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString() : new Date().toISOString(),
                            initialStock: Number(batch.stock),
                            currentStock: Number(batch.stock),
                            buyPrice: batch.buyPrice ? Number(batch.buyPrice) : Number(formData.purchasePrice),
                            purchaseDate: new Date().toISOString()
                        });
                    }
                }
            }

            toast.success('Product updated successfully!');
            router.push('/products');
        } catch (error) {
            toast.error('Failed to update product');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading product...</div>;

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.20))] overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
            {/* Header */}
            <header className="flex-none p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <nav className="flex items-center gap-2 mb-2 text-sm">
                        <Link href="/products" className="text-slate-500 hover:text-primary flex items-center gap-1">
                            <ChevronLeft className="h-4 w-4" />
                            Inventory
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-primary font-semibold">Edit Product</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Product</h1>
                </div>
            </header>

            {/* Form Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-primary">
                                        <Package className="h-5 w-5" />
                                        <CardTitle className="text-lg">Product Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Product Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="h-12 text-lg"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <Layers className="h-4 w-4" /> Category <span className="text-red-500">*</span>
                                                </label>
                                            </div>
                                            <Select
                                                value={formData.categoryId}
                                                onValueChange={(val) => handleChange('categoryId', val)}
                                                required
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Barcode className="h-4 w-4" /> Barcode
                                            </label>
                                            <Input
                                                value={formData.barcode}
                                                onChange={(e) => handleChange('barcode', e.target.value)}
                                                className="h-12 font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Description
                                        </label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-green-600">
                                        <DollarSign className="h-5 w-5" />
                                        <CardTitle className="text-lg">Pricing</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Purchase Price <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.purchasePrice}
                                            onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                            className="h-12 font-mono text-lg"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Selling Price <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.sellingPrice}
                                            onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                            className="h-12 font-mono text-lg"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Batch Management Section */}
                            {(isBatchTracked && !originalIsBatchTracked) && (
                                <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/20 dark:bg-yellow-900/10 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                                                <Layers className="h-5 w-5" />
                                                <CardTitle className="text-lg">Convert Stock to Batches</CardTitle>
                                            </div>
                                            <Button type="button" onClick={addNewBatchRow} size="sm" variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Batch
                                            </Button>
                                        </div>
                                        <CardDescription className="text-yellow-600 dark:text-yellow-500">
                                            You are enabling batch tracking. You must verify your stock by creating batches.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {newBatches.map((batch, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Batch Number</label>
                                                    <Input
                                                        value={batch.batchNumber}
                                                        onChange={(e) => handleBatchChange(index, 'batchNumber', e.target.value)}
                                                        placeholder="e.g. B-001"
                                                        required
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Expiry Date</label>
                                                    <Input
                                                        type="date"
                                                        value={batch.expiryDate}
                                                        onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)}
                                                        required
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Quantity</label>
                                                    <Input
                                                        type="number"
                                                        value={batch.stock}
                                                        onChange={(e) => handleBatchChange(index, 'stock', e.target.value)}
                                                        placeholder="0"
                                                        required
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1 relative">
                                                    <label className="text-xs font-semibold text-slate-500">Buy Price</label>
                                                    <Input
                                                        type="number"
                                                        value={batch.buyPrice}
                                                        onChange={(e) => handleBatchChange(index, 'buyPrice', e.target.value)}
                                                        placeholder={formData.purchasePrice || "0"}
                                                        className="h-9"
                                                    />
                                                    {newBatches.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBatchRow(index)}
                                                            className="absolute -right-2 -top-2 bg-red-100 text-red-500 rounded-full p-1 hover:bg-red-200"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Existing Batches List (Read Only or just visible) */}
                            {originalIsBatchTracked && existingBatches.length > 0 && (
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Existing Batches</CardTitle>
                                    </CardHeader>
                                    <div className="p-4 pt-0">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-500 border-b">
                                                <tr>
                                                    <th className="py-2">Batch</th>
                                                    <th className="py-2">Expiry</th>
                                                    <th className="py-2 text-right">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {existingBatches.map(b => (
                                                    <tr key={b.id} className="border-b last:border-0">
                                                        <td className="py-2 font-medium">{b.batchNumber}</td>
                                                        <td className="py-2">{new Date(b.expiryDate).toLocaleDateString()}</td>
                                                        <td className="py-2 text-right">{b.currentStock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
                                            Need to adjust existing batches? Please use the Stock Adjustment feature (Coming Soon) or edit directly in DB.
                                            <br />
                                            <span className="text-xs">(Adding more batches here allowed if needed)</span>
                                        </div>
                                        {/* We could allow adding more batches here too using the same newBatches UI */}
                                        <div className="mt-4">
                                            <Button type="button" onClick={() => {
                                                setOriginalIsBatchTracked(false); // Hack to show the "Add Batch" UI
                                                // Actually logic needs refine: separate "Add New Batches" block from "Convert" block
                                                // simplified for now: if fully tracked, just show read only.
                                            }} variant="outline" size="sm">
                                                Add New Batches
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Right Column: Inventory & Actions */}
                        <div className="space-y-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Box className="h-5 w-5" />
                                        <CardTitle className="text-lg">Inventory Control</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Batch/Lot Tracking</span>
                                            <p className="text-xs text-slate-500">Enable to track batches</p>
                                        </div>
                                        <div className="flex items-center h-6">
                                            <input
                                                type="checkbox"
                                                width={20}
                                                height={20}
                                                checked={isBatchTracked}
                                                onChange={(e) => setIsBatchTracked(e.target.checked)}
                                                disabled={originalIsBatchTracked} // Prevent disabling for now to avoid data loss complexity
                                                className="w-5 h-5 accent-primary cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {originalIsBatchTracked && <p className="text-xs text-orange-500">Cannot disable batch tracking once enabled (for safety).</p>}

                                    {!isBatchTracked && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Current Stock <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    type="number"
                                                    required
                                                    value={formData.stock}
                                                    onChange={(e) => handleChange('stock', e.target.value)}
                                                    className="h-12 text-center font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Expiry Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={formData.expiryDate}
                                                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                                                    className="h-12"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {isBatchTracked && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                                            <p className="font-bold flex items-center gap-2"><Box className="h-4 w-4" /> Final Stock: {formData.stock || 0}</p>
                                            {!originalIsBatchTracked && <p className="mt-1 opacity-80">Calculated from new batches</p>}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Low Stock Alert Level
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.reorderLevel}
                                            onChange={(e) => handleChange('reorderLevel', e.target.value)}
                                            className="h-12 text-center"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                                <Button type="submit" disabled={submitting} className="h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20">
                                    <Save className="mr-2 h-5 w-5" />
                                    Update Product
                                </Button>
                                <Link href="/products" className="w-full">
                                    <Button variant="outline" type="button" className="h-12 w-full">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
