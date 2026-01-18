/**
 * Check-Ins Storage Module
 * M2-2.3: Log Check-In
 *
 * Handles SQLite operations for habit check-ins with streak calculation
 */

import type { HabitCheckIn, CheckInSource } from "../types";
import { getDatabase } from "./database";

// Create check-in input type
export interface CreateCheckInInput {
  occurredAt?: string; // Defaults to now
  source?: CheckInSource; // Defaults to MANUAL
  value?: number; // For count/duration habits (e.g., 25 mins, 8 reps)
  evidenceUrl?: string;
  note?: string;
  intensity?: number;
  outcome?: string;
}

// Check-in row from SQLite
interface CheckInRow {
  id: string;
  habitId: string;
  userId: string;
  occurredAt: string;
  source: CheckInSource;
  value: number | null;
  evidenceUrl: string | null;
  note: string | null;
  intensity: number | null;
  outcome: string | null;
  createdAt: string;
  syncedAt: string | null;
}

function rowToCheckIn(row: CheckInRow): HabitCheckIn {
  return {
    id: row.id,
    habitId: row.habitId,
    userId: row.userId,
    occurredAt: row.occurredAt,
    source: row.source,
    value: row.value ?? undefined,
    evidenceUrl: row.evidenceUrl ?? undefined,
    note: row.note ?? undefined,
    intensity: row.intensity ?? undefined,
    outcome: row.outcome as HabitCheckIn["outcome"],
    createdAt: row.createdAt,
    syncedAt: row.syncedAt ?? undefined,
  };
}

/**
 * Create a new check-in and update habit streak data
 */
export async function createCheckIn(
  habitId: string,
  userId: string,
  input: CreateCheckInInput = {}
): Promise<HabitCheckIn> {
  const db = await getDatabase();
  const id = `checkin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const occurredAt = input.occurredAt ?? now;

  // Validate note length
  if (input.note && input.note.length > 500) {
    throw new Error("Note cannot exceed 500 characters");
  }

  // Check habit exists and belongs to user
  const habit = await db.getFirstAsync<{ id: string; userId: string }>(
    "SELECT id, userId FROM habits WHERE id = ? AND userId = ?",
    [habitId, userId]
  );

  if (!habit) {
    throw new Error("Habit not found or access denied");
  }

  // Insert check-in
  await db.runAsync(
    `INSERT INTO habit_check_ins (
      id, habitId, userId, occurredAt, source, value, evidenceUrl, note, intensity, outcome, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      habitId,
      userId,
      occurredAt,
      input.source ?? "MANUAL",
      input.value ?? null,
      input.evidenceUrl ?? null,
      input.note ?? null,
      input.intensity ?? null,
      input.outcome ?? null,
      now,
    ]
  );

  // Update habit streak data
  await updateHabitStreaks(habitId, occurredAt);

  const checkIn: HabitCheckIn = {
    id,
    habitId,
    userId,
    occurredAt,
    source: input.source ?? "MANUAL",
    value: input.value,
    evidenceUrl: input.evidenceUrl,
    note: input.note,
    intensity: input.intensity,
    outcome: input.outcome as HabitCheckIn["outcome"],
    createdAt: now,
  };

  return checkIn;
}

/**
 * Get check-ins for a habit
 */
export async function getCheckIns(
  habitId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<HabitCheckIn[]> {
  const db = await getDatabase();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const rows = await db.getAllAsync<CheckInRow>(
    `SELECT * FROM habit_check_ins 
     WHERE habitId = ? 
     ORDER BY occurredAt DESC 
     LIMIT ? OFFSET ?`,
    [habitId, limit, offset]
  );

  return rows.map(rowToCheckIn);
}

/**
 * Get check-ins for a user across all habits
 */
export async function getUserCheckIns(
  userId: string,
  options: { limit?: number; startDate?: string; endDate?: string } = {}
): Promise<HabitCheckIn[]> {
  const db = await getDatabase();
  const limit = options.limit ?? 100;

  let query = "SELECT * FROM habit_check_ins WHERE userId = ?";
  const params: (string | number)[] = [userId];

  if (options.startDate) {
    query += " AND occurredAt >= ?";
    params.push(options.startDate);
  }

  if (options.endDate) {
    query += " AND occurredAt <= ?";
    params.push(options.endDate);
  }

  query += " ORDER BY occurredAt DESC LIMIT ?";
  params.push(limit);

  const rows = await db.getAllAsync<CheckInRow>(query, params);
  return rows.map(rowToCheckIn);
}

/**
 * Get check-in by ID
 */
export async function getCheckInById(checkInId: string): Promise<HabitCheckIn | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<CheckInRow>("SELECT * FROM habit_check_ins WHERE id = ?", [
    checkInId,
  ]);

  return row ? rowToCheckIn(row) : null;
}

/**
 * Get today's check-ins for a habit
 */
export async function getTodayCheckIns(habitId: string): Promise<HabitCheckIn[]> {
  const db = await getDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  const tomorrowStart = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const rows = await db.getAllAsync<CheckInRow>(
    `SELECT * FROM habit_check_ins 
     WHERE habitId = ? AND occurredAt >= ? AND occurredAt < ?
     ORDER BY occurredAt DESC`,
    [habitId, todayStart, tomorrowStart]
  );

  return rows.map(rowToCheckIn);
}

/**
 * Delete a check-in and recalculate streaks
 */
export async function deleteCheckIn(checkInId: string, userId: string): Promise<boolean> {
  const db = await getDatabase();

  // Get check-in to verify ownership and get habitId
  const checkIn = await db.getFirstAsync<{ id: string; habitId: string; userId: string }>(
    "SELECT id, habitId, userId FROM habit_check_ins WHERE id = ? AND userId = ?",
    [checkInId, userId]
  );

  if (!checkIn) {
    throw new Error("Check-in not found or access denied");
  }

  await db.runAsync("DELETE FROM habit_check_ins WHERE id = ?", [checkInId]);

  // Recalculate streaks for the habit
  await recalculateHabitStreaks(checkIn.habitId);

  return true;
}

/**
 * Mark check-in as synced with server
 */
export async function markCheckInSynced(checkInId: string, serverSyncedAt: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync("UPDATE habit_check_ins SET syncedAt = ? WHERE id = ?", [
    serverSyncedAt,
    checkInId,
  ]);
}

/**
 * Get unsynced check-ins for a user
 */
export async function getUnsyncedCheckIns(userId: string): Promise<HabitCheckIn[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<CheckInRow>(
    "SELECT * FROM habit_check_ins WHERE userId = ? AND syncedAt IS NULL ORDER BY createdAt ASC",
    [userId]
  );

  return rows.map(rowToCheckIn);
}

/**
 * Count check-ins for a habit within a date range
 */
export async function countCheckInsInRange(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM habit_check_ins 
     WHERE habitId = ? AND occurredAt >= ? AND occurredAt < ?`,
    [habitId, startDate, endDate]
  );

  return result?.count ?? 0;
}

/**
 * Update habit streak data after a check-in
 */
async function updateHabitStreaks(habitId: string, occurredAt: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get current habit data
  const habit = await db.getFirstAsync<{
    currentStreak: number;
    longestStreak: number;
    lastCheckInAt: string | null;
  }>("SELECT currentStreak, longestStreak, lastCheckInAt FROM habits WHERE id = ?", [habitId]);

  if (!habit) return;

  const occurredDate = new Date(occurredAt);
  const lastCheckInDate = habit.lastCheckInAt ? new Date(habit.lastCheckInAt) : null;

  let newStreak = habit.currentStreak;
  let longestStreak = habit.longestStreak;

  if (!lastCheckInDate) {
    // First check-in ever
    newStreak = 1;
  } else {
    const daysSinceLastCheckIn = Math.floor(
      (occurredDate.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCheckIn === 0) {
      // Same day - streak stays the same (allow multiple check-ins per day)
    } else if (daysSinceLastCheckIn === 1) {
      // Consecutive day - increment streak
      newStreak = habit.currentStreak + 1;
    } else {
      // Missed days - reset streak
      newStreak = 1;
    }
  }

  // Update longest streak if current exceeds it
  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  await db.runAsync(
    `UPDATE habits SET 
      currentStreak = ?,
      longestStreak = ?,
      lastCheckInAt = ?,
      updatedAt = ?
    WHERE id = ?`,
    [newStreak, longestStreak, occurredAt, now, habitId]
  );
}

/**
 * Recalculate all streak data for a habit from check-in history
 * Used after deleting a check-in
 */
async function recalculateHabitStreaks(habitId: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get all check-ins ordered by date
  const checkIns = await db.getAllAsync<{ occurredAt: string }>(
    "SELECT occurredAt FROM habit_check_ins WHERE habitId = ? ORDER BY occurredAt ASC",
    [habitId]
  );

  if (checkIns.length === 0) {
    // No check-ins - reset all streak data
    await db.runAsync(
      `UPDATE habits SET 
        currentStreak = 0,
        longestStreak = 0,
        lastCheckInAt = NULL,
        updatedAt = ?
      WHERE id = ?`,
      [now, habitId]
    );
    return;
  }

  let currentStreak = 1;
  let longestStreak = 1;
  let lastDate = new Date(checkIns[0].occurredAt);

  for (let i = 1; i < checkIns.length; i++) {
    const currentDate = new Date(checkIns[i].occurredAt);
    const daysDiff = Math.floor(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day
      currentStreak++;
    } else if (daysDiff > 1) {
      // Gap in days - reset streak
      currentStreak = 1;
    }
    // daysDiff === 0: same day, streak unchanged

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    lastDate = currentDate;
  }

  const lastCheckIn = checkIns[checkIns.length - 1];

  // Check if current streak is still active (within last 24h or today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCheckInDay = new Date(lastCheckIn.occurredAt);
  lastCheckInDay.setHours(0, 0, 0, 0);
  const daysSinceLastCheckIn = Math.floor(
    (today.getTime() - lastCheckInDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If more than 1 day since last check-in, current streak is broken
  if (daysSinceLastCheckIn > 1) {
    currentStreak = 0;
  }

  await db.runAsync(
    `UPDATE habits SET 
      currentStreak = ?,
      longestStreak = ?,
      lastCheckInAt = ?,
      updatedAt = ?
    WHERE id = ?`,
    [currentStreak, longestStreak, lastCheckIn.occurredAt, now, habitId]
  );
}
