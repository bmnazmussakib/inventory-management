'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSalesStore } from '@/stores/sales-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, ArrowLeft, Printer, Download, Eye } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { formatPrice, formatBanglaDate, bnNumber } from '@/lib/format';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Receipt } from '@/components/Receipt';
import { exportReceiptToPDF } from '@/lib/export-utils';

export default function SalesHistoryPage() {
    const t = useTranslations('Sales');
    const commonT = useTranslations('Common');
    const locale = useLocale();
    const { sales, fetchSales, isLoading } = useSalesStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const searchLower = searchTerm.toLowerCase();
            const idMatch = sale.id?.toString().includes(searchLower);
            const dateMatch = new Date(sale.date).toLocaleDateString().includes(searchLower);
            return idMatch || dateMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm]);

    const handleViewReceipt = (sale: any) => {
        setSelectedSale(sale);
        setIsReceiptModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/sales">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales History</h1>
                        <p className="text-slate-500 text-sm">View and manage past transactions</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by ID or Date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-800"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Invoice ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="w-[100px] text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                        Loading sales data...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                        No sales found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSales.map((sale) => (
                                    <TableRow key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <TableCell className="font-mono text-xs font-bold">
                                            #{sale.id}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {locale === 'bn'
                                                    ? formatBanglaDate(sale.date)
                                                    : new Date(sale.date).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                {sale.items.reduce((acc: number, item: any) => acc + item.qty, 0)} items
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                            {formatPrice(sale.total, locale)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewReceipt(sale)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4 text-primary" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Receipt View</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto flex justify-center bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                        {selectedSale && <Receipt sale={selectedSale} />}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => selectedSale && exportReceiptToPDF(selectedSale, `receipt-${selectedSale.id}.pdf`)}>
                            <FileText className="mr-2 h-4 w-4" /> Download PDF
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
