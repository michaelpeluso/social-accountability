/**
 * BadgeGrid Component
 * Displays a grid of earned badges with rarity styling
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { BadgeWithInfo } from "../../storage/badges";

type BadgeGridProps = {
  badges: BadgeWithInfo[];
  onBadgePress?: (badge: BadgeWithInfo) => void;
  emptyMessage?: string;
};

const RARITY_COLORS = {
  common: { bg: "#f5f5f5", border: "#ddd", text: "#666" },
  rare: { bg: "#e3f2fd", border: "#2196f3", text: "#1565c0" },
  epic: { bg: "#f3e5f5", border: "#9c27b0", text: "#7b1fa2" },
  legendary: { bg: "#fff8e1", border: "#ffc107", text: "#f57f17" },
};

export function BadgeGrid({ badges, onBadgePress, emptyMessage }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyText}>{emptyMessage ?? "No badges earned yet"}</Text>
        <Text style={styles.emptySubtext}>
          Complete habits and engage with friends to earn badges!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {badges.map((badge) => {
        const rarityStyle = RARITY_COLORS[badge.rarity];
        return (
          <Pressable
            key={badge.id}
            style={[
              styles.badgeCard,
              { backgroundColor: rarityStyle.bg, borderColor: rarityStyle.border },
            ]}
            onPress={() => onBadgePress?.(badge)}
          >
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.badgeName, { color: rarityStyle.text }]}>{badge.name}</Text>
            <Text style={styles.badgeRarity}>{badge.rarity.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Single Badge Display (larger, for detail view)
 */
type BadgeDetailProps = {
  badge: BadgeWithInfo;
  onShare?: () => void;
};

export function BadgeDetail({ badge, onShare }: BadgeDetailProps) {
  const rarityStyle = RARITY_COLORS[badge.rarity];

  return (
    <View style={[styles.detailContainer, { backgroundColor: rarityStyle.bg }]}>
      <Text style={styles.detailEmoji}>{badge.emoji}</Text>
      <Text style={[styles.detailName, { color: rarityStyle.text }]}>{badge.name}</Text>
      <Text style={styles.detailDescription}>{badge.description}</Text>

      <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.border }]}>
        <Text style={styles.rarityBadgeText}>{badge.rarity.toUpperCase()}</Text>
      </View>

      <Text style={styles.earnedDate}>
        Earned on {new Date(badge.earnedAt).toLocaleDateString()}
      </Text>

      {onShare && !badge.sharedAt && (
        <Pressable style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Badge</Text>
        </Pressable>
      )}

      {badge.sharedAt && <Text style={styles.sharedText}>Shared</Text>}
    </View>
  );
}

/**
 * Badge Summary (for profile header)
 */
type BadgeSummaryProps = {
  counts: Record<string, number>;
  onPress?: () => void;
};

export function BadgeSummary({ counts, onPress }: BadgeSummaryProps) {
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <Pressable style={styles.summaryContainer} onPress={onPress}>
      <Text style={styles.summaryEmoji}>🏆</Text>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTotal}>{total} Badges</Text>
        <View style={styles.summaryBreakdown}>
          {counts.legendary > 0 && (
            <Text style={[styles.summaryRarity, { color: RARITY_COLORS.legendary.text }]}>
              ⭐ {counts.legendary}
            </Text>
          )}
          {counts.epic > 0 && (
            <Text style={[styles.summaryRarity, { color: RARITY_COLORS.epic.text }]}>
              💎 {counts.epic}
            </Text>
          )}
          {counts.rare > 0 && (
            <Text style={[styles.summaryRarity, { color: RARITY_COLORS.rare.text }]}>
              🔷 {counts.rare}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.summaryArrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Grid Styles
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  badgeCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  badgeRarity: {
    fontSize: 8,
    color: "#999",
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },

  // Detail Styles
  detailContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    margin: 16,
  },
  detailEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  rarityBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  earnedDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sharedText: {
    fontSize: 12,
    color: "#4caf50",
    fontStyle: "italic",
  },

  // Summary Styles
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    margin: 16,
  },
  summaryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryBreakdown: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  summaryRarity: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryArrow: {
    fontSize: 18,
    color: "#999",
  },
});
