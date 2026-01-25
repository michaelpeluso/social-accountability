/**
 * HabitCard Component
 * Displays a habit with title, schedule, streak, goal link, and social info
 * Supports both owned habits (with participant count) and joined habits (with owner info)
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { Habit, HabitWithMeta, Goal } from "../../../types";

interface HabitCardProps {
  habit: Habit | HabitWithMeta;
  linkedGoal?: Goal | null;
  onPress?: () => void;
}

// Type guard for HabitWithMeta
function isHabitWithMeta(habit: Habit | HabitWithMeta): habit is HabitWithMeta {
  return "isJoined" in habit || "participantCount" in habit;
}

export function HabitCard({ habit, linkedGoal, onPress }: HabitCardProps) {
  const { theme } = useTheme();

  const scheduleText =
    habit.schedule.targetCount === 1
      ? habit.schedule.frequency === "daily"
        ? "Daily"
        : habit.schedule.frequency === "weekly"
          ? "Weekly"
          : habit.schedule.frequency === "monthly"
            ? "Monthly"
            : "Custom"
      : `${habit.schedule.targetCount}x / ${habit.schedule.frequency.replace("ly", "")}`;

  // Extract meta info if available
  const meta = isHabitWithMeta(habit) ? habit : null;
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
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
            {habit.icon && `${habit.icon} `}
            {habit.title}
          </Text>
          {isJoined && ownerName && (
            <Text style={[styles.ownerText, { color: theme.text.tertiary }]} numberOfLines={1}>
              by {ownerName}
            </Text>
          )}
        </View>
        <View style={styles.badges}>
          {participantCount > 0 && (
            <View
              style={[styles.participantBadge, { backgroundColor: theme.semantic.primary + "20" }]}
            >
              <Text style={[styles.participantText, { color: theme.semantic.primary }]}>
                👥 {participantCount}
              </Text>
            </View>
          )}
          {habit.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: theme.text.success + "20" }]}>
              <Text style={[styles.streakText, { color: theme.text.success }]}>
                🔥 {habit.currentStreak}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.meta}>
        <Text
          style={[
            styles.scheduleBadge,
            { backgroundColor: theme.background.secondary, color: theme.text.secondary },
          ]}
        >
          {scheduleText}
        </Text>
        {isJoined && (
          <Text style={[styles.joinedBadge, { color: theme.semantic.primary }]}>Joined</Text>
        )}
        {linkedGoal && (
          <Text style={[styles.goalLink, { color: theme.semantic.primary }]}>
            → {linkedGoal.title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.sm,
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
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  participantBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  participantText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  scheduleBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  joinedBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  goalLink: {
    fontSize: typography.fontSize.xs,
  },
});
