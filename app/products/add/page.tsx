'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
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
    PlusCircle
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
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AddProductPage() {
    const router = useRouter();
    const { addProduct } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const [submitting, setSubmitting] = useState(false);

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

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const selectedCategory = categories.find(c => c.id === Number(formData.categoryId));
            await addProduct({
                name: formData.name,
                category: selectedCategory?.name || 'Uncategorized',
                categoryId: Number(formData.categoryId),
                ean: formData.barcode,
                sellPrice: Number(formData.sellingPrice),
                buyPrice: Number(formData.purchasePrice),
                stock: Number(formData.stock),
                reorderLevel: Number(formData.reorderLevel),
                description: formData.description,
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
            });
            toast.success('Product added successfully!');
            router.push('/products');
        } catch (error) {
            toast.error('Failed to add product');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

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
                        <span className="text-primary font-semibold">New Product</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
                    <p className="text-slate-500 text-sm">Fill in the details to add a new item to your inventory.</p>
                </div>
                <div className="flex items-center gap-3">
                    <BulkUploadDialog />
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
                                    <CardDescription>Basic details about the product.</CardDescription>
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
                                            placeholder="e.g. Miniket Rice 5KG"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <Layers className="h-4 w-4" /> Category <span className="text-red-500">*</span>
                                                </label>
                                                <Link href="/categories" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                    <PlusCircle className="h-3 w-3" /> Add New
                                                </Link>
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
                                                    {categories.length === 0 && (
                                                        <div className="p-2 text-sm text-center text-slate-500">No categories found. Add one first.</div>
                                                    )}
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
                                                placeholder="SCAN-123456"
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
                                            placeholder="Detailed product description..."
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
                                    <CardDescription>Set the cost and selling price.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Purchase Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-400 font-bold">৳</span>
                                            <Input
                                                type="number"
                                                required
                                                value={formData.purchasePrice}
                                                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                                className="h-12 pl-8 font-mono text-lg"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Selling Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-400 font-bold">৳</span>
                                            <Input
                                                type="number"
                                                required
                                                value={formData.sellingPrice}
                                                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                                className="h-12 pl-8 font-mono text-lg"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Initial Stock <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.stock}
                                            onChange={(e) => handleChange('stock', e.target.value)}
                                            className="h-12 text-center font-bold text-lg"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            Low Stock Alert Level
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.reorderLevel}
                                            onChange={(e) => handleChange('reorderLevel', e.target.value)}
                                            className="h-12 text-center"
                                            placeholder="5"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-purple-500" />
                                            Expiry Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => handleChange('expiryDate', e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                                <Button type="submit" disabled={submitting} className="h-14 w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    <Save className="mr-2 h-5 w-5" />
                                    Save Product
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
