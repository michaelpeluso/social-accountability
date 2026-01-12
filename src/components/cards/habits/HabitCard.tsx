/**
 * HabitCard Component
 * Displays a habit with title, schedule, streak, and goal link
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { Habit, Goal } from "../../../types";

interface HabitCardProps {
  habit: Habit;
  linkedGoal?: Goal | null;
  onPress?: () => void;
}

export function HabitCard({ habit, linkedGoal, onPress }: HabitCardProps) {
  const { theme } = useTheme();

  const scheduleText =
    habit.schedule.targetCount === 1
      ? habit.schedule.frequency === "daily"
        ? "Daily"
        : habit.schedule.frequency === "weekly"
          ? "Weekly"
          : "Monthly"
      : `${habit.schedule.targetCount}x / ${habit.schedule.frequency.replace("ly", "")}`;

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
        <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
          {habit.icon && `${habit.icon} `}
          {habit.title}
        </Text>
        {habit.currentStreak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: theme.text.success + "20" }]}>
            <Text style={[styles.streakText, { color: theme.text.success }]}>
              🔥 {habit.currentStreak}
            </Text>
          </View>
        )}
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
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
  goalLink: {
    fontSize: typography.fontSize.xs,
  },
});
