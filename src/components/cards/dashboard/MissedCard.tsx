/**
 * MissedCard - Most missed habits
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface MissedItem {
  habitId: string;
  title: string;
  missedDays: number;
}

interface MissedCardProps {
  items: MissedItem[];
}

export function MissedCard({ items }: MissedCardProps) {
  const { theme } = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      {items.map((item, index) => (
        <Pressable
          key={item.habitId}
          style={[styles.item, { borderBottomColor: theme.border.light }]}
          onPress={() => router.push(`/habits/${item.habitId}`)}
        >
          <Text style={[styles.rank, { color: theme.text.tertiary }]}>#{index + 1}</Text>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.count, { color: theme.text.error }]}>{item.missedDays} missed</Text>
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
