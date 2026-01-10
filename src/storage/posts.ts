/**
 * Posts Storage Module
 * Handles CRUD operations for social posts (M3)
 * Pattern: [SQLite Write] → [UI Update] → [Sync Queue]
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Post, CreatePostRequest, FeedPost, FeedScope, ReactionEmoji } from "../types";
import { checkRateLimit, incrementRateLimit } from "./rateLimits";
import { RATE_LIMITS } from "../types";

/**
 * Create a new post
 * Enforces rate limit of 20 posts/day
 */
export async function createPost(
  userId: string,
  request: CreatePostRequest
): Promise<Post | { error: string }> {
  // Check rate limit
  const withinLimit = await checkRateLimit(userId, "post", null, RATE_LIMITS.POSTS_PER_DAY);
  if (!withinLimit) {
    logger.warn("Post rate limit exceeded", { userId });
    return { error: "Daily post limit reached (20/day)" };
  }

  const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const post: Post = {
    id,
    authorUserId: userId,
    circleId: request.circleId,
    pillar: request.pillar,
    privacy: request.privacy,
    bodyText: request.bodyText,
    mediaUrl: request.mediaUrl,
    linkedCheckInId: request.linkedCheckInId,
    linkedHabitId: request.linkedHabitId,
    createdAt: now,
  };

  try {
    await execute(
      `INSERT INTO posts (id, authorUserId, circleId, pillar, privacy, bodyText, mediaUrl, linkedCheckInId, linkedHabitId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.id,
        post.authorUserId,
        post.circleId ?? null,
        post.pillar,
        post.privacy,
        post.bodyText ?? null,
        post.mediaUrl ?? null,
        post.linkedCheckInId ?? null,
        post.linkedHabitId ?? null,
        post.createdAt,
      ]
    );

    await incrementRateLimit(userId, "post", null);

    logger.info("Post created", { postId: id, pillar: post.pillar, privacy: post.privacy });
    return post;
  } catch (error) {
    logger.error("Failed to create post", { error, userId });
    throw error;
  }
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string): Promise<Post | null> {
  return queryFirst<Post>("SELECT * FROM posts WHERE id = ?", [postId]);
}

/**
 * Update a post (allowed within 24 hours)
 */
export async function updatePost(
  postId: string,
  userId: string,
  updates: { bodyText?: string }
): Promise<Post | { error: string }> {
  const post = await getPostById(postId);

  if (!post) {
    return { error: "Post not found" };
  }

  if (post.authorUserId !== userId) {
    return { error: "Not authorized to edit this post" };
  }

  // Check if within 24 hours
  const createdAt = new Date(post.createdAt).getTime();
  const now = Date.now();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) {
    return { error: "Posts can only be edited within 24 hours of creation" };
  }

  const editedAt = new Date().toISOString();

  await execute(`UPDATE posts SET bodyText = ?, editedAt = ? WHERE id = ?`, [
    updates.bodyText ?? post.bodyText ?? null,
    editedAt,
    postId,
  ]);

  logger.info("Post updated", { postId });

  return { ...post, bodyText: updates.bodyText ?? post.bodyText, editedAt };
}

/**
 * Delete a post (allowed within 24 hours)
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<{ success: boolean } | { error: string }> {
  const post = await getPostById(postId);

  if (!post) {
    return { error: "Post not found" };
  }

  if (post.authorUserId !== userId) {
    return { error: "Not authorized to delete this post" };
  }

  // Check if within 24 hours
  const createdAt = new Date(post.createdAt).getTime();
  const now = Date.now();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) {
    return { error: "Posts can only be deleted within 24 hours of creation" };
  }

  // Delete reactions first (foreign key)
  await execute("DELETE FROM reactions WHERE postId = ?", [postId]);
  await execute("DELETE FROM posts WHERE id = ?", [postId]);

  logger.info("Post deleted", { postId });

  return { success: true };
}

/**
 * Get feed posts based on scope
 * - "mine": User's own posts
 * - "friends": Posts from friends (FRIENDS or PUBLIC privacy)
 * - "discover": All PUBLIC posts
 */
export async function getFeedPosts(
  userId: string,
  scope: FeedScope,
  limit = 20,
  cursor?: string
): Promise<FeedPost[]> {
  let sql = "";
  const params: (string | number)[] = [];

  const cursorClause = cursor ? "AND p.createdAt < ?" : "";
  if (cursor) params.push(cursor);

  switch (scope) {
    case "mine":
      sql = `
        SELECT p.*, u.displayName as authorName, u.photoUrl as authorAvatarUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.authorUserId = u.id
        LEFT JOIN habits h ON p.linkedHabitId = h.id
        LEFT JOIN habit_check_ins c ON p.linkedCheckInId = c.id
        WHERE p.authorUserId = ? ${cursorClause}
        ORDER BY p.createdAt DESC
        LIMIT ?
      `;
      params.unshift(userId);
      params.push(limit);
      break;

    case "friends":
      sql = `
        SELECT p.*, u.displayName as authorName, u.photoUrl as authorAvatarUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.authorUserId = u.id
        LEFT JOIN habits h ON p.linkedHabitId = h.id
        LEFT JOIN habit_check_ins c ON p.linkedCheckInId = c.id
        WHERE (
          p.authorUserId = ?
          OR (
            p.privacy IN ('FRIENDS', 'PUBLIC')
            AND p.authorUserId IN (
              SELECT friendId FROM friendships 
              WHERE userId = ? AND status = 'ACCEPTED'
            )
          )
        ) ${cursorClause}
        ORDER BY p.createdAt DESC
        LIMIT ?
      `;
      params.unshift(userId, userId);
      params.push(limit);
      break;

    case "discover":
      sql = `
        SELECT p.*, u.displayName as authorName, u.photoUrl as authorAvatarUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.authorUserId = u.id
        LEFT JOIN habits h ON p.linkedHabitId = h.id
        LEFT JOIN habit_check_ins c ON p.linkedCheckInId = c.id
        WHERE p.privacy = 'PUBLIC' ${cursorClause}
        ORDER BY p.createdAt DESC
        LIMIT ?
      `;
      params.push(limit);
      break;
  }

  const posts = await query<FeedPost & { authorName: string; authorAvatarUrl: string | null }>(
    sql,
    params
  );

  // Fetch reactions for each post
  const postsWithReactions: FeedPost[] = await Promise.all(
    posts.map(async (post) => {
      const reactions = await getPostReactionSummary(post.id, userId);
      return {
        ...post,
        reactions,
      };
    })
  );

  return postsWithReactions;
}

/**
 * Get reaction summary for a post
 */
async function getPostReactionSummary(
  postId: string,
  viewerId: string
): Promise<{ emoji: ReactionEmoji; count: number; userReacted: boolean }[]> {
  const reactions = await query<{ emoji: ReactionEmoji; count: number; userReacted: number }>(
    `SELECT emoji, 
            COUNT(*) as count,
            MAX(CASE WHEN userId = ? THEN 1 ELSE 0 END) as userReacted
     FROM reactions 
     WHERE postId = ?
     GROUP BY emoji`,
    [viewerId, postId]
  );

  return reactions.map((r) => ({
    emoji: r.emoji,
    count: r.count,
    userReacted: r.userReacted === 1,
  }));
}

/**
 * Get posts by user
 */
export async function getPostsByUser(
  userId: string,
  viewerId: string,
  limit = 20
): Promise<Post[]> {
  // If viewing own posts, show all
  if (userId === viewerId) {
    return query<Post>(
      "SELECT * FROM posts WHERE authorUserId = ? ORDER BY createdAt DESC LIMIT ?",
      [userId, limit]
    );
  }

  // Otherwise, check friendship and privacy
  const friendship = await queryFirst<{ status: string }>(
    "SELECT status FROM friendships WHERE userId = ? AND friendId = ? AND status = 'ACCEPTED'",
    [viewerId, userId]
  );

  const isFriend = !!friendship;
  const privacyFilter = isFriend ? "privacy IN ('FRIENDS', 'PUBLIC')" : "privacy = 'PUBLIC'";

  return query<Post>(
    `SELECT * FROM posts WHERE authorUserId = ? AND ${privacyFilter} ORDER BY createdAt DESC LIMIT ?`,
    [userId, limit]
  );
}

/**
 * Count user's posts today (for rate limiting)
 */
export async function countPostsToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM posts 
     WHERE authorUserId = ? AND date(createdAt) = ?`,
    [userId, today]
  );
  return result?.count ?? 0;
}
