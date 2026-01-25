/**
 * Reactions Integration Tests
 * Tests reactions module against actual SQLite database to ensure schema compatibility
 *
 * NOTE: These tests require a real SQLite database, not the mocked version.
 * They are skipped in the standard test run and should be run separately
 * with a real database for integration verification.
 */

import {
  toggleReaction,
  getTargetReactions,
  getReactionCounts,
  getUserReaction,
  deleteTargetReactions,
} from "../../src/storage/reactions";
import { execute, query, queryFirst, getDatabase, closeDatabase } from "../../src/storage/database";
import type { ReactionEmoji } from "../../src/types";

// Database row type for reactions (different from API type)
interface DbReaction {
  id: string;
  postId: string | null;
  storyId: string | null;
  userId: string;
  emoji: string;
  createdAt: string;
}

const TEST_USER_1 = "test_user_1";
const TEST_USER_2 = "test_user_2";
const TEST_POST_ID = "test_post_123";
const TEST_STORY_ID = "test_story_456";

// Skip all tests - these require a real database, not the mocked version
describe.skip("Reactions Integration Tests", () => {
  beforeAll(async () => {
    // Initialize database
    await getDatabase();

    // Create test users
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_1, "Test User 1", "FRIENDS", new Date().toISOString(), new Date().toISOString()]
    );
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_2, "Test User 2", "FRIENDS", new Date().toISOString(), new Date().toISOString()]
    );

    // Create test post
    await execute(
      `INSERT OR REPLACE INTO posts (id, userId, text, pillar, privacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        TEST_POST_ID,
        TEST_USER_1,
        "Test post",
        "BODY",
        "PUBLIC",
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    // Create test story
    await execute(
      `INSERT OR REPLACE INTO stories (id, userId, pillar, privacy, mediaUrl, mediaType, expiresAt, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        TEST_STORY_ID,
        TEST_USER_1,
        "BODY",
        "PUBLIC",
        "https://example.com/story.jpg",
        "IMAGE",
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await execute("DELETE FROM reactions WHERE userId IN (?, ?)", [TEST_USER_1, TEST_USER_2]);
    await execute("DELETE FROM stories WHERE id = ?", [TEST_STORY_ID]);
    await execute("DELETE FROM posts WHERE id = ?", [TEST_POST_ID]);
    await execute("DELETE FROM users WHERE id IN (?, ?)", [TEST_USER_1, TEST_USER_2]);
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear reactions before each test
    await execute("DELETE FROM reactions WHERE userId IN (?, ?)", [TEST_USER_1, TEST_USER_2]);
  });

  describe("Schema Validation", () => {
    it("should have postId and storyId columns in reactions table", async () => {
      const tableInfo = await query<{ name: string; type: string }>("PRAGMA table_info(reactions)");
      const columnNames = tableInfo.map((col) => col.name);

      expect(columnNames).toContain("postId");
      expect(columnNames).toContain("storyId");
      expect(columnNames).not.toContain("targetId");
      expect(columnNames).not.toContain("targetType");
    });

    it("should enforce CHECK constraint that one of postId or storyId must be set", async () => {
      // This should fail - neither postId nor storyId
      await expect(
        execute("INSERT INTO reactions (id, userId, emoji, createdAt) VALUES (?, ?, ?, ?)", [
          "test_reaction",
          TEST_USER_1,
          "👍",
          new Date().toISOString(),
        ])
      ).rejects.toThrow();

      // This should fail - both postId and storyId
      await expect(
        execute(
          "INSERT INTO reactions (id, postId, storyId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "test_reaction",
            TEST_POST_ID,
            TEST_STORY_ID,
            TEST_USER_1,
            "👍",
            new Date().toISOString(),
          ]
        )
      ).rejects.toThrow();
    });

    it("should successfully insert reaction with postId only", async () => {
      await execute(
        "INSERT INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)",
        ["test_reaction_post", TEST_POST_ID, TEST_USER_1, "👍", new Date().toISOString()]
      );

      const reaction = await queryFirst<DbReaction>("SELECT * FROM reactions WHERE id = ?", [
        "test_reaction_post",
      ]);

      expect(reaction).not.toBeNull();
      expect(reaction?.postId).toBe(TEST_POST_ID);
      expect(reaction?.storyId).toBeNull();
    });

    it("should successfully insert reaction with storyId only", async () => {
      await execute(
        "INSERT INTO reactions (id, storyId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)",
        ["test_reaction_story", TEST_STORY_ID, TEST_USER_1, "❤️", new Date().toISOString()]
      );

      const reaction = await queryFirst<DbReaction>("SELECT * FROM reactions WHERE id = ?", [
        "test_reaction_story",
      ]);

      expect(reaction).not.toBeNull();
      expect(reaction?.storyId).toBe(TEST_STORY_ID);
      expect(reaction?.postId).toBeNull();
    });
  });

  describe("toggleReaction for Posts", () => {
    it("should add a post reaction using postId column", async () => {
      const result = await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });

      expect(result).toHaveProperty("action", "added");
      expect(result).toHaveProperty("reaction");

      // Verify in database
      const dbReaction = await queryFirst<DbReaction>(
        "SELECT * FROM reactions WHERE postId = ? AND userId = ?",
        [TEST_POST_ID, TEST_USER_1]
      );

      expect(dbReaction).not.toBeNull();
      expect(dbReaction?.postId).toBe(TEST_POST_ID);
      expect(dbReaction?.storyId).toBeNull();
      expect(dbReaction?.emoji).toBe("👏");
    });

    it("should remove post reaction when toggling same emoji", async () => {
      // Add reaction first
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      // Toggle again with same emoji
      const result = await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      expect(result).toHaveProperty("action", "removed");

      // Verify removed from database
      const dbReaction = await queryFirst<DbReaction>(
        "SELECT * FROM reactions WHERE postId = ? AND userId = ?",
        [TEST_POST_ID, TEST_USER_1]
      );

      expect(dbReaction).toBeNull();
    });

    it("should update emoji when toggling different emoji", async () => {
      // Add initial reaction
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👍" as ReactionEmoji,
      });

      // Toggle with different emoji
      const result = await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "❤️" as ReactionEmoji,
      });

      expect(result).toHaveProperty("action", "added");
      if ("reaction" in result) {
        expect(result.reaction?.emoji).toBe("❤️");
      }

      // Verify updated in database
      const dbReaction = await queryFirst<DbReaction>(
        "SELECT * FROM reactions WHERE postId = ? AND userId = ?",
        [TEST_POST_ID, TEST_USER_1]
      );

      expect(dbReaction?.emoji).toBe("❤️");
    });
  });

  describe("toggleReaction for Stories", () => {
    it("should add a story reaction using storyId column", async () => {
      const result = await toggleReaction(TEST_USER_1, {
        targetId: TEST_STORY_ID,
        targetType: "STORY",
        emoji: "🔥" as ReactionEmoji,
      });

      expect(result).toHaveProperty("action", "added");

      // Verify in database
      const dbReaction = await queryFirst<DbReaction>(
        "SELECT * FROM reactions WHERE storyId = ? AND userId = ?",
        [TEST_STORY_ID, TEST_USER_1]
      );

      expect(dbReaction).not.toBeNull();
      expect(dbReaction?.storyId).toBe(TEST_STORY_ID);
      expect(dbReaction?.postId).toBeNull();
      expect(dbReaction?.emoji).toBe("🔥");
    });
  });

  describe("getTargetReactions", () => {
    it("should retrieve all post reactions", async () => {
      // Add multiple reactions
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "🔥" as ReactionEmoji,
      });

      const reactions = await getTargetReactions(TEST_POST_ID, "POST");

      expect(reactions).toHaveLength(2);
      expect(reactions.map((r) => r.emoji)).toContain("👏");
      expect(reactions.map((r) => r.emoji)).toContain("🔥");
    });

    it("should retrieve all story reactions", async () => {
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_STORY_ID,
        targetType: "STORY",
        emoji: "❤️" as ReactionEmoji,
      });

      const reactions = await getTargetReactions(TEST_STORY_ID, "STORY");

      expect(reactions).toHaveLength(1);
      expect(reactions[0].emoji).toBe("❤️");
    });
  });

  describe("getReactionCounts", () => {
    it("should return counts grouped by emoji for posts", async () => {
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👏" as ReactionEmoji,
      });

      const counts = await getReactionCounts(TEST_POST_ID, "POST");

      expect(counts).toHaveLength(1);
      expect(counts[0].emoji).toBe("👏");
      expect(counts[0].count).toBe(2);
    });
  });

  describe("getUserReaction", () => {
    it("should get user's specific reaction to a post", async () => {
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "📈" as ReactionEmoji,
      });

      const reaction = await getUserReaction(TEST_POST_ID, TEST_USER_1, "POST");

      expect(reaction).not.toBeNull();
      expect(reaction?.emoji).toBe("📈");
      expect(reaction?.targetId).toBe(TEST_POST_ID);
      expect(reaction?.targetType).toBe("POST");
    });

    it("should return null if user hasn't reacted", async () => {
      const reaction = await getUserReaction(TEST_POST_ID, TEST_USER_2, "POST");
      expect(reaction).toBeNull();
    });
  });

  describe("deleteTargetReactions", () => {
    it("should delete all post reactions", async () => {
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "👍" as ReactionEmoji,
      });
      await toggleReaction(TEST_USER_2, {
        targetId: TEST_POST_ID,
        targetType: "POST",
        emoji: "❤️" as ReactionEmoji,
      });

      await deleteTargetReactions(TEST_POST_ID, "POST");

      const reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [
        TEST_POST_ID,
      ]);
      expect(reactions).toHaveLength(0);
    });

    it("should delete all story reactions", async () => {
      await toggleReaction(TEST_USER_1, {
        targetId: TEST_STORY_ID,
        targetType: "STORY",
        emoji: "🔥" as ReactionEmoji,
      });

      await deleteTargetReactions(TEST_STORY_ID, "STORY");

      const reactions = await query<DbReaction>("SELECT * FROM reactions WHERE storyId = ?", [
        TEST_STORY_ID,
      ]);
      expect(reactions).toHaveLength(0);
    });
  });

  describe("CASCADE DELETE behavior", () => {
    it("should cascade delete reactions when post is deleted", async () => {
      // Create a temporary post
      const tempPostId = "temp_post_cascade";
      await execute(
        `INSERT INTO posts (id, userId, text, pillar, privacy, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tempPostId,
          TEST_USER_1,
          "Temp post",
          "BODY",
          "PUBLIC",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      // Add reaction
      await toggleReaction(TEST_USER_1, {
        targetId: tempPostId,
        targetType: "POST",
        emoji: "👍" as ReactionEmoji,
      });

      // Verify reaction exists
      let reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [
        tempPostId,
      ]);
      expect(reactions).toHaveLength(1);

      // Delete post
      await execute("DELETE FROM posts WHERE id = ?", [tempPostId]);

      // Verify reactions were cascade deleted
      reactions = await query<DbReaction>("SELECT * FROM reactions WHERE postId = ?", [tempPostId]);
      expect(reactions).toHaveLength(0);
    });

    it("should cascade delete reactions when story is deleted", async () => {
      // Create a temporary story
      const tempStoryId = "temp_story_cascade";
      await execute(
        `INSERT INTO stories (id, userId, pillar, privacy, mediaUrl, mediaType, expiresAt, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tempStoryId,
          TEST_USER_1,
          "BODY",
          "PUBLIC",
          "https://example.com/temp.jpg",
          "IMAGE",
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ]
      );

      // Add reaction
      await toggleReaction(TEST_USER_1, {
        targetId: tempStoryId,
        targetType: "STORY",
        emoji: "❤️" as ReactionEmoji,
      });

      // Verify reaction exists
      let reactions = await query<DbReaction>("SELECT * FROM reactions WHERE storyId = ?", [
        tempStoryId,
      ]);
      expect(reactions).toHaveLength(1);

      // Delete story
      await execute("DELETE FROM stories WHERE id = ?", [tempStoryId]);

      // Verify reactions were cascade deleted
      reactions = await query<DbReaction>("SELECT * FROM reactions WHERE storyId = ?", [
        tempStoryId,
      ]);
      expect(reactions).toHaveLength(0);
    });
  });
});
