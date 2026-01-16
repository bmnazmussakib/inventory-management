import { useEffect } from 'react';
import { useProductStore } from '@/stores/product-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function useNotificationScanner() {
    const { products } = useProductStore();
    const { addNotification } = useNotificationStore();
    const t = useTranslations('Notifications');

    useEffect(() => {
        if (products.length === 0) return;

        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        products.forEach((product) => {
            // Check Low Stock
            if (product.stock <= product.reorderLevel) {
                const message = t('lowStock', { name: product.name, count: product.stock });
                addNotification({
                    type: 'low_stock',
                    productId: product.id!,
                    productName: product.name,
                    message,
                });
            }

            // Check Expiry
            if (product.expiryDate) {
                const expiry = new Date(product.expiryDate);
                if (expiry <= thirtyDaysLater) {
                    const type = expiry < now ? 'expiry' : 'expiry'; // Both use expiry type for now
                    const message = expiry < now
                        ? t('expired', { name: product.name })
                        : t('expiringSoon', { name: product.name, date: new Date(product.expiryDate).toLocaleDateString() });

                    addNotification({
                        type: 'expiry',
                        productId: product.id!,
                        productName: product.name,
                        message,
                    });
                }
            }
        });
    }, [products, addNotification, t]);
}
