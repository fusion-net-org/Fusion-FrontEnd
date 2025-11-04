import { create } from 'zustand';
import type { INotification } from '@/interfaces/Notification/Notification';

interface NotificationState {
  refreshKey: number;
  notifications: INotification[];
  unreadCount: number;

  setNotifications: (items: INotification[]) => void;
  bump: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  refreshKey: 0,
  notifications: [],
  unreadCount: 0,

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.filter((x) => !x.isRead).length,
    }),

  bump: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
