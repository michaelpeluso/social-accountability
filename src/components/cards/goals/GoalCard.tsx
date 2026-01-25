/**
 * GoalCard Component
 * Displays a goal with title and privacy badge
 * Supports both owned goals (with participant count) and joined goals (with owner info)
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { Goal, GoalWithMeta, Privacy } from "../../../types";

const PRIVACY_LABELS: Record<Privacy, string> = {
  SELF: "Private",
  FRIENDS: "Friends",
  CLOSE_FRIENDS: "Close Friends",
  PUBLIC: "Public",
};

// Type guard for GoalWithMeta
function isGoalWithMeta(goal: Goal | GoalWithMeta): goal is GoalWithMeta {
  return "isJoined" in goal || "participantCount" in goal;
}

interface GoalCardProps {
  goal: Goal | GoalWithMeta;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function GoalCard({ goal, onPress, onLongPress }: GoalCardProps) {
  const { theme } = useTheme();

  // Extract meta info if available
  const meta = isGoalWithMeta(goal) ? goal : null;
  const isJoined = meta?.isJoined ?? false;
  const participantCount = meta?.participantCount ?? 0;
  const ownerName = meta?.ownerName;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.card.background,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={2}>
            {goal.title}
          </Text>
          {isJoined && ownerName && (
            <Text style={[styles.ownerText, { color: theme.text.tertiary }]} numberOfLines={1}>
              by {ownerName}
            </Text>
          )}
        </View>
        {participantCount > 0 && (
          <View
            style={[styles.participantBadge, { backgroundColor: theme.semantic.primary + "20" }]}
          >
            <Text style={[styles.participantText, { color: theme.semantic.primary }]}>
              👥 {participantCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text
          style={[
            styles.privacyBadge,
            {
              backgroundColor: theme.background.secondary,
              color: theme.text.tertiary,
            },
          ]}
        >
          {PRIVACY_LABELS[goal.privacy]}
        </Text>
        {isJoined && (
          <Text style={[styles.joinedBadge, { color: theme.semantic.primary }]}>Joined</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  ownerText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  participantBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  participantText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  privacyBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  joinedBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
