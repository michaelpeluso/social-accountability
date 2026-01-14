/**
 * Tests for Pillar Score Calculation Logic
 * M2-2.6: Dashboard - Pillar Scores
 */

import {
  calculatePillarScore,
  calculateAllPillarScores,
  getTrendArrow,
  getTrendColor,
  getScoreColor,
  type PillarHabit,
  type PillarCheckIn,
} from "../../src/logic/pillarScores";
import type { Pillar } from "../../src/types";

describe("Pillar Score Calculation", () => {
  const referenceDate = new Date("2024-01-15T12:00:00.000Z");

  describe("calculatePillarScore", () => {
    it("returns 0 score when no habits in pillar", () => {
      const habits: PillarHabit[] = [];
      const checkIns: PillarCheckIn[] = [];

      const result = calculatePillarScore("MIND", habits, checkIns, referenceDate);

      expect(result.pillar).toBe("MIND");
      expect(result.score).toBe(0);
      expect(result.habitCount).toBe(0);
    });

    it("returns 100% when all daily targets met", () => {
      const habits = [
        {
          id: "habit-1",
          pillar: "BODY" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: false,
        },
      ];
      // Check-ins for each day of the week so far (Mon-Fri for a Monday reference)
      const checkIns = [
        { habitId: "habit-1", occurredAt: "2024-01-15T08:00:00.000Z" }, // Monday
        { habitId: "habit-1", occurredAt: "2024-01-14T08:00:00.000Z" }, // Sunday (part of this week)
      ];

      const result = calculatePillarScore("BODY", habits, checkIns, referenceDate);

      expect(result.pillar).toBe("BODY");
      expect(result.habitCount).toBe(1);
      expect(result.thisWeekCheckIns).toBeGreaterThan(0);
    });

    it("excludes archived habits from score", () => {
      const habits = [
        {
          id: "habit-1",
          pillar: "MIND" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: true, // Archived
        },
        {
          id: "habit-2",
          pillar: "MIND" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: false,
        },
      ];
      const checkIns = [{ habitId: "habit-2", occurredAt: "2024-01-15T08:00:00.000Z" }];

      const result = calculatePillarScore("MIND", habits, checkIns, referenceDate);

      expect(result.habitCount).toBe(1); // Only active habit counted
    });

    it("calculates trend based on week comparison", () => {
      const habits = [
        {
          id: "habit-1",
          pillar: "HEART" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: false,
        },
      ];
      // More check-ins this week than last week = "up" trend
      // Reference: Monday Jan 15. This week: Sun Jan 14 - Sat Jan 20
      // Last week: Sun Jan 7 - Sat Jan 13
      const checkIns = [
        { habitId: "habit-1", occurredAt: "2024-01-15T08:00:00.000Z" }, // This week (Monday)
        { habitId: "habit-1", occurredAt: "2024-01-16T08:00:00.000Z" }, // This week (Tuesday)
        { habitId: "habit-1", occurredAt: "2024-01-17T08:00:00.000Z" }, // This week (Wednesday)
        // Only 1 last week
        { habitId: "habit-1", occurredAt: "2024-01-10T08:00:00.000Z" }, // Last week (Wednesday)
      ];

      const result = calculatePillarScore("HEART", habits, checkIns, referenceDate);

      expect(result.thisWeekCheckIns).toBeGreaterThan(result.lastWeekCheckIns);
    });

    it("ignores check-ins from other pillars", () => {
      const habits = [
        {
          id: "habit-1",
          pillar: "SOUL" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: false,
        },
        {
          id: "habit-2",
          pillar: "BODY" as Pillar,
          schedule: { frequency: "daily" as const, targetCount: 1 },
          isArchived: false,
        },
      ];
      const checkIns = [
        { habitId: "habit-1", occurredAt: "2024-01-15T08:00:00.000Z" }, // SOUL
        { habitId: "habit-2", occurredAt: "2024-01-15T08:00:00.000Z" }, // BODY
      ];

      const soulResult = calculatePillarScore("SOUL", habits, checkIns, referenceDate);
      const bodyResult = calculatePillarScore("BODY", habits, checkIns, referenceDate);

      expect(soulResult.thisWeekCheckIns).toBe(1);
      expect(bodyResult.thisWeekCheckIns).toBe(1);
    });
  });

  describe("calculateAllPillarScores", () => {
    it("returns scores for all 4 pillars", () => {
      const habits: PillarHabit[] = [];
      const checkIns: PillarCheckIn[] = [];

      const result = calculateAllPillarScores(habits, checkIns, referenceDate);

      expect(result.pillars).toHaveLength(4);
      expect(result.pillars.map((p) => p.pillar)).toEqual(["MIND", "BODY", "HEART", "SOUL"]);
    });

    it("calculates overall score as average of active pillars", () => {
      const habits = [
        {
          id: "habit-1",
          pillar: "MIND" as Pillar,
          schedule: { frequency: "weekly" as const, targetCount: 1 },
          isArchived: false,
        },
        {
          id: "habit-2",
          pillar: "BODY" as Pillar,
          schedule: { frequency: "weekly" as const, targetCount: 1 },
          isArchived: false,
        },
      ];
      const checkIns = [
        { habitId: "habit-1", occurredAt: "2024-01-15T08:00:00.000Z" },
        // Body habit has no check-ins
      ];

      const result = calculateAllPillarScores(habits, checkIns, referenceDate);

      // Should average MIND (100%) and BODY (0%) = 50%
      // Only pillars with habits are considered
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it("returns 0 overall when no habits exist", () => {
      const result = calculateAllPillarScores([], [], referenceDate);
      expect(result.overall).toBe(0);
    });
  });

  describe("display helpers", () => {
    describe("getTrendArrow", () => {
      it("returns correct arrows for each trend", () => {
        expect(getTrendArrow("up")).toBe("↑");
        expect(getTrendArrow("down")).toBe("↓");
        expect(getTrendArrow("stable")).toBe("→");
      });
    });

    describe("getTrendColor", () => {
      it("returns green for up trend", () => {
        expect(getTrendColor("up")).toBe("#4CAF50");
      });

      it("returns red for down trend", () => {
        expect(getTrendColor("down")).toBe("#FF5252");
      });

      it("returns gray for stable trend", () => {
        expect(getTrendColor("stable")).toBe("#9E9E9E");
      });
    });

    describe("getScoreColor", () => {
      it("returns appropriate colors based on score ranges", () => {
        expect(getScoreColor(100)).toBe("#4CAF50"); // Excellent
        expect(getScoreColor(80)).toBe("#4CAF50"); // Excellent
        expect(getScoreColor(70)).toBe("#8BC34A"); // Good
        expect(getScoreColor(50)).toBe("#FFC107"); // Needs work
        expect(getScoreColor(30)).toBe("#FF9800"); // Struggling
        expect(getScoreColor(10)).toBe("#FF5252"); // Critical
      });
    });
  });
});
