/**
 * Badge Awarding Logic
 * Checks and awards badges based on user activity (M3)
 * Supports tiered badges (bronze, silver, gold, platinum) with quantitative thresholds
 */

import { awardBadge, hasBadge } from "../storage/badges";
import { queryFirst, query } from "../storage/database";
import { countUserReactionsGiven } from "../storage/reactions";
import { countNudgesSent } from "../storage/nudges";
import { countUserPosts } from "../storage/posts";
import { countUserComments } from "../storage/comments";
import { countUserHabits, countUserCheckIns } from "../storage/habits";
import { countCompletedGoals } from "../storage/goals";
import { createNotification } from "../storage/notifications";
import { logger } from "../lib/logger";
import type { Badge, BadgeType, BadgeTier, Pillar } from "../types";
import { TIERED_BADGE_DEFINITIONS, BADGE_INFO } from "../types";

/**
 * Check and award all applicable tiered badges for a user
 * Returns newly awarded badges
 */
export async function checkAndAwardTieredBadges(userId: string): Promise<Badge[]> {
  const awardedBadges: Badge[] = [];

  // Get all counts
  const counts = await getBadgeCounts(userId);

  // Check each tiered category
  for (const [category, definition] of Object.entries(TIERED_BADGE_DEFINITIONS)) {
    const count = counts[category] ?? 0;
    const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];

    for (const tier of tiers) {
      const threshold = definition.thresholds[tier];
      if (count >= threshold) {
        const badgeType = `${category}-${tier}` as BadgeType;
        const badge = await awardBadge(userId, badgeType);
        if (badge) {
          awardedBadges.push(badge);

          // Create notification for new badge
          await createBadgeNotification(userId, badge);
        }
      }
    }
  }

  return awardedBadges;
}

/**
 * Get all badge-related counts for a user
 */
export async function getBadgeCounts(userId: string): Promise<Record<string, number>> {
  const [
    postsCount,
    habitsCount,
    goalsCount,
    checkinsCount,
    reactionsCount,
    nudgesCount,
    commentsCount,
  ] = await Promise.all([
    countUserPosts(userId),
    countUserHabits(userId),
    countCompletedGoals(userId),
    countUserCheckIns(userId),
    countUserReactionsGiven(userId),
    countNudgesSent(userId),
    countUserComments(userId),
  ]);

  return {
    posts: postsCount,
    habits: habitsCount,
    goals: goalsCount,
    checkins: checkinsCount,
    reactions: reactionsCount,
    nudges: nudgesCount,
    comments: commentsCount,
  };
}

/**
 * Create a notification for a newly earned badge
 */
async function createBadgeNotification(userId: string, badge: Badge): Promise<void> {
  const info = BADGE_INFO[badge.badgeType];
  if (!info) return;

  await createNotification(
    userId,
    "BADGE_EARNED",
    `${info.emoji} New Badge Earned!`,
    `Congratulations! You've earned the "${info.name}" badge. ${info.description}`,
    {
      badgeId: badge.id,
      badgeType: badge.badgeType,
      tier: badge.tier ?? "",
    }
  );
}

/**
 * Check and award all applicable badges for a user
 * Call this after significant events (check-in, reaction, nudge, etc.)
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const awardedBadges: Badge[] = [];

  // Check tiered badges first
  const tieredBadges = await checkAndAwardTieredBadges(userId);
  awardedBadges.push(...tieredBadges);

  // Check streak badges
  const streakBadges = await checkStreakBadges(userId);
  awardedBadges.push(...streakBadges);

  // Check legacy milestone badges (for backwards compatibility)
  const milestoneBadges = await checkMilestoneBadges(userId);
  awardedBadges.push(...milestoneBadges);

  // Check recovery badges
  const recoveryBadges = await checkRecoveryBadges(userId);
  awardedBadges.push(...recoveryBadges);

  // Check pillar badges (monthly)
  const pillarBadges = await checkPillarBadges(userId);
  awardedBadges.push(...pillarBadges);

  if (awardedBadges.length > 0) {
    logger.info("Badges awarded", {
      userId,
      count: awardedBadges.length,
      badges: awardedBadges.map((b) => b.badgeType),
    });
  }

  return awardedBadges;
}

/**
 * Check streak-based badges (7, 30, 100 day streaks)
 */
async function checkStreakBadges(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Get max current streak across all habits
  const result = await queryFirst<{ maxStreak: number }>(
    `SELECT MAX(currentStreak) as maxStreak FROM habits WHERE userId = ? AND isArchived = 0`,
    [userId]
  );

  const maxStreak = result?.maxStreak ?? 0;

  // 7-day streak
  if (maxStreak >= 7) {
    const badge = await awardBadge(userId, "streak-7");
    if (badge) awarded.push(badge);
  }

  // 30-day streak
  if (maxStreak >= 30) {
    const badge = await awardBadge(userId, "streak-30");
    if (badge) awarded.push(badge);
  }

  // 100-day streak
  if (maxStreak >= 100) {
    const badge = await awardBadge(userId, "streak-100");
    if (badge) awarded.push(badge);
  }

  return awarded;
}

/**
 * Check milestone badges (habits created, check-ins logged)
 */
async function checkMilestoneBadges(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Check habits count
  const habitsResult = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM habits WHERE userId = ?",
    [userId]
  );
  const habitsCount = habitsResult?.count ?? 0;

  if (habitsCount >= 10) {
    const badge = await awardBadge(userId, "habits-10");
    if (badge) awarded.push(badge);
  }

  // Check check-ins count
  const checkInsResult = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM habit_check_ins WHERE userId = ?",
    [userId]
  );
  const checkInsCount = checkInsResult?.count ?? 0;

  if (checkInsCount >= 100) {
    const badge = await awardBadge(userId, "checkins-100");
    if (badge) awarded.push(badge);
  }

  if (checkInsCount >= 1000) {
    const badge = await awardBadge(userId, "checkins-1000");
    if (badge) awarded.push(badge);
  }

  return awarded;
}

/**
 * Check recovery badges (coming back after missed days)
 */
async function checkRecoveryBadges(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Get max recovery streak (recoveryStreak field tracks consecutive days after a miss)
  const result = await queryFirst<{ maxRecovery: number }>(
    `SELECT MAX(recoveryStreak) as maxRecovery FROM habits WHERE userId = ? AND isArchived = 0`,
    [userId]
  );

  const maxRecovery = result?.maxRecovery ?? 0;

  // Recovery after 3-day miss
  if (maxRecovery >= 3) {
    const badge = await awardBadge(userId, "recovery-3");
    if (badge) awarded.push(badge);
  }

  // Recovery after 7-day miss
  if (maxRecovery >= 7) {
    const badge = await awardBadge(userId, "recovery-7");
    if (badge) awarded.push(badge);
  }

  return awarded;
}

/**
 * Check social badges (reactions given, nudges sent)
 * NOTE: These are legacy badges kept for backwards compatibility
 * New tiered badges (reactions-bronze/silver/gold/platinum) are awarded via checkAndAwardTieredBadges
 * This function is preserved for potential future use but not currently called in the main flow
 * @deprecated Use checkAndAwardTieredBadges for new social badge awards
 */
export async function checkSocialBadgesLegacy(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Legacy reactions badge
  const reactionsCount = await countUserReactionsGiven(userId);
  if (reactionsCount >= 50) {
    const badge = await awardBadge(userId, "reactions-50");
    if (badge) awarded.push(badge);
  }

  // Legacy nudges badge
  const nudgesCount = await countNudgesSent(userId);
  if (nudgesCount >= 10) {
    const badge = await awardBadge(userId, "nudges-10");
    if (badge) awarded.push(badge);
  }

  return awarded;
}

/**
 * Check pillar badges (90% completion in a pillar for a month)
 */
async function checkPillarBadges(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];
  const pillars: Pillar[] = ["MIND", "BODY", "HEART", "SOUL"];

  // Get first day of last month
  const now = new Date();
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const daysInLastMonth = lastOfLastMonth.getDate();

  const startDate = firstOfLastMonth.toISOString().split("T")[0];
  const endDate = lastOfLastMonth.toISOString().split("T")[0];

  for (const pillar of pillars) {
    // Get habits in this pillar
    const habits = await query<{ id: string }>(
      `SELECT id FROM habits WHERE userId = ? AND pillar = ? AND isArchived = 0`,
      [userId, pillar]
    );

    if (habits.length === 0) continue;

    // Calculate expected check-ins for the month
    // For simplicity, we assume daily habits (each habit should have daysInLastMonth check-ins)
    const expectedCheckIns = habits.length * daysInLastMonth;

    // Get actual check-ins
    const checkInsResult = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM habit_check_ins ci
       JOIN habits h ON ci.habitId = h.id
       WHERE h.userId = ? AND h.pillar = ?
       AND date(ci.occurredAt) >= ? AND date(ci.occurredAt) <= ?`,
      [userId, pillar, startDate, endDate]
    );

    const actualCheckIns = checkInsResult?.count ?? 0;
    const completionRate = actualCheckIns / expectedCheckIns;

    if (completionRate >= 0.9) {
      const badgeType = `pillar-${pillar.toLowerCase()}-90` as BadgeType;
      const badge = await awardBadge(userId, badgeType);
      if (badge) awarded.push(badge);
    }
  }

  return awarded;
}

/**
 * Check a specific badge type for a user
 * Returns true if the user has earned or should earn this badge
 */
export async function checkSpecificBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
  // Check if already earned
  if (await hasBadge(userId, badgeType)) {
    return true;
  }

  // Check tiered badges first
  const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];
  for (const tier of tiers) {
    if (badgeType.endsWith(`-${tier}`)) {
      const category = badgeType.replace(`-${tier}`, "");
      const definition = TIERED_BADGE_DEFINITIONS[category];
      if (definition) {
        const counts = await getBadgeCounts(userId);
        const count = counts[category] ?? 0;
        const threshold = definition.thresholds[tier];
        return count >= threshold;
      }
    }
  }

  // Check specific conditions based on badge type
  switch (badgeType) {
    case "streak-7":
    case "streak-30":
    case "streak-100": {
      const result = await queryFirst<{ maxStreak: number }>(
        `SELECT MAX(currentStreak) as maxStreak FROM habits WHERE userId = ? AND isArchived = 0`,
        [userId]
      );
      const maxStreak = result?.maxStreak ?? 0;
      const required = badgeType === "streak-7" ? 7 : badgeType === "streak-30" ? 30 : 100;
      return maxStreak >= required;
    }

    case "habits-10": {
      const result = await queryFirst<{ count: number }>(
        "SELECT COUNT(*) as count FROM habits WHERE userId = ?",
        [userId]
      );
      return (result?.count ?? 0) >= 10;
    }

    case "checkins-100":
    case "checkins-1000": {
      const result = await queryFirst<{ count: number }>(
        "SELECT COUNT(*) as count FROM habit_check_ins WHERE userId = ?",
        [userId]
      );
      const required = badgeType === "checkins-100" ? 100 : 1000;
      return (result?.count ?? 0) >= required;
    }

    case "reactions-50": {
      const count = await countUserReactionsGiven(userId);
      return count >= 50;
    }

    case "nudges-10": {
      const count = await countNudgesSent(userId);
      return count >= 10;
    }

    default:
      return false;
  }
}

/**
 * Get progress towards next badge in a category
 */
export async function getBadgeProgress(
  userId: string,
  category: string
): Promise<{
  currentCount: number;
  currentTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  nextThreshold: number | null;
  progressPercent: number;
} | null> {
  const definition = TIERED_BADGE_DEFINITIONS[category];
  if (!definition) return null;

  const counts = await getBadgeCounts(userId);
  const currentCount = counts[category] ?? 0;

  // Find current tier
  const tiers: BadgeTier[] = ["platinum", "gold", "silver", "bronze"];
  let currentTier: BadgeTier | null = null;

  for (const tier of tiers) {
    if (currentCount >= definition.thresholds[tier]) {
      currentTier = tier;
      break;
    }
  }

  // Find next tier
  const tiersAscending: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];
  let nextTier: BadgeTier | null = null;
  let nextThreshold: number | null = null;

  for (const tier of tiersAscending) {
    if (currentCount < definition.thresholds[tier]) {
      nextTier = tier;
      nextThreshold = definition.thresholds[tier];
      break;
    }
  }

  // Calculate progress
  const progressPercent = nextThreshold
    ? Math.min(100, Math.round((currentCount / nextThreshold) * 100))
    : 100;

  return {
    currentCount,
    currentTier,
    nextTier,
    nextThreshold,
    progressPercent,
  };
}
