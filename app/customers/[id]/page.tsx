'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomerStore } from '@/stores/customer-store';
import { useSalesStore } from '@/stores/sales-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, ShoppingBag, TrendingDown, TrendingUp, User } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';
import { PaymentDialog } from '@/components/customers/payment-dialog';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { db, type Customer, type Sale, type Payment } from '@/lib/db';
import Link from 'next/link';

export default function CustomerLedgerPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = Number(params.id);
    const locale = useLocale();

    const { customers, fetchCustomers } = useCustomerStore();
    const { sales, fetchSales } = useSalesStore();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
        fetchSales();
        loadPayments();
    }, [fetchCustomers, fetchSales]);

    useEffect(() => {
        const c = customers.find(c => c.id === customerId);
        setCustomer(c || null);
    }, [customers, customerId]);

    const loadPayments = async () => {
        const allPayments = await db.payments.where('customerId').equals(customerId).toArray();
        setPayments(allPayments);
    };

    // Get sales linked to this customer
    const customerSales = useMemo(() => {
        return sales.filter(s => s.customerId === customerId);
    }, [sales, customerId]);

    // Combine sales and payments into a unified ledger
    const ledgerEntries = useMemo(() => {
        const entries: Array<{
            id: string;
            date: string;
            type: 'sale' | 'payment_received' | 'payment_given';
            description: string;
            debit: number; // Customer owes more
            credit: number; // Customer owes less
            balance?: number;
        }> = [];

        // Add sales as debit (customer owes us)
        customerSales.forEach(sale => {
            entries.push({
                id: `sale-${sale.id}`,
                date: sale.date,
                type: 'sale',
                description: `Sale #${String(sale.id).slice(0, 6)} - ${sale.items.length} items`,
                debit: sale.dueAmount || 0,
                credit: 0
            });
        });

        // Add payments
        payments.forEach(payment => {
            entries.push({
                id: `payment-${payment.id}`,
                date: payment.date,
                type: payment.type === 'received' ? 'payment_received' : 'payment_given',
                description: payment.notes || (payment.type === 'received' ? 'Payment Received' : 'Refund Given'),
                debit: payment.type === 'given' ? payment.amount : 0,
                credit: payment.type === 'received' ? payment.amount : 0
            });
        });

        // Sort by date descending
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return entries;
    }, [customerSales, payments]);

    if (!customer) {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-500">Loading customer...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{customer.phone} {customer.address && `• ${customer.address}`}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit</Button>
            </div>

            {/* Balance Card */}
            <div className={`rounded-2xl p-6 ${customer.currentBalance > 0
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : customer.currentBalance < 0
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gradient-to-br from-slate-500 to-slate-600'
                } text-white shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">
                            {customer.currentBalance > 0 ? 'Customer Owes (বাকি)' : customer.currentBalance < 0 ? 'Advance Balance (অগ্রিম)' : 'Balance Settled'}
                        </p>
                        <h2 className="text-4xl font-black">
                            {formatPrice(Math.abs(customer.currentBalance), locale)}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-2">
                        <PaymentDialog
                            customer={customer}
                            open={isPaymentDialogOpen}
                            onOpenChange={(v) => { setIsPaymentDialogOpen(v); if (!v) loadPayments(); }}
                            trigger={
                                <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                                    <DollarSign className="h-4 w-4 mr-2" /> Receive Payment (পেমেন্ট নিন)
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <ShoppingBag className="h-4 w-4" /> Total Sales
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{customerSales.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <TrendingUp className="h-4 w-4" /> Total Credit Given
                    </div>
                    <p className="text-xl font-bold text-red-600">
                        {formatPrice(customerSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0), locale)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <TrendingDown className="h-4 w-4" /> Total Received
                    </div>
                    <p className="text-xl font-bold text-green-600">
                        {formatPrice(payments.filter(p => p.type === 'received').reduce((sum, p) => sum + p.amount, 0), locale)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <User className="h-4 w-4" /> Transactions
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{ledgerEntries.length}</p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">Transaction History (খাতা)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right text-red-600">Debit (+)</th>
                                <th className="px-6 py-3 text-right text-green-600">Credit (-)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {ledgerEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No transactions yet</td>
                                </tr>
                            ) : (
                                ledgerEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(entry.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${entry.type === 'sale' ? 'bg-blue-500' : entry.type === 'payment_received' ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-red-600">
                                            {entry.debit > 0 ? formatPrice(entry.debit, locale) : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-green-600">
                                            {entry.credit > 0 ? formatPrice(entry.credit, locale) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddCustomerDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                customerToEdit={customer}
            />
        </div>
    );
}
