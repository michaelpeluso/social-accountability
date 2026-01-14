/**
 * RecoveryCard - Habits getting back on track
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { PILLAR_INFO } from "../../../types/goals";
import type { Pillar } from "../../../types";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface RecoveryHabit {
  habitId: string;
  title: string;
  pillar: Pillar;
  recovery: {
    recoveryStreak: number;
  };
}

interface RecoveryCardProps {
  habits: RecoveryHabit[];
}

export function RecoveryCard({ habits }: RecoveryCardProps) {
  const { theme } = useTheme();

  if (habits.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      {habits.map((item) => (
        <Pressable
          key={item.habitId}
          style={[styles.item, { borderBottomColor: theme.border.light }]}
          onPress={() => router.push(`/habits/${item.habitId}`)}
        >
          <Text style={styles.emoji}>{PILLAR_INFO[item.pillar].emoji}</Text>
          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.subtext, { color: theme.text.secondary }]}>
              {item.recovery.recoveryStreak} day{item.recovery.recoveryStreak !== 1 ? "s" : ""} back
              on track
            </Text>
          </View>
          <Text
            style={[
              styles.badge,
              { backgroundColor: theme.text.success + "20", color: theme.text.success },
            ]}
          >
            {item.recovery.recoveryStreak}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  emoji: {
    fontSize: typography.fontSize.xxl,
    marginRight: spacing.sm,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
  },
  badge: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
});
