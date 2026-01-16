/**
 * ProgressSummary - Displays goal progress information
 * Shows linked habits count and progress tracking message
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme, spacing, borderRadius, typography } from "../../../theme";

interface ProgressSummaryProps {
  /** Number of linked habits */
  habitCount: number;
  /** Optional subtitle text */
  subtitle?: string;
}

export function ProgressSummary({
  habitCount,
  subtitle = "Track your progress towards this goal",
}: ProgressSummaryProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card.background }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Progress</Text>
      <View style={[styles.card, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.text, { color: theme.text.primary }]}>
          {habitCount} habit{habitCount !== 1 ? "s" : ""} linked
        </Text>
        <Text style={[styles.subtext, { color: theme.text.tertiary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xxs,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
  },
});
