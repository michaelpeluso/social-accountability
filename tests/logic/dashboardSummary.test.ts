/**
 * Tests for Dashboard Summary Logic
 * M2-2.7: Dashboard - Habit Summary
 */

import {
  calculateHabitSummary,
  getHabitCompletionData,
  getHabitsNeedingAttention,
  getDailyCheckInCounts,
  getBestPerformingHabit,
  type DashboardCheckIn,
} from "../../src/logic/dashboardSummary";
import type { Pillar } from "../../src/types";

describe("Dashboard Summary Logic", () => {
  const referenceDate = new Date("2024-01-15T12:00:00.000Z"); // Monday

  const createHabit = (
    id: string,
    title: string,
    pillar: Pillar,
    frequency: "daily" | "weekly" = "daily",
    targetCount: number = 1
  ) => ({
    id,
    title,
    pillar,
    schedule: { frequency, targetCount },
    isArchived: false,
    currentStreak: 5,
    longestStreak: 10,
  });

  const createCheckIn = (habitId: string, occurredAt: string) => ({
    id: `checkin-${Date.now()}-${Math.random()}`,
    habitId,
    occurredAt,
  });

  describe("calculateHabitSummary", () => {
    it("returns correct counts for habits", () => {
      const habits = [
        { ...createHabit("h1", "Meditate", "MIND"), isArchived: false },
        { ...createHabit("h2", "Exercise", "BODY"), isArchived: false },
        { ...createHabit("h3", "Old Habit", "HEART"), isArchived: true },
      ];
      const checkIns: DashboardCheckIn[] = [];

      const result = calculateHabitSummary(habits, checkIns, referenceDate);

      expect(result.totalHabits).toBe(3);
      expect(result.activeHabits).toBe(2);
      expect(result.archivedHabits).toBe(1);
    });

    it("calculates completion rate correctly", () => {
      const habits = [createHabit("h1", "Daily Habit", "MIND", "daily", 1)];
      // Monday reference, week just started
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"), // Monday
        createCheckIn("h1", "2024-01-14T08:00:00.000Z"), // Sunday
      ];

      const result = calculateHabitSummary(habits, checkIns, referenceDate);

      expect(result.checkInsThisWeek).toBe(2);
      expect(result.completionRate).toBeGreaterThan(0);
    });

    it("returns top streaks sorted by streak count", () => {
      const habits = [
        { ...createHabit("h1", "Low Streak", "MIND"), currentStreak: 3 },
        { ...createHabit("h2", "High Streak", "BODY"), currentStreak: 15 },
        { ...createHabit("h3", "Medium Streak", "HEART"), currentStreak: 7 },
      ];
      const checkIns: DashboardCheckIn[] = [];

      const result = calculateHabitSummary(habits, checkIns, referenceDate);

      expect(result.topStreaks).toHaveLength(3);
      expect(result.topStreaks[0].streak).toBe(15);
      expect(result.topStreaks[1].streak).toBe(7);
      expect(result.topStreaks[2].streak).toBe(3);
    });

    it("excludes habits with 0 streak from top streaks", () => {
      const habits = [
        { ...createHabit("h1", "No Streak", "MIND"), currentStreak: 0 },
        { ...createHabit("h2", "Has Streak", "BODY"), currentStreak: 5 },
      ];
      const checkIns: DashboardCheckIn[] = [];

      const result = calculateHabitSummary(habits, checkIns, referenceDate);

      expect(result.topStreaks).toHaveLength(1);
      expect(result.topStreaks[0].habitId).toBe("h2");
    });

    it("counts today check-ins correctly", () => {
      const habits = [createHabit("h1", "Habit", "MIND")];
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"), // Today
        createCheckIn("h1", "2024-01-15T18:00:00.000Z"), // Today
        createCheckIn("h1", "2024-01-14T08:00:00.000Z"), // Yesterday
      ];

      const result = calculateHabitSummary(habits, checkIns, referenceDate);

      expect(result.checkInsToday).toBe(2);
    });
  });

  describe("getHabitCompletionData", () => {
    it("returns completion data for each active habit", () => {
      const habits = [
        createHabit("h1", "Habit 1", "MIND", "daily", 1),
        createHabit("h2", "Habit 2", "BODY", "daily", 2),
      ];
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"),
        createCheckIn("h2", "2024-01-15T08:00:00.000Z"),
      ];

      const result = getHabitCompletionData(habits, checkIns, referenceDate);

      expect(result).toHaveLength(2);
      expect(result.find((h) => h.habitId === "h1")).toBeDefined();
      expect(result.find((h) => h.habitId === "h2")).toBeDefined();
    });

    it("calculates completion rate per habit", () => {
      const habits = [createHabit("h1", "Weekly Habit", "MIND", "weekly", 3)];
      // All check-ins must be within the same week (Sun-Sat)
      // Reference is Monday Jan 15, so week started Sun Jan 14
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"), // Monday
        createCheckIn("h1", "2024-01-15T12:00:00.000Z"), // Monday (second)
        createCheckIn("h1", "2024-01-14T08:00:00.000Z"), // Sunday (start of week)
      ];

      const result = getHabitCompletionData(habits, checkIns, referenceDate);

      expect(result[0].completionRate).toBe(100); // 3/3 = 100%
    });
  });

  describe("getHabitsNeedingAttention", () => {
    it("returns daily habits not completed today", () => {
      const habits = [
        createHabit("h1", "Completed", "MIND", "daily", 1),
        createHabit("h2", "Not Completed", "BODY", "daily", 1),
      ];
      const checkIns = [createCheckIn("h1", "2024-01-15T08:00:00.000Z")]; // Only h1 completed

      const result = getHabitsNeedingAttention(habits, checkIns, referenceDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("h2");
    });

    it("excludes archived habits", () => {
      const habits = [
        { ...createHabit("h1", "Active", "MIND", "daily", 1), isArchived: false },
        { ...createHabit("h2", "Archived", "BODY", "daily", 1), isArchived: true },
      ];
      const checkIns: DashboardCheckIn[] = [];

      const result = getHabitsNeedingAttention(habits, checkIns, referenceDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("h1");
    });

    it("returns empty array when all daily habits completed", () => {
      const habits = [createHabit("h1", "Done", "MIND", "daily", 1)];
      const checkIns = [createCheckIn("h1", "2024-01-15T08:00:00.000Z")];

      const result = getHabitsNeedingAttention(habits, checkIns, referenceDate);

      expect(result).toHaveLength(0);
    });
  });

  describe("getDailyCheckInCounts", () => {
    it("returns check-in counts for last N days", () => {
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"), // Day 0
        createCheckIn("h1", "2024-01-14T08:00:00.000Z"), // Day -1
        createCheckIn("h1", "2024-01-14T18:00:00.000Z"), // Day -1 (second)
        createCheckIn("h1", "2024-01-13T08:00:00.000Z"), // Day -2
      ];

      const result = getDailyCheckInCounts(checkIns, 3, referenceDate);

      expect(result).toHaveLength(3);
      expect(result[2].count).toBe(1); // Most recent (today)
      expect(result[1].count).toBe(2); // Yesterday
      expect(result[0].count).toBe(1); // 2 days ago
    });

    it("returns 0 for days with no check-ins", () => {
      const checkIns: DashboardCheckIn[] = [];

      const result = getDailyCheckInCounts(checkIns, 7, referenceDate);

      expect(result).toHaveLength(7);
      result.forEach((day) => {
        expect(day.count).toBe(0);
      });
    });
  });

  describe("getBestPerformingHabit", () => {
    it("returns habit with highest completion rate", () => {
      const habits = [
        createHabit("h1", "Low Rate", "MIND", "daily", 3),
        createHabit("h2", "High Rate", "BODY", "daily", 1),
      ];
      const checkIns = [
        createCheckIn("h1", "2024-01-15T08:00:00.000Z"), // 1/3 for h1
        createCheckIn("h2", "2024-01-15T08:00:00.000Z"), // 1/1 for h2
      ];

      const result = getBestPerformingHabit(habits, checkIns, referenceDate);

      expect(result?.id).toBe("h2");
    });

    it("returns null when no habits exist", () => {
      const result = getBestPerformingHabit([], [], referenceDate);
      expect(result).toBeNull();
    });
  });
});
