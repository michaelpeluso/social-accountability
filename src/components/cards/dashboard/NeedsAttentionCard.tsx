/**
 * NeedsAttentionCard - Habits requiring attention
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { PILLAR_INFO } from "../../../types/goals";
import type { Pillar } from "../../../types";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface AttentionHabit {
  id: string;
  title: string;
  pillar: Pillar;
}

interface NeedsAttentionCardProps {
  habits: AttentionHabit[];
}

export function NeedsAttentionCard({ habits }: NeedsAttentionCardProps) {
  const { theme } = useTheme();

  if (habits.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: "#FF9500" + "20" }]}>
      {habits.slice(0, 3).map((habit) => (
        <Pressable
          key={habit.id}
          style={[styles.item, { borderBottomColor: theme.border.light }]}
          onPress={() => router.push(`/habits/${habit.id}`)}
        >
          <Text style={styles.emoji}>{PILLAR_INFO[habit.pillar].emoji}</Text>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
            {habit.title}
          </Text>
          <Text style={[styles.cta, { color: theme.button.primary.background }]}>Log</Text>
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
    fontSize: typography.fontSize.xl,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  cta: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
});
