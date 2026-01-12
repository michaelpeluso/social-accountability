/**
 * TopStreaksCard - Top habit streaks
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface StreakItem {
  habitId: string;
  title: string;
  streak: number;
}

interface TopStreaksCardProps {
  streaks: StreakItem[];
}

export function TopStreaksCard({ streaks }: TopStreaksCardProps) {
  const { theme } = useTheme();

  if (streaks.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      {streaks.map((item, index) => (
        <Pressable
          key={item.habitId}
          style={[styles.item, { borderBottomColor: theme.border.light }]}
          onPress={() => router.push(`/habits/${item.habitId}`)}
        >
          <Text style={[styles.rank, { color: theme.text.tertiary }]}>#{index + 1}</Text>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.count, { color: theme.text.success }]}>{item.streak} days</Text>
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
  rank: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
    width: 30,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  count: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
