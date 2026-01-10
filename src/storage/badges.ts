/**
 * Badges Storage Module
 * Handles badge awarding and retrieval (M3)
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Badge, BadgeType } from "../types";
import { BADGE_INFO } from "../types";

/**
 * Award a badge to a user (if not already earned)
 * Returns the badge if newly awarded, null if already earned
 */
export async function awardBadge(userId: string, badgeType: BadgeType): Promise<Badge | null> {
  // Check if already earned
  const existing = await queryFirst<Badge>(
    "SELECT * FROM badges WHERE userId = ? AND badgeType = ?",
    [userId, badgeType]
  );

  if (existing) {
    return null; // Already earned
  }

  const id = `badge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const badge: Badge = {
    id,
    userId,
    badgeType,
    earnedAt: now,
  };

  try {
    await execute(`INSERT INTO badges (id, userId, badgeType, earnedAt) VALUES (?, ?, ?, ?)`, [
      badge.id,
      badge.userId,
      badge.badgeType,
      badge.earnedAt,
    ]);

    const badgeInfo = BADGE_INFO[badgeType];
    logger.info("Badge awarded", {
      userId,
      badgeType,
      badgeName: badgeInfo.name,
      rarity: badgeInfo.rarity,
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
  return query<Badge>("SELECT * FROM badges WHERE userId = ? ORDER BY earnedAt DESC", [userId]);
}

/**
 * Get badges with display info
 */
export type BadgeWithInfo = Badge & {
  name: string;
  description: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
};

export async function getUserBadgesWithInfo(userId: string): Promise<BadgeWithInfo[]> {
  const badges = await getUserBadges(userId);

  return badges.map((badge) => {
    const info = BADGE_INFO[badge.badgeType];
    return {
      ...badge,
      name: info.name,
      description: info.description,
      emoji: info.emoji,
      rarity: info.rarity,
    };
  });
}

/**
 * Check if user has a specific badge
 */
export async function hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
  const badge = await queryFirst<Badge>(
    "SELECT id FROM badges WHERE userId = ? AND badgeType = ?",
    [userId, badgeType]
  );
  return !!badge;
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
    const rarity = BADGE_INFO[badge.badgeType].rarity;
    counts[rarity]++;
  }

  return counts;
}

/**
 * Get recently earned badges (for notifications)
 */
export async function getRecentBadges(userId: string, since: string): Promise<Badge[]> {
  return query<Badge>(
    "SELECT * FROM badges WHERE userId = ? AND earnedAt > ? ORDER BY earnedAt DESC",
    [userId, since]
  );
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
