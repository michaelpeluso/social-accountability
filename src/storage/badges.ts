/**
 * Badges Storage Module
 * Handles badge awarding and retrieval (M3)
 * Supports tiered badges (bronze, silver, gold, platinum) with quantitative thresholds
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Badge, BadgeType, BadgeTier } from "../types";
import { BADGE_INFO, TIERED_BADGE_DEFINITIONS, BADGE_TIER_COLORS } from "../types";

/**
 * Parse badge type into category and tier
 */
export function parseTieredBadge(
  badgeType: BadgeType
): { category: string; tier: BadgeTier } | null {
  const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];
  for (const tier of tiers) {
    if (badgeType.endsWith(`-${tier}`)) {
      const category = badgeType.replace(`-${tier}`, "");
      if (TIERED_BADGE_DEFINITIONS[category]) {
        return { category, tier };
      }
    }
  }
  return null;
}

/**
 * Get the next tier badge type for a category
 */
export function getNextTierBadge(category: string, currentTier: BadgeTier): BadgeType | null {
  const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    return `${category}-${nextTier}` as BadgeType;
  }
  return null; // Already at platinum
}

/**
 * Award a badge to a user (if not already earned)
 * Returns the badge if newly awarded, null if already earned
 */
export async function awardBadge(userId: string, badgeType: BadgeType): Promise<Badge | null> {
  // Check if already earned
  const existing = await queryFirst<Badge>(
    "SELECT * FROM badges WHERE userId = ? AND badgeName = ?",
    [userId, badgeType]
  );

  if (existing) {
    return null; // Already earned
  }

  const id = `badge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  // Determine tier if it's a tiered badge
  const parsed = parseTieredBadge(badgeType);
  const tier = parsed?.tier;

  const badge: Badge = {
    id,
    userId,
    badgeType,
    tier,
    earnedAt: now,
  };

  try {
    await execute(
      `INSERT INTO badges (id, userId, badgeName, tier, earnedAt) VALUES (?, ?, ?, ?, ?)`,
      [badge.id, badge.userId, badge.badgeType, tier ?? null, badge.earnedAt]
    );

    const badgeInfo = BADGE_INFO[badgeType];
    logger.info("Badge awarded", {
      userId,
      badgeType,
      badgeName: badgeInfo?.name ?? badgeType,
      tier,
      rarity: badgeInfo?.rarity,
    });

    return badge;
  } catch (error) {
    // Handle unique constraint violation
    if (String(error).includes("UNIQUE constraint failed")) {
      return null;
    }
    logger.error("Failed to award badge", { error, userId, badgeType });
    throw error;
  }
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const rows = await query<{
    id: string;
    userId: string;
    badgeName: string;
    tier: string | null;
    earnedAt: string;
    sharedAt: string | null;
    syncedAt: string | null;
  }>("SELECT * FROM badges WHERE userId = ? ORDER BY earnedAt DESC", [userId]);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    badgeType: row.badgeName as BadgeType,
    tier: row.tier as BadgeTier | undefined,
    earnedAt: row.earnedAt,
    sharedAt: row.sharedAt ?? undefined,
    syncedAt: row.syncedAt ?? undefined,
  }));
}

/**
 * Get badges with display info
 */
export type BadgeWithInfo = Badge & {
  name: string;
  description: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  tierColor?: string;
};

export async function getUserBadgesWithInfo(userId: string): Promise<BadgeWithInfo[]> {
  const badges = await getUserBadges(userId);

  return badges.map((badge) => {
    const info = BADGE_INFO[badge.badgeType];
    return {
      ...badge,
      name: info?.name ?? badge.badgeType,
      description: info?.description ?? "",
      emoji: info?.emoji ?? "🏆",
      rarity: info?.rarity ?? "common",
      tierColor: badge.tier ? BADGE_TIER_COLORS[badge.tier] : undefined,
    };
  });
}

/**
 * Check if user has a specific badge
 */
export async function hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
  const badge = await queryFirst<{ id: string }>(
    "SELECT id FROM badges WHERE userId = ? AND badgeName = ?",
    [userId, badgeType]
  );
  return !!badge;
}

/**
 * Get badge by ID
 */
export async function getBadgeById(badgeId: string): Promise<Badge | null> {
  const row = await queryFirst<{
    id: string;
    userId: string;
    badgeName: string;
    tier: string | null;
    earnedAt: string;
    sharedAt: string | null;
    syncedAt: string | null;
  }>("SELECT * FROM badges WHERE id = ?", [badgeId]);

  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    badgeType: row.badgeName as BadgeType,
    tier: row.tier as BadgeTier | undefined,
    earnedAt: row.earnedAt,
    sharedAt: row.sharedAt ?? undefined,
    syncedAt: row.syncedAt ?? undefined,
  };
}

/**
 * Mark a badge as shared (when user creates a post about it)
 */
export async function markBadgeShared(badgeId: string): Promise<void> {
  const now = new Date().toISOString();
  await execute("UPDATE badges SET sharedAt = ? WHERE id = ?", [now, badgeId]);
  logger.info("Badge marked as shared", { badgeId });
}

/**
 * Count total badges for a user
 */
export async function countUserBadges(userId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM badges WHERE userId = ?",
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Get badge counts by rarity
 */
export async function getBadgeCountsByRarity(userId: string): Promise<Record<string, number>> {
  const badges = await getUserBadges(userId);

  const counts: Record<string, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (const badge of badges) {
    const info = BADGE_INFO[badge.badgeType];
    const rarity = info?.rarity ?? "common";
    counts[rarity]++;
  }

  return counts;
}

/**
 * Get badge counts by tier
 */
export async function getBadgeCountsByTier(userId: string): Promise<Record<BadgeTier, number>> {
  const badges = await getUserBadges(userId);

  const counts: Record<BadgeTier, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  };

  for (const badge of badges) {
    if (badge.tier) {
      counts[badge.tier]++;
    }
  }

  return counts;
}

/**
 * Get user's highest tier for a badge category
 */
export async function getHighestTierForCategory(
  userId: string,
  category: string
): Promise<BadgeTier | null> {
  const badges = await getUserBadges(userId);
  const tiers: BadgeTier[] = ["platinum", "gold", "silver", "bronze"];

  for (const tier of tiers) {
    const badgeType = `${category}-${tier}` as BadgeType;
    if (badges.some((b) => b.badgeType === badgeType)) {
      return tier;
    }
  }

  return null;
}

/**
 * Get recently earned badges (for notifications)
 */
export async function getRecentBadges(userId: string, since: string): Promise<Badge[]> {
  const rows = await query<{
    id: string;
    userId: string;
    badgeName: string;
    tier: string | null;
    earnedAt: string;
    sharedAt: string | null;
    syncedAt: string | null;
  }>("SELECT * FROM badges WHERE userId = ? AND earnedAt > ? ORDER BY earnedAt DESC", [
    userId,
    since,
  ]);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    badgeType: row.badgeName as BadgeType,
    tier: row.tier as BadgeTier | undefined,
    earnedAt: row.earnedAt,
    sharedAt: row.sharedAt ?? undefined,
    syncedAt: row.syncedAt ?? undefined,
  }));
}

/**
 * Get list of all badge types user hasn't earned yet
 */
export async function getUnearnedBadges(userId: string): Promise<BadgeType[]> {
  const earnedBadges = await getUserBadges(userId);
  const earnedTypes = new Set(earnedBadges.map((b) => b.badgeType));

  const allBadgeTypes = Object.keys(BADGE_INFO) as BadgeType[];
  return allBadgeTypes.filter((type) => !earnedTypes.has(type));
}

/**
 * Get next badge to earn for a category (progress tracking)
 */
export async function getNextBadgeProgress(
  userId: string,
  category: string,
  currentCount: number
): Promise<{ nextBadge: BadgeType; threshold: number; progress: number } | null> {
  const definition = TIERED_BADGE_DEFINITIONS[category];
  if (!definition) return null;

  const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];

  for (const tier of tiers) {
    const badgeType = `${category}-${tier}` as BadgeType;
    const hasEarned = await hasBadge(userId, badgeType);

    if (!hasEarned) {
      const threshold = definition.thresholds[tier];
      return {
        nextBadge: badgeType,
        threshold,
        progress: Math.min(100, Math.round((currentCount / threshold) * 100)),
      };
    }
  }

  return null; // User has all tiers
}
