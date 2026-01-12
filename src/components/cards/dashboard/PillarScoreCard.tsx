/**
 * PillarScoreCard - Individual pillar score display
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { PILLAR_INFO } from "../../../types/goals";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { getScoreColor, getTrendColor, getTrendArrow, type PillarScore } from "../../../logic";

interface PillarScoreCardProps {
  score: PillarScore;
  onPress: () => void;
}

export function PillarScoreCard({ score, onPress }: PillarScoreCardProps) {
  const { theme } = useTheme();
  const info = PILLAR_INFO[score.pillar];

  return (
    <Pressable
      style={[styles.card, { borderLeftColor: info.color, backgroundColor: theme.card.background }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <Text style={[styles.name, { color: theme.text.primary }]}>{info.label}</Text>
      </View>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: getScoreColor(score.score) }]}>{score.score}%</Text>
        <Text style={[styles.trend, { color: getTrendColor(score.trend) }]}>
          {getTrendArrow(score.trend)}
        </Text>
      </View>
      <Text style={[styles.meta, { color: theme.text.tertiary }]}>
        {score.habitCount} habit{score.habitCount !== 1 ? "s" : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: typography.fontSize.xl,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  score: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  trend: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
