/**
 * Badges Storage Tests
 */

import { awardBadge, getUserBadges, hasBadge } from "../../src/storage/badges";
import { execute, query, queryFirst } from "../../src/storage/database";
import type { BadgeType } from "../../src/types";

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

const TEST_USER = "badge_user";

describe("Badges Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("awardBadge", () => {
    it("should award a badge to a user", async () => {
      (queryFirst as jest.Mock).mockResolvedValueOnce(null); // Badge not earned yet
      (execute as jest.Mock).mockResolvedValue({});
      (queryFirst as jest.Mock).mockResolvedValueOnce({
        id: "badge-1",
        userId: TEST_USER,
        badgeType: "streak-7",
        earnedAt: new Date().toISOString(),
        sharedAt: null,
      });

      const badge = await awardBadge(TEST_USER, "streak-7" as BadgeType);

      expect(badge).not.toBeNull();
      expect(badge?.userId).toBe(TEST_USER);
      expect(badge?.badgeType).toBe("streak-7");
    });

    it("should not award same badge twice", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "badge-1",
        userId: TEST_USER,
        badgeType: "habits-10",
        earnedAt: new Date().toISOString(),
        sharedAt: null,
      });

      const badge = await awardBadge(TEST_USER, "habits-10" as BadgeType);
      expect(badge).toBeNull(); // Already earned
    });
  });

  describe("getUserBadges", () => {
    it("should retrieve all badges for a user", async () => {
      const mockBadges = [
        {
          id: "b1",
          userId: TEST_USER,
          badgeType: "recovery-3",
          earnedAt: new Date().toISOString(),
          sharedAt: null,
        },
        {
          id: "b2",
          userId: TEST_USER,
          badgeType: "reactions-50",
          earnedAt: new Date().toISOString(),
          sharedAt: null,
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockBadges);

      const badges = await getUserBadges(TEST_USER);
      expect(badges.length).toBe(2);
    });
  });

  describe("hasBadge", () => {
    it("should return true if user has the badge", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "badge-1",
        badgeType: "nudges-10",
      });

      const result = await hasBadge(TEST_USER, "nudges-10" as BadgeType);
      expect(result).toBe(true);
    });

    it("should return false if user does not have the badge", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const result = await hasBadge(TEST_USER, "streak-100" as BadgeType);
      expect(result).toBe(false);
    });
  });
});
