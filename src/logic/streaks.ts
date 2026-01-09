/**
 * Streak Calculation Module
 * M2-2.4: Streak Calculation (Device-Side)
 *
 * Pure functions for calculating habit streaks. All calculations run on device.
 * Supports both daily and weekly habits per spec.
 */

import {
  startOfDay,
  startOfWeek,
  subtractDays,
  isSameDay,
  daysBetween,
  weeksBetween,
  today,
} from "./dates";

// Minimal types for pure functions (no dependency on full Habit type)
export interface StreakHabit {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  targetCount: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface StreakCheckIn {
  occurredAt: string; // ISO date string
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastCheckInAt: string | null;
  daysSinceLastCheckIn: number | null;
}

/**
 * Calculate streak data for a habit based on check-in history
 *
 * @param habit - Habit schedule configuration
 * @param checkIns - Array of check-ins (should be sorted by occurredAt DESC for efficiency)
 * @param referenceDate - Date to calculate from (defaults to today)
 * @returns StreakResult with current/longest streak and metadata
 */
export function calculateStreak(
  habit: StreakHabit,
  checkIns: StreakCheckIn[],
  referenceDate: Date = today()
): StreakResult {
  if (checkIns.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInAt: null,
      daysSinceLastCheckIn: null,
    };
  }

  // Sort by date ascending for streak calculation
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  const lastCheckIn = sorted[sorted.length - 1];
  const lastCheckInDate = new Date(lastCheckIn.occurredAt);
  const daysSinceLastCheckIn = daysBetween(lastCheckInDate, referenceDate);

  if (habit.frequency === "daily") {
    return calculateDailyStreak(
      sorted,
      referenceDate,
      lastCheckIn.occurredAt,
      daysSinceLastCheckIn
    );
  } else {
    // Weekly, monthly, and custom all use weekly logic for now
    return calculateWeeklyStreak(
      habit,
      sorted,
      referenceDate,
      lastCheckIn.occurredAt,
      daysSinceLastCheckIn
    );
  }
}

/**
 * Calculate streak for daily habits
 * Streak continues if check-in exists for each consecutive day
 */
function calculateDailyStreak(
  checkIns: StreakCheckIn[],
  referenceDate: Date,
  lastCheckInAt: string,
  daysSinceLastCheckIn: number
): StreakResult {
  // Group check-ins by day
  const checkInDays = new Set<string>();
  for (const c of checkIns) {
    const dayKey = startOfDay(new Date(c.occurredAt)).toISOString();
    checkInDays.add(dayKey);
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let checkDate = startOfDay(referenceDate);

  // Calculate current streak (working backwards from today)
  // Allow for today to not have a check-in yet (streak still active if yesterday had one)
  const todayKey = checkDate.toISOString();
  const yesterdayKey = startOfDay(subtractDays(checkDate, 1)).toISOString();

  if (checkInDays.has(todayKey)) {
    // Today has check-in, count backwards
    currentStreak = 1;
    checkDate = subtractDays(checkDate, 1);
    while (checkInDays.has(startOfDay(checkDate).toISOString())) {
      currentStreak++;
      checkDate = subtractDays(checkDate, 1);
    }
  } else if (checkInDays.has(yesterdayKey)) {
    // Today doesn't have check-in but yesterday does - streak still "active" but not broken yet
    currentStreak = 0; // Will show as missed today
    checkDate = subtractDays(referenceDate, 1);
    while (checkInDays.has(startOfDay(checkDate).toISOString())) {
      currentStreak++;
      checkDate = subtractDays(checkDate, 1);
    }
  }

  // Calculate longest streak (scan all check-ins chronologically)
  const sortedDays = Array.from(checkInDays)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  tempStreak = 1;
  longestStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff = daysBetween(sortedDays[i - 1], sortedDays[i]);
    if (diff === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else if (diff > 1) {
      tempStreak = 1;
    }
    // diff === 0 shouldn't happen since we're using a Set, but ignore if it does
  }

  return {
    currentStreak,
    longestStreak,
    lastCheckInAt,
    daysSinceLastCheckIn,
  };
}

/**
 * Calculate streak for weekly habits
 * Streak continues if targetCount is met each week
 */
function calculateWeeklyStreak(
  habit: StreakHabit,
  checkIns: StreakCheckIn[],
  referenceDate: Date,
  lastCheckInAt: string,
  daysSinceLastCheckIn: number
): StreakResult {
  // Group check-ins by week
  const weekMap = new Map<string, number>();
  for (const c of checkIns) {
    const weekKey = startOfWeek(new Date(c.occurredAt)).toISOString();
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
  }

  const weeks = Array.from(weekMap.entries())
    .map(([weekStart, count]) => ({ weekStart: new Date(weekStart), count }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

  if (weeks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInAt,
      daysSinceLastCheckIn,
    };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak (working backwards from current week)
  const currentWeekStart = startOfWeek(referenceDate);
  let checkWeek = currentWeekStart;

  // Check current week first
  const currentWeekKey = checkWeek.toISOString();
  const currentWeekCount = weekMap.get(currentWeekKey) || 0;

  if (currentWeekCount >= habit.targetCount) {
    currentStreak = 1;
    checkWeek = new Date(checkWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    while (true) {
      const weekKey = checkWeek.toISOString();
      const count = weekMap.get(weekKey) || 0;
      if (count >= habit.targetCount) {
        currentStreak++;
        checkWeek = new Date(checkWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 0;
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].count >= habit.targetCount) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevWeek = weeks[i - 1].weekStart;
        const currWeek = weeks[i].weekStart;
        const weeksDiff = weeksBetween(prevWeek, currWeek);

        if (weeksDiff === 1 && weeks[i - 1].count >= habit.targetCount) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastCheckInAt,
    daysSinceLastCheckIn,
  };
}

/**
 * Check if a daily habit was completed today
 */
export function isCompletedToday(
  checkIns: StreakCheckIn[],
  referenceDate: Date = today()
): boolean {
  return checkIns.some((c) => isSameDay(c.occurredAt, referenceDate));
}

/**
 * Check if a weekly habit met its target this week
 */
export function isCompletedThisWeek(
  checkIns: StreakCheckIn[],
  targetCount: number,
  referenceDate: Date = today()
): boolean {
  const weekStart = startOfWeek(referenceDate);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const thisWeekCount = checkIns.filter((c) => {
    const d = new Date(c.occurredAt);
    return d >= weekStart && d < weekEnd;
  }).length;

  return thisWeekCount >= targetCount;
}

/**
 * Get check-in count for the current period (today or this week)
 */
export function getCurrentPeriodCount(
  habit: StreakHabit,
  checkIns: StreakCheckIn[],
  referenceDate: Date = today()
): { count: number; target: number; remaining: number } {
  const target = habit.targetCount;
  let count = 0;

  if (habit.frequency === "daily") {
    count = checkIns.filter((c) => isSameDay(c.occurredAt, referenceDate)).length;
  } else {
    const weekStart = startOfWeek(referenceDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    count = checkIns.filter((c) => {
      const d = new Date(c.occurredAt);
      return d >= weekStart && d < weekEnd;
    }).length;
  }

  return {
    count,
    target,
    remaining: Math.max(0, target - count),
  };
}
