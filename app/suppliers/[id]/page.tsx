'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupplierStore } from '@/stores/supplier-store';
import { usePurchaseStore } from '@/stores/purchase-store'; // Need to add purchase logic if not present
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, ShoppingBag, TrendingDown, TrendingUp, Factory } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { SupplierPaymentDialog } from '@/components/suppliers/SupplierPaymentDialog';
import { db, type Supplier, type SupplierPayment } from '@/lib/db';
import Link from 'next/link';

export default function SupplierLedgerPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = Number(params.id);
    const locale = useLocale();

    const { suppliers, fetchSuppliers } = useSupplierStore();

    // We fetch purchases direct from DB for now as purchaseStore might not be loaded with all
    // But better to use hooks if we had them. Let's assume we do some simple fetch here.
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]); // Using any for Purchase generic
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    useEffect(() => {
        fetchSuppliers();
        loadData();
    }, [fetchSuppliers, supplierId]);

    const loadData = async () => {
        const [allPayments, allPurchases] = await Promise.all([
            db.supplier_payments.where('supplierId').equals(supplierId).toArray(),
            db.purchases.where('supplierId').equals(supplierId).toArray()
        ]);
        setPayments(allPayments);
        setPurchases(allPurchases);
    };

    useEffect(() => {
        const s = suppliers.find(c => c.id === supplierId);
        setSupplier(s || null);
    }, [suppliers, supplierId]);

    // Combine transactions
    const ledgerEntries = useMemo(() => {
        const entries: Array<{
            id: string;
            date: string;
            type: 'purchase' | 'payment';
            description: string;
            debit: number; // We paid (Liability down)
            credit: number; // We bought (Liability up)
        }> = [];

        // Purchases (Liability Increases -> Credit in a Liability Account, but effectively 'Payable increases')
        // In simple ledger terms for Supplier:
        // "Credit" side = Amount we owe INCREASES (Purchase)
        // "Debit" side = Amount we owe DECREASES (Payment)
        purchases.forEach(p => {
            entries.push({
                id: `purchase-${p.id}`,
                date: p.date,
                type: 'purchase',
                description: `Purchase #${p.id} - ${p.items.length} items`,
                credit: p.grandTotal, // We owe this
                debit: 0
            });
        });

        // Payments
        payments.forEach(p => {
            entries.push({
                id: `payment-${p.id}`,
                date: p.date,
                type: 'payment',
                description: p.notes || 'Payment to Supplier',
                credit: 0,
                debit: p.amount // We paid off
            });
        });

        // Handle "Paid Amount" carried inside Purchase record?
        // Actually, if we recorded a purchase with "Paid Amount", that implies a simultaneous payment?
        // Or do we store that as a separate "payment" record?
        // The purchase schema has "paidAmount".
        // It's cleaner to treat Purchase as full 'Credit' then a 'Payment' for the paid portion.
        // But if `paidAmount` exists in `purchase`, we should show it.
        // Option: Split purchase into Purchase (Full amount Credit) AND Payment (Paid amount Debit).
        // Let's iterate purchases again and add implicit payments if paidAmount > 0
        purchases.forEach(p => {
            if (p.paidAmount && p.paidAmount > 0) {
                entries.push({
                    id: `purchase-instant-pay-${p.id}`,
                    date: p.date,
                    type: 'payment',
                    description: `Instant Payment for Purchase #${p.id}`,
                    credit: 0,
                    debit: p.paidAmount
                });
            }
        });

        // Sort by date descending
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return entries;
    }, [purchases, payments]);

    if (!supplier) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{supplier.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{supplier.phone} {supplier.address && `• ${supplier.address}`}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit</Button>
            </div>

            {/* Balance Card */}
            <div className={`rounded-2xl p-6 ${supplier.currentBalance > 0
                ? 'bg-gradient-to-br from-red-600 to-red-700'
                : 'bg-gradient-to-br from-green-600 to-green-700'
                } text-white shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">
                            {supplier.currentBalance > 0 ? 'Payable (দিতে হবে)' : 'Advance (পাবেন)'}
                        </p>
                        <h2 className="text-4xl font-black">
                            {formatPrice(Math.abs(supplier.currentBalance), locale)}
                        </h2>
                    </div>
                    <Button
                        onClick={() => setIsPaymentDialogOpen(true)}
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                        <DollarSign className="h-4 w-4 mr-2" /> Pay Now (পেমেন্ট দিন)
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <ShoppingBag className="h-4 w-4" /> Total Purchases
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{purchases.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <TrendingUp className="h-4 w-4" /> Total Bought
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                        {formatPrice(purchases.reduce((sum, p) => sum + p.grandTotal, 0), locale)}
                    </p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right text-red-600">Purchase (+)</th>
                                <th className="px-6 py-3 text-right text-green-600">Paid (-)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {ledgerEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(entry.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${entry.type === 'purchase' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                        {entry.description}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-600">
                                        {entry.credit > 0 ? formatPrice(entry.credit, locale) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-green-600">
                                        {entry.debit > 0 ? formatPrice(entry.debit, locale) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {ledgerEntries.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No transactions</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddSupplierDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                supplierToEdit={supplier}
            />

            <SupplierPaymentDialog
                open={isPaymentDialogOpen}
                onOpenChange={(v) => {
                    setIsPaymentDialogOpen(v);
                    if (!v) {
                        fetchSuppliers();
                        loadData(); // Reload ledger
                    }
                }}
                supplier={supplier}
            />
        </div>
    );
}
