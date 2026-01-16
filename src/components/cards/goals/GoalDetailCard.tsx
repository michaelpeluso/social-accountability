/**
 * GoalDetailCard - Displays detailed goal information
 * Used in goal detail screens to show goal title, pillar, privacy, and creation date
 */

import { View, Text, StyleSheet } from "react-native";
import { PILLAR_INFO, PRIVACY_INFO } from "../../../types/goals";
import type { Goal } from "../../../types";
import { useTheme, spacing, borderRadius, typography } from "../../../theme";

interface GoalDetailCardProps {
  /** The goal to display */
  goal: Goal;
}

export function GoalDetailCard({ goal }: GoalDetailCardProps) {
  const { theme } = useTheme();
  const pillarInfo = PILLAR_INFO[goal.pillar];
  const privacyInfo = PRIVACY_INFO[goal.privacy];

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
          <Text style={[styles.title, { color: theme.text.primary }]}>{goal.title}</Text>
          <Text style={[styles.pillarLabel, { color: theme.text.tertiary }]}>
            {pillarInfo.label}
          </Text>
        </View>
      </View>

      <View style={[styles.metaRow, { borderTopColor: theme.border.light }]}>
        <View style={[styles.privacyBadge, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.privacyText, { color: theme.text.tertiary }]}>
            {privacyInfo.label}
          </Text>
        </View>
        <Text style={[styles.createdDate, { color: theme.text.tertiary }]}>
          Created {new Date(goal.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
    marginBottom: spacing.md,
  },
  pillarEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    marginBottom: spacing.xxs,
  },
  pillarLabel: {
    fontSize: typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  privacyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  privacyText: {
    fontSize: typography.fontSize.xs,
  },
  createdDate: {
    fontSize: typography.fontSize.xs,
  },
});
