/**
 * Rate Limits Storage Tests
 */

import {
  checkRateLimit,
  incrementRateLimit,
  getRateLimitCount,
} from "../../src/storage/rateLimits";
import { queryFirst, execute } from "../../src/storage/database";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const TEST_USER = "rate_limit_user";

describe("Rate Limits Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("should allow action when under limit", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 5 });

      const canProceed = await checkRateLimit(TEST_USER, "POST_CREATE", null, 20);
      expect(canProceed).toBe(true);
    });

    it("should block action when at limit", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 20 });

      const canProceed = await checkRateLimit(TEST_USER, "POST_CREATE", null, 20);
      expect(canProceed).toBe(false);
    });
  });

  describe("incrementRateLimit", () => {
    it("should increment action count", async () => {
      (execute as jest.Mock).mockResolvedValue({});

      await incrementRateLimit(TEST_USER, "REACTION_CREATE", null);

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO rate_limits"),
        expect.any(Array)
      );
    });
  });

  describe("getRateLimitCount", () => {
    it("should return current count for action", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 5 });

      const count = await getRateLimitCount(TEST_USER, "POST_CREATE", null);
      expect(count).toBe(5);
    });

    it("should return 0 for unused action", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 0 });

      const count = await getRateLimitCount("unused_user", "UNUSED_ACTION", null);
      expect(count).toBe(0);
    });
  });
});
