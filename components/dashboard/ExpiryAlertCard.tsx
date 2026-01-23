'use client';

import { useEffect, useState } from 'react';
import { db, ProductBatch, Product } from '@/lib/db';
import { format } from 'date-fns';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { bnNumber } from '@/lib/format';
import { useLocale } from 'next-intl';

export function ExpiryAlertCard() {
    const [expiringBatches, setExpiringBatches] = useState<{ batch: ProductBatch, product: Product }[]>([]);
    const [loading, setLoading] = useState(true);
    const locale = useLocale();

    useEffect(() => {
        const fetchExpiring = async () => {
            try {
                // Get all batches
                const allBatches = await db.product_batches.toArray();
                const now = new Date();
                const thirtyDaysLater = new Date();
                thirtyDaysLater.setDate(now.getDate() + 30);

                // Filter expiring soon or expired
                const expiring = allBatches.filter(b => {
                    if (b.currentStock <= 0) return false; // Ignore out of stock
                    const expiry = new Date(b.expiryDate);
                    return expiry <= thirtyDaysLater;
                });

                // Sort by earliest expiry
                expiring.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                // Get product details for these batches (limit to top 5)
                const top5 = expiring.slice(0, 5);
                const populated = await Promise.all(top5.map(async (batch) => {
                    const product = await db.products.get(batch.productId);
                    return product ? { batch, product } : null;
                }));

                setExpiringBatches(populated.filter(Boolean) as { batch: ProductBatch, product: Product }[]);
            } catch (err) {
                console.error("Failed to fetch expiring batches", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExpiring();
    }, []);

    if (loading) return null; // Or skeleton

    return (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-orange-500" />
                <h2 className="text-slate-900 dark:text-white text-lg font-bold">মেয়াদোত্তীর্ণ সতর্কতা (Expiry Alert)</h2>
            </div>

            <div className="space-y-4">
                {expiringBatches.length > 0 ? expiringBatches.map(({ batch, product }) => {
                    const expiry = new Date(batch.expiryDate);
                    const now = new Date();
                    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpired = daysToExpiry < 0;

                    return (
                        <div key={batch.id} className={cn(
                            "flex items-center justify-between p-3 rounded-xl border",
                            isExpired
                                ? "border-red-50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10"
                                : "border-orange-50 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10"
                        )}>
                            <div className="flex gap-3 items-center min-w-0">
                                <div className={cn(
                                    "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center shadow-sm text-white",
                                    isExpired ? "bg-red-500" : "bg-orange-500"
                                )}>
                                    <Package className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{product.name} ({batch.batchNumber})</p>
                                    <p className="text-[11px] text-slate-500">
                                        মেয়াদ: {format(expiry, 'dd MMM yyyy')} • মজুত: {locale === 'bn' ? bnNumber(batch.currentStock) : batch.currentStock}
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2",
                                isExpired ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            )}>
                                {isExpired ? 'Expired' : `${daysToExpiry} days`}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-8 text-slate-400 text-sm">সব ব্যাচের মেয়াদ ঠিক আছে ✅</div>
                )}
            </div>

            <Link href="/products">
                <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-sm font-medium hover:border-primary hover:text-primary transition-all">
                    স্টক ম্যানেজ করুন
                </button>
            </Link>
        </section>
    );
}
