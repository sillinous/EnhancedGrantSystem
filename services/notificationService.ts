import { Notification } from '../types';

const STORAGE_KEY = 'grantfinder_notifications';

const getStoredNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const getNotifications = async (): Promise<Notification[]> => {
  return getStoredNotifications();
};

export const markAsRead = async (id: number): Promise<void> => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n =>
    n.id === id ? { ...n, isRead: true } : n
  );
  saveNotifications(updated);
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
  const notifications = getStoredNotifications();
  const newNotification: Notification = {
    ...notification,
    id: Date.now(),
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
  return newNotification;
};

export const clearAllNotifications = async (): Promise<void> => {
  saveNotifications([]);
};
