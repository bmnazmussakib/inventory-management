'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { bnNumber, formatPrice, formatBanglaDate } from '@/lib/format';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore, flattenCategoryTree, buildCategoryTree } from '@/stores/category-store';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUpDown,
    Plus,
    AlertTriangle,
    Loader2,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db, type Product } from '@/lib/db';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { useNotificationStore } from '@/stores/notification-store';
import { useTranslations, useLocale } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { DataTableActionCell } from '@/components/DataTableActionCell';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function ProductsPage() {
    const t = useTranslations('Products');
    const commonT = useTranslations('Common');
    const locale = useLocale();

    const {
        products,
        isLoading: isProductsLoading,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
    } = useProductStore();

    const {
        categories,
        fetchCategories,
    } = useCategoryStore();

    const { addNotification } = useNotificationStore();
    const nt = useTranslations('Notifications');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        description: '',
        brand: '',
        category: '',
        categoryId: undefined,
        buyPrice: 0,
        sellPrice: 0,
        stock: 0,
        reorderLevel: 5,
        ean: '',
        color: '',
        size: '',
        internalId: '',
        expiryDate: '',
        discountPercent: 0,
        scheme: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    const flattenedCategories = useMemo(() => {
        const tree = buildCategoryTree(categories, products);
        return flattenCategoryTree(tree);
    }, [categories, products]);

    const handleEdit = useCallback((product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            brand: product.brand || '',
            category: product.category,
            categoryId: product.categoryId,
            buyPrice: product.buyPrice,
            sellPrice: product.sellPrice,
            stock: product.stock,
            reorderLevel: product.reorderLevel,
            ean: product.ean || '',
            color: product.color || '',
            size: product.size || '',
            internalId: product.internalId || '',
            expiryDate: product.expiryDate || '',
            discountPercent: product.discountPercent || 0,
            scheme: product.scheme || ''
        });
        setIsDialogOpen(true);
    }, []);

    const resetForm = useCallback(() => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            brand: '',
            category: '',
            categoryId: undefined,
            buyPrice: 0,
            sellPrice: 0,
            stock: 0,
            reorderLevel: 5,
            ean: '',
            color: '',
            size: '',
            internalId: '',
            expiryDate: '',
            discountPercent: 0,
            scheme: ''
        });
    }, []);

    const handleBulkDelete = useCallback(async (selectedProducts: Product[]) => {
        const ids = selectedProducts.map(p => p.id).filter((id): id is number => id !== undefined);
        if (ids.length > 0) {
            await db.products.bulkDelete(ids);
            await fetchProducts();
        }
    }, [fetchProducts]);

    const columns = useMemo<ColumnDef<Product>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="p-0 hover:bg-transparent font-bold"
                >
                    {t('table.name')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-bold text-base">
                            {product.name}
                            {product.stock <= product.reorderLevel && (
                                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                            )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
                            {t('id')}: {product.internalId || (locale === 'bn' ? bnNumber(product.id || 0) : (product.id || 0))}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'category',
            header: t('table.category'),
            cell: ({ row }) => {
                const cat = row.getValue('category') as string;
                return (
                    <Badge variant="outline" className="rounded-lg bg-background/50 border-muted-foreground/30 px-2 py-0.5 text-xs font-medium">
                        {cat === 'Uncategorized' ? t('uncategorized') : cat}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'sellPrice',
            header: ({ column }) => (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="p-0 hover:bg-transparent font-bold ml-auto"
                    >
                        {t('table.sellPrice')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('sellPrice'));
                return (
                    <div className="text-right font-bold text-lg text-primary">
                        {formatPrice(amount, locale)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'stock',
            header: () => <div className="text-center font-bold">{t('table.stock')}</div>,
            cell: ({ row }) => {
                const stock = parseInt(row.getValue('stock'));
                const product = row.original;
                return (
                    <div className="text-center">
                        <div className={cn(
                            "inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm transition-all",
                            stock <= product.reorderLevel
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : "bg-green-500/10 text-green-600 border border-green-500/20"
                        )}>
                            {locale === 'bn' ? bnNumber(stock) : stock}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'expiryDate',
            header: () => <div className="text-center font-bold">{t('table.expiryDate')}</div>,
            cell: ({ row }) => {
                const dateStr = row.getValue('expiryDate') as string;
                if (!dateStr) return <div className="text-center text-muted-foreground text-xs italic">{t('noExpiry')}</div>;

                const expiry = new Date(dateStr);
                const now = new Date();
                const diffTime = expiry.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let textColor = "text-muted-foreground";
                let bgColor = "bg-muted/50";
                let borderColor = "border-transparent";

                if (diffDays <= 0) {
                    textColor = "text-red-700 dark:text-red-400";
                    bgColor = "bg-red-100 dark:bg-red-900/30";
                    borderColor = "border-red-200 dark:border-red-800";
                } else if (diffDays <= 30) {
                    textColor = "text-red-600";
                    bgColor = "bg-red-50/50";
                    borderColor = "border-red-100";
                } else if (diffDays <= 60) {
                    textColor = "text-orange-600";
                    bgColor = "bg-orange-50/50";
                    borderColor = "border-orange-100";
                }

                return (
                    <div className="text-center">
                        <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold border", textColor, bgColor, borderColor)}>
                            {locale === 'bn' ? formatBanglaDate(dateStr).split(' ')[0] : dateStr}
                            {diffDays <= 30 && <AlertCircle className="ml-1 h-3 w-3 animate-pulse" />}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'discountPercent',
            header: () => <div className="font-bold">{t('table.discountScheme')}</div>,
            cell: ({ row }) => {
                const discount = row.original.discountPercent;
                const scheme = row.original.scheme;
                return (
                    <div className="flex flex-col gap-1">
                        {discount && discount > 0 ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-600/10 px-2 py-0.5 rounded-full w-fit">
                                -{locale === 'bn' ? bnNumber(discount) : discount}%
                            </span>
                        ) : null}
                        {scheme ? (
                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]" title={scheme}>
                                {scheme}
                            </span>
                        ) : (
                            (!discount || discount === 0) && <span className="text-[10px] text-muted-foreground opacity-30">N/A</span>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-right font-bold px-4">{commonT('actions')}</div>,
            cell: ({ row }) => (
                <div className="text-right px-2">
                    <DataTableActionCell
                        data={row.original}
                        onEdit={handleEdit}
                        onDelete={(p) => p.id && deleteProduct(p.id)}
                    />
                </div>
            ),
        },
    ], [t, commonT, locale, handleEdit, deleteProduct]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCat = categories.find(c => c.id === formData.categoryId);
        const finalData = {
            ...formData,
            category: selectedCat ? selectedCat.name : 'Uncategorized'
        };

        if (editingProduct?.id) {
            await updateProduct(editingProduct.id, finalData);
        } else {
            await addProduct(finalData);
        }

        // Real-time notification check
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        if (finalData.stock <= finalData.reorderLevel) {
            addNotification({
                type: 'low_stock',
                productId: editingProduct?.id || 0,
                productName: finalData.name,
                message: nt('lowStock', { name: finalData.name, count: locale === 'bn' ? bnNumber(finalData.stock) : finalData.stock })
            }, true);
        }

        if (finalData.expiryDate) {
            const expiry = new Date(finalData.expiryDate);
            if (expiry <= thirtyDaysLater) {
                addNotification({
                    type: 'expiry',
                    productId: editingProduct?.id || 0,
                    productName: finalData.name,
                    message: expiry < now ? nt('expired', { name: finalData.name }) : nt('expiringSoon', { name: finalData.name, date: locale === 'bn' ? formatBanglaDate(finalData.expiryDate).split(' ')[0] : finalData.expiryDate })
                }, true);
            }
        }

        setIsDialogOpen(false);
        resetForm();
    };

    const getRowId = useCallback((product: Product) => product.id?.toString() || '', []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <BulkUploadDialog />

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto shadow-vibrant bg-gradient-primary hover:scale-[1.05] transition-transform text-primary-foreground rounded-xl py-6 sm:py-2">
                                <Plus className="mr-2 h-5 w-5" /> {t('addNew')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-2 border-b bg-muted/30">
                                <DialogTitle className="text-xl font-bold">{editingProduct ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary/70">{commonT('dashboard')}</h4>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">{t('form.nameLabel')}</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="rounded-xl border-muted focus-visible:ring-primary/20 font-bengali"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="categoryId">{t('form.categoryLabel')}</Label>
                                                <Select
                                                    value={formData.categoryId?.toString() || "none"}
                                                    onValueChange={(val) => setFormData({
                                                        ...formData,
                                                        categoryId: val === "none" ? undefined : parseInt(val)
                                                    })}
                                                >
                                                    <SelectTrigger className="rounded-xl border-muted">
                                                        <SelectValue placeholder={t('form.selectCategory')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-premium">
                                                        <SelectItem value="none" className="font-bengali">{t('uncategorized')}</SelectItem>
                                                        {flattenedCategories.map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id!.toString()} className="font-medium font-bengali">
                                                                <span style={{ paddingLeft: `${cat.depth * 12}px` }}>
                                                                    {cat.depth > 0 ? "→ " : ""}{cat.name}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="brand">{t('form.brandLabel')}</Label>
                                                <Input
                                                    id="brand"
                                                    value={formData.brand}
                                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                    className="rounded-xl border-muted focus-visible:ring-primary/20 font-bengali"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expiryDate" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                {t('form.expiryDateLabel')}
                                            </Label>
                                            <Input
                                                id="expiryDate"
                                                type="date"
                                                value={formData.expiryDate || ""}
                                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                                className="rounded-xl border-muted focus-visible:ring-primary/20"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="discountPercent">{t('form.discountPercentLabel')}</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="discountPercent"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={formData.discountPercent}
                                                        onChange={e => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                                                        className="rounded-xl border-muted focus-visible:ring-primary/20 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="scheme">{t('form.schemeLabel')}</Label>
                                                <Input
                                                    id="scheme"
                                                    value={formData.scheme}
                                                    onChange={e => setFormData({ ...formData, scheme: e.target.value })}
                                                    className="rounded-xl border-muted focus-visible:ring-primary/20 font-bengali"
                                                    placeholder="Buy 2 Get 1..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted/50">
                                        <div className="grid gap-2">
                                            <Label>{t('form.buyPriceLabel')}</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold"> {locale === 'bn' ? '৳' : '৳'}</span>
                                                <Input type="number" value={formData.buyPrice} onChange={e => setFormData({ ...formData, buyPrice: Number(e.target.value) })} className="rounded-xl focus-visible:ring-primary/20 pl-8" required />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.sellPriceLabel')}</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold"> {locale === 'bn' ? '৳' : '৳'}</span>
                                                <Input type="number" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: Number(e.target.value) })} className="rounded-xl focus-visible:ring-primary/20 pl-8" required />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="grid gap-2">
                                            <Label>{t('form.stockLabel')}</Label>
                                            <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="rounded-xl focus-visible:ring-primary/20" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.reorderLabel')}</Label>
                                            <Input type="number" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })} className="rounded-xl focus-visible:ring-primary/20" required />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t bg-muted/30">
                                    <DialogFooter>
                                        <Button type="submit" className="w-full rounded-xl py-6 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bengali">
                                            {editingProduct ? t('form.update') : t('form.save')}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isProductsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground font-bengali">{commonT('search')}</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={products}
                    getRowId={getRowId}
                    filterColumn="name"
                    searchPlaceholder={t('table.name') + " / " + t('table.category') + "..."}
                    onBulkDelete={handleBulkDelete}
                />
            )}
        </div>
    );
}
