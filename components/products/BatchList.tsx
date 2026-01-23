'use client';

import { useEffect, useState } from 'react';
import { useProductStore } from '@/stores/product-store';
import { ProductBatch } from '@/lib/db';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BatchList({ productId }: { productId: number }) {
    const { getBatchesByProductId } = useProductStore();
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getBatchesByProductId(productId);
            setBatches(data);
            setLoading(false);
        };
        load();
    }, [productId, getBatchesByProductId]);

    if (loading) return <div className="p-4 text-sm text-slate-500">Loading batches...</div>;

    if (batches.length === 0) return <div className="p-4 text-sm text-slate-500">No batches found.</div>;

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-2">Batch #</th>
                        <th className="px-4 py-2">Expiry</th>
                        <th className="px-4 py-2 text-center">Stock</th>
                        <th className="px-4 py-2 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {batches.map(batch => {
                        const expiry = new Date(batch.expiryDate);
                        const now = new Date();
                        const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        let statusColor = "text-green-600";
                        let StatusIcon = CheckCircle2;

                        if (daysToExpiry < 0) {
                            statusColor = "text-red-500 font-bold";
                            StatusIcon = XCircle;
                        } else if (daysToExpiry < 30) {
                            statusColor = "text-orange-500 font-bold";
                            StatusIcon = AlertTriangle;
                        }

                        return (
                            <tr key={batch.id} className="hover:bg-white dark:hover:bg-slate-800/50">
                                <td className="px-4 py-2 font-medium">{batch.batchNumber}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    {format(expiry, 'dd MMM yyyy')}
                                    {daysToExpiry > 0 && daysToExpiry < 90 && (
                                        <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{daysToExpiry}d</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-center font-bold">{batch.currentStock}</td>
                                <td className="px-4 py-2 text-right">
                                    <div className={cn("flex items-center justify-end gap-1", statusColor)}>
                                        <StatusIcon className="h-3 w-3" />
                                        <span>{daysToExpiry < 0 ? 'Expired' : daysToExpiry < 30 ? 'Expiring' : 'Good'}</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
