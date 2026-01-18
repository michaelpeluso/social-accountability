/**
 * Post Creation Tests
 * Tests post creation functionality with mocked database
 */

import { createPost } from "../../src/storage/posts";
import { execute, getDatabase, closeDatabase } from "../../src/storage/database";

const TEST_USER_ID = "create_post_test_user";

describe("Post Creation Tests", () => {
  beforeAll(async () => {
    // Initialize database
    await getDatabase();

    // Create test user
    const now = new Date().toISOString();
    await execute(
      `INSERT OR REPLACE INTO users (id, displayName, defaultPrivacy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [TEST_USER_ID, "Test User", "FRIENDS", now, now]
    );
  });

  afterAll(async () => {
    // Clean up
    await execute("DELETE FROM posts WHERE userId = ?", [TEST_USER_ID]);
    await execute("DELETE FROM users WHERE id = ?", [TEST_USER_ID]);
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear posts before each test
    await execute("DELETE FROM posts WHERE userId = ?", [TEST_USER_ID]);
  });

  describe("createPost", () => {
    it("should create a simple text post", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "This is my first post!",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.id).toBeDefined();
        expect(result.text).toBe("This is my first post!");
        expect(result.pillar).toBe("MIND");
        expect(result.privacy).toBe("PUBLIC");
        expect(result.userId).toBe(TEST_USER_ID);
        expect(result.createdAt).toBeDefined();
      }
    });

    it("should create a post with all optional fields", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Complete post with all fields",
        pillar: "BODY",
        privacy: "FRIENDS",
        mediaUrl: "https://example.com/image.jpg",
        mediaType: "photo",
        postTypeTags: ["win"],
        customTags: ["personal-best"],
      });

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.text).toBe("Complete post with all fields");
        expect(result.mediaUrl).toBe("https://example.com/image.jpg");
        expect(result.mediaType).toBe("photo");
        expect(result.postTypeTags).toEqual(["win"]);
        expect(result.customTags).toEqual(["personal-best"]);
      }
    });

    it("should create a post with minimum required fields", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Minimal post",
        pillar: "SOUL",
        privacy: "SELF",
      });

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.text).toBe("Minimal post");
        expect(result.pillar).toBe("SOUL");
        expect(result.privacy).toBe("SELF");
        expect(result.mediaUrl).toBeUndefined();
      }
    });

    it("should allow text up to 500 chars", async () => {
      const longText = "a".repeat(500);

      const result = await createPost(TEST_USER_ID, {
        text: longText,
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      expect(result).not.toHaveProperty("error");
      if (!("error" in result)) {
        expect(result.text?.length).toBe(500);
      }
    });

    it("should create post without text if media is provided", async () => {
      const result = await createPost(TEST_USER_ID, {
        pillar: "BODY",
        privacy: "PUBLIC",
        mediaUrl: "https://example.com/photo.jpg",
        mediaType: "photo",
      });

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.text).toBeUndefined();
        expect(result.mediaUrl).toBe("https://example.com/photo.jpg");
      }
    });

    it("should create post and return valid post object", async () => {
      const createResult = await createPost(TEST_USER_ID, {
        text: "Post to check structure",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      expect(createResult).not.toHaveProperty("error");

      if (!("error" in createResult)) {
        // Verify post structure
        expect(createResult.id).toBeDefined();
        expect(createResult.id).toMatch(/^post_/);
        expect(createResult.text).toBe("Post to check structure");
        expect(createResult.userId).toBe(TEST_USER_ID);
        expect(createResult.pillar).toBe("MIND");
        expect(createResult.privacy).toBe("PUBLIC");
        expect(createResult.createdAt).toBeDefined();
      }
    });

    it("should handle different pillars", async () => {
      const pillars = ["BODY", "MIND", "SOUL", "HEART"] as const;

      for (const pillar of pillars) {
        const result = await createPost(TEST_USER_ID, {
          text: `Post about ${pillar}`,
          pillar,
          privacy: "PUBLIC",
        });

        expect(result).not.toHaveProperty("error");

        if (!("error" in result)) {
          expect(result.pillar).toBe(pillar);
        }
      }
    });

    it("should handle different privacy levels", async () => {
      const privacyLevels = ["SELF", "FRIENDS", "PUBLIC"] as const;

      for (const privacy of privacyLevels) {
        const result = await createPost(TEST_USER_ID, {
          text: `${privacy} post`,
          pillar: "MIND",
          privacy,
        });

        expect(result).not.toHaveProperty("error");

        if (!("error" in result)) {
          expect(result.privacy).toBe(privacy);
        }
      }
    });

    it("should create multiple posts successfully", async () => {
      const posts = [];

      for (let i = 0; i < 3; i++) {
        const result = await createPost(TEST_USER_ID, {
          text: `Post number ${i + 1}`,
          pillar: "MIND",
          privacy: "PUBLIC",
        });

        expect(result).not.toHaveProperty("error");

        if (!("error" in result)) {
          posts.push(result);
        }
      }

      expect(posts).toHaveLength(3);

      // Verify all posts have unique IDs
      const ids = posts.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it("should set timestamps correctly", async () => {
      const beforeCreate = new Date().toISOString();

      const result = await createPost(TEST_USER_ID, {
        text: "Timestamp test",
        pillar: "MIND",
        privacy: "PUBLIC",
      });

      const afterCreate = new Date().toISOString();

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.createdAt).toBeDefined();

        // Timestamps should be between before and after
        expect(result.createdAt >= beforeCreate).toBe(true);
        expect(result.createdAt <= afterCreate).toBe(true);
      }
    });

    it("should handle post with custom tags", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Post with custom tags",
        pillar: "BODY",
        privacy: "PUBLIC",
        customTags: ["workout", "fitness", "health"],
      });

      expect(result).not.toHaveProperty("error");

      if (!("error" in result)) {
        expect(result.customTags).toBeDefined();
        expect(result.customTags).toHaveLength(3);
        expect(result.customTags).toContain("workout");
        expect(result.customTags).toContain("fitness");
      }
    });
  });

  describe("Media Type Validation", () => {
    it("should reject chart post with mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Chart post with invalid media",
        pillar: "MIND",
        privacy: "PUBLIC",
        mediaType: "chart",
        mediaUrl: "https://example.com/image.jpg", // Invalid: charts can't have uploaded media
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("Chart posts cannot");
      }
    });

    it("should reject photo post without mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Photo post missing URL",
        pillar: "BODY",
        privacy: "PUBLIC",
        mediaType: "photo",
        // Missing mediaUrl - invalid
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("require a media URL");
      }
    });

    it("should reject video post without mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Video post missing URL",
        pillar: "SOUL",
        privacy: "FRIENDS",
        mediaType: "video",
        // Missing mediaUrl - invalid
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("require a media URL");
      }
    });

    it("should allow chart post without mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        text: "Chart visualization of my progress",
        pillar: "MIND",
        privacy: "PUBLIC",
        mediaType: "chart",
        // No mediaUrl - valid for charts
      });

      expect(result).not.toHaveProperty("error");
      if (!("error" in result)) {
        expect(result.mediaType).toBe("chart");
        expect(result.mediaUrl).toBeUndefined();
      }
    });

    it("should allow photo post with mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        pillar: "BODY",
        privacy: "PUBLIC",
        mediaType: "photo",
        mediaUrl: "https://example.com/workout.jpg",
      });

      expect(result).not.toHaveProperty("error");
      if (!("error" in result)) {
        expect(result.mediaType).toBe("photo");
        expect(result.mediaUrl).toBe("https://example.com/workout.jpg");
      }
    });

    it("should allow video post with mediaUrl", async () => {
      const result = await createPost(TEST_USER_ID, {
        pillar: "HEART",
        privacy: "FRIENDS",
        mediaType: "video",
        mediaUrl: "https://example.com/celebration.mp4",
      });

      expect(result).not.toHaveProperty("error");
      if (!("error" in result)) {
        expect(result.mediaType).toBe("video");
        expect(result.mediaUrl).toBe("https://example.com/celebration.mp4");
      }
    });

    it("should reject post with no content (no text, no media, not chart)", async () => {
      const result = await createPost(TEST_USER_ID, {
        pillar: "MIND",
        privacy: "PUBLIC",
        // No text, no media, no chart type
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("must have text");
      }
    });
  });
});
