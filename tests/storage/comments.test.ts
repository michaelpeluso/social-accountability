/**
 * Comments Storage Tests
 */

import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  getCommentCount,
} from "../../src/storage/comments";
import { execute, query, queryFirst } from "../../src/storage/database";
import { checkRateLimit } from "../../src/storage/rateLimits";

// Mock database
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

// Mock rate limits
jest.mock("../../src/storage/rateLimits", () => ({
  checkRateLimit: jest.fn().mockResolvedValue(true),
  incrementRateLimit: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Comments Storage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
  });

  describe("createComment", () => {
    it("creates a comment successfully", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ id: "post_1", userId: "author_1" });
      (execute as jest.Mock).mockResolvedValue(undefined);

      const result = await createComment("user_1", {
        postId: "post_1",
        text: "Great post!",
      });

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.postId).toBe("post_1");
        expect(result.userId).toBe("user_1");
        expect(result.text).toBe("Great post!");
        expect(result.isArchived).toBe(false);
      }
    });

    it("rejects empty comments", async () => {
      const result = await createComment("user_1", {
        postId: "post_1",
        text: "",
      });

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Comment cannot be empty");
      }
    });

    it("rejects comments over 50 characters", async () => {
      const result = await createComment("user_1", {
        postId: "post_1",
        text: "This is a very long comment that exceeds the fifty character limit",
      });

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Comment must be 50 characters or less");
      }
    });

    it("rejects when post not found", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const result = await createComment("user_1", {
        postId: "nonexistent",
        text: "Hello",
      });

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Post not found");
      }
    });

    it("respects rate limits", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);

      const result = await createComment("user_1", {
        postId: "post_1",
        text: "Hello",
      });

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Daily comment limit reached (50/day)");
      }
    });
  });

  describe("getPostComments", () => {
    it("returns comments for a post", async () => {
      const mockComments = [
        { id: "c1", postId: "post_1", userId: "user_1", text: "Hello", userName: "Alice" },
        { id: "c2", postId: "post_1", userId: "user_2", text: "World", userName: "Bob" },
      ];
      (query as jest.Mock).mockResolvedValue(mockComments);

      const result = await getPostComments("post_1");

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("Hello");
      expect(result[1].text).toBe("World");
    });
  });

  describe("updateComment", () => {
    it("updates own comment", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "c1",
        postId: "post_1",
        userId: "user_1",
        text: "Original",
        isArchived: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });
      (execute as jest.Mock).mockResolvedValue(undefined);

      const result = await updateComment("user_1", "c1", "Updated");

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.text).toBe("Updated");
      }
    });

    it("rejects editing others comments", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "c1",
        userId: "other_user",
        text: "Not yours",
      });

      const result = await updateComment("user_1", "c1", "Hijack");

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("You can only edit your own comments");
      }
    });
  });

  describe("deleteComment", () => {
    it("deletes own comment", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "c1",
        userId: "user_1",
        isArchived: false,
      });
      (execute as jest.Mock).mockResolvedValue(undefined);

      const result = await deleteComment("user_1", "c1");

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.success).toBe(true);
      }
    });

    it("rejects deleting others comments", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "c1",
        userId: "other_user",
      });

      const result = await deleteComment("user_1", "c1");

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("You can only delete your own comments");
      }
    });
  });

  describe("getCommentCount", () => {
    it("returns comment count", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await getCommentCount("post_1");

      expect(result).toBe(5);
    });

    it("returns 0 when no comments", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const result = await getCommentCount("post_1");

      expect(result).toBe(0);
    });
  });
});
