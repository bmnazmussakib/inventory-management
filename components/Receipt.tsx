import React from 'react';
import { bnNumber, formatPrice, formatBanglaDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface ReceiptItem {
    name: string;
    qty: number;
    price: number; // discounted unit price
    itemDiscount?: number; // total discount for this item
    scheme?: string;
}

interface ReceiptProps {
    sale: {
        id?: number;
        date: string;
        items: ReceiptItem[];
        subtotal: number;
        discount: number;
        total: number;
    };
    className?: string;
}


import { useSettingsStore } from '@/stores/settings-store';

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, className }, ref) => {
    const t = useTranslations('Sales');
    const locale = useLocale();
    const { shopName, shopAddress, shopPhone, invoiceFooter } = useSettingsStore();

    return (
        <div
            ref={ref}
            className={cn(
                "w-[80mm] p-6 bg-white text-black font-mono text-[12px] printable-receipt",
                className
            )}
        >
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">{shopName}</h1>
                <p className="text-[10px] text-gray-600">{shopAddress}</p>
                <p className="text-[10px] text-gray-600">Phone: {shopPhone}</p>
                <div className="border-b border-dashed border-gray-400 my-4" />
                <h2 className="text-sm font-bold font-bengali">{t('receipt.title')}</h2>
            </div>

            {/* Meta Info */}
            <div className="mb-4 space-y-1 text-[10px] font-bengali">
                <div className="flex justify-between">
                    <span>{locale === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                    <span>{locale === 'bn' ? formatBanglaDate(sale.date) : new Date(sale.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>{locale === 'bn' ? 'রশিদ নং:' : 'Bill No:'}</span>
                    <span>#{sale.id ? (locale === 'bn' ? bnNumber(sale.id) : sale.id) : '---'}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-4" />

            {/* Items Table */}
            <table className="w-full mb-4 text-[10px] font-bengali">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left font-bold pb-2">{t('item')}</th>
                        <th className="text-center font-bold pb-2">{t('qty')}</th>
                        <th className="text-right font-bold pb-2">{t('price')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-2 pr-2">
                                <div className="font-bold">{item.name}</div>
                                {item.scheme && (
                                    <div className="text-[8px] text-gray-500 italic mt-0.5 opacity-80">
                                        {t('offer', { scheme: item.scheme })}
                                    </div>
                                )}
                            </td>
                            <td className="text-center py-2">{locale === 'bn' ? bnNumber(item.qty) : item.qty}</td>
                            <td className="text-right py-2">{formatPrice(item.price * item.qty, locale)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-solid border-black my-4" />

            {/* Footer / Total */}
            <div className="space-y-1 pt-2 font-bengali">
                <div className="flex justify-between text-[10px]">
                    <span>{t('subtotal')}:</span>
                    <span>{formatPrice(sale.subtotal, locale)}</span>
                </div>
                {sale.discount > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-600">
                        <span>{t('discount')}:</span>
                        <span>-{formatPrice(sale.discount, locale)}</span>
                    </div>
                )}
                <div className="border-b border-gray-200 my-2" />
                <div className="flex justify-between text-base font-bold">
                    <span>{t('grandTotal')}:</span>
                    <span>{formatPrice(sale.total, locale)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 italic mt-2">
                    <span>{locale === 'bn' ? 'পেমেন্ট মোড:' : 'Payment Mode:'}</span>
                    <span>{locale === 'bn' ? 'ক্যাশ' : 'Cash'}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-6" />

            {/* Thank You Note */}
            <div className="text-center space-y-2 font-bengali pt-4">
                <p className="text-[10px] font-bold leading-tight break-words">
                    {locale === 'bn' ? 'ধন্যবাদ! আবার আসবেন।' : 'Thank you! Come again.'}
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">{invoiceFooter || 'Thank you for shopping with us!'}</p>
                <div className="pt-2">
                    <p className="text-[8px] opacity-40">Powered by {shopName}</p>
                </div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
