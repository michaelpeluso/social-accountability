/**
 * Reactions Storage Module
 * Handles CRUD operations for post reactions (M3)
 * Fixed emoji set: 👍 ❤️ 👏 🔥 📈
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Reaction, ReactionEmoji, CreateReactionRequest } from "../types";
import { ALLOWED_REACTIONS, RATE_LIMITS } from "../types";
import { checkRateLimit, incrementRateLimit } from "./rateLimits";
import { notifyReactionReceived } from "./notifications";
import { showNotificationAlert } from "../services/notificationAlert";

/**
 * Add a reaction to a post (toggle behavior - adds if not exists, removes if exists)
 */
export async function toggleReaction(
  userId: string,
  request: CreateReactionRequest
): Promise<{ action: "added" | "removed"; reaction?: Reaction } | { error: string }> {
  const { targetId, targetType, emoji } = request;

  // Validate emoji is in allowed set
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return { error: `Invalid reaction emoji. Allowed: ${ALLOWED_REACTIONS.join(" ")}` };
  }

  // Determine which column to use based on targetType
  const isPost = targetType === "POST";
  const columnName = isPost ? "postId" : "storyId";

  // Check if user already reacted to this target
  const existing = await queryFirst<Reaction>(
    `SELECT * FROM reactions WHERE ${columnName} = ? AND userId = ?`,
    [targetId, userId]
  );

  if (existing) {
    // If same emoji, remove the reaction
    if (existing.emoji === emoji) {
      await execute("DELETE FROM reactions WHERE id = ?", [existing.id]);
      logger.info("Reaction removed", { targetId, targetType, userId, emoji });
      return { action: "removed" };
    }

    // Different emoji - update to new one
    await execute("UPDATE reactions SET emoji = ? WHERE id = ?", [emoji, existing.id]);
    logger.info("Reaction updated", {
      targetId,
      targetType,
      userId,
      oldEmoji: existing.emoji,
      newEmoji: emoji,
    });
    return { action: "added", reaction: { ...existing, emoji } };
  }

  // Check rate limit for new reactions
  const withinLimit = await checkRateLimit(userId, "reaction", null, RATE_LIMITS.REACTIONS_PER_DAY);
  if (!withinLimit) {
    logger.warn("Reaction rate limit exceeded", { userId });
    return { error: "Daily reaction limit reached (100/day)" };
  }

  // Add new reaction
  const id = `reaction_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const reaction: Reaction = {
    id,
    targetId,
    targetType,
    userId,
    emoji,
    createdAt: now,
  };

  // Insert with appropriate postId or storyId
  const postIdValue = isPost ? targetId : null;
  const storyIdValue = isPost ? null : targetId;

  await execute(
    `INSERT INTO reactions (id, postId, storyId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [reaction.id, postIdValue, storyIdValue, reaction.userId, reaction.emoji, reaction.createdAt]
  );

  await incrementRateLimit(userId, "reaction", null);

  // Notify post owner (unless they're reacting to their own post)
  // Only notify for POST reactions
  if (targetType === "POST") {
    const post = await queryFirst<{ userId: string }>("SELECT userId FROM posts WHERE id = ?", [
      targetId,
    ]);

    if (post && post.userId !== userId) {
      // Get reactor's name
      const reactor = await queryFirst<{ displayName: string }>(
        "SELECT displayName FROM users WHERE id = ?",
        [userId]
      );
      const reactorName = reactor?.displayName || "Someone";

      // Create notification record
      const notification = await notifyReactionReceived(post.userId, reactorName, emoji, targetId);

      // Show alert to simulate system notification
      showNotificationAlert(notification);
    }
  }

  logger.info("Reaction added", { targetId, targetType, userId, emoji });
  return { action: "added", reaction };
}

/**
 * Get all reactions for a target (post or story)
 */
export async function getTargetReactions(
  targetId: string,
  targetType: "POST" | "STORY" = "POST"
): Promise<Reaction[]> {
  const columnName = targetType === "POST" ? "postId" : "storyId";
  const reactions = await query<Reaction & { targetId: string; targetType: string }>(
    `SELECT *, ${columnName} as targetId, ? as targetType FROM reactions WHERE ${columnName} = ? ORDER BY createdAt ASC`,
    [targetType, targetId]
  );
  return reactions;
}

/**
 * Get reaction counts grouped by emoji for a target
 */
export async function getReactionCounts(
  targetId: string,
  targetType: "POST" | "STORY" = "POST"
): Promise<{ emoji: ReactionEmoji; count: number }[]> {
  const columnName = targetType === "POST" ? "postId" : "storyId";
  return query<{ emoji: ReactionEmoji; count: number }>(
    `SELECT emoji, COUNT(*) as count FROM reactions WHERE ${columnName} = ? GROUP BY emoji`,
    [targetId]
  );
}

/**
 * Check if user has reacted to a target
 */
export async function getUserReaction(
  targetId: string,
  userId: string,
  targetType: "POST" | "STORY" = "POST"
): Promise<Reaction | null> {
  const columnName = targetType === "POST" ? "postId" : "storyId";
  const reaction = await queryFirst<Reaction & { targetId: string; targetType: string }>(
    `SELECT *, ${columnName} as targetId, ? as targetType FROM reactions WHERE ${columnName} = ? AND userId = ?`,
    [targetType, targetId, userId]
  );
  return reaction;
}

/**
 * Get total reactions given by a user (for badge tracking)
 */
export async function countUserReactionsGiven(userId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM reactions WHERE userId = ?",
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Get reactions received by a user's posts
 */
export async function countUserReactionsReceived(userId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM reactions r
     JOIN posts p ON r.postId = p.id
     WHERE p.userId = ?`,
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Delete all reactions for a target (called when post/story is deleted)
 */
export async function deleteTargetReactions(
  targetId: string,
  targetType: "POST" | "STORY" = "POST"
): Promise<void> {
  const columnName = targetType === "POST" ? "postId" : "storyId";
  await execute(`DELETE FROM reactions WHERE ${columnName} = ?`, [targetId]);
  logger.info("Target reactions deleted", { targetId, targetType });
}

/**
 * Backwards-compatible alias for getTargetReactions with POST type
 */
export async function getPostReactions(postId: string): Promise<Reaction[]> {
  return getTargetReactions(postId, "POST");
}

/**
 * Backwards-compatible alias for deleteTargetReactions with POST type
 */
export async function deletePostReactions(postId: string): Promise<void> {
  return deleteTargetReactions(postId, "POST");
}
