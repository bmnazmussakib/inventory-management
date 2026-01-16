'use client';

import * as React from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Settings2,
    Trash2,
    Edit,
    Download,
    X,
    AlertCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { toBanglaNumber } from '@/lib/format';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    filterColumn?: string;
    onBulkDelete?: (rows: TData[]) => Promise<void>;
    onBulkExport?: (rows: TData[]) => void;
    getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder,
    filterColumn,
    onBulkDelete,
    onBulkExport,
    getRowId,
}: DataTableProps<TData, TValue>) {
    const t = useTranslations('Common');
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const table = useReactTable({
        data,
        columns,
        getRowId: getRowId,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    // Use getSelectedRowModel instead of getFilteredSelectedRowModel for better reliability
    const selectedRows = table.getSelectedRowModel().rows;
    const hasSelection = selectedRows.length > 0;

    const handleBulkDelete = async () => {
        if (!onBulkDelete || selectedRows.length === 0) return;

        setIsDeleting(true);
        try {
            await onBulkDelete(selectedRows.map(row => row.original));
            table.resetRowSelection();
            setIsBulkDeleteDialogOpen(false);
            toast.success(t('deleteSelected') + ' সফল হয়েছে।');
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('মুছে ফেলতে সমস্যা হয়েছে।');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkExport = () => {
        if (selectedRows.length === 0) return;

        if (onBulkExport) {
            onBulkExport(selectedRows.map(row => row.original));
        } else {
            // Default CSV export logic
            const exportData = selectedRows.map(row => row.original);
            if (exportData.length === 0) return;

            const headers = Object.keys(exportData[0] as any).filter(key => key !== 'id');
            const csvContent = [
                headers.join(','),
                ...exportData.map(row => {
                    return headers.map(header => {
                        const val = (row as any)[header];
                        return `"${String(val || '').replace(/"/g, '""')}"`;
                    }).join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `export_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(t('exportSelected') + ' সফল হয়েছে।');
        }
    };

    return (
        <div className="space-y-4 relative">
            {/* Bulk Actions Toolbar */}
            {hasSelection && (
                <div className="absolute -top-12 left-0 right-0 z-50 flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4 px-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-white/10"
                            onClick={() => table.resetRowSelection()}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-transparent">
                                {toBanglaNumber(selectedRows.length)}
                            </Badge>
                            <span className="text-sm font-bold">{t('selected')}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-foreground hover:bg-white/10 gap-2 font-bold"
                            onClick={() => toast.info(t('bulkEditNotice'))}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('editSelected')}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-foreground hover:bg-white/10 gap-2 font-bold"
                            onClick={handleBulkExport}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('exportSelected')}</span>
                        </Button>
                        <div className="h-4 w-[1px] bg-white/20 mx-1" />
                        <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 gap-2 font-bold shadow-none"
                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('deleteSelected')}</span>
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder={searchPlaceholder || t('search')}
                        value={(table.getColumn(filterColumn || '')?.getFilterValue() as string) ?? ''}
                        onChange={(event) =>
                            table.getColumn(filterColumn || '')?.setFilterValue(event.target.value)
                        }
                        className="pl-10 h-10 rounded-xl focus-visible:ring-primary/20 border-muted bg-card"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="hidden h-10 ml-auto lg:flex border-muted rounded-xl gap-2 hover:bg-muted/50">
                            <Settings2 className="h-4 w-4" />
                            {t('settings')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-premium">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize rounded-lg mx-1"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-2xl border border-muted bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="font-bold py-4">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="group hover:bg-muted/10 transition-colors data-[state=selected]:bg-primary/5 border-muted/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3 px-5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">
                                    কোনো তথ্য পাওয়া যায়নি।
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground font-medium">
                    {t('selected')} {toBanglaNumber(selectedRows.length)} / {toBanglaNumber(table.getFilteredRowModel().rows.length)}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="rounded-xl h-9 w-9 p-0 border-muted hover:bg-muted/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="rounded-xl h-9 w-9 p-0 border-muted hover:bg-muted/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl shadow-premium border-muted">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            {t('deleteSelected')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {t('bulkDeleteConfirm', { count: toBanglaNumber(selectedRows.length) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 font-bold">
                        <AlertDialogCancel className="rounded-xl border-muted hover:bg-muted/50" disabled={isDeleting}>
                            {t('cancel') || 'বাতিল'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent automatic close to handle sync/async better
                                handleBulkDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'মুছে ফেলা হচ্ছে...' : t('deleteSelected')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
