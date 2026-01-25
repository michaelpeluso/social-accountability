/**
 * LinkedHabitsList - Displays habits linked to a goal
 * Shows habit cards with streak badges and navigation
 * For joined goals, hides the "Add Habit" button (onAddHabit is optional)
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import type { Habit, HabitWithMeta } from "../../../types";
import { useTheme, spacing, borderRadius, typography } from "../../../theme";

interface LinkedHabitsListProps {
  /** Array of habits linked to the goal */
  habits: Habit[] | HabitWithMeta[];
  /** Handler for adding a new habit (optional - hidden for non-owners) */
  onAddHabit?: () => void;
}

export function LinkedHabitsList({ habits, onAddHabit }: LinkedHabitsListProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Linked Habits</Text>
        {onAddHabit && (
          <Pressable
            onPress={onAddHabit}
            style={[styles.addButton, { backgroundColor: theme.button.primary.background }]}
          >
            <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>
              + Add Habit
            </Text>
          </Pressable>
        )}
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
            No habits linked to this goal yet.
          </Text>
          {onAddHabit && (
            <Pressable onPress={onAddHabit} style={styles.linkButton}>
              <Text style={[styles.linkButtonText, { color: theme.semantic.primary }]}>
                Create a habit
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        habits.map((habit) => (
          <Pressable
            key={habit.id}
            style={[styles.habitCard, { borderBottomColor: theme.border.light }]}
            onPress={() => router.push(`/habits/${habit.id}`)}
          >
            <View style={styles.habitInfo}>
              <Text style={[styles.habitTitle, { color: theme.text.primary }]}>{habit.title}</Text>
              <Text style={[styles.habitSchedule, { color: theme.text.tertiary }]}>
                {habit.schedule.targetCount}x {habit.schedule.frequency}
              </Text>
            </View>
            {habit.currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.semantic.danger + "20" }]}>
                <Text style={[styles.streakText, { color: theme.semantic.danger }]}>
                  {habit.currentStreak} day streak
                </Text>
              </View>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  addButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  linkButton: {
    paddingVertical: spacing.xs,
  },
  linkButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  habitSchedule: {
    fontSize: typography.fontSize.xs,
  },
  streakBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
