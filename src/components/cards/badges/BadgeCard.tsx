/**
 * BadgeCard Component
 * Displays a single badge with tier-based styling and optional share functionality
 *
 * Props:
 * - badge: Badge object with id, badgeType, earnedAt, tier
 * - onShare?: Callback when share button is pressed
 * - showShareButton?: Whether to show the share button (default: true)
 *
 * Tier colors:
 * - Bronze: #CD7F32
 * - Silver: #C0C0C0
 * - Gold: #FFD700
 * - Platinum: #E5E4E2
 *
 * Uses theme tokens for colors and spacing.
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import type { Badge, BadgeTier } from "../../../types";
import { BADGE_INFO, BADGE_TIER_COLORS, getTieredBadgeInfo } from "../../../types";
import { formatRelativeTime } from "../../../logic/dates";

export interface BadgeCardProps {
  badge: Badge;
  onShare?: (badge: Badge) => void;
  onPress?: (badge: Badge) => void;
  showShareButton?: boolean;
}

export function BadgeCard({ badge, onShare, onPress, showShareButton = true }: BadgeCardProps) {
  const { theme } = useTheme();

  // Get badge info - try tiered info first, then standard
  // getTieredBadgeInfo extracts tier from badgeType (e.g., "posts-bronze")
  const info = badge.tier ? getTieredBadgeInfo(badge.badgeType) : BADGE_INFO[badge.badgeType];

  // Determine display color - prefer tier color over rarity
  const getDisplayColor = () => {
    // If badge has a tier, use tier color
    if (badge.tier) {
      return BADGE_TIER_COLORS[badge.tier];
    }

    // Fall back to rarity-based color
    switch (info?.rarity) {
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

  // Get tier label for display
  const getTierLabel = (tier: BadgeTier | null | undefined): string => {
    if (!tier) return "";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Get tier text color (ensure readability)
  const getTierTextColor = (tier: BadgeTier | null | undefined): string => {
    if (!tier) return "#FFFFFF";
    switch (tier) {
      case "gold":
        return "#8B6914"; // Dark gold for contrast
      case "silver":
        return "#5C5C5C"; // Dark gray for contrast
      case "platinum":
        return "#4A4A4A"; // Dark for contrast
      case "bronze":
        return "#8B4513"; // Saddle brown for contrast
      default:
        return "#FFFFFF";
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(badge);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(badge);
    }
  };

  if (!info) {
    // Fallback for unknown badge types
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
        <Text style={{ color: theme.text.tertiary }}>Unknown Badge</Text>
      </View>
    );
  }

  const displayColor = getDisplayColor();

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: theme.background.secondary,
          borderRadius: theme.radius.medium,
          padding: theme.space.componentGap,
          borderWidth: badge.tier ? 2 : 0,
          borderColor: displayColor,
        },
      ]}
    >
      {/* Tier ribbon/badge */}
      {badge.tier && (
        <View
          style={[
            styles.tierBadge,
            {
              backgroundColor: displayColor,
              borderRadius: theme.radius.small,
            },
          ]}
        >
          <Text
            style={[
              styles.tierText,
              {
                color: getTierTextColor(badge.tier),
                fontSize: 10,
                fontWeight: "700",
              },
            ]}
          >
            {getTierLabel(badge.tier)}
          </Text>
        </View>
      )}

      {/* Icon container with tier/rarity color */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: displayColor,
            shadowColor: displayColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      >
        <Text style={styles.emoji}>{info.emoji}</Text>
      </View>

      {/* Badge name */}
      <Text
        style={[
          styles.name,
          {
            color: theme.text.primary,
            fontSize: theme.typography.bodySmall.fontSize,
            fontWeight: theme.typography.h3.fontWeight,
          },
        ]}
        numberOfLines={2}
      >
        {info.name}
      </Text>

      {/* Badge description */}
      <Text
        style={[
          styles.description,
          {
            color: theme.text.tertiary,
            fontSize: theme.typography.caption.fontSize,
          },
        ]}
        numberOfLines={2}
      >
        {info.description}
      </Text>

      {/* Earned date */}
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

      {/* Share button */}
      {showShareButton && onShare && (
        <Pressable
          onPress={handleShare}
          style={[
            styles.shareButton,
            {
              backgroundColor: theme.semantic.primary,
              borderRadius: theme.radius.small,
            },
          ]}
        >
          <Ionicons name="share-outline" size={14} color="#FFFFFF" />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    alignItems: "center",
    position: "relative",
  },
  tierBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
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
  date: {
    marginBottom: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  shareText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
