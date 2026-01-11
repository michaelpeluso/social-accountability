/**
 * Profile Screen (M3.5)
 * Shows user profile with earned badges and stats
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Stack, router } from "expo-router";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { getUserBadges } from "../../src/storage/badges";
import type { Badge } from "../../src/types";
import { BADGE_INFO } from "../../src/types";
import { formatRelativeTime } from "../../src/logic/dates";

// Mock user data (would come from auth context)
const MOCK_USER = {
  id: "user_1",
  displayName: "Demo User",
  photoUrl: null,
  bio: "Building better habits, one day at a time.",
  createdAt: "2024-01-01T00:00:00Z",
};

export default function ProfileScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    const userBadges = await getUserBadges(MOCK_USER.id);
    setBadges(userBadges);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const getBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return styles.badge_legendary;
      case "epic":
        return styles.badge_epic;
      case "rare":
        return styles.badge_rare;
      default:
        return styles.badge_common;
    }
  };

  const renderBadge = (badge: Badge) => {
    const info = BADGE_INFO[badge.badgeType];
    return (
      <View key={badge.id} style={styles.badgeItem}>
        <View style={[styles.badgeIcon, getBadgeStyle(info.rarity)]}>
          <Text style={styles.badgeEmoji}>{info.emoji}</Text>
        </View>
        <Text style={styles.badgeName}>{info.name}</Text>
        <Text style={styles.badgeDescription}>{info.description}</Text>
        <Text style={styles.badgeDate}>{formatRelativeTime(badge.earnedAt)}</Text>
      </View>
    );
  };

  const renderEmptyBadges = () => (
    <View style={styles.emptyBadges}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={styles.emptyTitle}>No badges yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete streaks, hit milestones, and support friends to earn badges!
      </Text>
    </View>
  );

  // Group badges by rarity
  const badgesByRarity = badges.reduce(
    (acc, badge) => {
      const rarity = BADGE_INFO[badge.badgeType].rarity;
      if (!acc[rarity]) acc[rarity] = [];
      acc[rarity].push(badge);
      return acc;
    },
    {} as Record<string, Badge[]>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Profile" }} />
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
          title: "Profile",
          headerRight: () => (
            <Pressable onPress={() => router.push("/settings")} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {MOCK_USER.photoUrl ? (
              <Image source={{ uri: MOCK_USER.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{MOCK_USER.displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.displayName}>{MOCK_USER.displayName}</Text>
          {MOCK_USER.bio && <Text style={styles.bio}>{MOCK_USER.bio}</Text>}
          <Text style={styles.joinDate}>Joined {formatRelativeTime(MOCK_USER.createdAt)}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Streaks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>

          {badges.length === 0 ? (
            renderEmptyBadges()
          ) : (
            <>
              {/* Legendary */}
              {badgesByRarity.legendary && badgesByRarity.legendary.length > 0 && (
                <View style={styles.badgeSection}>
                  <Text style={styles.rarityLabel}>🌟 Legendary</Text>
                  <View style={styles.badgeGrid}>{badgesByRarity.legendary.map(renderBadge)}</View>
                </View>
              )}

              {/* Epic */}
              {badgesByRarity.epic && badgesByRarity.epic.length > 0 && (
                <View style={styles.badgeSection}>
                  <Text style={styles.rarityLabel}>💎 Epic</Text>
                  <View style={styles.badgeGrid}>{badgesByRarity.epic.map(renderBadge)}</View>
                </View>
              )}

              {/* Rare */}
              {badgesByRarity.rare && badgesByRarity.rare.length > 0 && (
                <View style={styles.badgeSection}>
                  <Text style={styles.rarityLabel}>✨ Rare</Text>
                  <View style={styles.badgeGrid}>{badgesByRarity.rare.map(renderBadge)}</View>
                </View>
              )}

              {/* Common */}
              {badgesByRarity.common && badgesByRarity.common.length > 0 && (
                <View style={styles.badgeSection}>
                  <Text style={styles.rarityLabel}>🔹 Common</Text>
                  <View style={styles.badgeGrid}>{badgesByRarity.common.map(renderBadge)}</View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={() => router.push("/feed/create")}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionText}>New Post</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => router.push("/habits")}>
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.actionText}>My Habits</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => router.push("/friends")}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Friends</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: spacing.md,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  settingsIcon: {
    fontSize: 24,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: "#fff",
  },
  displayName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: "#333",
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  joinDate: {
    fontSize: typography.fontSize.xs,
    color: "#999",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: "#333",
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#eee",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
    marginBottom: spacing.sm,
  },
  badgeSection: {
    marginBottom: spacing.md,
  },
  rarityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#666",
    marginBottom: spacing.xs,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: "#f9f9f9",
    borderRadius: borderRadius.md,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  badge_common: {
    backgroundColor: "#e0e0e0",
  },
  badge_rare: {
    backgroundColor: "#64B5F6",
  },
  badge_epic: {
    backgroundColor: "#BA68C8",
  },
  badge_legendary: {
    backgroundColor: "#FFD54F",
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: "#333",
    textAlign: "center",
  },
  badgeDescription: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  badgeDate: {
    fontSize: 9,
    color: "#999",
    marginTop: 2,
  },
  emptyBadges: {
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    padding: spacing.sm,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: "#333",
  },
});
