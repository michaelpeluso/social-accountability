/**
 * StreakDisplay Component
 * Shows current streak, best streak, and recovery streak
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  recoveryStreak?: number;
  isInRecovery?: boolean;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  recoveryStreak = 0,
  isInRecovery = false,
}: StreakDisplayProps) {
  const { theme } = useTheme();

  const showRecovery = isInRecovery && recoveryStreak > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.card.background }]}>
      <View style={styles.item}>
        <Text style={[styles.number, { color: theme.semantic.danger }]}>{currentStreak}</Text>
        <Text style={[styles.label, { color: theme.text.secondary }]}>Current Streak</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border.light }]} />
      <View style={styles.item}>
        <Text style={[styles.number, { color: theme.semantic.danger }]}>{longestStreak}</Text>
        <Text style={[styles.label, { color: theme.text.secondary }]}>Best Streak</Text>
      </View>
      {showRecovery && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border.light }]} />
          <View style={styles.item}>
            <Text style={[styles.number, { color: theme.text.success }]}>{recoveryStreak}</Text>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Recovery 🔥</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg - 4,
    borderRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
  },
  number: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});
