/**
 * BadgeEarnedModal Component
 * Celebration modal shown when a user earns a new badge
 *
 * Props:
 * - visible: Whether the modal is visible
 * - badge: The badge that was earned
 * - onClose: Callback when modal is dismissed
 * - onShare: Callback when user wants to share the badge
 *
 * Features:
 * - Tier-colored visual celebration
 * - Badge details with tier indicator
 * - Share to feed button
 * - Dismiss button
 */

import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import type { Badge, BadgeTier } from "../../types";
import { BADGE_INFO, BADGE_TIER_COLORS, getTieredBadgeInfo } from "../../types";

export interface BadgeEarnedModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
  onShare: (badge: Badge) => void;
}

export function BadgeEarnedModal({ visible, badge, onClose, onShare }: BadgeEarnedModalProps) {
  const { theme } = useTheme();

  if (!badge) return null;

  // Get badge info
  // getTieredBadgeInfo extracts tier from badgeType (e.g., "posts-bronze")
  const info = badge.tier ? getTieredBadgeInfo(badge.badgeType) : BADGE_INFO[badge.badgeType];

  if (!info) return null;

  // Get display color based on tier
  const getDisplayColor = () => {
    if (badge.tier) {
      return BADGE_TIER_COLORS[badge.tier];
    }
    switch (info.rarity) {
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

  // Get tier label
  const getTierLabel = (tier: BadgeTier): string => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const displayColor = getDisplayColor();

  const handleShare = () => {
    onShare(badge);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.background.primary,
              borderRadius: theme.radius.large,
              borderWidth: 3,
              borderColor: displayColor,
            },
          ]}
        >
          {/* Header with celebration icon */}
          <View style={styles.header}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text.primary,
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                },
              ]}
            >
              Badge Earned!
            </Text>
          </View>

          {/* Badge display */}
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: displayColor,
                shadowColor: displayColor,
              },
            ]}
          >
            <Text style={styles.badgeEmoji}>{info.emoji}</Text>
          </View>

          {/* Tier indicator */}
          {badge.tier && (
            <View
              style={[
                styles.tierPill,
                {
                  backgroundColor: displayColor,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Text
                style={[styles.tierText, { color: badge.tier === "gold" ? "#8B6914" : "#FFFFFF" }]}
              >
                {getTierLabel(badge.tier)} Tier
              </Text>
            </View>
          )}

          {/* Badge info */}
          <Text
            style={[
              styles.badgeName,
              {
                color: theme.text.primary,
                fontSize: theme.typography.h3.fontSize,
                fontWeight: theme.typography.h3.fontWeight,
              },
            ]}
          >
            {info.name}
          </Text>
          <Text
            style={[
              styles.badgeDescription,
              {
                color: theme.text.secondary,
                fontSize: theme.typography.body.fontSize,
              },
            ]}
          >
            {info.description}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleShare}
              style={[
                styles.shareButton,
                {
                  backgroundColor: theme.semantic.primary,
                  borderRadius: theme.radius.medium,
                },
              ]}
            >
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share to Feed</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={[
                styles.dismissButton,
                {
                  borderColor: theme.border.light,
                  borderRadius: theme.radius.medium,
                },
              ]}
            >
              <Text style={[styles.dismissButtonText, { color: theme.text.secondary }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 48,
  },
  tierPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  tierText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  badgeName: {
    textAlign: "center",
    marginBottom: 8,
  },
  badgeDescription: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dismissButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
