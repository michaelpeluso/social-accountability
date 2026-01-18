/**
 * Comments Storage Module
 * Handles CRUD operations for post comments (M3)
 * 50 character max per comment, only on Posts (not Stories)
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type { Comment, CreateCommentRequest } from "../types";
import { checkRateLimit, incrementRateLimit } from "./rateLimits";
import { notifyCommentReceived } from "./notifications";
import { showNotificationAlert } from "../services/notificationAlert";

// Rate limits
const COMMENTS_PER_DAY = 50;

/**
 * Add a comment to a post
 */
export async function createComment(
  userId: string,
  request: CreateCommentRequest
): Promise<Comment | { error: string }> {
  const { postId, text } = request;

  // Validate comment length
  if (!text || text.trim().length === 0) {
    return { error: "Comment cannot be empty" };
  }

  if (text.length > 50) {
    return { error: "Comment must be 50 characters or less" };
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(userId, "comment", null, COMMENTS_PER_DAY);
  if (!withinLimit) {
    logger.warn("Comment rate limit exceeded", { userId });
    return { error: "Daily comment limit reached (50/day)" };
  }

  // Verify post exists
  const post = await queryFirst<{ id: string; userId: string }>(
    "SELECT id, userId FROM posts WHERE id = ?",
    [postId]
  );

  if (!post) {
    return { error: "Post not found" };
  }

  const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const comment: Comment = {
    id,
    postId,
    userId,
    text: text.trim(),
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await execute(
      `INSERT INTO comments (id, postId, userId, text, isArchived, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        comment.id,
        comment.postId,
        comment.userId,
        comment.text,
        comment.isArchived ? 1 : 0,
        comment.createdAt,
        comment.updatedAt,
      ]
    );

    await incrementRateLimit(userId, "comment", null);

    // Notify post owner (unless they're commenting on their own post)
    if (post.userId !== userId) {
      // Get commenter's name
      const commenter = await queryFirst<{ displayName: string }>(
        "SELECT displayName FROM users WHERE id = ?",
        [userId]
      );
      const commenterName = commenter?.displayName || "Someone";

      // Create notification record
      const notification = await notifyCommentReceived(
        post.userId,
        commenterName,
        comment.text,
        postId
      );

      // Show alert to simulate system notification
      showNotificationAlert(notification);
    }

    logger.info("Comment created", { commentId: id, postId, userId });
    return comment;
  } catch (error) {
    logger.error("Failed to create comment", { error, postId, userId });
    throw error;
  }
}

/**
 * Get all comments for a post
 */
export async function getPostComments(postId: string): Promise<Comment[]> {
  return query<Comment>(
    `SELECT c.*, u.displayName as userName, u.photoUrl as userPhotoUrl
     FROM comments c
     LEFT JOIN users u ON c.userId = u.id
     WHERE c.postId = ? AND c.isArchived = 0
     ORDER BY c.createdAt ASC`,
    [postId]
  );
}

/**
 * Update a comment
 */
export async function updateComment(
  userId: string,
  commentId: string,
  text: string
): Promise<Comment | { error: string }> {
  // Validate comment length
  if (!text || text.trim().length === 0) {
    return { error: "Comment cannot be empty" };
  }

  if (text.length > 50) {
    return { error: "Comment must be 50 characters or less" };
  }

  // Check ownership
  const existing = await queryFirst<Comment>(
    "SELECT * FROM comments WHERE id = ? AND isArchived = 0",
    [commentId]
  );

  if (!existing) {
    return { error: "Comment not found" };
  }

  if (existing.userId !== userId) {
    return { error: "You can only edit your own comments" };
  }

  const now = new Date().toISOString();

  await execute("UPDATE comments SET text = ?, updatedAt = ? WHERE id = ?", [
    text.trim(),
    now,
    commentId,
  ]);

  logger.info("Comment updated", { commentId, userId });

  return {
    ...existing,
    text: text.trim(),
    updatedAt: now,
  };
}

/**
 * Delete (archive) a comment
 */
export async function deleteComment(
  userId: string,
  commentId: string
): Promise<{ success: boolean } | { error: string }> {
  // Check ownership
  const existing = await queryFirst<Comment>(
    "SELECT * FROM comments WHERE id = ? AND isArchived = 0",
    [commentId]
  );

  if (!existing) {
    return { error: "Comment not found" };
  }

  if (existing.userId !== userId) {
    return { error: "You can only delete your own comments" };
  }

  await execute("UPDATE comments SET isArchived = 1 WHERE id = ?", [commentId]);

  logger.info("Comment deleted", { commentId, userId });

  return { success: true };
}

/**
 * Get comment count for a post
 */
export async function getCommentCount(postId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM comments WHERE postId = ? AND isArchived = 0",
    [postId]
  );
  return result?.count ?? 0;
}
