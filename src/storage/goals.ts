/**
 * Goals Storage - SQLite operations for goals
 * Device-first: local is source of truth, synced to cloud
 */

import { query, queryFirst, execute } from "./database";
import { logger } from "../lib/logger";
import { enqueue } from "../services/sync";
import type { Goal, Pillar, Privacy } from "../types";

/**
 * Generate a UUID for new goals (device-side for offline support)
 */
function generateId(): string {
  return "goal-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
}

/**
 * Create a new goal
 */
export async function createGoal(
  userId: string,
  data: { title: string; pillar: Pillar; privacy: Privacy }
): Promise<Goal> {
  const now = new Date().toISOString();
  const id = generateId();

  const goal: Goal = {
    id,
    userId,
    title: data.title.trim(),
    pillar: data.pillar,
    privacy: data.privacy,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  await execute(
    `INSERT INTO goals (id, userId, title, pillar, privacy, isArchived, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [goal.id, goal.userId, goal.title, goal.pillar, goal.privacy, 0, goal.createdAt, goal.updatedAt]
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
  updates: { title?: string; pillar?: Pillar; privacy?: Privacy; isArchived?: boolean }
): Promise<Goal | null> {
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

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
    isArchived: row.isArchived === 1,
    archivedAt: row.archivedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    syncedAt: row.syncedAt ?? undefined,
  };
}
