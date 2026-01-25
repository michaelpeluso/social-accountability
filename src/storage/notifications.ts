/**
 * Notifications Storage Module
 * Handles local notifications for reactions, nudges, badges, etc. (M3)
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { AppNotification, NotificationType } from "../types";

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  text: string,
  data?: Record<string, string>
): Promise<AppNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const notification: AppNotification = {
    id,
    userId,
    type,
    title,
    text,
    data,
    isRead: false,
    createdAt: now,
  };

  await execute(
    `INSERT INTO notifications (id, userId, type, title, text, data, isRead, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      notification.id,
      notification.userId,
      notification.type,
      notification.title,
      notification.text,
      data ? JSON.stringify(data) : null,
      notification.createdAt,
    ]
  );

  logger.info("Notification created", { notificationId: id, type, userId });
  return notification;
}

/**
 * Get user's notifications
 */
export async function getNotifications(
  userId: string,
  limit = 50,
  includeRead = true
): Promise<AppNotification[]> {
  const readClause = includeRead ? "" : "AND isRead = 0";

  const rows = await query<AppNotification & { data: string | null }>(
    `SELECT * FROM notifications WHERE userId = ? ${readClause} ORDER BY createdAt DESC LIMIT ?`,
    [userId, limit]
  );

  return rows.map((row) => ({
    ...row,
    isRead: Boolean(row.isRead),
    data: row.data ? JSON.parse(row.data) : undefined,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0",
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await execute("UPDATE notifications SET isRead = 1 WHERE id = ?", [notificationId]);
  logger.info("Notification marked as read", { notificationId });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await execute("UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0", [userId]);
  logger.info("All notifications marked as read", { userId });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await execute("DELETE FROM notifications WHERE id = ?", [notificationId]);
  logger.info("Notification deleted", { notificationId });
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

  const result = await execute("DELETE FROM notifications WHERE userId = ? AND createdAt < ?", [
    userId,
    cutoffDate,
  ]);

  const deletedCount = result.changes;
  if (deletedCount > 0) {
    logger.info("Old notifications cleaned up", { userId, deletedCount });
  }

  return deletedCount;
}

// Notification factory functions for common notification types

/**
 * Create a notification for receiving a reaction
 */
export async function notifyReactionReceived(
  userId: string,
  reactorName: string,
  emoji: string,
  postId: string
): Promise<AppNotification> {
  return createNotification(
    userId,
    "REACTION_RECEIVED",
    "New Reaction",
    `${reactorName} reacted ${emoji} to your post`,
    { postId }
  );
}

/**
 * Create a notification for receiving a nudge
 */
export async function notifyNudgeReceived(
  userId: string,
  senderName: string,
  templateText: string,
  templateEmoji: string
): Promise<AppNotification> {
  return createNotification(
    userId,
    "NUDGE_RECEIVED",
    `${templateEmoji} ${senderName}`,
    templateText,
    { screen: "nudges" }
  );
}

/**
 * Create a notification for earning a badge
 */
export async function notifyBadgeEarned(
  userId: string,
  badgeName: string,
  badgeEmoji: string,
  badgeId: string
): Promise<AppNotification> {
  return createNotification(
    userId,
    "BADGE_EARNED",
    `${badgeEmoji} Badge Earned!`,
    `You earned the "${badgeName}" badge`,
    { badgeId, screen: "profile" }
  );
}

/**
 * Create a notification for a friend posting
 */
export async function notifyFriendPosted(
  userId: string,
  friendName: string,
  postId: string
): Promise<AppNotification> {
  return createNotification(
    userId,
    "FRIEND_POSTED",
    "New Post",
    `${friendName} shared a new post`,
    { postId, screen: "feed" }
  );
}

/**
 * Create a habit reminder notification
 */
export async function notifyHabitReminder(
  userId: string,
  habitTitle: string,
  habitId: string
): Promise<AppNotification> {
  return createNotification(userId, "HABIT_REMINDER", "Habit Reminder", `Time for: ${habitTitle}`, {
    habitId,
    screen: "habits",
  });
}

/**
 * Create a notification for receiving a comment on your post
 */
export async function notifyCommentReceived(
  userId: string,
  commenterName: string,
  commentText: string,
  postId: string
): Promise<AppNotification> {
  // Truncate comment preview if too long
  const preview = commentText.length > 30 ? `${commentText.slice(0, 30)}...` : commentText;
  return createNotification(
    userId,
    "COMMENT_RECEIVED",
    "New Comment",
    `${commenterName}: "${preview}"`,
    { postId, screen: "feed" }
  );
}
