'use client';

import { useState, useEffect } from 'react';
import { usePurchaseStore } from '@/stores/purchase-store'; // Ensure you created this
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Calendar, User } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function PurchasesPage() {
    // Note: ensure usePurchaseStore is implemented
    // If not, I'll need to rely on db fetch directly or assume store exists
    // Since I created purchase-store.ts, I'll use it.
    const { purchases, fetchPurchases } = usePurchaseStore();
    const [searchTerm, setSearchTerm] = useState('');
    const locale = useLocale();

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    // Need to probably join supplier names if not stored in purchase
    // The Purchase interface has supplierName optional? 
    // Actually schema didn't force it. We might need to fetch supplier map.
    // For simplicity, I'll just show supplierId or if PurchaseStore enriches it.
    // In db.ts I added supplierName? to interface but logically it's relational.
    // Let's rely on basic display for now.

    const filteredPurchases = purchases.filter(p =>
        String(p.id).includes(searchTerm) ||
        String(p.supplierId).includes(searchTerm)
    );

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchases (ক্রয় তালিকা)</h1>
                    <p className="text-slate-500">History of stock entries and purchases</p>
                </div>
                <Link href="/purchases/new">
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" /> New Purchase
                    </Button>
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="font-bold">Supplier</TableHead>
                                <TableHead className="font-bold text-center">Items</TableHead>
                                <TableHead className="font-bold text-right">Total</TableHead>
                                <TableHead className="font-bold text-right">Paid</TableHead>
                                <TableHead className="font-bold text-right">Due</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPurchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">No purchases found</TableCell>
                                </TableRow>
                            ) : (
                                filteredPurchases.map((purchase) => (
                                    <TableRow key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(purchase.date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="h-3 w-3 text-slate-400" />
                                                {/* In real app, we'd lookup supplier name from ID */}
                                                Supplier #{purchase.supplierId}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-slate-700 dark:text-slate-300">
                                            {purchase.items.length}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                            {formatPrice(purchase.grandTotal, locale)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {formatPrice(purchase.paidAmount, locale)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">
                                            {purchase.dueAmount > 0 ? formatPrice(purchase.dueAmount, locale) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
