/**
 * Reactions Storage Module
 * Handles CRUD operations for post reactions (M3)
 * Fixed emoji set: 👏 🔥 💪 ❤️ ✨
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Reaction, ReactionEmoji, CreateReactionRequest } from "../types";
import { ALLOWED_REACTIONS, RATE_LIMITS } from "../types";
import { checkRateLimit, incrementRateLimit } from "./rateLimits";

/**
 * Add a reaction to a post (toggle behavior - adds if not exists, removes if exists)
 */
export async function toggleReaction(
  userId: string,
  request: CreateReactionRequest
): Promise<{ action: "added" | "removed"; reaction?: Reaction } | { error: string }> {
  const { postId, emoji } = request;

  // Validate emoji is in allowed set
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return { error: `Invalid reaction emoji. Allowed: ${ALLOWED_REACTIONS.join(" ")}` };
  }

  // Check if user already reacted to this post
  const existing = await queryFirst<Reaction>(
    "SELECT * FROM reactions WHERE postId = ? AND userId = ?",
    [postId, userId]
  );

  if (existing) {
    // If same emoji, remove the reaction
    if (existing.emoji === emoji) {
      await execute("DELETE FROM reactions WHERE id = ?", [existing.id]);
      logger.info("Reaction removed", { postId, userId, emoji });
      return { action: "removed" };
    }

    // Different emoji - update to new one
    await execute("UPDATE reactions SET emoji = ? WHERE id = ?", [emoji, existing.id]);
    logger.info("Reaction updated", { postId, userId, oldEmoji: existing.emoji, newEmoji: emoji });
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
    postId,
    userId,
    emoji,
    createdAt: now,
  };

  await execute(
    `INSERT INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [reaction.id, reaction.postId, reaction.userId, reaction.emoji, reaction.createdAt]
  );

  await incrementRateLimit(userId, "reaction", null);

  logger.info("Reaction added", { postId, userId, emoji });
  return { action: "added", reaction };
}

/**
 * Get all reactions for a post
 */
export async function getPostReactions(postId: string): Promise<Reaction[]> {
  return query<Reaction>("SELECT * FROM reactions WHERE postId = ? ORDER BY createdAt ASC", [
    postId,
  ]);
}

/**
 * Get reaction counts grouped by emoji for a post
 */
export async function getReactionCounts(
  postId: string
): Promise<{ emoji: ReactionEmoji; count: number }[]> {
  return query<{ emoji: ReactionEmoji; count: number }>(
    `SELECT emoji, COUNT(*) as count FROM reactions WHERE postId = ? GROUP BY emoji`,
    [postId]
  );
}

/**
 * Check if user has reacted to a post
 */
export async function getUserReaction(postId: string, userId: string): Promise<Reaction | null> {
  return queryFirst<Reaction>("SELECT * FROM reactions WHERE postId = ? AND userId = ?", [
    postId,
    userId,
  ]);
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
     WHERE p.authorUserId = ?`,
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Delete all reactions for a post (called when post is deleted)
 */
export async function deletePostReactions(postId: string): Promise<void> {
  await execute("DELETE FROM reactions WHERE postId = ?", [postId]);
  logger.info("Post reactions deleted", { postId });
}
