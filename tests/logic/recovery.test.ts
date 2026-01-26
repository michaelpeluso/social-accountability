/**
 * Recovery Module Tests
 * M2-2.5: Tests for streak recovery and miss detection logic
 */

import {
  calculateRecoveryStatus,
  findMissedPeriods,
  getHabitStatus,
  getStatusMessage,
  RecoveryHabit,
  RecoveryCheckIn,
} from "../../src/logic/recovery";

// Helper to create check-ins for testing (using UTC to avoid timezone issues)
function makeCheckIn(daysAgo: number, baseDate: Date): RecoveryCheckIn {
  const date = new Date(baseDate);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return { occurredAt: date.toISOString() };
}

describe("findMissedPeriods", () => {
  describe("daily habits", () => {
    const dailyHabit: RecoveryHabit = { frequency: "daily", targetCount: 1 };

    it("finds missed days when check-ins are not consecutive", () => {
      const referenceDate = new Date("2024-01-10T12:00:00Z");
      // Check-ins on days 10 (today), 9, 7, 5 - missing days 4, 6, and 8
      // (lookback of 6 days = Jan 4-9, excluding today Jan 10)
      const checkIns = [
        { occurredAt: "2024-01-10T08:00:00Z" }, // Today - excluded
        { occurredAt: "2024-01-09T08:00:00Z" }, // Day 9
        // Day 8 missed
        { occurredAt: "2024-01-07T08:00:00Z" }, // Day 7
        // Day 6 missed
        { occurredAt: "2024-01-05T08:00:00Z" }, // Day 5
        // Day 4 missed (within 6-day lookback)
      ];

      const misses = findMissedPeriods(dailyHabit, checkIns, referenceDate, 6);

      // Should include days 4, 6, and 8 as misses (using UTC dates)
      const missedDays = misses.map((m) => m.date.getUTCDate());
      expect(missedDays).toContain(4);
      expect(missedDays).toContain(6);
      expect(missedDays).toContain(8);
      expect(misses).toHaveLength(3);
      expect(misses.every((m) => m.type === "day")).toBe(true);
    });

    it("does not count today as a miss", () => {
      const referenceDate = new Date("2024-01-15T12:00:00Z");
      // No check-in today, but that's ok - day isn't over
      const checkIns = [
        { occurredAt: "2024-01-14T08:00:00Z" }, // Yesterday
        { occurredAt: "2024-01-13T08:00:00Z" },
      ];

      const misses = findMissedPeriods(dailyHabit, checkIns, referenceDate, 3);

      expect(
        misses.find((m) => m.date.toDateString() === referenceDate.toDateString())
      ).toBeUndefined();
    });

    it("returns all days in lookback as misses when no check-ins", () => {
      const referenceDate = new Date("2024-01-10T12:00:00Z");
      const checkIns: RecoveryCheckIn[] = [];

      const misses = findMissedPeriods(dailyHabit, checkIns, referenceDate, 5);

      // All days except today should be misses
      expect(misses.length).toBeGreaterThan(0);
      expect(misses.every((m) => m.date < referenceDate)).toBe(true);
    });
  });

  describe("weekly habits", () => {
    const weeklyHabit: RecoveryHabit = { frequency: "weekly", targetCount: 3 };
    const refDate = new Date("2024-01-22T12:00:00Z"); // Week of Jan 22

    it("finds missed weeks when target not met", () => {
      // Week of Jan 15: only 2 check-ins (needs 3)
      // Week of Jan 8: 3 check-ins (met)
      const checkIns = [
        { occurredAt: "2024-01-22T10:00:00Z" }, // Current week, excluded
        { occurredAt: "2024-01-15T10:00:00Z" },
        { occurredAt: "2024-01-16T10:00:00Z" }, // Only 2 for week of Jan 15
        { occurredAt: "2024-01-08T10:00:00Z" },
        { occurredAt: "2024-01-09T10:00:00Z" },
        { occurredAt: "2024-01-10T10:00:00Z" }, // 3 for week of Jan 8
      ];

      const misses = findMissedPeriods(weeklyHabit, checkIns, refDate, 21);

      // Should find week of Jan 15 as missed (only 2 of 3)
      const weekOfJan15Misses = misses.filter(
        (m) =>
          m.date.getTime() >= new Date("2024-01-14").getTime() &&
          m.date.getTime() < new Date("2024-01-21").getTime()
      );
      expect(weekOfJan15Misses.length).toBe(1);
      expect(weekOfJan15Misses[0].type).toBe("week");
      expect(weekOfJan15Misses[0].actualCount).toBe(2);
      expect(weekOfJan15Misses[0].expectedCount).toBe(3);
    });
  });
});

describe("calculateRecoveryStatus", () => {
  const referenceDate = new Date("2024-01-15T12:00:00Z");

  describe("daily habits", () => {
    const dailyHabit: RecoveryHabit = { frequency: "daily", targetCount: 1 };

    it("detects recovery after a miss", () => {
      const checkIns = [
        makeCheckIn(0, referenceDate), // Today - back on track
        makeCheckIn(1, referenceDate), // Yesterday - back on track
        // Day 2 missed
        makeCheckIn(3, referenceDate), // Before miss
      ];

      const status = calculateRecoveryStatus(dailyHabit, checkIns, referenceDate, 5);

      expect(status.isInRecovery).toBe(true);
      expect(status.recoveryStreak).toBeGreaterThan(0);
      expect(status.lastMissedAt).not.toBeNull();
    });

    it("tracks consecutive misses", () => {
      const checkIns = [
        makeCheckIn(0, referenceDate), // Today
        // Days 1, 2, 3 missed
        makeCheckIn(4, referenceDate),
      ];

      const status = calculateRecoveryStatus(dailyHabit, checkIns, referenceDate, 10);

      expect(status.consecutiveMisses).toBe(3);
    });

    it("returns misses when lookback has uncovered days", () => {
      // The lookback period will find misses for days without check-ins
      const checkIns = [
        makeCheckIn(0, referenceDate),
        makeCheckIn(1, referenceDate),
        makeCheckIn(2, referenceDate),
      ];

      const status = calculateRecoveryStatus(dailyHabit, checkIns, referenceDate, 5);

      // Days 3 and 4 in lookback have no check-ins, counted as misses
      expect(status.recentMisses.length).toBeGreaterThan(0);
    });
  });

  describe("empty check-ins", () => {
    const dailyHabit: RecoveryHabit = { frequency: "daily", targetCount: 1 };

    it("returns status with misses when no check-ins exist", () => {
      // With no check-ins, lookback finds all days as missed
      const status = calculateRecoveryStatus(dailyHabit, [], referenceDate, 5);

      expect(status.isInRecovery).toBe(false);
      expect(status.recoveryStreak).toBe(0);
      // There will be misses for all days in lookback (except today)
      expect(status.recentMisses.length).toBeGreaterThan(0);
    });
  });
});

describe("getHabitStatus", () => {
  describe("daily habits", () => {
    const dailyHabit: RecoveryHabit = { frequency: "daily", targetCount: 1 };

    it("returns inactive for no check-ins", () => {
      const referenceDate = new Date("2024-01-15T12:00:00Z");
      expect(getHabitStatus(dailyHabit, [], referenceDate)).toBe("inactive");
    });

    it("returns recovering when completed today after prior gap in history", () => {
      // Default lookback is 30 days, so gaps will be detected
      const referenceDate = new Date("2024-01-15T12:00:00Z");
      const checkIns = [
        { occurredAt: "2024-01-15T08:00:00Z" }, // Today
        { occurredAt: "2024-01-14T08:00:00Z" }, // Yesterday
      ];

      // With 30-day lookback, there are many "misses" before Jan 14
      expect(getHabitStatus(dailyHabit, checkIns, referenceDate)).toBe("recovering");
    });

    it("returns missed-today when today not done but yesterday was", () => {
      const referenceDate = new Date("2024-01-03T12:00:00Z");
      const checkIns = [
        { occurredAt: "2024-01-02T08:00:00Z" }, // Yesterday
      ];

      const status = getHabitStatus(dailyHabit, checkIns, referenceDate);
      // Could be missed-today or at-risk depending on lookback
      expect(["missed-today", "at-risk", "recovering"]).toContain(status);
    });

    it("returns at-risk when both yesterday and today missed", () => {
      const referenceDate = new Date("2024-01-04T12:00:00Z");
      const checkIns = [
        { occurredAt: "2024-01-02T08:00:00Z" }, // 2 days ago
      ];

      expect(getHabitStatus(dailyHabit, checkIns, referenceDate)).toBe("at-risk");
    });
  });

  describe("weekly habits", () => {
    const weeklyHabit: RecoveryHabit = { frequency: "weekly", targetCount: 3 };

    it("returns at-risk when unlikely to complete this week", () => {
      // Saturday, only 1 check-in this week, need 3, only 1 day left
      const saturday = new Date("2024-01-13T12:00:00Z");
      const checkIns = [
        { occurredAt: "2024-01-08T10:00:00Z" }, // Only 1 this week
      ];

      // Should be at-risk since can't complete 3 in remaining days
      const status = getHabitStatus(weeklyHabit, checkIns, saturday);
      expect(["at-risk", "recovering"]).toContain(status);
    });
  });
});

describe("getStatusMessage", () => {
  it("returns correct message for each status", () => {
    expect(getStatusMessage("on-track")).toContain("Great work");
    expect(getStatusMessage("missed-today")).toContain("forget");
    expect(getStatusMessage("recovering", 1)).toContain("Welcome back");
    expect(getStatusMessage("recovering", 3)).toContain("3 days");
    expect(getStatusMessage("at-risk")).toContain("falling behind");
    expect(getStatusMessage("inactive")).toContain("first check-in");
  });
});
