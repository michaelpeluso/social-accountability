/**
 * Streak Calculation Tests
 * M2-2.4: Tests for streak calculation logic
 */

import {
  calculateStreak,
  isCompletedToday,
  isCompletedThisWeek,
  getCurrentPeriodCount,
  StreakHabit,
  StreakCheckIn,
} from "../../src/logic/streaks";

// Helper to create check-ins for testing
function makeCheckIn(daysAgo: number, baseDate: Date = new Date("2024-01-15")): StreakCheckIn {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - daysAgo);
  return { occurredAt: date.toISOString() };
}

describe("calculateStreak", () => {
  const referenceDate = new Date("2024-01-15T12:00:00Z"); // Monday

  describe("daily habits", () => {
    const dailyHabit: StreakHabit = { frequency: "daily", targetCount: 1 };

    it("returns zero streak for no check-ins", () => {
      const result = calculateStreak(dailyHabit, [], referenceDate);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastCheckInAt).toBeNull();
      expect(result.daysSinceLastCheckIn).toBeNull();
    });

    it("calculates current streak for consecutive days including today", () => {
      const checkIns = [
        makeCheckIn(0, referenceDate), // Today
        makeCheckIn(1, referenceDate), // Yesterday
        makeCheckIn(2, referenceDate), // 2 days ago
      ];

      const result = calculateStreak(dailyHabit, checkIns, referenceDate);

      expect(result.currentStreak).toBe(3);
      expect(result.daysSinceLastCheckIn).toBe(0);
    });

    it("calculates streak when today is missing but yesterday exists", () => {
      const checkIns = [
        makeCheckIn(1, referenceDate), // Yesterday
        makeCheckIn(2, referenceDate), // 2 days ago
        makeCheckIn(3, referenceDate), // 3 days ago
      ];

      const result = calculateStreak(dailyHabit, checkIns, referenceDate);

      // Streak of 3 days ending yesterday
      expect(result.currentStreak).toBe(3);
      expect(result.daysSinceLastCheckIn).toBe(1);
    });

    it("returns zero current streak if gap is 2+ days", () => {
      const checkIns = [
        makeCheckIn(2, referenceDate), // 2 days ago (missed yesterday)
        makeCheckIn(3, referenceDate), // 3 days ago
      ];

      const result = calculateStreak(dailyHabit, checkIns, referenceDate);

      expect(result.currentStreak).toBe(0); // Streak broken
      expect(result.longestStreak).toBe(2); // Historical best
    });

    it("calculates longest streak correctly", () => {
      const checkIns = [
        makeCheckIn(0, referenceDate), // Today - new streak of 1
        // Gap here
        makeCheckIn(10, referenceDate), // 10 days ago
        makeCheckIn(11, referenceDate),
        makeCheckIn(12, referenceDate),
        makeCheckIn(13, referenceDate),
        makeCheckIn(14, referenceDate), // 5-day streak
      ];

      const result = calculateStreak(dailyHabit, checkIns, referenceDate);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(5);
    });

    it("handles multiple check-ins on same day as one day", () => {
      const baseDate = new Date("2024-01-15T12:00:00Z");
      const checkIns = [
        { occurredAt: new Date("2024-01-15T08:00:00Z").toISOString() },
        { occurredAt: new Date("2024-01-15T12:00:00Z").toISOString() },
        { occurredAt: new Date("2024-01-15T18:00:00Z").toISOString() },
        { occurredAt: new Date("2024-01-14T10:00:00Z").toISOString() },
      ];

      const result = calculateStreak(dailyHabit, checkIns, baseDate);

      expect(result.currentStreak).toBe(2); // 2 unique days
    });
  });

  describe("weekly habits", () => {
    const weeklyHabit: StreakHabit = { frequency: "weekly", targetCount: 3 };

    it("returns zero streak for no check-ins", () => {
      const result = calculateStreak(weeklyHabit, [], referenceDate);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it("calculates current streak when target met each week", () => {
      // Week of Jan 15 (Mon Jan 15): 3 check-ins
      // Week of Jan 8 (Mon Jan 8): 3 check-ins
      const checkIns = [
        { occurredAt: "2024-01-15T10:00:00Z" },
        { occurredAt: "2024-01-16T10:00:00Z" },
        { occurredAt: "2024-01-17T10:00:00Z" },
        { occurredAt: "2024-01-08T10:00:00Z" },
        { occurredAt: "2024-01-09T10:00:00Z" },
        { occurredAt: "2024-01-10T10:00:00Z" },
      ];

      const result = calculateStreak(weeklyHabit, checkIns, referenceDate);

      expect(result.currentStreak).toBe(2); // 2 consecutive weeks
    });

    it("breaks streak when target not met", () => {
      // Week of Jan 15: 3 check-ins (met)
      // Week of Jan 8: 2 check-ins (NOT met, need 3)
      // Week of Jan 1: 3 check-ins (met)
      const checkIns = [
        { occurredAt: "2024-01-15T10:00:00Z" },
        { occurredAt: "2024-01-16T10:00:00Z" },
        { occurredAt: "2024-01-17T10:00:00Z" },
        { occurredAt: "2024-01-08T10:00:00Z" },
        { occurredAt: "2024-01-09T10:00:00Z" }, // Only 2, needs 3
        { occurredAt: "2024-01-01T10:00:00Z" },
        { occurredAt: "2024-01-02T10:00:00Z" },
        { occurredAt: "2024-01-03T10:00:00Z" },
      ];

      const result = calculateStreak(weeklyHabit, checkIns, referenceDate);

      expect(result.currentStreak).toBe(1); // Only current week
      expect(result.longestStreak).toBe(1); // Best was also 1 week
    });
  });
});

describe("isCompletedToday", () => {
  const today = new Date("2024-01-15T14:00:00Z");

  it("returns true if check-in exists today", () => {
    const checkIns = [{ occurredAt: "2024-01-15T08:00:00Z" }];

    expect(isCompletedToday(checkIns, today)).toBe(true);
  });

  it("returns false if no check-in today", () => {
    const checkIns = [{ occurredAt: "2024-01-14T08:00:00Z" }];

    expect(isCompletedToday(checkIns, today)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isCompletedToday([], today)).toBe(false);
  });
});

describe("isCompletedThisWeek", () => {
  const today = new Date("2024-01-17T14:00:00Z"); // Wednesday

  it("returns true when target met", () => {
    const checkIns = [
      { occurredAt: "2024-01-15T08:00:00Z" }, // Monday
      { occurredAt: "2024-01-16T08:00:00Z" }, // Tuesday
      { occurredAt: "2024-01-17T08:00:00Z" }, // Wednesday
    ];

    expect(isCompletedThisWeek(checkIns, 3, today)).toBe(true);
  });

  it("returns false when target not met", () => {
    const checkIns = [
      { occurredAt: "2024-01-15T08:00:00Z" }, // Monday
      { occurredAt: "2024-01-16T08:00:00Z" }, // Tuesday
    ];

    expect(isCompletedThisWeek(checkIns, 3, today)).toBe(false);
  });

  it("ignores check-ins from previous week", () => {
    const checkIns = [
      { occurredAt: "2024-01-10T08:00:00Z" }, // Previous week
      { occurredAt: "2024-01-11T08:00:00Z" }, // Previous week
      { occurredAt: "2024-01-15T08:00:00Z" }, // This week - only 1
    ];

    expect(isCompletedThisWeek(checkIns, 2, today)).toBe(false);
  });
});

describe("getCurrentPeriodCount", () => {
  describe("daily habits", () => {
    const dailyHabit: StreakHabit = { frequency: "daily", targetCount: 2 };
    const today = new Date("2024-01-15T14:00:00Z");

    it("counts check-ins for today only", () => {
      const checkIns = [
        { occurredAt: "2024-01-15T08:00:00Z" },
        { occurredAt: "2024-01-14T08:00:00Z" }, // Yesterday, ignored
      ];

      const result = getCurrentPeriodCount(dailyHabit, checkIns, today);

      expect(result.count).toBe(1);
      expect(result.target).toBe(2);
      expect(result.remaining).toBe(1);
    });

    it("calculates remaining correctly when complete", () => {
      const checkIns = [
        { occurredAt: "2024-01-15T08:00:00Z" },
        { occurredAt: "2024-01-15T12:00:00Z" },
        { occurredAt: "2024-01-15T18:00:00Z" },
      ];

      const result = getCurrentPeriodCount(dailyHabit, checkIns, today);

      expect(result.count).toBe(3);
      expect(result.target).toBe(2);
      expect(result.remaining).toBe(0); // Already exceeded
    });
  });

  describe("weekly habits", () => {
    const weeklyHabit: StreakHabit = { frequency: "weekly", targetCount: 4 };
    const today = new Date("2024-01-17T14:00:00Z"); // Wednesday

    it("counts check-ins for this week", () => {
      const checkIns = [
        { occurredAt: "2024-01-15T08:00:00Z" }, // Monday
        { occurredAt: "2024-01-16T08:00:00Z" }, // Tuesday
        { occurredAt: "2024-01-10T08:00:00Z" }, // Last week, ignored
      ];

      const result = getCurrentPeriodCount(weeklyHabit, checkIns, today);

      expect(result.count).toBe(2);
      expect(result.target).toBe(4);
      expect(result.remaining).toBe(2);
    });
  });
});
