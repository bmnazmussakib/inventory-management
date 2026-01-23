'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductStore } from '@/stores/product-store';
import { ProductBatch } from '@/lib/db';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bnNumber, formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';

interface BatchSelectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: number | null;
    productName: string;
    onSelectBatch: (batch: ProductBatch) => void;
}

export function BatchSelectDialog({ open, onOpenChange, productId, productName, onSelectBatch }: BatchSelectDialogProps) {
    const { getBatchesByProductId } = useProductStore();
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const locale = useLocale();

    useEffect(() => {
        if (open && productId) {
            setLoading(true);
            getBatchesByProductId(productId).then(data => {
                // Filter out out-of-stock batches? Maybe show them as disabled.
                // Sort by expiry (earliest first)
                const sorted = data.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                setBatches(sorted);
                setLoading(false);
            });
        }
    }, [open, productId, getBatchesByProductId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Select Batch for {productName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500">Loading batches...</div>
                    ) : batches.length === 0 ? (
                        <div className="p-4 text-center text-red-500 font-bold">No batches found for this product!</div>
                    ) : (
                        <div className="grid gap-2">
                            {batches.map(batch => {
                                const expiry = new Date(batch.expiryDate);
                                const now = new Date();
                                const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                const isExpired = daysToExpiry < 0;
                                const isOutOfStock = batch.currentStock <= 0;

                                let statusColor = "text-green-600";
                                let StatusIcon = CheckCircle2;

                                if (isExpired) {
                                    statusColor = "text-red-500 font-bold";
                                    StatusIcon = XCircle;
                                } else if (daysToExpiry < 30) {
                                    statusColor = "text-orange-500 font-bold";
                                    StatusIcon = AlertTriangle;
                                }

                                return (
                                    <button
                                        key={batch.id}
                                        disabled={isExpired || isOutOfStock}
                                        onClick={() => {
                                            onSelectBatch(batch);
                                            onOpenChange(false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                                            isExpired || isOutOfStock
                                                ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-400 cursor-not-allowed"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md hover:ring-1 hover:ring-primary/20"
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">#{batch.batchNumber}</span>
                                                <div className={cn("text-xs flex items-center gap-1", statusColor)}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {isExpired ? 'Expired' : daysToExpiry < 30 ? `Expiring in ${daysToExpiry}d` : 'Healthy'}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Expiry: {format(expiry, 'dd MMM yyyy')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500">Stock</div>
                                            <div className={cn("font-bold text-lg", isOutOfStock ? "text-red-400" : "text-slate-700 dark:text-slate-200")}>
                                                {locale === 'bn' ? bnNumber(batch.currentStock) : batch.currentStock}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
