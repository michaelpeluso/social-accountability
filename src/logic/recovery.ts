/**
 * Recovery & Miss Detection Module
 * M2-2.5: Streak Recovery & Misses
 *
 * Pure functions for detecting missed habits and calculating recovery streaks.
 * Recovery streaks show user they're "getting back on track" after a miss.
 */

import { startOfDay, startOfWeek, subtractDays, today, isSameDay } from "./dates";

export interface RecoveryHabit {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  targetCount: number;
}

export interface RecoveryCheckIn {
  occurredAt: string; // ISO date string
}

export interface MissedPeriod {
  type: "day" | "week";
  date: Date; // Start of the missed period
  expectedCount: number;
  actualCount: number;
}

export interface RecoveryStatus {
  isInRecovery: boolean;
  recoveryStreak: number; // Days/weeks back on track after a miss
  lastMissedAt: string | null;
  recentMisses: MissedPeriod[]; // Last 7 missed periods for display
  consecutiveMisses: number; // How many periods missed in a row before recovery
}

/**
 * Calculate recovery status for a habit
 *
 * Recovery mode activates when:
 * 1. User had an active streak
 * 2. User missed one or more periods
 * 3. User is now completing habits again
 *
 * @param habit - Habit configuration
 * @param checkIns - All check-ins for this habit
 * @param referenceDate - Date to calculate from
 * @param lookbackDays - How far back to look for misses (default 30 days)
 */
export function calculateRecoveryStatus(
  habit: RecoveryHabit,
  checkIns: RecoveryCheckIn[],
  referenceDate: Date = today(),
  lookbackDays: number = 30
): RecoveryStatus {
  const misses = findMissedPeriods(habit, checkIns, referenceDate, lookbackDays);
  const sortedMisses = [...misses].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sortedMisses.length === 0) {
    return {
      isInRecovery: false,
      recoveryStreak: 0,
      lastMissedAt: null,
      recentMisses: [],
      consecutiveMisses: 0,
    };
  }

  const lastMiss = sortedMisses[0];
  const lastMissedAt = lastMiss.date.toISOString();

  // Calculate consecutive misses ending at lastMiss
  let consecutiveMisses = 1;
  for (let i = 1; i < sortedMisses.length; i++) {
    const prevMiss = sortedMisses[i - 1];
    const currMiss = sortedMisses[i];
    const periodLength = habit.frequency === "daily" ? 1 : 7;
    const expectedGap = periodLength;
    const actualGap = Math.round(
      (prevMiss.date.getTime() - currMiss.date.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (actualGap === expectedGap) {
      consecutiveMisses++;
    } else {
      break;
    }
  }

  // Check if currently in recovery (had misses but now completing)
  const recoveryStreak = calculateRecoveryStreak(habit, checkIns, lastMiss.date, referenceDate);
  const isInRecovery = recoveryStreak > 0;

  return {
    isInRecovery,
    recoveryStreak,
    lastMissedAt,
    recentMisses: sortedMisses.slice(0, 7),
    consecutiveMisses,
  };
}

/**
 * Find all missed periods within the lookback window
 */
export function findMissedPeriods(
  habit: RecoveryHabit,
  checkIns: RecoveryCheckIn[],
  referenceDate: Date = today(),
  lookbackDays: number = 30
): MissedPeriod[] {
  const misses: MissedPeriod[] = [];
  const startDate = subtractDays(referenceDate, lookbackDays);

  if (habit.frequency === "daily") {
    // Check each day in the lookback window
    let checkDate = startOfDay(startDate);
    const endDate = startOfDay(referenceDate);

    while (checkDate < endDate) {
      const count = countCheckInsForDay(checkIns, checkDate);
      if (count < habit.targetCount) {
        misses.push({
          type: "day",
          date: new Date(checkDate),
          expectedCount: habit.targetCount,
          actualCount: count,
        });
      }
      checkDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Don't count today as a miss (day isn't over yet)
  } else {
    // Check each complete week in the lookback window
    let checkWeek = startOfWeek(startDate);
    const currentWeekStart = startOfWeek(referenceDate);

    while (checkWeek < currentWeekStart) {
      const count = countCheckInsForWeek(checkIns, checkWeek);
      if (count < habit.targetCount) {
        misses.push({
          type: "week",
          date: new Date(checkWeek),
          expectedCount: habit.targetCount,
          actualCount: count,
        });
      }
      checkWeek = new Date(checkWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    // Don't count current week as a miss (week isn't over yet)
  }

  return misses;
}

/**
 * Calculate how many consecutive periods completed since last miss
 */
function calculateRecoveryStreak(
  habit: RecoveryHabit,
  checkIns: RecoveryCheckIn[],
  lastMissDate: Date,
  referenceDate: Date
): number {
  let streak = 0;

  if (habit.frequency === "daily") {
    // Count consecutive completed days after the miss
    let checkDate = new Date(lastMissDate.getTime() + 24 * 60 * 60 * 1000);
    const endDate = startOfDay(referenceDate);

    while (checkDate <= endDate) {
      const count = countCheckInsForDay(checkIns, checkDate);
      if (count >= habit.targetCount) {
        streak++;
        checkDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
      } else if (checkDate < endDate) {
        // Another miss before today resets recovery
        return 0;
      } else {
        // Today not yet complete is ok
        break;
      }
    }
  } else {
    // Count consecutive completed weeks after the missed week
    let checkWeek = new Date(lastMissDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const currentWeekStart = startOfWeek(referenceDate);

    while (checkWeek <= currentWeekStart) {
      if (checkWeek.getTime() === currentWeekStart.getTime()) {
        // Current week - check if on track
        const count = countCheckInsForWeek(checkIns, checkWeek);
        // Don't require full completion for current week, just some progress
        if (count > 0) {
          streak++;
        }
        break;
      }

      const count = countCheckInsForWeek(checkIns, checkWeek);
      if (count >= habit.targetCount) {
        streak++;
        checkWeek = new Date(checkWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        // Another miss resets recovery
        return 0;
      }
    }
  }

  return streak;
}

/**
 * Count check-ins for a specific day
 */
function countCheckInsForDay(checkIns: RecoveryCheckIn[], day: Date): number {
  return checkIns.filter((c) => isSameDay(c.occurredAt, day)).length;
}

/**
 * Count check-ins for a specific week
 */
function countCheckInsForWeek(checkIns: RecoveryCheckIn[], weekStart: Date): number {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return checkIns.filter((c) => {
    const d = new Date(c.occurredAt);
    return d >= weekStart && d < weekEnd;
  }).length;
}

/**
 * Determine the user's current habit status for display
 */
export type HabitStatus = "on-track" | "missed-today" | "recovering" | "at-risk" | "inactive";

export function getHabitStatus(
  habit: RecoveryHabit,
  checkIns: RecoveryCheckIn[],
  referenceDate: Date = today()
): HabitStatus {
  if (checkIns.length === 0) {
    return "inactive";
  }

  const recovery = calculateRecoveryStatus(habit, checkIns, referenceDate);

  // Check current period completion
  if (habit.frequency === "daily") {
    const todayCount = countCheckInsForDay(checkIns, startOfDay(referenceDate));
    const yesterdayCount = countCheckInsForDay(
      checkIns,
      startOfDay(subtractDays(referenceDate, 1))
    );

    if (todayCount >= habit.targetCount) {
      return recovery.isInRecovery ? "recovering" : "on-track";
    }

    if (yesterdayCount < habit.targetCount && todayCount < habit.targetCount) {
      return "at-risk"; // Missed yesterday and not yet done today
    }

    return "missed-today"; // Just today left to do
  } else {
    const currentWeekStart = startOfWeek(referenceDate);
    const currentWeekCount = countCheckInsForWeek(checkIns, currentWeekStart);
    const daysLeftInWeek =
      7 -
      Math.floor((referenceDate.getTime() - currentWeekStart.getTime()) / (24 * 60 * 60 * 1000));

    if (currentWeekCount >= habit.targetCount) {
      return recovery.isInRecovery ? "recovering" : "on-track";
    }

    // At risk if unlikely to complete (more remaining than days left)
    const remaining = habit.targetCount - currentWeekCount;
    if (remaining > daysLeftInWeek) {
      return "at-risk";
    }

    return recovery.isInRecovery ? "recovering" : "missed-today";
  }
}

/**
 * Get motivational message based on habit status
 */
export function getStatusMessage(status: HabitStatus, recoveryStreak: number = 0): string {
  switch (status) {
    case "on-track":
      return "Great work! Keep it up!";
    case "missed-today":
      return "Don't forget to check in today!";
    case "recovering":
      return recoveryStreak === 1
        ? "Welcome back! You're getting back on track."
        : `${recoveryStreak} days back on track!`;
    case "at-risk":
      return "You're falling behind. Let's get back to it!";
    case "inactive":
      return "Ready to start? Log your first check-in!";
  }
}
