/**
 * Rate Limits Storage Module
 * Handles rate limiting for social actions (posts, reactions, nudges)
 */

import { execute, queryFirst } from "./database";
import { logger } from "../lib/logger";

/**
 * Check if a user is within rate limit for an action
 * @param userId - The user performing the action
 * @param actionType - Type of action (post, reaction, nudge)
 * @param targetId - Optional target (e.g., recipient user for nudges)
 * @param limit - Maximum allowed count per day
 */
export async function checkRateLimit(
  userId: string,
  actionType: string,
  targetId: string | null,
  limit: number
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  const result = await queryFirst<{ count: number }>(
    `SELECT count FROM rate_limits 
     WHERE userId = ? AND actionType = ? AND (targetId = ? OR (targetId IS NULL AND ? IS NULL)) AND date = ?`,
    [userId, actionType, targetId, targetId, today]
  );

  const currentCount = result?.count ?? 0;
  return currentCount < limit;
}

/**
 * Increment rate limit counter for an action
 */
export async function incrementRateLimit(
  userId: string,
  actionType: string,
  targetId: string | null
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const id = `rl_${userId}_${actionType}_${targetId ?? "global"}_${today}`;

  try {
    // Try to insert or update
    await execute(
      `INSERT INTO rate_limits (id, userId, actionType, targetId, date, count)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(userId, actionType, targetId, date) 
       DO UPDATE SET count = count + 1`,
      [id, userId, actionType, targetId, today]
    );
  } catch (error) {
    // If the UPSERT fails, try a manual update
    const existing = await queryFirst<{ id: string }>(
      `SELECT id FROM rate_limits 
       WHERE userId = ? AND actionType = ? AND (targetId = ? OR (targetId IS NULL AND ? IS NULL)) AND date = ?`,
      [userId, actionType, targetId, targetId, today]
    );

    if (existing) {
      await execute(`UPDATE rate_limits SET count = count + 1 WHERE id = ?`, [existing.id]);
    } else {
      await execute(
        `INSERT INTO rate_limits (id, userId, actionType, targetId, date, count)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, userId, actionType, targetId, today]
      );
    }

    logger.warn("Rate limit upsert fallback used", { userId, actionType });
  }
}

/**
 * Get current rate limit count
 */
export async function getRateLimitCount(
  userId: string,
  actionType: string,
  targetId: string | null
): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const result = await queryFirst<{ count: number }>(
    `SELECT count FROM rate_limits 
     WHERE userId = ? AND actionType = ? AND (targetId = ? OR (targetId IS NULL AND ? IS NULL)) AND date = ?`,
    [userId, actionType, targetId, targetId, today]
  );

  return result?.count ?? 0;
}

/**
 * Reset rate limits (for testing or admin purposes)
 */
export async function resetRateLimits(userId: string): Promise<void> {
  await execute("DELETE FROM rate_limits WHERE userId = ?", [userId]);
  logger.info("Rate limits reset", { userId });
}
