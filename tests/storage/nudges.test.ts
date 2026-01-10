/**
 * Nudges Storage Tests
 */

import { sendNudge, getNudgesReceived } from "../../src/storage/nudges";
import { execute, query, queryFirst } from "../../src/storage/database";
import { checkRateLimit, incrementRateLimit } from "../../src/storage/rateLimits";
import type { NudgeTemplateId } from "../../src/types";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/storage/rateLimits", () => ({
  checkRateLimit: jest.fn(),
  incrementRateLimit: jest.fn(),
  getRateLimitCount: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const TEST_USER_1 = "nudge_sender";
const TEST_USER_2 = "nudge_receiver";

describe("Nudges Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (incrementRateLimit as jest.Mock).mockResolvedValue(undefined);
  });

  describe("sendNudge", () => {
    it("should send a nudge to a friend", async () => {
      // Mock friendship check - return valid friendship
      (queryFirst as jest.Mock).mockResolvedValueOnce({ status: "ACCEPTED" });

      // Mock rate limit checks (2 calls: pair limit + total limit)
      (checkRateLimit as jest.Mock).mockResolvedValueOnce(true); // pair limit
      (checkRateLimit as jest.Mock).mockResolvedValueOnce(true); // total limit

      (execute as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });

      // Mock final nudge retrieval
      (queryFirst as jest.Mock).mockResolvedValueOnce({
        id: "nudge-1",
        fromUserId: TEST_USER_1,
        toUserId: TEST_USER_2,
        templateId: "keep-it-up",
        createdAt: new Date().toISOString(),
      });

      const result = await sendNudge(TEST_USER_1, {
        toUserId: TEST_USER_2,
        templateId: "keep-it-up" as NudgeTemplateId,
      });

      expect(result).toHaveProperty("id");
      expect("error" in result).toBe(false);

      if (!("error" in result)) {
        expect(result.fromUserId).toBe(TEST_USER_1);
        expect(result.toUserId).toBe(TEST_USER_2);
      }
    });

    it("should not allow nudging yourself", async () => {
      const result = await sendNudge(TEST_USER_1, {
        toUserId: TEST_USER_1,
        templateId: "you-got-this" as NudgeTemplateId,
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("yourself");
      }
    });

    it("should not allow nudging non-friends", async () => {
      // Mock friendship check - return null (not friends)
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const result = await sendNudge(TEST_USER_1, {
        toUserId: "non_friend_user",
        templateId: "proud-streak" as NudgeTemplateId,
      });

      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("friends");
      }
    });
  });

  describe("getNudgesReceived", () => {
    it("should retrieve nudges received by a user", async () => {
      const mockNudges = [
        {
          id: "nudge-1",
          fromUserId: TEST_USER_1,
          fromName: "Sender",
          fromAvatar: null,
          templateId: "keep-it-up",
          createdAt: new Date().toISOString(),
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockNudges);

      const nudges = await getNudgesReceived(TEST_USER_2, 10);
      expect(Array.isArray(nudges)).toBe(true);
      expect(nudges.length).toBeGreaterThan(0);
    });
  });
});
