import { create } from 'zustand';
import { toast } from 'sonner';

export type NotificationType = 'low_stock' | 'expiry';

export interface Notification {
    id: string;
    type: NotificationType;
    productId: number;
    productName: string;
    message: string;
    timestamp: number;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>, showToast?: boolean) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],

    addNotification: (notification, showToast = false) => {
        set((state) => {
            // Prevent duplicate notifications for the same product and type if added recently (last 1 hour)
            const exists = state.notifications.find(
                (n) => n.productId === notification.productId &&
                    n.type === notification.type &&
                    (Date.now() - n.timestamp < 3600000)
            );
            if (exists) return state;

            const newNotification: Notification = {
                ...notification,
                id: Math.random().toString(36).substring(7),
                timestamp: Date.now(),
            };

            if (showToast) {
                toast(notification.type === 'low_stock' ? 'Low Stock Alert' : 'Expiry Alert', {
                    description: notification.message,
                    duration: 5000,
                });
            }

            return { notifications: [newNotification, ...state.notifications] };
        });
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },

    clearAll: () => set({ notifications: [] }),
}));
