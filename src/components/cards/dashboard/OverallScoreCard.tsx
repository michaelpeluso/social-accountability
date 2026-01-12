/**
 * OverallScoreCard - Main dashboard score display
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { getScoreColor } from "../../../logic";

interface OverallScoreCardProps {
  score: number;
  activeHabits: number;
}

export function OverallScoreCard({ score, activeHabits }: OverallScoreCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Overall Score</Text>
      <Text style={[styles.score, { color: getScoreColor(score) }]}>{score}%</Text>
      <Text style={[styles.subtext, { color: theme.text.tertiary }]}>
        {activeHabits} active habits
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  score: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
});
