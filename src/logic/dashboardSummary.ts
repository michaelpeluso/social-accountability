/**
 * Dashboard Summary Logic
 * M2-2.7: Dashboard - Habit Summary
 *
 * Pure functions for calculating dashboard metrics on device (free compute).
 */

import type { Pillar } from "../types";
import { startOfDay, subtractDays, isThisWeek } from "./dates";

// Input types for pure functions
export interface DashboardHabit {
  id: string;
  title: string;
  pillar: Pillar;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    targetCount: number;
  };
  isArchived: boolean;
  currentStreak: number;
  longestStreak: number;
}

export interface DashboardCheckIn {
  id: string;
  habitId: string;
  occurredAt: string;
}

export interface HabitSummary {
  totalHabits: number;
  activeHabits: number;
  archivedHabits: number;
  completionRate: number; // 0-100 percentage
  topStreaks: { habitId: string; title: string; streak: number }[];
  mostMissed: { habitId: string; title: string; missedDays: number }[];
  checkInsToday: number;
  checkInsThisWeek: number;
}

export interface HabitCompletionData {
  habitId: string;
  title: string;
  expected: number;
  actual: number;
  completionRate: number;
}

/**
 * Get expected check-ins for this week (days elapsed so far)
 */
function getExpectedCheckInsThisWeek(habit: DashboardHabit): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;

  switch (habit.schedule.frequency) {
    case "daily":
      return habit.schedule.targetCount * daysElapsed;
    case "weekly":
      return habit.schedule.targetCount;
    case "monthly":
      return Math.ceil(habit.schedule.targetCount / 4);
    default:
      return habit.schedule.targetCount;
  }
}

/**
 * Calculate habit summary statistics
 */
export function calculateHabitSummary(
  habits: DashboardHabit[],
  checkIns: DashboardCheckIn[],
  referenceDate: Date = new Date()
): HabitSummary {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);

  // Get today's check-ins
  const todayStart = startOfDay(referenceDate);
  const todayCheckIns = checkIns.filter((c) => {
    const checkInDate = startOfDay(new Date(c.occurredAt));
    return checkInDate.getTime() === todayStart.getTime();
  });

  // Get this week's check-ins
  const thisWeekCheckIns = checkIns.filter((c) => isThisWeek(c.occurredAt, referenceDate));

  // Calculate completion rate for this week
  const activeHabitIds = new Set(activeHabits.map((h) => h.id));
  const relevantCheckIns = thisWeekCheckIns.filter((c) => activeHabitIds.has(c.habitId));

  let totalExpected = 0;
  let totalActual = 0;

  for (const habit of activeHabits) {
    const expected = getExpectedCheckInsThisWeek(habit);
    const actual = relevantCheckIns.filter((c) => c.habitId === habit.id).length;
    totalExpected += expected;
    totalActual += Math.min(actual, expected);
  }

  const completionRate = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

  // Top 3 streaks
  const topStreaks = [...activeHabits]
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 3)
    .filter((h) => h.currentStreak > 0)
    .map((h) => ({
      habitId: h.id,
      title: h.title,
      streak: h.currentStreak,
    }));

  // Most missed (habits with lowest completion rate this week)
  const habitCompletions: HabitCompletionData[] = activeHabits.map((habit) => {
    const expected = getExpectedCheckInsThisWeek(habit);
    const actual = relevantCheckIns.filter((c) => c.habitId === habit.id).length;
    return {
      habitId: habit.id,
      title: habit.title,
      expected,
      actual,
      completionRate: expected > 0 ? (actual / expected) * 100 : 100,
    };
  });

  const mostMissed = habitCompletions
    .filter((h) => h.completionRate < 100 && h.expected > 0)
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 3)
    .map((h) => ({
      habitId: h.habitId,
      title: h.title,
      missedDays: Math.max(0, h.expected - h.actual),
    }));

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    archivedHabits: archivedHabits.length,
    completionRate,
    topStreaks,
    mostMissed,
    checkInsToday: todayCheckIns.length,
    checkInsThisWeek: thisWeekCheckIns.length,
  };
}

/**
 * Calculate completion data for all habits
 */
export function getHabitCompletionData(
  habits: DashboardHabit[],
  checkIns: DashboardCheckIn[],
  referenceDate: Date = new Date()
): HabitCompletionData[] {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const thisWeekCheckIns = checkIns.filter((c) => isThisWeek(c.occurredAt, referenceDate));

  return activeHabits.map((habit) => {
    const expected = getExpectedCheckInsThisWeek(habit);
    const actual = thisWeekCheckIns.filter((c) => c.habitId === habit.id).length;
    return {
      habitId: habit.id,
      title: habit.title,
      expected,
      actual,
      completionRate:
        expected > 0 ? Math.round((Math.min(actual, expected) / expected) * 100) : 100,
    };
  });
}

/**
 * Get habits that need attention (not completed today for daily habits)
 */
export function getHabitsNeedingAttention(
  habits: DashboardHabit[],
  checkIns: DashboardCheckIn[],
  referenceDate: Date = new Date()
): DashboardHabit[] {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const todayStart = startOfDay(referenceDate);

  return activeHabits.filter((habit) => {
    if (habit.schedule.frequency !== "daily") {
      // For weekly habits, check if we're on track for the week
      return false; // Simplified for now
    }

    // For daily habits, check if today's target is met
    const todayCheckIns = checkIns.filter((c) => {
      const checkInDate = startOfDay(new Date(c.occurredAt));
      return c.habitId === habit.id && checkInDate.getTime() === todayStart.getTime();
    });

    return todayCheckIns.length < habit.schedule.targetCount;
  });
}

/**
 * Calculate daily check-in counts for the last N days
 */
export function getDailyCheckInCounts(
  checkIns: DashboardCheckIn[],
  days: number,
  referenceDate: Date = new Date()
): { date: Date; count: number }[] {
  const result: { date: Date; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = startOfDay(subtractDays(referenceDate, i));
    const count = checkIns.filter((c) => {
      const checkInDate = startOfDay(new Date(c.occurredAt));
      return checkInDate.getTime() === date.getTime();
    }).length;

    result.push({ date, count });
  }

  return result;
}

/**
 * Get best performing habit (highest completion rate)
 */
export function getBestPerformingHabit(
  habits: DashboardHabit[],
  checkIns: DashboardCheckIn[],
  referenceDate: Date = new Date()
): DashboardHabit | null {
  const completionData = getHabitCompletionData(habits, checkIns, referenceDate);
  if (completionData.length === 0) return null;

  const best = completionData.reduce((prev, curr) =>
    curr.completionRate > prev.completionRate ? curr : prev
  );

  return habits.find((h) => h.id === best.habitId) || null;
}

/**
 * Calculate check-ins by hour of day for heatmap
 * Returns array of 24 elements (0-23 hours) with check-in counts
 */
export function getCheckInsByHour(
  checkIns: DashboardCheckIn[],
  days: number = 30,
  referenceDate: Date = new Date()
): { hour: number; count: number; avgCount: number }[] {
  const startDate = subtractDays(referenceDate, days);
  const relevantCheckIns = checkIns.filter((c) => new Date(c.occurredAt) >= startDate);

  const hourCounts: number[] = new Array(24).fill(0);

  for (const checkIn of relevantCheckIns) {
    const hour = new Date(checkIn.occurredAt).getHours();
    hourCounts[hour]++;
  }

  return hourCounts.map((count, hour) => ({
    hour,
    count,
    avgCount: Math.round((count / days) * 10) / 10, // Avg per day, 1 decimal
  }));
}

/**
 * Get check-ins by day of week for heatmap
 * Returns array of 7 elements (0=Sunday to 6=Saturday)
 */
export function getCheckInsByDayOfWeek(
  checkIns: DashboardCheckIn[],
  weeks: number = 4,
  referenceDate: Date = new Date()
): { day: number; dayName: string; count: number; avgCount: number }[] {
  const days = weeks * 7;
  const startDate = subtractDays(referenceDate, days);
  const relevantCheckIns = checkIns.filter((c) => new Date(c.occurredAt) >= startDate);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: number[] = new Array(7).fill(0);

  for (const checkIn of relevantCheckIns) {
    const day = new Date(checkIn.occurredAt).getDay();
    dayCounts[day]++;
  }

  return dayCounts.map((count, day) => ({
    day,
    dayName: dayNames[day],
    count,
    avgCount: Math.round((count / weeks) * 10) / 10,
  }));
}

/**
 * Calculate completion rate trends over time
 * Returns weekly completion rates for the last N weeks
 */
export function getCompletionRateTrend(
  habits: DashboardHabit[],
  checkIns: DashboardCheckIn[],
  weeks: number = 8,
  referenceDate: Date = new Date()
): { weekStart: Date; completionRate: number; checkInCount: number }[] {
  const result: { weekStart: Date; completionRate: number; checkInCount: number }[] = [];
  const activeHabits = habits.filter((h) => !h.isArchived);

  if (activeHabits.length === 0) {
    return result;
  }

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subtractDays(referenceDate, i * 7 + referenceDate.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekCheckIns = checkIns.filter((c) => {
      const d = new Date(c.occurredAt);
      return d >= weekStart && d < weekEnd;
    });

    // Calculate expected check-ins for the week
    let totalExpected = 0;
    let totalActual = 0;

    for (const habit of activeHabits) {
      const expected =
        habit.schedule.frequency === "daily"
          ? habit.schedule.targetCount * 7
          : habit.schedule.targetCount;
      const actual = weekCheckIns.filter((c) => c.habitId === habit.id).length;
      totalExpected += expected;
      totalActual += Math.min(actual, expected);
    }

    const completionRate = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

    result.push({
      weekStart: new Date(weekStart),
      completionRate,
      checkInCount: weekCheckIns.length,
    });
  }

  return result;
}

/**
 * Get hour x day heatmap data for best time analysis
 * Returns 24x7 matrix of check-in density
 */
export interface HeatmapCell {
  hour: number;
  day: number;
  count: number;
  intensity: number; // 0-1 normalized
}

export function getTimeHeatmap(
  checkIns: DashboardCheckIn[],
  weeks: number = 4,
  referenceDate: Date = new Date()
): HeatmapCell[] {
  const days = weeks * 7;
  const startDate = subtractDays(referenceDate, days);
  const relevantCheckIns = checkIns.filter((c) => new Date(c.occurredAt) >= startDate);

  // Initialize 24x7 matrix
  const matrix: number[][] = Array(24)
    .fill(null)
    .map(() => Array(7).fill(0));

  for (const checkIn of relevantCheckIns) {
    const date = new Date(checkIn.occurredAt);
    const hour = date.getHours();
    const day = date.getDay();
    matrix[hour][day]++;
  }

  // Find max for normalization
  let maxCount = 0;
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) {
      if (matrix[h][d] > maxCount) maxCount = matrix[h][d];
    }
  }

  // Flatten to array with intensity
  const result: HeatmapCell[] = [];
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) {
      result.push({
        hour: h,
        day: d,
        count: matrix[h][d],
        intensity: maxCount > 0 ? matrix[h][d] / maxCount : 0,
      });
    }
  }

  return result;
}

/**
 * Get peak activity hours (top 3 hours with most check-ins)
 */
export function getPeakActivityHours(
  checkIns: DashboardCheckIn[],
  days: number = 30,
  referenceDate: Date = new Date()
): { hour: number; label: string; count: number }[] {
  const hourData = getCheckInsByHour(checkIns, days, referenceDate);

  return hourData
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((h) => ({
      hour: h.hour,
      label: `${h.hour.toString().padStart(2, "0")}:00`,
      count: h.count,
    }));
}
