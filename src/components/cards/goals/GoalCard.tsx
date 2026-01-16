/**
 * GoalCard Component
 * Displays a goal with title and privacy badge
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { Goal, Privacy } from "../../../types";

const PRIVACY_LABELS: Record<Privacy, string> = {
  SELF: "Private",
  FRIENDS: "Friends",
  PUBLIC: "Public",
};

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function GoalCard({ goal, onPress, onLongPress }: GoalCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.card.background,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={2}>
        {goal.title}
      </Text>
      <View style={styles.meta}>
        <Text
          style={[
            styles.privacyBadge,
            {
              backgroundColor: theme.background.secondary,
              color: theme.text.tertiary,
            },
          ]}
        >
          {PRIVACY_LABELS[goal.privacy]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: "row",
  },
  privacyBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
});
