/**
 * Reactions Storage Tests
 */

import { toggleReaction, getPostReactions, getUserReaction } from "../../src/storage/reactions";
import { execute, query, queryFirst } from "../../src/storage/database";
import { checkRateLimit, incrementRateLimit } from "../../src/storage/rateLimits";
import type { ReactionEmoji } from "../../src/types";

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

const TEST_USER = "reaction_test_user";
const TEST_POST_ID = "test_post_123";

describe("Reactions Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (incrementRateLimit as jest.Mock).mockResolvedValue(undefined);
  });

  describe("toggleReaction", () => {
    it("should add a reaction to a post", async () => {
      (queryFirst as jest.Mock).mockResolvedValueOnce(null); // No existing reaction
      (execute as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });
      (queryFirst as jest.Mock).mockResolvedValueOnce({
        id: "reaction-1",
        postId: TEST_POST_ID,
        userId: TEST_USER,
        emoji: "👏",
        createdAt: new Date().toISOString(),
      });

      const result = await toggleReaction(TEST_USER, {
        postId: TEST_POST_ID,
        emoji: "👏" as ReactionEmoji,
      });

      expect(result).toHaveProperty("action");
      if ("action" in result) {
        expect(result.action).toBe("added");
        expect(result.reaction?.emoji).toBe("👏");
      }
    });

    it("should remove reaction if same emoji clicked again", async () => {
      // Mock existing reaction with same emoji
      const existingReaction = {
        id: "reaction-1",
        postId: TEST_POST_ID,
        userId: TEST_USER,
        emoji: "🔥",
        createdAt: new Date().toISOString(),
      };

      (queryFirst as jest.Mock).mockResolvedValue(existingReaction);
      (execute as jest.Mock).mockResolvedValue({});

      const result = await toggleReaction(TEST_USER, {
        postId: TEST_POST_ID,
        emoji: "🔥" as ReactionEmoji, // Same emoji
      });

      expect(result).toHaveProperty("action");
      if ("action" in result) {
        expect(result.action).toBe("removed");
      }
    });

    it("should reject invalid emoji", async () => {
      const result = await toggleReaction(TEST_USER, {
        postId: TEST_POST_ID,
        emoji: "🤷" as ReactionEmoji,
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getPostReactions", () => {
    it("should retrieve all reactions for a post", async () => {
      const mockReactions = [
        {
          id: "r1",
          postId: TEST_POST_ID,
          userId: "user1",
          emoji: "👏",
          createdAt: new Date().toISOString(),
        },
        {
          id: "r2",
          postId: TEST_POST_ID,
          userId: "user2",
          emoji: "✨",
          createdAt: new Date().toISOString(),
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockReactions);

      const reactions = await getPostReactions(TEST_POST_ID);
      expect(reactions.length).toBe(2);
    });
  });

  describe("getUserReaction", () => {
    it("should get user's specific reaction to a post", async () => {
      const mockReaction = {
        id: "r1",
        postId: TEST_POST_ID,
        userId: TEST_USER,
        emoji: "💪",
        createdAt: new Date().toISOString(),
      };

      (queryFirst as jest.Mock).mockResolvedValue(mockReaction);

      const reaction = await getUserReaction(TEST_POST_ID, TEST_USER);
      expect(reaction).not.toBeNull();
      expect(reaction?.emoji).toBe("💪");
    });

    it("should return null if user hasn't reacted", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const reaction = await getUserReaction(TEST_POST_ID, "non_reactor");
      expect(reaction).toBeNull();
    });
  });
});
