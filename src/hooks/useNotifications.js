import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [currentToken, setCurrentToken] = useState(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const getFCMToken = async () => {
    try {
      const permission = await checkPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      setCurrentToken(token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  const scheduleLocalNotification = (title, body, delay = 0) => {
    if (!('Notification' in window) || notificationPermission !== 'granted') {
      return;
    }

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    }, delay);
  };

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      // Show local notification
      if (payload.notification) {
        scheduleLocalNotification(
          payload.notification.title,
          payload.notification.body
        );
      }
    });

    return unsubscribe;
  }, []);

  return {
    notificationPermission,
    currentToken,
    getFCMToken,
    scheduleLocalNotification,
    checkPermission
  };
};