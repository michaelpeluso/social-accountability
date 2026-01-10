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
