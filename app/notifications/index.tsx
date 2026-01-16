/**
 * Notifications Screen (M3.6)
 * Shows notifications for reactions, nudges, badges, and friend activity
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { getNotifications, markAsRead, markAllAsRead } from "../../src/storage/notifications";
import type { AppNotification, NotificationType } from "../../src/types";
import { formatRelativeTime } from "../../src/logic/dates";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  REACTION_RECEIVED: "👍",
  COMMENT_RECEIVED: "💬",
  NUDGE_RECEIVED: "💪",
  BADGE_EARNED: "🏆",
  FRIEND_POSTED: "📝",
  HABIT_REMINDER: "⏰",
  CIRCLE_POST: "🔵",
  CIRCLE_MESSAGE: "💬",
  CIRCLE_INVITE: "📩",
  CIRCLE_MEMBER_JOINED: "👋",
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock user ID (would come from auth context)
  const currentUserId = "user_1";

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications(currentUserId, 50);
    setNotifications(data);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: AppNotification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    // Navigate based on type
    if (notification.data) {
      if (notification.type === "REACTION_RECEIVED" && notification.data.postId) {
        router.push(`/feed/${notification.data.postId}`);
      } else if (notification.type === "NUDGE_RECEIVED" && notification.data.fromUserId) {
        router.push(`/friends/${notification.data.fromUserId}`);
      } else if (notification.type === "BADGE_EARNED") {
        router.push("/profile");
      } else if (notification.type === "FRIEND_POSTED" && notification.data.postId) {
        router.push(`/feed/${notification.data.postId}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <Pressable
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{NOTIFICATION_ICONS[item.type]}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔔</Text>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When friends react to your posts or send you nudges, you&apos;ll see them here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Notifications" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: "#666",
  },
  list: {
    padding: spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#eee",
  },
  notificationUnread: {
    backgroundColor: "#f0f7ff",
    borderColor: "#007AFF",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    marginTop: 2,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginLeft: spacing.sm,
    marginTop: 6,
  },
  markAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    color: "#007AFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    textAlign: "center",
  },
});
