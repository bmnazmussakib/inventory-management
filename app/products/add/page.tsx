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
    FileText
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
            await addProduct({
                name: formData.name,
                categoryId: Number(formData.categoryId),
                barcode: formData.barcode,
                price: Number(formData.sellingPrice),
                costPrice: Number(formData.purchasePrice),
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
            <div className="flex-none p-6 md:p-10 pb-0">
                <nav className="flex items-center gap-2 mb-6 text-sm">
                    <Link href="/" className="text-slate-500 hover:text-primary flex items-center gap-1">
                        Home
                    </Link>
                    <span className="text-slate-300">/</span>
                    <Link href="/products" className="text-slate-500 hover:text-primary">
                        Inventory
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-primary font-semibold">New Product</span>
                </nav>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        নতুন পণ্য যোগ করুন <span className="text-slate-400 text-lg font-normal ml-2">(Add New Product)</span>
                    </h1>
                    <p className="text-slate-500">সঠিক তথ্য দিয়ে স্টক ইনভেন্টরি আপডেট করুন।</p>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-4xl">
                    <div className="p-8 space-y-8">
                        {/* Name */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                <Package className="h-4 w-4 text-primary" />
                                পণ্যর নাম (Product Name) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="h-12 text-lg"
                                placeholder="যেমন: মিনিকেট চাল ৫ কেজি"
                            />
                        </div>

                        {/* Category & Barcode */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <Layers className="h-4 w-4 text-primary" />
                                    ক্যাটাগরি (Category) <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(val) => handleChange('categoryId', val)}
                                    required
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="ক্যাটাগরি সিলেক্ট করুন" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <Barcode className="h-4 w-4 text-primary" />
                                    বারকোড (Barcode)
                                </label>
                                <Input
                                    value={formData.barcode}
                                    onChange={(e) => handleChange('barcode', e.target.value)}
                                    className="h-12 font-mono"
                                    placeholder="SCAN-123456"
                                />
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    ক্রয় মূল্য (Purchase Price) <span className="text-red-500">*</span>
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
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                    বিক্রয় মূল্য (Selling Price) <span className="text-red-500">*</span>
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
                        </div>

                        {/* Inventory Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <Box className="h-4 w-4 text-primary" />
                                    প্রাথমিক স্টক (Initial Stock) <span className="text-red-500">*</span>
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
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    সতর্কতা লেভেল (Low Stock Alert)
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
                                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                    <Calendar className="h-4 w-4 text-purple-500" />
                                    মেয়াদ উত্তীর্ণ তারিখ (Expiry)
                                </label>
                                <Input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                                    className="h-12"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                                <FileText className="h-4 w-4 text-primary" />
                                বিবরণ (Description)
                            </label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="min-h-[100px]"
                                placeholder="পণ্যের বিস্তারিত বিবরণ..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/products">
                            <Button variant="outline" type="button" className="h-12 px-8 text-base">
                                বাতিল করুন
                            </Button>
                        </Link>
                        <Button type="submit" disabled={submitting} className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                            <Save className="mr-2 h-5 w-5" />
                            পণ্য সংরক্ষণ করুন
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
