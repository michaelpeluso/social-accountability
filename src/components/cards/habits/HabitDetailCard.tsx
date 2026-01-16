/**
 * HabitDetailCard Component
 * Displays habit info with pillar, title, and schedule
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { PILLAR_INFO } from "../../../types/goals";
import type { Habit } from "../../../types";

interface HabitDetailCardProps {
  habit: Habit;
}

export function HabitDetailCard({ habit }: HabitDetailCardProps) {
  const { theme } = useTheme();
  const pillarInfo = PILLAR_INFO[habit.pillar];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.card.background, borderLeftColor: pillarInfo.color },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.pillarEmoji}>{pillarInfo.emoji}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{habit.title}</Text>
          <Text style={[styles.pillarLabel, { color: theme.text.secondary }]}>
            {pillarInfo.label}
          </Text>
        </View>
      </View>

      <View style={[styles.scheduleInfo, { borderTopColor: theme.border.light }]}>
        <Text style={[styles.scheduleText, { color: theme.text.secondary }]}>
          {habit.schedule.targetCount}x {habit.schedule.frequency}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    padding: spacing.lg - 4,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillarEmoji: {
    fontSize: typography.fontSize.xxxl,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  pillarLabel: {
    fontSize: typography.fontSize.sm,
  },
  scheduleInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  scheduleText: {
    fontSize: typography.fontSize.base,
  },
});
