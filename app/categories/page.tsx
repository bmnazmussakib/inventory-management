'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    Folders,
    ChevronRight,
    ChevronDown,
    Package,
    ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategoryStore, buildCategoryTree, flattenCategoryTree, type CategoryWithStats } from '@/stores/category-store';
import { useProductStore } from '@/stores/product-store';
import { useTranslations, useLocale } from 'next-intl';
import { CategoryDialog } from '@/components/CategoryDialog';
import { db, type Category } from '@/lib/db';
import { bnNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { DataTableActionCell } from '@/components/DataTableActionCell';
import { ColumnDef } from '@tanstack/react-table';

export default function CategoriesPage() {
    const t = useTranslations('Categories');
    const commonT = useTranslations('Common');
    const locale = useLocale();
    const { categories, fetchCategories, deleteCategory, isLoading: isCategoriesLoading } = useCategoryStore();
    const { products, fetchProducts } = useProductStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [fetchCategories, fetchProducts]);

    const hierarchicalData = useMemo(() => {
        const tree = buildCategoryTree(categories, products);
        return flattenCategoryTree(tree);
    }, [categories, products]);

    const handleEdit = useCallback((category: Category) => {
        setEditingCategory(category);
        setIsDialogOpen(true);
    }, []);

    const confirmDelete = useCallback(async (category: Category) => {
        if (!category.id) return;

        try {
            await deleteCategory(category.id);
            toast.success(t('deleted'));
        } catch (error: any) {
            if (error.message === 'HAS_CHILDREN') {
                toast.error(t('delete.hasChildren'));
            } else {
                toast.error(t('deleteError'));
            }
        }
    }, [deleteCategory, t]);

    const handleBulkDelete = useCallback(async (selectedCategories: Category[]) => {
        const ids = selectedCategories.map(c => c.id).filter((id): id is number => id !== undefined);

        if (ids.length > 0) {
            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                try {
                    await deleteCategory(id);
                    successCount++;
                } catch (e) {
                    errorCount++;
                }
            }

            if (errorCount > 0) {
                toast.warning(t('bulkDeleteResult', {
                    success: locale === 'bn' ? bnNumber(successCount) : successCount,
                    error: locale === 'bn' ? bnNumber(errorCount) : errorCount
                }));
            } else {
                toast.success(t('deleted'));
            }
            await fetchCategories();
        }
    }, [deleteCategory, fetchCategories, t, locale]);

    const getRowId = useCallback((cat: CategoryWithStats) => cat.id?.toString() || '', []);

    const columns = useMemo<ColumnDef<CategoryWithStats>[]>(() => [
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
                const node = row.original;
                return (
                    <div className="flex items-center" style={{ paddingLeft: `${node.depth * 24}px` }}>
                        {node.depth > 0 && (
                            <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
                        )}
                        {node.depth === 0 ? (
                            <Folders className="h-4 w-4 mr-2 text-primary/70" />
                        ) : (
                            <ChevronDown className="h-3 w-3 mr-2 text-muted-foreground/50 rotate-[-90deg]" />
                        )}
                        <span className="font-medium font-bengali text-base">{node.name}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'description',
            header: t('table.description'),
            cell: ({ row }) => {
                const desc = row.getValue('description') as string;
                return (
                    <span className="text-sm text-muted-foreground max-w-xs truncate block font-bengali">
                        {desc || '-'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'productCount',
            header: () => <div className="text-center font-bold">{t('table.productCount')}</div>,
            cell: ({ row }) => {
                const count = row.getValue('productCount') as number;
                return (
                    <div className="text-center">
                        <Badge variant="secondary" className="gap-1 px-2 rounded-lg bg-primary/5 text-primary border-primary/10">
                            <Package className="h-3 w-3" />
                            {locale === 'bn' ? bnNumber(count) : count}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right font-bold px-4">{commonT('actions')}</div>,
            cell: ({ row }) => (
                <div className="text-right px-2">
                    <DataTableActionCell
                        data={row.original}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                    />
                </div>
            ),
        },
    ], [t, commonT, locale, handleEdit, confirmDelete]);

    return (
        <div className="p-4 md:p-10 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Folders className="h-8 w-8 text-primary" />
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('description')}
                    </p>
                </div>
                <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }} className="rounded-xl shadow-vibrant bg-gradient-primary text-primary-foreground group transform hover:scale-105 transition-all font-bengali">
                    <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> {t('addNew')}
                </Button>
            </div>

            {isCategoriesLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={hierarchicalData}
                    getRowId={getRowId}
                    filterColumn="name"
                    searchPlaceholder={t('table.name') + "..."}
                    onBulkDelete={handleBulkDelete}
                />
            )}

            <CategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                editingCategory={editingCategory}
            />
        </div>
    );
}
