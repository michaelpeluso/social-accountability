/**
 * Habits Storage - SQLite operations for habits
 * Device-first: local is source of truth, synced to cloud
 */

import { query, queryFirst, execute } from "./database";
import { logger } from "../lib/logger";
import { enqueue } from "../services/sync";
import type { Habit, HabitSchedule, Pillar, Privacy } from "../types";

/**
 * Generate a UUID for new habits (device-side for offline support)
 */
function generateId(): string {
  return "habit-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
}

export interface CreateHabitData {
  title: string;
  goalId?: string;
  parentHabitId?: string;
  pillar: Pillar;
  schedule: HabitSchedule;
  privacy: Privacy;
}

/**
 * Create a new habit
 */
export async function createHabit(userId: string, data: CreateHabitData): Promise<Habit> {
  const now = new Date().toISOString();
  const id = generateId();

  // Validate parent habit depth (max 2 levels)
  if (data.parentHabitId) {
    const parent = await getHabitById(data.parentHabitId);
    if (parent?.parentHabitId) {
      throw new Error("Cannot create sub-habit of a sub-habit (max depth 2)");
    }
  }

  const habit: Habit = {
    id,
    userId,
    goalId: data.goalId,
    parentHabitId: data.parentHabitId,
    title: data.title.trim(),
    pillar: data.pillar,
    schedule: data.schedule,
    privacy: data.privacy,
    isArchived: false,
    currentStreak: 0,
    longestStreak: 0,
    recoveryStreak: 0,
    createdAt: now,
    updatedAt: now,
  };

  await execute(
    `INSERT INTO habits (id, userId, goalId, parentHabitId, title, pillar, schedule, privacy, 
     isArchived, currentStreak, longestStreak, recoveryStreak, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.userId,
      habit.goalId || null,
      habit.parentHabitId || null,
      habit.title,
      habit.pillar,
      JSON.stringify(habit.schedule),
      habit.privacy,
      0,
      0,
      0,
      0,
      habit.createdAt,
      habit.updatedAt,
    ]
  );

  // Queue for background sync
  await enqueue("CREATE", "habits", habit.id, habit as unknown as Record<string, unknown>);

  logger.info("Habit created", { habitId: habit.id, pillar: habit.pillar, goalId: habit.goalId });

  return habit;
}

/**
 * Get all habits for a user
 */
export async function getHabits(
  userId: string,
  options: { includeArchived?: boolean; goalId?: string } = {}
): Promise<Habit[]> {
  const { includeArchived = false, goalId } = options;

  let sql = "SELECT * FROM habits WHERE userId = ?";
  const params: (string | number)[] = [userId];

  if (!includeArchived) {
    sql += " AND isArchived = 0";
  }

  if (goalId) {
    sql += " AND goalId = ?";
    params.push(goalId);
  }

  sql += " ORDER BY createdAt DESC";

  const rows = await query<HabitRow>(sql, params);
  return rows.map(rowToHabit);
}

/**
 * Get habits for a specific goal
 */
export async function getHabitsByGoal(goalId: string): Promise<Habit[]> {
  const rows = await query<HabitRow>(
    "SELECT * FROM habits WHERE goalId = ? AND isArchived = 0 ORDER BY createdAt DESC",
    [goalId]
  );
  return rows.map(rowToHabit);
}

/**
 * Get sub-habits of a parent habit
 */
export async function getSubHabits(parentHabitId: string): Promise<Habit[]> {
  const rows = await query<HabitRow>(
    "SELECT * FROM habits WHERE parentHabitId = ? AND isArchived = 0 ORDER BY createdAt ASC",
    [parentHabitId]
  );
  return rows.map(rowToHabit);
}

/**
 * Get a habit by ID
 */
export async function getHabitById(habitId: string): Promise<Habit | null> {
  const row = await queryFirst<HabitRow>("SELECT * FROM habits WHERE id = ?", [habitId]);
  return row ? rowToHabit(row) : null;
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: string,
  updates: {
    title?: string;
    pillar?: Pillar;
    schedule?: HabitSchedule;
    privacy?: Privacy;
    isArchived?: boolean;
    currentStreak?: number;
    longestStreak?: number;
    recoveryStreak?: number;
    lastCheckInAt?: string;
    lastMissedAt?: string;
  }
): Promise<Habit | null> {
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    setClauses.push("title = ?");
    params.push(updates.title.trim());
  }
  if (updates.pillar !== undefined) {
    setClauses.push("pillar = ?");
    params.push(updates.pillar);
  }
  if (updates.schedule !== undefined) {
    setClauses.push("schedule = ?");
    params.push(JSON.stringify(updates.schedule));
  }
  if (updates.privacy !== undefined) {
    setClauses.push("privacy = ?");
    params.push(updates.privacy);
  }
  if (updates.isArchived !== undefined) {
    setClauses.push("isArchived = ?");
    params.push(updates.isArchived ? 1 : 0);
    if (updates.isArchived) {
      setClauses.push("archivedAt = ?");
      params.push(now);
    }
  }
  if (updates.currentStreak !== undefined) {
    setClauses.push("currentStreak = ?");
    params.push(updates.currentStreak);
  }
  if (updates.longestStreak !== undefined) {
    setClauses.push("longestStreak = ?");
    params.push(updates.longestStreak);
  }
  if (updates.recoveryStreak !== undefined) {
    setClauses.push("recoveryStreak = ?");
    params.push(updates.recoveryStreak);
  }
  if (updates.lastCheckInAt !== undefined) {
    setClauses.push("lastCheckInAt = ?");
    params.push(updates.lastCheckInAt);
  }
  if (updates.lastMissedAt !== undefined) {
    setClauses.push("lastMissedAt = ?");
    params.push(updates.lastMissedAt);
  }

  if (setClauses.length === 0) {
    return getHabitById(habitId);
  }

  setClauses.push("updatedAt = ?");
  params.push(now);
  params.push(habitId);

  await execute(`UPDATE habits SET ${setClauses.join(", ")} WHERE id = ?`, params);

  const updated = await getHabitById(habitId);
  if (updated) {
    await enqueue("UPDATE", "habits", habitId, updated as unknown as Record<string, unknown>);
    logger.info("Habit updated", { habitId });
  }

  return updated;
}

/**
 * Archive a habit (soft delete)
 */
export async function archiveHabit(habitId: string): Promise<Habit | null> {
  return updateHabit(habitId, { isArchived: true });
}

/**
 * Delete a habit permanently
 */
export async function deleteHabit(habitId: string): Promise<void> {
  await execute("DELETE FROM habits WHERE id = ?", [habitId]);
  logger.info("Habit deleted from local storage", { habitId });
}

/**
 * Mark habit as synced
 */
export async function markHabitSynced(habitId: string): Promise<void> {
  const now = new Date().toISOString();
  await execute("UPDATE habits SET syncedAt = ? WHERE id = ?", [now, habitId]);
}

/**
 * Get unsynced habits
 */
export async function getUnsyncedHabits(): Promise<Habit[]> {
  const rows = await query<HabitRow>(
    "SELECT * FROM habits WHERE syncedAt IS NULL OR syncedAt < updatedAt"
  );
  return rows.map(rowToHabit);
}

// Internal types for SQLite row mapping
interface HabitRow {
  id: string;
  userId: string;
  goalId: string | null;
  parentHabitId: string | null;
  title: string;
  pillar: string;
  schedule: string;
  privacy: string;
  isArchived: number;
  archivedAt: string | null;
  currentStreak: number;
  longestStreak: number;
  lastCheckInAt: string | null;
  lastMissedAt: string | null;
  recoveryStreak: number;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.userId,
    goalId: row.goalId ?? undefined,
    parentHabitId: row.parentHabitId ?? undefined,
    title: row.title,
    pillar: row.pillar as Pillar,
    schedule: JSON.parse(row.schedule) as HabitSchedule,
    privacy: row.privacy as Privacy,
    isArchived: row.isArchived === 1,
    archivedAt: row.archivedAt ?? undefined,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastCheckInAt: row.lastCheckInAt ?? undefined,
    lastMissedAt: row.lastMissedAt ?? undefined,
    recoveryStreak: row.recoveryStreak,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    syncedAt: row.syncedAt ?? undefined,
  };
}
