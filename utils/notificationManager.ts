import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Safe notification imports with error handling
let Notifications: any = null;
try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
    // Configure notification behavior only if available
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.warn('expo-notifications not available:', error);
  Notifications = {
    // Mock implementation for development
    getExpoPushTokenAsync: () => Promise.resolve({ data: 'mock-token' }),
    getPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    requestPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    scheduleNotificationAsync: () => Promise.resolve('mock-id'),
    cancelNotificationAsync: () => Promise.resolve(),
    getAllScheduledNotificationsAsync: () => Promise.resolve([]),
    addNotificationReceivedListener: () => ({ remove: () => {} }),
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  };
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: NotificationType;
  scheduledTime?: Date;
  sent?: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'reservation_confirmed' 
  | 'reservation_cancelled'
  | 'event_reminder'
  | 'event_starting'
  | 'payment_received'
  | 'new_reservation'
  | 'attendance_reminder'
  | 'event_updated'
  | 'general';

export class NotificationManager {
  private static NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
  private static PUSH_TOKEN_KEY = 'expo_push_token';
  private static SETTINGS_KEY = 'notification_settings';

  // Initialize notification system
  static async initialize(): Promise<boolean> {
    try {
      // Skip native notification setup in development/web environment
      if (__DEV__ && Platform.OS === 'web') {
        console.log('Development web environment - skipping native notification setup');
        return true;
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        // In development, still return true to allow app to continue
        return __DEV__ ? true : false;
      }

      // Get push token for this device
      const pushToken = await this.getPushToken();
      
      if (pushToken) {
        // Store token for backend registration
        await AsyncStorage.setItem(this.PUSH_TOKEN_KEY, pushToken);
        console.log('Push token stored:', pushToken);
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // In development, return true to prevent app crashes
      return __DEV__ ? true : false;
    }
  }

  // Get Expo push token
  private static async getPushToken(): Promise<string | null> {
    try {
      // Skip push token generation in development/web environment
      if (__DEV__ && (Platform.OS === 'web' || !Constants.isDevice)) {
        console.log('Development environment - using mock push token');
        return 'dev-mock-push-token-' + Math.random().toString(36).substr(2, 9);
      }

      if (Constants.isDevice) {
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        return token;
      } else {
        console.log('Must use physical device for Push Notifications');
        return null;
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      // Return mock token in development to prevent crashes
      if (__DEV__) {
        console.log('Returning mock token due to error in development');
        return 'dev-fallback-push-token-' + Math.random().toString(36).substr(2, 9);
      }
      return null;
    }
  }

  // Set up notification listeners
  private static setupNotificationListeners() {
    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received in foreground:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  // Handle notification received
  private static async handleNotificationReceived(notification: any) {
    // Store notification in local storage
    await this.storeNotification({
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      type: (notification.request.content.data?.type as NotificationType) || 'general',
      createdAt: new Date().toISOString(),
      sent: true,
    });
  }

  // Handle notification tap
  private static handleNotificationTapped(response: any) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.navigationRoute) {
      // In a real app, you'd use your navigation system here
      console.log('Navigate to:', data.navigationRoute, data.navigationParams);
    }
  }

  // Send reservation confirmation notification
  static async sendReservationConfirmation(
    reservationId: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string
  ) {
    const notification: NotificationData = {
      id: `reservation_confirmed_${reservationId}`,
      title: '✅ Reserva Confirmada',
      body: `Tu reserva para "${eventTitle}" ha sido confirmada para el ${eventDate} a las ${eventTime}`,
      type: 'reservation_confirmed',
      data: {
        reservationId,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        navigationRoute: '/reservations',
        navigationParams: { reservationId }
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }

  // Send event reminder notification
  static async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    reminderMinutes: number = 60
  ) {
    const eventDateTime = new Date(`${eventDate} ${eventTime}`);
    const reminderTime = new Date(eventDateTime.getTime() - (reminderMinutes * 60 * 1000));

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      console.log('Reminder time is in the past, skipping');
      return;
    }

    const notification: NotificationData = {
      id: `event_reminder_${eventId}`,
      title: '⏰ Recordatorio de Evento',
      body: `"${eventTitle}" comienza en ${reminderMinutes} minutos`,
      type: 'event_reminder',
      scheduledTime: reminderTime,
      data: {
        eventId,
        eventTitle,
        eventDate,
        eventTime,
        navigationRoute: '/event-detail',
        navigationParams: { eventId }
      },
      createdAt: new Date().toISOString(),
    };

    await this.scheduleLocalNotification(notification);
    return notification;
  }

  // Send new reservation notification to host
  static async sendNewReservationToHost(
    hostName: string,
    eventTitle: string,
    attendeeName: string,
    numberOfSpots: number
  ) {
    const notification: NotificationData = {
      id: `new_reservation_${Date.now()}`,
      title: '🎉 Nueva Reserva',
      body: `${attendeeName} ha reservado ${numberOfSpots} plaza${numberOfSpots > 1 ? 's' : ''} para "${eventTitle}"`,
      type: 'new_reservation',
      data: {
        eventTitle,
        attendeeName,
        numberOfSpots,
        navigationRoute: '/mi-tablero',
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }

  // Send payment received notification
  static async sendPaymentReceived(
    amount: number,
    eventTitle: string,
    attendeeName: string
  ) {
    const notification: NotificationData = {
      id: `payment_received_${Date.now()}`,
      title: '💰 Pago Recibido',
      body: `Has recibido €${amount.toFixed(2)} de ${attendeeName} por "${eventTitle}"`,
      type: 'payment_received',
      data: {
        amount,
        eventTitle,
        attendeeName,
        navigationRoute: '/bank-accounts',
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }

  // Send event starting soon notification
  static async sendEventStartingSoon(
    eventId: string,
    eventTitle: string,
    eventLocation: string,
    minutesUntilStart: number
  ) {
    const notification: NotificationData = {
      id: `event_starting_${eventId}`,
      title: '🚀 Tu Evento Está Por Comenzar',
      body: `"${eventTitle}" comienza en ${minutesUntilStart} minutos en ${eventLocation}`,
      type: 'event_starting',
      data: {
        eventId,
        eventTitle,
        eventLocation,
        navigationRoute: '/host-dashboard',
        navigationParams: { eventId }
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }

  // Send attendance reminder
  static async sendAttendanceReminder(
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string
  ) {
    const notification: NotificationData = {
      id: `attendance_reminder_${Date.now()}`,
      title: '📍 No Olvides Tu Evento',
      body: `"${eventTitle}" es hoy a las ${eventTime} en ${eventLocation}`,
      type: 'attendance_reminder',
      data: {
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        navigationRoute: '/ticket-wallet',
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }

  // Send local notification immediately
  private static async sendLocalNotification(notification: NotificationData) {
    try {
      // Check if notifications are enabled for this type
      if (!(await this.isNotificationTypeEnabled(notification.type))) {
        console.log(`Notifications disabled for type: ${notification.type}`);
        return;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('Local notification sent:', identifier);
      
      // Store notification
      notification.sent = true;
      await this.storeNotification(notification);
      
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Schedule local notification for later
  private static async scheduleLocalNotification(notification: NotificationData) {
    try {
      if (!notification.scheduledTime) {
        throw new Error('Scheduled time required');
      }

      // Check if notifications are enabled for this type
      if (!(await this.isNotificationTypeEnabled(notification.type))) {
        console.log(`Notifications disabled for type: ${notification.type}`);
        return;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, (notification.scheduledTime.getTime() - Date.now()) / 1000) 
        },
      });

      console.log('Local notification scheduled:', identifier, 'for', notification.scheduledTime);
      
      // Store notification
      await this.storeNotification(notification);
      
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Store notification in local storage
  private static async storeNotification(notification: NotificationData) {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATIONS_STORAGE_KEY);
      const notifications = stored ? JSON.parse(stored) : [];
      
      // Add new notification
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get all notifications
  static async getNotifications(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread notifications count
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.data?.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId 
          ? { ...n, data: { ...n.data, read: true } }
          : n
      );
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Clear all notifications
  static async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem(this.NOTIFICATIONS_STORAGE_KEY);
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Notification settings management
  static async getNotificationSettings() {
    try {
      const stored = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async updateNotificationSettings(settings: any) {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  private static getDefaultSettings() {
    return {
      reservation_confirmed: true,
      reservation_cancelled: true,
      event_reminder: true,
      event_starting: true,
      payment_received: true,
      new_reservation: true,
      attendance_reminder: true,
      event_updated: true,
      general: true,
      soundEnabled: true,
      vibrationEnabled: true,
      reminderMinutes: 60,
    };
  }

  private static async isNotificationTypeEnabled(type: NotificationType): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings[type] !== false;
  }

  // Cancel scheduled notifications for specific event
  static async cancelEventNotifications(eventId: string) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.eventId === eventId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log('Cancelled notification:', notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cancelling event notifications:', error);
    }
  }

  // Test notification (for development)
  static async sendTestNotification() {
    const notification: NotificationData = {
      id: `test_${Date.now()}`,
      title: '🧪 Notificación de Prueba',
      body: 'El sistema de notificaciones funciona correctamente',
      type: 'general',
      data: {
        test: true,
      },
      createdAt: new Date().toISOString(),
    };

    await this.sendLocalNotification(notification);
    return notification;
  }
}

export default NotificationManager;