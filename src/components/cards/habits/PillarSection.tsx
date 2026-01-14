/**
 * PillarSection Component
 * Groups items by pillar with colored header
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { PILLAR_INFO } from "../../../types/goals";
import type { Pillar } from "../../../types";

interface PillarSectionProps {
  pillar: Pillar;
  count: number;
  children: React.ReactNode;
}

export function PillarSection({ pillar, count, children }: PillarSectionProps) {
  const { theme } = useTheme();
  const pillarInfo = PILLAR_INFO[pillar];
  const pillarColor = pillarInfo.color;

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: pillarColor + "20",
          },
        ]}
      >
        <Text style={styles.emoji}>{pillarInfo.emoji}</Text>
        <Text style={[styles.title, { color: theme.text.primary }]}>{pillarInfo.label}</Text>
        <Text style={[styles.count, { color: theme.text.tertiary }]}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  emoji: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  count: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
