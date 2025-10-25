import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@store/AuthContext';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  writeBatch,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  userId: string;
  type: 'group_invite' | 'group_activity' | 'weekly_report' | 'achievement' | 'system' | 'counselor_message';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  sendNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 실시간 알림 구독
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification: Notification = {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          read: data.read || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          priority: data.priority || 'medium',
        };

        newNotifications.push(notification);
        if (!notification.read) {
          unread++;
        }
      });

      setNotifications(newNotifications);
      setUnreadCount(unread);

      // 새로운 알림이 있으면 토스트 표시
      if (newNotifications.length > 0 && newNotifications[0].createdAt > new Date(Date.now() - 5000)) {
        const latestNotification = newNotifications[0];
        if (!latestNotification.read) {
          showNotificationToast(latestNotification);
        }
      }
    }, (error) => {
      console.error('알림 구독 오류:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // 알림 토스트 표시
  const showNotificationToast = useCallback((notification: Notification) => {
    const toastOptions = {
      duration: notification.priority === 'urgent' ? 8000 : 4000,
      icon: getNotificationIcon(notification.type),
      style: {
        background: getNotificationColor(notification.priority),
        color: '#fff',
      },
    };

    toast(notification.message, toastOptions);
  }, []);

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      group_invite: '👥',
      group_activity: '📊',
      weekly_report: '📈',
      achievement: '🏆',
      system: '⚙️',
      counselor_message: '💬',
    };
    return icons[type] || '🔔';
  };

  // 알림 색상 가져오기
  const getNotificationColor = (priority: Notification['priority']) => {
    const colors = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority] || colors.medium;
  };

  // 알림을 읽음으로 표시
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  }, []);

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const batch = writeBatch(db);

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
    }
  }, [notifications]);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('알림 삭제 오류:', error);
    }
  }, []);

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('모든 알림 삭제 오류:', error);
    }
  }, [notifications]);

  // 새 알림 전송
  const sendNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: new Date(),
        read: false,
      });
    } catch (error) {
      console.error('알림 전송 오류:', error);
    }
  }, []);

  // 브라우저 푸시 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 브라우저 푸시 알림 표시
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const latestNotification = notifications[0];
      if (latestNotification && !latestNotification.read) {
        const browserNotification = new Notification(latestNotification.title, {
          body: latestNotification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: latestNotification.id,
          requireInteraction: latestNotification.priority === 'urgent',
        });

        browserNotification.onclick = () => {
          window.focus();
          markAsRead(latestNotification.id);
          browserNotification.close();
        };

        // 5초 후 자동 닫기
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }, [notifications, markAsRead]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
