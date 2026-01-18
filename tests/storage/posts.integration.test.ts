/**
 * Posts Integration Tests
 * Tests posts module with reactions to ensure schema compatibility
 *
 * NOTE: These tests require a real SQLite database, not the mocked version.
 * They are skipped in the standard test run and should be run separately
 * with a real database for integration verification.
 */

import { createPost, deletePost, getFeedPosts, getPostById } from "../../src/storage/posts";
import { toggleReaction } from "../../src/storage/reactions";
import { execute, query, getDatabase, closeDatabase } from "../../src/storage/database";
import type { ReactionEmoji, Post } from "../../src/types";

// Database row type for reactions (different from API type)
interface DbReaction {
  id: string;
  postId: string | null;
  storyId: string | null;
  userId: string;
  emoji: string;
  createdAt: string;
}

const TEST_USER_1 = "posts_test_user_1";
const TEST_USER_2 = "posts_test_user_2";
const TEST_USER_3 = "posts_test_user_3";

// Skip all tests - these require a real database, not the mocked version
describe.skip("Posts Integration Tests", () => {
  beforeAll(async () => {
    // Initialize database
    await getDatabase();

    // Create test users
    const now = new Date().toISOString();
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_1, "Test User 1", "FRIENDS", now, now]
    );
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_2, "Test User 2", "FRIENDS", now, now]
    );
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_3, "Test User 3", "FRIENDS", now, now]
    );

    // Create friendship between user 1 and 2
    await execute(
      `INSERT OR REPLACE INTO friendships (id, userId, friendId, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["friendship_1_2", TEST_USER_1, TEST_USER_2, "ACCEPTED", now, now]
    );
    await execute(
      `INSERT OR REPLACE INTO friendships (id, userId, friendId, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["friendship_2_1", TEST_USER_2, TEST_USER_1, "ACCEPTED", now, now]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await execute("DELETE FROM reactions WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM comments WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM posts WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM friendships WHERE userId IN (?, ?, ?) OR friendId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM users WHERE id IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear posts and reactions before each test
    await execute("DELETE FROM reactions WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM comments WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
    await execute("DELETE FROM posts WHERE userId IN (?, ?, ?)", [
      TEST_USER_1,
      TEST_USER_2,
      TEST_USER_3,
    ]);
  });

  describe("Post Creation and Retrieval", () => {
    it("should create a post successfully", async () => {
      const result = await createPost(TEST_USER_1, {
        text: "Test post with reactions",
        pillar: "BODY",
        privacy: "PUBLIC",
      });

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("post");

      if ("post" in result && result.post && !("error" in result)) {
        const post = await getPostById((result as { post: Post }).post.id);
        expect(post).not.toBeNull();
        expect(post?.text).toBe("Test post with reactions");
      }
    });

    it("should retrieve post with reactions", async () => {
      // Create post
      const createResult = await createPost(TEST_USER_1, {
        text: "Post for reaction testing",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create test post");
      }

      const postId = (createResult as { post: Post }).post.id;

      // Add reactions from multiple users
      await toggleReaction(TEST_USER_1, {
        targetId: postId,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: postId,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      // Retrieve post
      const post = await getPostById(postId);
      expect(post).not.toBeNull();
      expect(post?.id).toBe(postId);

      // Verify reactions are stored with postId
      const reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [
        postId,
      ]);
      expect(reactions).toHaveLength(2);
      expect(reactions.every((r) => r.postId === postId)).toBe(true);
      expect(reactions.every((r) => r.storyId === null)).toBe(true);
    });
  });

  describe("Feed Loading with Reactions", () => {
    it("should load feed posts without targetId errors", async () => {
      // Create posts
      const post1Result = await createPost(TEST_USER_1, {
        text: "My post",
        pillar: "BODY",
        privacy: "PUBLIC",
      });

      const post2Result = await createPost(TEST_USER_2, {
        text: "Friend's post",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      if (!("post" in post1Result) || !post1Result.post) {
        throw new Error("Failed to create post 1");
      }
      if (!("post" in post2Result) || !post2Result.post) {
        throw new Error("Failed to create post 2");
      }

      // Add reactions
      await toggleReaction(TEST_USER_2, {
        targetId: (post1Result as { post: Post }).post.id,
        targetType: "POST",
        emoji: "👍" as ReactionEmoji,
      });

      // Load feed - should not throw targetId error
      const feed = await getFeedPosts(TEST_USER_1, "friends", 20);

      expect(feed).toBeDefined();
      expect(feed.length).toBeGreaterThan(0);

      // Verify reactions are included
      const postWithReaction = feed.find((p) => p.id === (post1Result as { post: Post }).post?.id);
      expect(postWithReaction).toBeDefined();
      expect(postWithReaction?.reactions).toBeDefined();
    });

    it("should correctly aggregate reaction counts in feed", async () => {
      // Create post
      const createResult = await createPost(TEST_USER_1, {
        text: "Popular post",
        pillar: "SOUL",
        privacy: "PUBLIC",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create post");
      }

      const postId = (createResult as { post: Post }).post.id;

      // Add multiple reactions
      await toggleReaction(TEST_USER_1, {
        targetId: postId,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: postId,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_3, {
        targetId: postId,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      // Load feed
      const feed = await getFeedPosts(TEST_USER_1, "friends", 20);
      const post = feed.find((p) => p.id === postId);

      expect(post).toBeDefined();
      expect(post?.reactions).toBeDefined();

      if (post?.reactions) {
        // Check reaction counts
        const clapReaction = post.reactions.find((r) => r.emoji === "👏");
        const fireReaction = post.reactions.find((r) => r.emoji === "🔥");

        expect(clapReaction?.count).toBe(2);
        expect(fireReaction?.count).toBe(1);
        expect(clapReaction?.userReacted).toBe(true); // TEST_USER_1 reacted
      }
    });

    it("should handle posts with no reactions", async () => {
      // Create post without reactions
      const createResult = await createPost(TEST_USER_1, {
        text: "Post without reactions",
        pillar: "BODY",
        privacy: "PUBLIC",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create post");
      }

      // Load feed
      const feed = await getFeedPosts(TEST_USER_1, "mine", 20);
      const post = feed.find((p) => p.id === (createResult as { post: Post }).post?.id);

      expect(post).toBeDefined();
      expect(post?.reactions).toBeDefined();
      expect(post?.reactions).toHaveLength(0);
    });
  });

  describe("Post Deletion with Reactions", () => {
    it("should delete post and cascade delete reactions", async () => {
      // Create post
      const createResult = await createPost(TEST_USER_1, {
        text: "Post to delete",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create post");
      }

      const postId = (createResult as { post: Post }).post.id;

      // Add reactions
      await toggleReaction(TEST_USER_1, {
        targetId: postId,
        targetType: "POST",
        emoji: "❤️" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: postId,
        targetType: "POST",
        emoji: "📈" as ReactionEmoji,
      });

      // Verify reactions exist
      let reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [postId]);
      expect(reactions).toHaveLength(2);

      // Delete post
      const deleteResult = await deletePost(postId, TEST_USER_1);
      expect(deleteResult).toHaveProperty("success", true);

      // Verify reactions were cascade deleted
      reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [postId]);
      expect(reactions).toHaveLength(0);

      // Verify post was deleted
      const post = await getPostById(postId);
      expect(post).toBeNull();
    });
  });

  describe("Privacy and Reactions", () => {
    it("should include reactions from friends on FRIENDS privacy posts", async () => {
      // User 1 creates FRIENDS post
      const createResult = await createPost(TEST_USER_1, {
        text: "Friends only post",
        pillar: "SOUL",
        privacy: "FRIENDS",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create post");
      }

      const postId = (createResult as { post: Post }).post.id;

      // User 2 (friend) adds reaction
      await toggleReaction(TEST_USER_2, {
        targetId: postId,
        targetType: "POST",
        emoji: "👍" as ReactionEmoji,
      });

      // User 3 (not friend) tries to react - would fail privacy check in real app
      // For this test, we just verify the reaction is stored
      await toggleReaction(TEST_USER_3, {
        targetId: postId,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      // Load User 1's feed
      const feed = await getFeedPosts(TEST_USER_1, "mine", 20);
      const post = feed.find((p) => p.id === postId);

      expect(post).toBeDefined();
      expect(post?.reactions).toBeDefined();
      expect(post?.reactions?.length).toBeGreaterThan(0);
    });
  });

  describe("Reaction Query Performance", () => {
    it("should efficiently query reactions using postId index", async () => {
      // Create post
      const createResult = await createPost(TEST_USER_1, {
        text: "Performance test post",
        pillar: "BODY",
        privacy: "PUBLIC",
      });

      if (!("post" in createResult) || !createResult.post) {
        throw new Error("Failed to create post");
      }

      const postId = (createResult as { post: Post }).post.id;

      // Add multiple reactions
      for (let i = 0; i < 10; i++) {
        await execute(
          "INSERT INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)",
          [`reaction_${i}`, postId, `user_${i}`, "👍", new Date().toISOString()]
        );
      }

      // Query should use index efficiently (no full table scan)
      const startTime = Date.now();
      const reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [
        postId,
      ]);
      const queryTime = Date.now() - startTime;

      expect(reactions).toHaveLength(10);
      expect(queryTime).toBeLessThan(100); // Should be very fast with index

      // Clean up test reactions
      await execute("DELETE FROM reactions WHERE postId = ?", [postId]);
    });
  });
});
