/**
 * Pillar Score Calculation Module
 * M2-2.6: Dashboard - Pillar Scores
 *
 * Pure functions for calculating pillar scores on device (free compute).
 * Scores range from 0-100 based on habit completion rates.
 */

import type { Pillar } from "../types";
import { isThisWeek, isLastWeek } from "./dates";

// Input types - minimal interfaces for pure functions
export interface PillarHabit {
  id: string;
  pillar: Pillar;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    targetCount: number;
  };
  isArchived: boolean;
}

export interface PillarCheckIn {
  habitId: string;
  occurredAt: string;
}

export interface PillarScore {
  pillar: Pillar;
  score: number; // 0-100
  trend: "up" | "stable" | "down";
  habitCount: number;
  thisWeekCheckIns: number;
  lastWeekCheckIns: number;
  expectedCheckIns: number;
}

export interface DashboardScores {
  overall: number;
  pillars: PillarScore[];
  lastUpdated: Date;
}

/**
 * Get expected check-ins for this week
 */
function getExpectedCheckInsThisWeek(habit: PillarHabit): number {
  switch (habit.schedule.frequency) {
    case "daily":
      // Days elapsed this week so far
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7
      return habit.schedule.targetCount * daysElapsed;
    case "weekly":
      return habit.schedule.targetCount;
    case "monthly":
      return Math.ceil(habit.schedule.targetCount / 4); // Approximately 1 week of a month
    default:
      return habit.schedule.targetCount;
  }
}

/**
 * Calculate completion rate (0-100) for a set of habits
 */
function calculateCompletionRate(
  habits: PillarHabit[],
  checkIns: PillarCheckIn[],
  filterFn: (date: Date) => boolean
): { rate: number; actual: number; expected: number } {
  if (habits.length === 0) {
    return { rate: 0, actual: 0, expected: 0 };
  }

  const activeHabits = habits.filter((h) => !h.isArchived);
  if (activeHabits.length === 0) {
    return { rate: 0, actual: 0, expected: 0 };
  }

  // Filter check-ins by date
  const filteredCheckIns = checkIns.filter((c) => filterFn(new Date(c.occurredAt)));

  // Count check-ins per habit
  const checkInCounts = new Map<string, number>();
  for (const checkIn of filteredCheckIns) {
    const count = checkInCounts.get(checkIn.habitId) || 0;
    checkInCounts.set(checkIn.habitId, count + 1);
  }

  // Calculate expected and actual totals
  let totalExpected = 0;
  let totalActual = 0;

  for (const habit of activeHabits) {
    const expected = getExpectedCheckInsThisWeek(habit);
    const actual = checkInCounts.get(habit.id) || 0;

    totalExpected += expected;
    totalActual += Math.min(actual, expected); // Cap at expected (no bonus for over-completing)
  }

  if (totalExpected === 0) {
    return { rate: 100, actual: totalActual, expected: 0 };
  }

  const rate = Math.round((totalActual / totalExpected) * 100);
  return { rate: Math.min(100, rate), actual: totalActual, expected: totalExpected };
}

/**
 * Calculate pillar score based on completion rate
 *
 * Score calculation:
 * - 0-100 based on (actual check-ins / expected check-ins) * 100
 * - Capped at 100 (no bonus for over-completing)
 * - 0 if no habits in pillar
 */
export function calculatePillarScore(
  pillar: Pillar,
  habits: PillarHabit[],
  checkIns: PillarCheckIn[],
  referenceDate: Date = new Date()
): PillarScore {
  // Filter habits for this pillar
  const pillarHabits = habits.filter((h) => h.pillar === pillar && !h.isArchived);
  const pillarHabitIds = new Set(pillarHabits.map((h) => h.id));
  const pillarCheckIns = checkIns.filter((c) => pillarHabitIds.has(c.habitId));

  // Calculate this week's completion
  const thisWeekData = calculateCompletionRate(pillarHabits, pillarCheckIns, (date) =>
    isThisWeek(date, referenceDate)
  );

  // Calculate last week's completion
  const lastWeekData = calculateCompletionRate(pillarHabits, pillarCheckIns, (date) =>
    isLastWeek(date, referenceDate)
  );

  // Determine trend
  let trend: "up" | "stable" | "down" = "stable";
  if (lastWeekData.rate > 0) {
    const diff = thisWeekData.rate - lastWeekData.rate;
    if (diff >= 10) {
      trend = "up";
    } else if (diff <= -10) {
      trend = "down";
    }
  }

  return {
    pillar,
    score: thisWeekData.rate,
    trend,
    habitCount: pillarHabits.length,
    thisWeekCheckIns: thisWeekData.actual,
    lastWeekCheckIns: lastWeekData.actual,
    expectedCheckIns: thisWeekData.expected,
  };
}

/**
 * Calculate scores for all pillars
 */
export function calculateAllPillarScores(
  habits: PillarHabit[],
  checkIns: PillarCheckIn[],
  referenceDate: Date = new Date()
): DashboardScores {
  const pillars: Pillar[] = ["MIND", "BODY", "HEART", "SOUL"];

  const pillarScores = pillars.map((pillar) =>
    calculatePillarScore(pillar, habits, checkIns, referenceDate)
  );

  // Overall score is weighted average of pillar scores (only pillars with habits)
  const activePillars = pillarScores.filter((p) => p.habitCount > 0);
  const overallScore =
    activePillars.length > 0
      ? Math.round(activePillars.reduce((sum, p) => sum + p.score, 0) / activePillars.length)
      : 0;

  return {
    overall: overallScore,
    pillars: pillarScores,
    lastUpdated: referenceDate,
  };
}

/**
 * Get trend arrow for display
 */
export function getTrendArrow(trend: "up" | "stable" | "down"): string {
  switch (trend) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    default:
      return "→";
  }
}

/**
 * Get trend color for display
 */
export function getTrendColor(trend: "up" | "stable" | "down"): string {
  switch (trend) {
    case "up":
      return "#4CAF50"; // Green
    case "down":
      return "#FF5252"; // Red
    default:
      return "#9E9E9E"; // Gray
  }
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "#4CAF50"; // Green - Excellent
  if (score >= 60) return "#8BC34A"; // Light green - Good
  if (score >= 40) return "#FFC107"; // Yellow - Needs work
  if (score >= 20) return "#FF9800"; // Orange - Struggling
  return "#FF5252"; // Red - Critical
}
