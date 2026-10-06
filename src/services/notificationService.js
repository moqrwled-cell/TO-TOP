/**
 * src/services/notificationService.js
 * Centralized Local Notification Service for نحو الأفضل (To Top).
 * Wraps @capacitor/local-notifications with browser Notification fallback,
 * Android notification channels ('tasks', 'prayers'), and deterministic 32-bit positive integer IDs.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Android Notification Channels Definition
export const NOTIFICATION_CHANNELS = Object.freeze({
  TASKS: {
    id: 'tasks',
    name: 'تنبيهات المهام اليومية',
    description: 'إشعارات تذكيرية بالمهام المجدولة في المنظم',
    importance: 4,
    visibility: 1,
    sound: 'beep.wav',
    vibration: true
  },
  PRAYERS: {
    id: 'prayers',
    name: 'تنبيهات أوقات الصلاة',
    description: 'إشعارات تذكيرية بدخول أوقات الصلاة المفروضة',
    importance: 5,
    visibility: 1,
    sound: 'adhan.wav',
    vibration: true
  }
});

// In-memory fallback tracking for non-native / test environments
const pendingNotificationsMap = new Map();
let channelsInitialized = false;

/**
 * Initialize Android notification channels for Tasks and Prayers
 */
export async function initializeNotificationChannels() {
  if (channelsInitialized) return;
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.TASKS);
      await LocalNotifications.createChannel(NOTIFICATION_CHANNELS.PRAYERS);
      channelsInitialized = true;
    } catch (err) {
      console.warn('[notificationService] Error creating notification channels:', err);
    }
  }
}

/**
 * Generate a deterministic 32-bit positive integer ID in range [1, 2147483647]
 * suitable for Android NotificationManager.
 *
 * @param {number|string} id - Input identifier
 * @param {number} [prefix=0] - Optional prefix offset
 * @returns {number} Deterministic positive 32-bit integer
 */
export function toDeterministicNotificationId(id, prefix = 0) {
  if (typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 2147483647) {
    return id;
  }
  const str = String(id ?? '');
  let hash = 2166136261 ^ prefix;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = (hash >>> 0) & 0x7FFFFFFF;
  return positive === 0 ? 1 : positive;
}

/**
 * Request notification permissions across native Android and Web
 * @returns {Promise<{ granted: boolean, status: string }>}
 */
export async function requestNotificationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      if (granted) {
        await initializeNotificationChannels();
      }
      return { granted, status: status.display };
    }

    // Web Notification fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      return { granted: perm === 'granted', status: perm };
    }
  } catch (err) {
    console.warn('[notificationService] Error requesting notification permissions:', err);
    return { granted: false, status: 'denied' };
  }

  // Fallback for simulated / test environments
  return { granted: true, status: 'granted' };
}

/**
 * Check current notification permission status
 * @returns {Promise<{ granted: boolean, status: string }>}
 */
export async function checkNotificationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return { granted: status.display === 'granted', status: status.display };
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return { granted: Notification.permission === 'granted', status: Notification.permission };
    }
  } catch (err) {
    console.warn('[notificationService] Error checking permissions:', err);
  }

  return { granted: true, status: 'granted' };
}

/**
 * Schedule a local notification for an organizer task.
 *
 * @param {Object} task - { id: number|string, text: string, time: string, date?: string }
 * @returns {Promise<number|null>} Notification ID or null if invalid
 */
export async function scheduleTaskNotification(task) {
  // Input validation for boundary and invalid inputs
  if (!task || typeof task !== 'object') {
    return null;
  }
  if (!task.text || typeof task.text !== 'string' || task.text.trim() === '') {
    return null;
  }
  if (!task.time || typeof task.time !== 'string') {
    return null;
  }

  const timeMatch = task.time.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return null;
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  // Calculate target trigger timestamp
  let triggerAt = new Date();
  if (task.date && typeof task.date === 'string') {
    const dMatch = task.date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dMatch) {
      triggerAt = new Date(
        parseInt(dMatch[1], 10),
        parseInt(dMatch[2], 10) - 1,
        parseInt(dMatch[3], 10),
        hours,
        minutes,
        0,
        0
      );
    } else {
      triggerAt.setHours(hours, minutes, 0, 0);
    }
  } else {
    triggerAt.setHours(hours, minutes, 0, 0);
  }

  // If time has already passed today and no future date was specified, schedule a brief reminder ahead
  if (triggerAt.getTime() <= Date.now()) {
    triggerAt = new Date(Date.now() + 5000);
  }

  const notifId = toDeterministicNotificationId(task.id);

  const notificationPayload = {
    id: notifId,
    title: 'تذكير بمهمة: نحو الأفضل',
    body: task.text.trim(),
    schedule: { at: triggerAt },
    channelId: NOTIFICATION_CHANNELS.TASKS.id,
    sound: NOTIFICATION_CHANNELS.TASKS.sound,
    extra: {
      taskId: task.id,
      type: 'task'
    }
  };

  pendingNotificationsMap.set(notifId, notificationPayload);

  // Native scheduling
  try {
    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      await LocalNotifications.schedule({
        notifications: [notificationPayload]
      });
    }
  } catch (err) {
    console.info('[notificationService] LocalNotifications.schedule fallback:', err?.message || err);
  }

  return notifId;
}

/**
 * Cancel a scheduled task notification safely.
 *
 * @param {number|string|null} taskId
 * @returns {Promise<void>}
 */
export async function cancelTaskNotification(taskId) {
  if (taskId === null || taskId === undefined) {
    return;
  }

  const notifId = toDeterministicNotificationId(taskId);
  pendingNotificationsMap.delete(notifId);

  try {
    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }]
      });
    }
  } catch (err) {
    console.info('[notificationService] cancelTaskNotification fallback:', err?.message || err);
  }
}

/**
 * Schedule local notifications for Islamic prayer times.
 *
 * @param {Record<string, string>} prayerTimes - e.g. { Fajr: '05:00', Dhuhr: '12:15', ... }
 * @param {Object} [coords] - Coordinates metadata
 * @returns {Promise<number[]>} Array of scheduled positive integer IDs
 */
export async function schedulePrayerNotifications(prayerTimes, coords = null) {
  if (!prayerTimes || typeof prayerTimes !== 'object') {
    return [];
  }

  const prayerDefs = [
    { key: 'Fajr', id: 80001, name: 'الفجر' },
    { key: 'Sunrise', id: 80002, name: 'الشروق' },
    { key: 'Dhuhr', id: 80003, name: 'الظهر' },
    { key: 'Asr', id: 80004, name: 'العصر' },
    { key: 'Maghrib', id: 80005, name: 'المغرب' },
    { key: 'Isha', id: 80006, name: 'العشاء' }
  ];

  const notificationsToSchedule = [];
  const scheduledIds = [];
  const now = Date.now();

  for (const item of prayerDefs) {
    const timeStr = prayerTimes[item.key] || prayerTimes[item.key.toLowerCase()];
    if (!timeStr || typeof timeStr !== 'string') continue;

    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) continue;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // Defensive range check: hours must be [0, 23], minutes must be [0, 59]
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      continue;
    }

    let target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If prayer time has passed today, schedule for tomorrow
    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }

    const payload = {
      id: item.id,
      title: `حان الآن موعد صلاة ${item.name}`,
      body: `حي على الصلاة، حي على الفلاح (${timeStr})`,
      schedule: { at: target },
      channelId: NOTIFICATION_CHANNELS.PRAYERS.id,
      sound: NOTIFICATION_CHANNELS.PRAYERS.sound,
      extra: {
        prayer: item.key,
        type: 'prayer'
      }
    };

    notificationsToSchedule.push(payload);
    scheduledIds.push(item.id);
    pendingNotificationsMap.set(item.id, payload);
  }

  if (notificationsToSchedule.length > 0) {
    try {
      if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
      }
    } catch (err) {
      console.info('[notificationService] schedulePrayerNotifications fallback:', err?.message || err);
    }
  }

  return scheduledIds;
}

/**
 * Dispatch an immediate test notification to verify system sound and banner.
 * @returns {Promise<boolean>}
 */
export async function testNotification() {
  try {
    const testId = 99999;
    const payload = {
      id: testId,
      title: 'نحو الأفضل — اختبار الإشعارات',
      body: 'تم تفعيل نظام الإشعارات المحلية بنجاح!',
      schedule: { at: new Date(Date.now() + 1000) },
      channelId: NOTIFICATION_CHANNELS.TASKS.id,
      sound: NOTIFICATION_CHANNELS.TASKS.sound
    };

    pendingNotificationsMap.set(testId, payload);

    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      await LocalNotifications.schedule({
        notifications: [payload]
      });
    }

    return true;
  } catch (err) {
    console.warn('[notificationService] testNotification error:', err);
    return false;
  }
}

/**
 * Retrieve all currently pending notifications
 * @returns {Promise<any[]>}
 */
export async function getPendingNotifications() {
  try {
    if (typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || typeof window !== 'undefined')) {
      const res = await LocalNotifications.getPending();
      if (res?.notifications) {
        return res.notifications;
      }
    }
  } catch (err) {
    console.info('[notificationService] getPending fallback:', err?.message || err);
  }
  return Array.from(pendingNotificationsMap.values());
}
