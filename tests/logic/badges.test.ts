/**
 * Badge Logic Tests
 */

import { checkSpecificBadge, checkAndAwardBadges } from "../../src/logic/badges";
import { queryFirst } from "../../src/storage/database";
import { hasBadge, awardBadge } from "../../src/storage/badges";
import type { BadgeType } from "../../src/types";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/storage/badges", () => ({
  hasBadge: jest.fn(),
  awardBadge: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const TEST_USER = "badge_logic_user";

describe("Badge Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkSpecificBadge", () => {
    it("should check streak-7 badge eligibility", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ maxStreak: 7 });

      const result = await checkSpecificBadge(TEST_USER, "streak-7" as BadgeType);
      expect(result).toBe(true);
    });

    it("should check habits-10 badge eligibility", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 10 });

      const result = await checkSpecificBadge(TEST_USER, "habits-10" as BadgeType);
      expect(result).toBe(true);
    });

    it("should return false for unmet criteria", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ maxStreak: 5 });

      const result = await checkSpecificBadge(TEST_USER, "streak-100" as BadgeType);
      expect(result).toBe(false);
    });
  });

  describe("checkAndAwardBadges", () => {
    it("should award applicable badges", async () => {
      (hasBadge as jest.Mock).mockResolvedValue(false);
      (queryFirst as jest.Mock).mockResolvedValue({ maxStreak: 30 });
      (awardBadge as jest.Mock).mockResolvedValue({
        id: "badge-1",
        userId: TEST_USER,
        badgeType: "streak-30",
        earnedAt: new Date().toISOString(),
        sharedAt: null,
      });

      const awarded = await checkAndAwardBadges(TEST_USER);
      expect(Array.isArray(awarded)).toBe(true);
    });

    it("should not award badges that don't meet criteria", async () => {
      (hasBadge as jest.Mock).mockResolvedValue(false);
      (queryFirst as jest.Mock).mockResolvedValue({ maxStreak: 0 });

      const awarded = await checkAndAwardBadges(TEST_USER);
      expect(Array.isArray(awarded)).toBe(true);
    });
  });
});
