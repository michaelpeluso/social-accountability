/**
 * SummaryCard - Weekly stats summary
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface SummaryCardProps {
  checkInsThisWeek: number;
  completionRate: number;
  checkInsToday: number;
}

export function SummaryCard({ checkInsThisWeek, completionRate, checkInsToday }: SummaryCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.value, { color: theme.text.primary }]}>{checkInsThisWeek}</Text>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Check-ins</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border.light }]} />
        <View style={styles.item}>
          <Text style={[styles.value, { color: theme.text.primary }]}>{completionRate}%</Text>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Completion</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border.light }]} />
        <View style={styles.item}>
          <Text style={[styles.value, { color: theme.text.primary }]}>{checkInsToday}</Text>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 40,
  },
});
