/**
 * Posts Storage Tests
 */

import {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getFeedPosts,
} from "../../src/storage/posts";
import { execute, query, queryFirst } from "../../src/storage/database";
import { checkRateLimit, incrementRateLimit } from "../../src/storage/rateLimits";
import type { Pillar, Privacy } from "../../src/types";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/storage/rateLimits", () => ({
  checkRateLimit: jest.fn(),
  incrementRateLimit: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const TEST_USER_ID = "test_user_posts";
const TEST_USER_ID_2 = "test_user_posts_2";

describe("Posts Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (incrementRateLimit as jest.Mock).mockResolvedValue(undefined);
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const mockId = "post-123";
      (execute as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });
      (queryFirst as jest.Mock).mockResolvedValue({
        id: mockId,
        userId: TEST_USER_ID,
        text: "Test post",
        pillar: "MIND",
        privacy: "FRIENDS",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await createPost(TEST_USER_ID, {
        text: "Test post",
        pillar: "MIND" as Pillar,
        privacy: "FRIENDS" as Privacy,
      });

      expect(result).toHaveProperty("id");
      expect("error" in result).toBe(false);

      if (!("error" in result)) {
        expect(result.text).toBe("Test post");
        expect(result.pillar).toBe("MIND");
        expect(result.privacy).toBe("FRIENDS");
      }
    });

    it("should enforce rate limit", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);

      const result = await createPost("rate_limit_user_0", {
        text: "Should fail",
        pillar: "BODY" as Pillar,
        privacy: "PUBLIC" as Privacy,
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("limit");
      }
    });
  });

  describe("getPostById", () => {
    it("should retrieve a post by ID", async () => {
      const mockPost = {
        id: "post-123",
        userId: TEST_USER_ID,
        text: "Find me",
        pillar: "HEART",
        privacy: "SELF",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (queryFirst as jest.Mock).mockResolvedValue(mockPost);

      const retrieved = await getPostById("post-123");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe("post-123");
      expect(retrieved?.text).toBe("Find me");
    });

    it("should return null for non-existent post", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const retrieved = await getPostById("non_existent_id");
      expect(retrieved).toBeNull();
    });
  });

  describe("updatePost", () => {
    it("should update post within 24 hours", async () => {
      const mockPost = {
        id: "post-123",
        userId: TEST_USER_ID,
        text: "Original text",
        pillar: "SOUL",
        privacy: "PUBLIC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock getPostById call (queryFirst inside updatePost)
      (queryFirst as jest.Mock).mockResolvedValueOnce(mockPost);
      (execute as jest.Mock).mockResolvedValue({});

      const updated = await updatePost("post-123", TEST_USER_ID, {
        text: "Updated text",
      });

      expect("error" in updated).toBe(false);
      if (!("error" in updated)) {
        expect(updated.text).toBe("Updated text");
        expect(updated.editedAt).toBeDefined();
      }
    });

    it("should not allow update by different user", async () => {
      const mockPost = {
        id: "post-123",
        userId: TEST_USER_ID,
        text: "My post",
        pillar: "MIND",
        privacy: "FRIENDS",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (queryFirst as jest.Mock).mockResolvedValue(mockPost);

      const result = await updatePost("post-123", TEST_USER_ID_2, {
        text: "Hacked",
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("Not authorized");
      }
    });
  });

  describe("deletePost", () => {
    it("should delete post within 24 hours", async () => {
      const mockPost = {
        id: "post-123",
        userId: TEST_USER_ID,
        text: "Delete me",
        pillar: "BODY",
        privacy: "SELF",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (queryFirst as jest.Mock).mockResolvedValue(mockPost);
      (execute as jest.Mock).mockResolvedValue({});

      const result = await deletePost("post-123", TEST_USER_ID);
      expect(result).toHaveProperty("success");
    });

    it("should not allow delete by different user", async () => {
      const mockPost = {
        id: "post-123",
        userId: TEST_USER_ID,
        text: "Protected",
        pillar: "HEART",
        privacy: "PUBLIC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (queryFirst as jest.Mock).mockResolvedValue(mockPost);

      const result = await deletePost("post-123", TEST_USER_ID_2);
      expect(result).toHaveProperty("error");
    });
  });

  describe("getFeedPosts", () => {
    it("should get user's own posts with 'mine' scope", async () => {
      const mockPosts = [
        {
          id: "post-1",
          userId: TEST_USER_ID,
          userName: "Test User",
          userPhotoUrl: null,
          text: "My post 1",
          pillar: "MIND",
          privacy: "FRIENDS",
          habitId: null,
          habitTitle: null,
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editedAt: null,
          reactions: [],
          userReaction: null,
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockPosts);

      const posts = await getFeedPosts(TEST_USER_ID, "mine", 10);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0].userId).toBe(TEST_USER_ID);
    });

    it("should include reactions in feed posts", async () => {
      const mockPosts = [
        {
          id: "post-with-reactions",
          userId: TEST_USER_ID,
          userName: "Test User",
          userPhotoUrl: null,
          text: "Post with reactions",
          pillar: "BODY",
          privacy: "PUBLIC",
          habitId: null,
          habitTitle: null,
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editedAt: null,
          reactions: [],
          userReaction: null,
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockPosts);

      const posts = await getFeedPosts(TEST_USER_ID, "discover", 10);

      expect(posts[0]).toBeDefined();
      expect(posts[0].reactions).toBeDefined();
      expect(Array.isArray(posts[0].reactions)).toBe(true);
    });
  });
});
