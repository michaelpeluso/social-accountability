/**
 * BadgeCard Component
 * Displays a single badge with rarity-based styling
 *
 * Props:
 * - badge: Badge object with id, badgeType, earnedAt
 *
 * Uses theme tokens for colors and spacing.
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import type { Badge } from "../../../types";
import { BADGE_INFO } from "../../../types";
import { formatRelativeTime } from "../../../logic/dates";

export interface BadgeCardProps {
  badge: Badge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const { theme } = useTheme();
  const info = BADGE_INFO[badge.badgeType];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return theme.badges.legendary;
      case "epic":
        return theme.badges.epic;
      case "rare":
        return theme.badges.rare;
      default:
        return theme.badges.common;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background.secondary,
          borderRadius: theme.radius.medium,
          padding: theme.space.componentGap,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: getRarityColor(info.rarity),
          },
        ]}
      >
        <Text style={styles.emoji}>{info.emoji}</Text>
      </View>
      <Text
        style={[
          styles.name,
          {
            color: theme.text.primary,
            fontSize: theme.typography.bodySmall.fontSize,
            fontWeight: theme.typography.h3.fontWeight,
          },
        ]}
      >
        {info.name}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: theme.text.tertiary,
            fontSize: theme.typography.caption.fontSize,
          },
        ]}
      >
        {info.description}
      </Text>
      <Text
        style={[
          styles.date,
          {
            color: theme.text.tertiary,
            fontSize: 10,
          },
        ]}
      >
        {formatRelativeTime(badge.earnedAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    textAlign: "center",
    marginBottom: 4,
  },
  date: {},
});
