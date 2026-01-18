/**
 * Posts Storage Module
 * Handles CRUD operations for social posts (M3)
 * Pattern: [SQLite Write] → [UI Update] → [Sync Queue]
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import type {
  Post,
  CreatePostRequest,
  FeedPost,
  FeedScope,
  ReactionEmoji,
  PostTypeTag,
} from "../types";
import { checkRateLimit, incrementRateLimit } from "./rateLimits";
import { RATE_LIMITS } from "../types";

/**
 * Parse JSON array fields from database row
 */
function parsePostJsonFields<T extends Partial<Post>>(post: T): T {
  return {
    ...post,
    postTypeTags: post.postTypeTags
      ? ((typeof post.postTypeTags === "string"
          ? JSON.parse(post.postTypeTags)
          : post.postTypeTags) as PostTypeTag[])
      : undefined,
    customTags: post.customTags
      ? ((typeof post.customTags === "string"
          ? JSON.parse(post.customTags)
          : post.customTags) as string[])
      : undefined,
  };
}

/**
 * Create a new post
 * Enforces rate limit of 20 posts/day
 *
 * Media rules:
 *   - photo/video: requires mediaUrl (user-uploaded media)
 *   - chart: auto-generated visualization, mediaUrl ignored
 */
export async function createPost(
  userId: string,
  request: CreatePostRequest
): Promise<Post | { error: string }> {
  // Validate media type rules
  if (request.mediaType === "chart" && request.mediaUrl) {
    logger.warn("Chart posts cannot have user-uploaded media", { userId });
    return { error: "Chart posts cannot include uploaded images/videos" };
  }

  if ((request.mediaType === "photo" || request.mediaType === "video") && !request.mediaUrl) {
    logger.warn("Photo/video posts require mediaUrl", { userId });
    return { error: "Photo or video posts require a media URL" };
  }

  // Must have either text or media
  if (!request.text && !request.mediaUrl && request.mediaType !== "chart") {
    return { error: "Post must have text, media, or be a chart type" };
  }

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
    userId,
    circleId: request.circleId,
    pillar: request.pillar,
    privacy: request.privacy,
    text: request.text,
    mediaUrl: request.mediaUrl,
    // M3: Advanced options
    mediaType: request.mediaType,
    postTypeTags: request.postTypeTags,
    customTags: request.customTags,
    checkInId: request.checkInId,
    habitId: request.habitId,
    goalId: request.goalId,
    linkedObjectId: request.linkedObjectId,
    linkedObjectType: request.linkedObjectType,
    contextTimeOfDay: request.contextTimeOfDay,
    contextLocationId: request.contextLocationId,
    createdAt: now,
  };

  try {
    await execute(
      `INSERT INTO posts (id, userId, circleId, pillar, privacy, text, mediaUrl,
       mediaType, postTypeTags, customTags, checkInId, habitId, goalId,
       linkedObjectId, linkedObjectType, contextTimeOfDay, contextLocationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.id,
        post.userId,
        post.circleId ?? null,
        post.pillar,
        post.privacy,
        post.text ?? null,
        post.mediaUrl ?? null,
        post.mediaType ?? null,
        post.postTypeTags ? JSON.stringify(post.postTypeTags) : null,
        post.customTags ? JSON.stringify(post.customTags) : null,
        post.checkInId ?? null,
        post.habitId ?? null,
        post.goalId ?? null,
        post.linkedObjectId ?? null,
        post.linkedObjectType ?? null,
        post.contextTimeOfDay ?? null,
        post.contextLocationId ?? null,
        post.createdAt,
        post.createdAt, // updatedAt = createdAt on create
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
  const post = await queryFirst<Post>("SELECT * FROM posts WHERE id = ?", [postId]);
  return post ? parsePostJsonFields(post) : null;
}

/**
 * Update a post (allowed within 24 hours)
 */
export async function updatePost(
  postId: string,
  userId: string,
  updates: { text?: string }
): Promise<Post | { error: string }> {
  const post = await getPostById(postId);

  if (!post) {
    return { error: "Post not found" };
  }

  if (post.userId !== userId) {
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

  await execute(`UPDATE posts SET text = ?, editedAt = ?, updatedAt = ? WHERE id = ?`, [
    updates.text ?? post.text ?? null,
    editedAt,
    editedAt,
    postId,
  ]);

  logger.info("Post updated", { postId });

  return { ...post, text: updates.text ?? post.text, editedAt };
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

  if (post.userId !== userId) {
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
        SELECT p.*, u.displayName as userName, u.photoUrl as userPhotoUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN habits h ON p.habitId = h.id
        LEFT JOIN habit_check_ins c ON p.checkInId = c.id
        WHERE p.userId = ? ${cursorClause}
        ORDER BY p.createdAt DESC
        LIMIT ?
      `;
      params.unshift(userId);
      params.push(limit);
      break;

    case "friends":
      sql = `
        SELECT p.*, u.displayName as userName, u.photoUrl as userPhotoUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN habits h ON p.habitId = h.id
        LEFT JOIN habit_check_ins c ON p.checkInId = c.id
        WHERE (
          p.userId = ?
          OR (
            p.privacy IN ('FRIENDS', 'PUBLIC')
            AND p.userId IN (
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
        SELECT p.*, u.displayName as userName, u.photoUrl as userPhotoUrl,
               h.title as linkedHabitTitle, c.occurredAt as linkedCheckInDate
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN habits h ON p.habitId = h.id
        LEFT JOIN habit_check_ins c ON p.checkInId = c.id
        WHERE p.privacy = 'PUBLIC' ${cursorClause}
        ORDER BY p.createdAt DESC
        LIMIT ?
      `;
      params.push(limit);
      break;
  }

  const posts = await query<FeedPost & { userName: string; userPhotoUrl: string | null }>(
    sql,
    params
  );

  // Fetch reactions for each post and parse JSON fields
  const postsWithReactions: FeedPost[] = await Promise.all(
    posts.map(async (post) => {
      const reactions = await getPostReactionSummary(post.id, userId);
      const parsedPost = parsePostJsonFields(post);
      return {
        ...parsedPost,
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
  let posts: Post[];

  // If viewing own posts, show all
  if (userId === viewerId) {
    posts = await query<Post>(
      "SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC LIMIT ?",
      [userId, limit]
    );
  } else {
    // Otherwise, check friendship and privacy
    const friendship = await queryFirst<{ status: string }>(
      "SELECT status FROM friendships WHERE userId = ? AND friendId = ? AND status = 'ACCEPTED'",
      [viewerId, userId]
    );

    const isFriend = !!friendship;
    const privacyFilter = isFriend ? "privacy IN ('FRIENDS', 'PUBLIC')" : "privacy = 'PUBLIC'";

    posts = await query<Post>(
      `SELECT * FROM posts WHERE userId = ? AND ${privacyFilter} ORDER BY createdAt DESC LIMIT ?`,
      [userId, limit]
    );
  }

  return posts.map(parsePostJsonFields);
}

/**
 * Count user's posts today (for rate limiting)
 */
export async function countPostsToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM posts 
     WHERE userId = ? AND date(createdAt) = ?`,
    [userId, today]
  );
  return result?.count ?? 0;
}
