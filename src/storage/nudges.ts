/**
 * Nudges Storage Module
 * Handles positive encouragement messages between friends (M3)
 * Rate limits: 3 nudges per pair per day, 10 total per day
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Nudge, NudgeTemplateId, CreateNudgeRequest } from "../types";
import { NUDGE_TEMPLATES, RATE_LIMITS } from "../types";
import { checkRateLimit, incrementRateLimit, getRateLimitCount } from "./rateLimits";

/**
 * Send a nudge to a friend
 * Enforces rate limits:
 * - 3 nudges per user pair per day
 * - 10 total nudges per day
 */
export async function sendNudge(
  fromUserId: string,
  request: CreateNudgeRequest
): Promise<Nudge | { error: string }> {
  const { toUserId, templateId } = request;

  // Cannot nudge yourself
  if (fromUserId === toUserId) {
    return { error: "Cannot send a nudge to yourself" };
  }

  // Validate template exists
  if (!NUDGE_TEMPLATES[templateId]) {
    return { error: "Invalid nudge template" };
  }

  // Check if they are friends
  const friendship = await queryFirst<{ status: string }>(
    `SELECT status FROM friendships 
     WHERE userId = ? AND friendId = ? AND status = 'ACCEPTED'`,
    [fromUserId, toUserId]
  );

  if (!friendship) {
    return { error: "You can only send nudges to friends" };
  }

  // Check pair rate limit (3 per day to same person)
  const pairWithinLimit = await checkRateLimit(
    fromUserId,
    "nudge_pair",
    toUserId,
    RATE_LIMITS.NUDGES_PER_PAIR_PER_DAY
  );
  if (!pairWithinLimit) {
    logger.warn("Nudge pair rate limit exceeded", { fromUserId, toUserId });
    return { error: "You can only send 3 nudges per day to the same friend" };
  }

  // Check total rate limit (10 per day total)
  const totalWithinLimit = await checkRateLimit(
    fromUserId,
    "nudge_total",
    null,
    RATE_LIMITS.NUDGES_TOTAL_PER_DAY
  );
  if (!totalWithinLimit) {
    logger.warn("Nudge total rate limit exceeded", { fromUserId });
    return { error: "Daily nudge limit reached (10/day)" };
  }

  const id = `nudge_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const nudge: Nudge = {
    id,
    fromUserId,
    toUserId,
    templateId,
    createdAt: now,
  };

  try {
    await execute(
      `INSERT INTO nudges (id, fromUserId, toUserId, templateId, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [nudge.id, nudge.fromUserId, nudge.toUserId, nudge.templateId, nudge.createdAt]
    );

    // Increment both rate limits
    await incrementRateLimit(fromUserId, "nudge_pair", toUserId);
    await incrementRateLimit(fromUserId, "nudge_total", null);

    logger.info("Nudge sent", { nudgeId: id, fromUserId, toUserId, templateId });
    return nudge;
  } catch (error) {
    logger.error("Failed to send nudge", { error, fromUserId, toUserId });
    throw error;
  }
}

/**
 * Get nudges received by a user
 */
export async function getNudgesReceived(
  userId: string,
  limit = 20,
  cursor?: string
): Promise<Nudge[]> {
  const cursorClause = cursor ? "AND createdAt < ?" : "";
  const params: (string | number)[] = [userId];
  if (cursor) params.push(cursor);
  params.push(limit);

  return query<Nudge>(
    `SELECT * FROM nudges WHERE toUserId = ? ${cursorClause} ORDER BY createdAt DESC LIMIT ?`,
    params
  );
}

/**
 * Get nudges sent by a user
 */
export async function getNudgesSent(userId: string, limit = 20, cursor?: string): Promise<Nudge[]> {
  const cursorClause = cursor ? "AND createdAt < ?" : "";
  const params: (string | number)[] = [userId];
  if (cursor) params.push(cursor);
  params.push(limit);

  return query<Nudge>(
    `SELECT * FROM nudges WHERE fromUserId = ? ${cursorClause} ORDER BY createdAt DESC LIMIT ?`,
    params
  );
}

/**
 * Get nudge with sender info (for display)
 */
export type NudgeWithSender = Nudge & {
  senderName: string;
  senderAvatarUrl?: string;
  templateText: string;
  templateEmoji: string;
};

export async function getNudgesWithSenderInfo(
  userId: string,
  limit = 20
): Promise<NudgeWithSender[]> {
  const nudges = await query<Nudge & { senderName: string; senderAvatarUrl: string | null }>(
    `SELECT n.*, u.displayName as senderName, u.photoUrl as senderAvatarUrl
     FROM nudges n
     JOIN users u ON n.fromUserId = u.id
     WHERE n.toUserId = ?
     ORDER BY n.createdAt DESC
     LIMIT ?`,
    [userId, limit]
  );

  return nudges.map((nudge) => {
    const template = NUDGE_TEMPLATES[nudge.templateId as NudgeTemplateId];
    return {
      ...nudge,
      senderAvatarUrl: nudge.senderAvatarUrl ?? undefined,
      templateText: template?.text ?? "Keep going!",
      templateEmoji: template?.emoji ?? "💪",
    };
  });
}

/**
 * Count total nudges sent by user (for badge tracking)
 */
export async function countNudgesSent(userId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM nudges WHERE fromUserId = ?",
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Get nudge rate limit status for a user pair
 */
export async function getNudgeRateLimitStatus(
  fromUserId: string,
  toUserId: string
): Promise<{ pairRemaining: number; totalRemaining: number }> {
  const pairCount = await getRateLimitCount(fromUserId, "nudge_pair", toUserId);
  const totalCount = await getRateLimitCount(fromUserId, "nudge_total", null);

  return {
    pairRemaining: Math.max(0, RATE_LIMITS.NUDGES_PER_PAIR_PER_DAY - pairCount),
    totalRemaining: Math.max(0, RATE_LIMITS.NUDGES_TOTAL_PER_DAY - totalCount),
  };
}

/**
 * Check if user has unread nudges (received today)
 */
export async function hasUnreadNudgesToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const result = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM nudges 
     WHERE toUserId = ? AND date(createdAt) = ?`,
    [userId, today]
  );
  return (result?.count ?? 0) > 0;
}
