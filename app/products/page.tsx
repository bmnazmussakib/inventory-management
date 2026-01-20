'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
import {
    Search,
    Filter,
    Grid,
    List,
    PlusCircle,
    Edit,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import { bnNumber, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';

export default function ProductList() {
    const t = useTranslations('Products'); // Assuming keys exist or fallback
    const locale = useLocale();
    const { products, fetchProducts, deleteProduct } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.ean && product.ean.includes(searchTerm));
            const matchesCategory = selectedCategory ? product.categoryId === Number(selectedCategory) : true;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const getCategoryName = (id?: number) => {
        if (!id) return 'Uncategorized';
        return categories.find(c => c.id === id)?.name || 'Uncategorized';
    };

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.20))] overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
            {/* Header Section */}
            <header className="flex-none h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {/* Mobile menu trigger would go here if not in Navbar */}
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">পণ্য তালিকা / Product List</h2>
                </div>
                <div className="flex items-center gap-4">
                    <BulkUploadDialog />
                    <Link href="/products/add">
                        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 text-sm">
                            <PlusCircle className="h-5 w-5" />
                            নতুন পণ্য যোগ করুন
                        </button>
                    </Link>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            placeholder="পণ্যের নাম বা বারকোড দিয়ে খুঁজুন..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-600 dark:text-slate-300">
                            <Filter className="h-4 w-4" />
                            <span>ফিল্টার</span>
                        </button>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-2 px-4 rounded-lg shadow-sm transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 text-primary" : "text-slate-400 hover:text-slate-600")}
                            >
                                <Grid className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-2 px-4 rounded-lg shadow-sm transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 text-primary" : "text-slate-400 hover:text-slate-600")}
                            >
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chips/Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                            selectedCategory === null
                                ? "bg-primary text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                    >
                        সব পণ্য
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(String(cat.id))}
                            className={cn(
                                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                                selectedCategory === String(cat.id)
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => {
                            const isLowStock = product.stock <= product.reorderLevel;
                            return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        "bg-white dark:bg-slate-800 border rounded-xl p-5 hover:shadow-md transition-shadow group flex flex-col justify-between relative",
                                        isLowStock
                                            ? "border-2 border-red-500/30 dark:border-red-500/50 shadow-sm shadow-red-500/5"
                                            : "border-slate-200 dark:border-slate-700"
                                    )}
                                >
                                    {isLowStock && (
                                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider z-10">
                                            <AlertTriangle className="h-3 w-3" /> লো স্টক
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                                {getCategoryName(product.categoryId)}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors"
                                                    onClick={() => deleteProduct(product.id as number)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate" title={product.name}>
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-4 truncate">{product.description || 'No description'}</p>
                                    </div>

                                    <div className="flex items-end justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">স্টক</p>
                                            <p className={cn("font-bold", isLowStock ? "text-red-500 flex items-center gap-1" : "text-slate-700 dark:text-slate-200")}>
                                                {locale === 'bn' ? bnNumber(product.stock) : product.stock} টি
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-0.5">মূল্য</p>
                                            <p className="text-xl font-bold text-primary">{formatPrice(product.sellPrice, locale)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Simple List View Fallback
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {filteredProducts.map((product, idx) => (
                            <div key={product.id} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{product.name}</p>
                                        <p className="text-xs text-slate-500">{getCategoryName(product.categoryId)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Stock</p>
                                        <p className="font-bold">{product.stock}</p>
                                    </div>
                                    <div className="text-right w-20">
                                        <p className="text-xs text-slate-500">Price</p>
                                        <p className="font-bold text-primary">{formatPrice(product.sellPrice, locale)}</p>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                            <Search className="h-10 w-10 opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">কোন পণ্য পাওয়া যায়নি</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">আপনার সার্চের সাথে মেলে এমন কোন পণ্য আমাদের কাছে নেই। অন্য কিছু লিখে চেষ্টা করুন।</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
                    <p className="text-sm text-slate-500">
                        মোট {locale === 'bn' ? bnNumber(filteredProducts.length) : filteredProducts.length} টি পণ্যের সবকটি দেখানো হচ্ছে
                    </p>
                    <div className="flex gap-2">
                        <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button className="size-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">১</button>
                        <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
