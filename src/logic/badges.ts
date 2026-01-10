/**
 * Badge Awarding Logic
 * Checks and awards badges based on user activity (M3)
 * Badges are automatically awarded when criteria are met
 */

import { awardBadge, hasBadge } from "../storage/badges";
import { queryFirst, query } from "../storage/database";
import { countUserReactionsGiven } from "../storage/reactions";
import { countNudgesSent } from "../storage/nudges";
import { logger } from "../lib/logger";
import type { Badge, BadgeType, Pillar } from "../types";

/**
 * Check and award all applicable badges for a user
 * Call this after significant events (check-in, reaction, nudge, etc.)
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const awardedBadges: Badge[] = [];

  // Check streak badges
  const streakBadges = await checkStreakBadges(userId);
  awardedBadges.push(...streakBadges);

  // Check milestone badges
  const milestoneBadges = await checkMilestoneBadges(userId);
  awardedBadges.push(...milestoneBadges);

  // Check recovery badges
  const recoveryBadges = await checkRecoveryBadges(userId);
  awardedBadges.push(...recoveryBadges);

  // Check social badges
  const socialBadges = await checkSocialBadges(userId);
  awardedBadges.push(...socialBadges);

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
 */
async function checkSocialBadges(userId: string): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Reactions given
  const reactionsCount = await countUserReactionsGiven(userId);
  if (reactionsCount >= 50) {
    const badge = await awardBadge(userId, "reactions-50");
    if (badge) awarded.push(badge);
  }

  // Nudges sent
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
