/**
 * Goals Storage - SQLite operations for goals
 * Device-first: local is source of truth, synced to cloud
 */

import { query, queryFirst, execute } from "./database";
import { logger } from "../lib/logger";
import { enqueue } from "../services/sync";
import type { Goal, Pillar, Privacy, GoalDataSource } from "../types";

/**
 * Generate a UUID for new goals (device-side for offline support)
 */
function generateId(): string {
  return "goal-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
}

/**
 * Input data for creating a goal
 */
export interface CreateGoalData {
  title: string;
  pillar: Pillar;
  privacy: Privacy;
  description?: string;
  identityId?: string;
  // Values
  isIndefinite: boolean;
  startValue?: number;
  targetValue?: number;
  // Timeframe
  startDate?: string;
  deadline?: string;
  // Data source & linking
  dataSource: GoalDataSource;
  linkedHabitIds?: string[];
}

/**
 * Create a new goal
 */
export async function createGoal(userId: string, data: CreateGoalData): Promise<Goal> {
  const now = new Date().toISOString();
  const id = generateId();

  const goal: Goal = {
    id,
    userId,
    title: data.title.trim(),
    pillar: data.pillar,
    privacy: data.privacy,
    description: data.description?.trim(),
    identityId: data.identityId,
    // Values
    isIndefinite: data.isIndefinite,
    startValue: data.startValue,
    targetValue: data.targetValue,
    currentValue: data.startValue, // Initialize to start value
    // Timeframe
    startDate: data.startDate,
    deadline: data.deadline,
    // Data source & linking
    dataSource: data.dataSource,
    linkedHabitIds: data.linkedHabitIds,
    // System fields
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  await execute(
    `INSERT INTO goals (
      id, userId, title, pillar, privacy, description, identityId,
      isIndefinite, startValue, targetValue, currentValue,
      startDate, deadline,
      dataSource, linkedHabitIds,
      isArchived, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      goal.id,
      goal.userId,
      goal.title,
      goal.pillar,
      goal.privacy,
      goal.description || null,
      goal.identityId || null,
      goal.isIndefinite ? 1 : 0,
      goal.startValue ?? null,
      goal.targetValue ?? null,
      goal.currentValue ?? null,
      goal.startDate || null,
      goal.deadline || null,
      goal.dataSource,
      goal.linkedHabitIds ? JSON.stringify(goal.linkedHabitIds) : null,
      goal.isArchived ? 1 : 0,
      goal.createdAt,
      goal.updatedAt,
    ]
  );

  // Queue for background sync
  await enqueue("CREATE", "goals", goal.id, goal);

  logger.info("Goal created", { goalId: goal.id, pillar: goal.pillar });

  return goal;
}

/**
 * Get all goals for a user
 */
export async function getGoals(
  userId: string,
  options: { includeArchived?: boolean } = {}
): Promise<Goal[]> {
  const { includeArchived = false } = options;

  let sql = "SELECT * FROM goals WHERE userId = ?";
  const params: (string | number)[] = [userId];

  if (!includeArchived) {
    sql += " AND isArchived = 0";
  }

  sql += " ORDER BY createdAt DESC";

  const rows = await query<GoalRow>(sql, params);
  return rows.map(rowToGoal);
}

/**
 * Get goals filtered by pillar
 */
export async function getGoalsByPillar(userId: string, pillar: Pillar): Promise<Goal[]> {
  const rows = await query<GoalRow>(
    "SELECT * FROM goals WHERE userId = ? AND pillar = ? AND isArchived = 0 ORDER BY createdAt DESC",
    [userId, pillar]
  );
  return rows.map(rowToGoal);
}

/**
 * Get a goal by ID
 */
export async function getGoalById(goalId: string): Promise<Goal | null> {
  const row = await queryFirst<GoalRow>("SELECT * FROM goals WHERE id = ?", [goalId]);
  return row ? rowToGoal(row) : null;
}

/**
 * Update a goal
 */
export async function updateGoal(
  goalId: string,
  updates: {
    title?: string;
    pillar?: Pillar;
    privacy?: Privacy;
    description?: string;
    identityId?: string;
    isIndefinite?: boolean;
    startValue?: number;
    targetValue?: number;
    currentValue?: number;
    startDate?: string;
    deadline?: string;
    dataSource?: GoalDataSource;
    linkedHabitIds?: string[];
    vacationMode?: boolean;
    vacationEndsAt?: string;
    isArchived?: boolean;
  }
): Promise<Goal | null> {
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
  if (updates.privacy !== undefined) {
    setClauses.push("privacy = ?");
    params.push(updates.privacy);
  }
  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    params.push(updates.description ? updates.description.trim() : null);
  }
  if (updates.identityId !== undefined) {
    setClauses.push("identityId = ?");
    params.push(updates.identityId || null);
  }
  if (updates.isIndefinite !== undefined) {
    setClauses.push("isIndefinite = ?");
    params.push(updates.isIndefinite ? 1 : 0);
  }
  if (updates.startValue !== undefined) {
    setClauses.push("startValue = ?");
    params.push(updates.startValue ?? null);
  }
  if (updates.targetValue !== undefined) {
    setClauses.push("targetValue = ?");
    params.push(updates.targetValue ?? null);
  }
  if (updates.currentValue !== undefined) {
    setClauses.push("currentValue = ?");
    params.push(updates.currentValue ?? null);
  }
  if (updates.startDate !== undefined) {
    setClauses.push("startDate = ?");
    params.push(updates.startDate || null);
  }
  if (updates.deadline !== undefined) {
    setClauses.push("deadline = ?");
    params.push(updates.deadline || null);
  }
  if (updates.dataSource !== undefined) {
    setClauses.push("dataSource = ?");
    params.push(updates.dataSource);
  }
  if (updates.linkedHabitIds !== undefined) {
    setClauses.push("linkedHabitIds = ?");
    params.push(updates.linkedHabitIds ? JSON.stringify(updates.linkedHabitIds) : null);
  }
  if (updates.vacationMode !== undefined) {
    setClauses.push("vacationMode = ?");
    params.push(updates.vacationMode ? 1 : 0);
  }
  if (updates.vacationEndsAt !== undefined) {
    setClauses.push("vacationEndsAt = ?");
    params.push(updates.vacationEndsAt || null);
  }
  if (updates.isArchived !== undefined) {
    setClauses.push("isArchived = ?");
    params.push(updates.isArchived ? 1 : 0);
    if (updates.isArchived) {
      setClauses.push("archivedAt = ?");
      params.push(now);
    }
  }

  if (setClauses.length === 0) {
    return getGoalById(goalId);
  }

  setClauses.push("updatedAt = ?");
  params.push(now);
  params.push(goalId);

  await execute(`UPDATE goals SET ${setClauses.join(", ")} WHERE id = ?`, params);

  const updated = await getGoalById(goalId);
  if (updated) {
    await enqueue("UPDATE", "goals", goalId, updated);
    logger.info("Goal updated", { goalId });
  }

  return updated;
}

/**
 * Archive a goal (soft delete)
 */
export async function archiveGoal(goalId: string): Promise<Goal | null> {
  return updateGoal(goalId, { isArchived: true });
}

/**
 * Delete a goal permanently (for local cleanup after sync)
 */
export async function deleteGoal(goalId: string): Promise<void> {
  await execute("DELETE FROM goals WHERE id = ?", [goalId]);
  logger.info("Goal deleted from local storage", { goalId });
}

/**
 * Mark goal as synced
 */
export async function markGoalSynced(goalId: string): Promise<void> {
  const now = new Date().toISOString();
  await execute("UPDATE goals SET syncedAt = ? WHERE id = ?", [now, goalId]);
}

/**
 * Get unsynced goals
 */
export async function getUnsyncedGoals(): Promise<Goal[]> {
  const rows = await query<GoalRow>(
    "SELECT * FROM goals WHERE syncedAt IS NULL OR syncedAt < updatedAt"
  );
  return rows.map(rowToGoal);
}

// Internal types for SQLite row mapping
interface GoalRow {
  id: string;
  userId: string;
  title: string;
  pillar: string;
  privacy: string;
  description: string | null;
  identityId: string | null;
  // Values
  isIndefinite: number;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  // Timeframe
  startDate: string | null;
  deadline: string | null;
  // Data source & linking
  dataSource: string;
  linkedHabitIds: string | null; // JSON array
  // Vacation mode
  vacationMode: number;
  vacationEndsAt: string | null;
  // System fields
  isArchived: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    pillar: row.pillar as Pillar,
    privacy: row.privacy as Privacy,
    description: row.description ?? undefined,
    identityId: row.identityId ?? undefined,
    // Values
    isIndefinite: row.isIndefinite === 1,
    startValue: row.startValue ?? undefined,
    targetValue: row.targetValue ?? undefined,
    currentValue: row.currentValue ?? undefined,
    // Timeframe
    startDate: row.startDate ?? undefined,
    deadline: row.deadline ?? undefined,
    // Data source & linking
    dataSource: (row.dataSource || "MANUAL") as GoalDataSource,
    linkedHabitIds: row.linkedHabitIds ? JSON.parse(row.linkedHabitIds) : undefined,
    // Vacation mode
    vacationMode: row.vacationMode === 1,
    vacationEndsAt: row.vacationEndsAt ?? undefined,
    // System fields
    isArchived: row.isArchived === 1,
    archivedAt: row.archivedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    syncedAt: row.syncedAt ?? undefined,
  };
}
