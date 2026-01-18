/**
 * Notification Alert Service
 * Shows system notifications to users via alerts (mocked push notifications)
 * In production, this would use expo-notifications for actual push notifications
 */

import { Alert, Platform } from "react-native";
import type { AppNotification } from "../types";
import { logger } from "../lib/logger";

/**
 * Show a notification alert to the user
 * This is a mock for system notifications until push notifications are implemented
 */
export function showNotificationAlert(notification: AppNotification): void {
  // Only show alert for notifications that aren't for the current user's own actions
  // (e.g., don't alert yourself when you comment on a post)

  logger.info("Showing notification alert", {
    type: notification.type,
    title: notification.title,
  });

  // Check if Alert is available (not available in test environment)
  if (!Alert?.alert) {
    logger.info("Alert not available (test environment)", { notificationId: notification.id });
    return;
  }

  // Use Alert.alert to mock system notification
  Alert.alert(notification.title, notification.text, [
    {
      text: "View",
      onPress: () => {
        logger.info("Notification viewed", { notificationId: notification.id });
        // Navigation would happen here in a full implementation
        // router.push based on notification.data.screen
      },
    },
    {
      text: "Dismiss",
      style: "cancel",
    },
  ]);
}

/**
 * Show a simple toast-style notification (non-blocking)
 * Falls back to console on web or test environment
 */
export function showNotificationToast(title: string, message: string): void {
  if (Platform.OS === "web" || !Alert?.alert) {
    logger.info("Notification toast", { title, message });
    return;
  }

  // On mobile, show a brief alert
  // In production, use a toast library or expo-notifications
  Alert.alert(title, message, [{ text: "OK" }], { cancelable: true });
}

/**
 * Queue a notification for later display
 * Useful when you don't want to interrupt the user immediately
 */
const notificationQueue: AppNotification[] = [];

export function queueNotification(notification: AppNotification): void {
  notificationQueue.push(notification);
  logger.info("Notification queued", {
    type: notification.type,
    queueLength: notificationQueue.length,
  });
}

export function getQueuedNotifications(): AppNotification[] {
  return [...notificationQueue];
}

export function clearNotificationQueue(): void {
  notificationQueue.length = 0;
}

/**
 * Process and show all queued notifications
 */
export function processNotificationQueue(): void {
  const notifications = getQueuedNotifications();
  clearNotificationQueue();

  if (notifications.length === 0) return;

  if (notifications.length === 1) {
    showNotificationAlert(notifications[0]);
  } else {
    // Show a summary for multiple notifications
    Alert.alert("New Notifications", `You have ${notifications.length} new notifications`, [
      {
        text: "View All",
        onPress: () => {
          logger.info("Viewing all notifications");
          // Navigate to notifications screen
        },
      },
      {
        text: "Dismiss",
        style: "cancel",
      },
    ]);
  }
}
