/**
 * Friend Profile Screen (M3.4)
 * Shows friend's profile and allows sending nudges
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { getUserBadges } from "../../src/storage/badges";
import { sendNudge } from "../../src/storage/nudges";
import type { Badge, NudgeTemplateId } from "../../src/types";
import { BADGE_INFO, NUDGE_TEMPLATES } from "../../src/types";

// Mock current user (would come from auth context)
const CURRENT_USER_ID = "user_1";

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<{
    id: string;
    displayName: string;
    photoUrl?: string;
    bio?: string;
  } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNudgePicker, setShowNudgePicker] = useState(false);
  const [sendingNudge, setSendingNudge] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!id) return;

    // In a real app, we'd fetch friend data from API
    // For now, mock it
    setFriend({
      id,
      displayName: "Friend User",
      bio: "A fellow habit tracker",
    });

    const userBadges = await getUserBadges(id);
    setBadges(userBadges);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSendNudge = async (templateId: NudgeTemplateId) => {
    if (!id) return;

    setSendingNudge(true);
    const result = await sendNudge(CURRENT_USER_ID, {
      toUserId: id,
      templateId,
    });
    setSendingNudge(false);

    if ("error" in result) {
      Alert.alert("Oops", result.error);
      return;
    }

    Alert.alert("Sent!", `Nudge sent to ${friend?.displayName ?? "your friend"}!`);
    setShowNudgePicker(false);
  };

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
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Friend" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Friend" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: friend.displayName }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {friend.photoUrl ? (
              <Image source={{ uri: friend.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{friend.displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.displayName}>{friend.displayName}</Text>
          {friend.bio && <Text style={styles.bio}>{friend.bio}</Text>}
        </View>

        {/* Nudge Button */}
        <Pressable style={styles.nudgeButton} onPress={() => setShowNudgePicker(!showNudgePicker)}>
          <Text style={styles.nudgeButtonText}>💪 Send a Nudge</Text>
        </Pressable>

        {/* Nudge Picker */}
        {showNudgePicker && (
          <View style={styles.nudgePicker}>
            <Text style={styles.nudgePickerTitle}>Choose a nudge:</Text>
            {(Object.keys(NUDGE_TEMPLATES) as NudgeTemplateId[]).map((templateId) => {
              const template = NUDGE_TEMPLATES[templateId];
              return (
                <Pressable
                  key={templateId}
                  style={styles.nudgeOption}
                  onPress={() => handleSendNudge(templateId)}
                  disabled={sendingNudge}
                >
                  <Text style={styles.nudgeEmoji}>{template.emoji}</Text>
                  <Text style={styles.nudgeText}>{template.text}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {badges.length === 0 ? (
            <Text style={styles.emptyText}>No badges yet</Text>
          ) : (
            <View style={styles.badgeGrid}>{badges.map(renderBadge)}</View>
          )}
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
  },
  nudgeButton: {
    backgroundColor: "#007AFF",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  nudgeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: "#fff",
  },
  nudgePicker: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  nudgePickerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
    marginBottom: spacing.sm,
  },
  nudgeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "#f5f5f5",
    marginBottom: spacing.xs,
  },
  nudgeEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  nudgeText: {
    fontSize: typography.fontSize.md,
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    textAlign: "center",
    padding: spacing.lg,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badgeItem: {
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: "#f9f9f9",
    borderRadius: borderRadius.md,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xxs,
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
    fontSize: 20,
  },
  badgeName: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },
});
