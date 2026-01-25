/**
 * Goal Participants Storage Module
 * Handles goal joining/leaving functionality (M5)
 *
 * Features:
 * - Join/leave goals owned by friends
 * - When joining a goal, also join all linked habits
 * - Get participants of a goal
 * - Get goals user has joined
 * - Send notifications on join
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import { createNotification } from "./notifications";
import { joinHabit, leaveHabit, isParticipant as isHabitParticipant } from "./habitParticipants";
import type { GoalParticipant, GoalParticipantRole, Privacy } from "../types";

/**
 * Generate ID for participant records
 */
function generateId(): string {
  return `gp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Join a goal (adds user as participant, joins all linked habits, and sends notification to owner)
 * performancePrivacy defaults to FRIENDS - user can change later
 */
export async function joinGoal(
  goalId: string,
  userId: string,
  userName: string,
  performancePrivacy: Privacy = "FRIENDS"
): Promise<{ goalParticipant: GoalParticipant; joinedHabitIds: string[] }> {
  const now = new Date().toISOString();
  const id = generateId();

  // Get goal info for notification and linked habits
  const goal = await queryFirst<{ userId: string; title: string; linkedHabitIds: string | null }>(
    "SELECT userId, title, linkedHabitIds FROM goals WHERE id = ?",
    [goalId]
  );

  if (!goal) {
    throw new Error("Goal not found");
  }

  // Check if already a participant
  const existing = await isGoalParticipant(goalId, userId);
  if (existing) {
    throw new Error("Already joined this goal");
  }

  // Can't join your own goal
  if (goal.userId === userId) {
    throw new Error("Cannot join your own goal");
  }

  const participant: GoalParticipant = {
    id,
    goalId,
    userId,
    role: "MEMBER",
    performancePrivacy,
    joinedAt: now,
  };

  // Join goal and linked habits in a transaction-like manner
  await execute(
    `INSERT INTO goal_participants (id, goalId, userId, role, performancePrivacy, joinedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      participant.id,
      participant.goalId,
      participant.userId,
      participant.role,
      participant.performancePrivacy,
      participant.joinedAt,
    ]
  );

  // Join all linked habits
  const joinedHabitIds: string[] = [];
  if (goal.linkedHabitIds) {
    try {
      const habitIds: string[] = JSON.parse(goal.linkedHabitIds);
      for (const habitId of habitIds) {
        try {
          // Check if not already a participant of this habit
          const alreadyJoined = await isHabitParticipant(habitId, userId);
          if (!alreadyJoined) {
            await joinHabit(habitId, userId, userName, performancePrivacy);
            joinedHabitIds.push(habitId);
          }
        } catch (err) {
          // Log but don't fail if a habit join fails (habit might not exist)
          logger.warn("Failed to join linked habit", { habitId, userId, error: err });
        }
      }
    } catch (parseErr) {
      logger.warn("Failed to parse linkedHabitIds", {
        goalId,
        linkedHabitIds: goal.linkedHabitIds,
      });
    }
  }

  // Send notification to goal owner
  await createNotification(
    goal.userId,
    "GOAL_MEMBER_JOINED",
    "Someone joined your goal!",
    `${userName} joined your goal "${goal.title}"`,
    {
      goalId,
      participantId: participant.id,
      userId,
      joinedHabitIds: JSON.stringify(joinedHabitIds),
    }
  );

  logger.info("User joined goal", { goalId, userId, participantId: id, joinedHabitIds });

  return { goalParticipant: participant, joinedHabitIds };
}

/**
 * Leave a goal
 * @param leaveLinkedHabits - If true, also leave all linked habits. Default: true
 */
export async function leaveGoal(
  goalId: string,
  userId: string,
  leaveLinkedHabits: boolean = true
): Promise<{ leftHabitIds: string[] }> {
  // Get goal info for linked habits
  const goal = await queryFirst<{ linkedHabitIds: string | null }>(
    "SELECT linkedHabitIds FROM goals WHERE id = ?",
    [goalId]
  );

  // Remove from goal participants
  const result = await execute("DELETE FROM goal_participants WHERE goalId = ? AND userId = ?", [
    goalId,
    userId,
  ]);

  if (result.changes === 0) {
    throw new Error("Not a participant of this goal");
  }

  // Optionally leave all linked habits
  const leftHabitIds: string[] = [];
  if (leaveLinkedHabits && goal?.linkedHabitIds) {
    try {
      const habitIds: string[] = JSON.parse(goal.linkedHabitIds);
      for (const habitId of habitIds) {
        try {
          await leaveHabit(habitId, userId);
          leftHabitIds.push(habitId);
        } catch (err) {
          // Log but don't fail if a habit leave fails
          logger.warn("Failed to leave linked habit", { habitId, userId, error: err });
        }
      }
    } catch (parseErr) {
      logger.warn("Failed to parse linkedHabitIds", { goalId });
    }
  }

  logger.info("User left goal", { goalId, userId, leaveLinkedHabits, leftHabitIds });

  return { leftHabitIds };
}

/**
 * Check if user is a participant of a goal
 */
export async function isGoalParticipant(goalId: string, userId: string): Promise<boolean> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM goal_participants WHERE goalId = ? AND userId = ?",
    [goalId, userId]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Get a specific participant record
 */
export async function getGoalParticipant(
  goalId: string,
  userId: string
): Promise<GoalParticipant | null> {
  const row = await queryFirst<{
    id: string;
    goalId: string;
    userId: string;
    role: string;
    performancePrivacy: string;
    joinedAt: string;
    syncedAt: string | null;
  }>("SELECT * FROM goal_participants WHERE goalId = ? AND userId = ?", [goalId, userId]);

  if (!row) return null;

  return {
    id: row.id,
    goalId: row.goalId,
    userId: row.userId,
    role: row.role as GoalParticipantRole,
    performancePrivacy: (row.performancePrivacy as Privacy) || "FRIENDS",
    joinedAt: row.joinedAt,
    syncedAt: row.syncedAt ?? undefined,
  };
}

/**
 * Get all participants of a goal
 */
export async function getGoalParticipants(goalId: string): Promise<GoalParticipant[]> {
  const rows = await query<GoalParticipant & { displayName?: string; photoUrl?: string }>(
    `SELECT gp.*, u.displayName, u.photoUrl
     FROM goal_participants gp
     LEFT JOIN users u ON gp.userId = u.id
     WHERE gp.goalId = ?
     ORDER BY gp.joinedAt DESC`,
    [goalId]
  );

  return rows.map((row) => ({
    id: row.id,
    goalId: row.goalId,
    userId: row.userId,
    role: row.role as GoalParticipantRole,
    performancePrivacy: (row.performancePrivacy || "FRIENDS") as Privacy,
    joinedAt: row.joinedAt,
    syncedAt: row.syncedAt,
    userName: row.displayName,
    userPhotoUrl: row.photoUrl,
  }));
}

/**
 * Update a participant's performance privacy
 */
export async function updateGoalParticipantPerformancePrivacy(
  goalId: string,
  userId: string,
  performancePrivacy: Privacy
): Promise<void> {
  const result = await execute(
    "UPDATE goal_participants SET performancePrivacy = ? WHERE goalId = ? AND userId = ?",
    [performancePrivacy, goalId, userId]
  );

  if (result.changes === 0) {
    throw new Error("Participant not found");
  }

  logger.info("Updated goal participant performance privacy", {
    goalId,
    userId,
    performancePrivacy,
  });
}

/**
 * Get goals that a user has joined (not their own)
 */
export async function getJoinedGoals(userId: string): Promise<
  {
    participantId: string;
    goalId: string;
    goalTitle: string;
    goalPillar: string;
    ownerName: string;
    ownerPhotoUrl: string | null;
    joinedAt: string;
    performancePrivacy: Privacy;
  }[]
> {
  const rows = await query<{
    participantId: string;
    goalId: string;
    goalTitle: string;
    goalPillar: string;
    ownerName: string;
    ownerPhotoUrl: string | null;
    joinedAt: string;
    performancePrivacy: string;
  }>(
    `SELECT
       gp.id as participantId,
       gp.goalId,
       gp.performancePrivacy,
       g.title as goalTitle,
       g.pillar as goalPillar,
       u.displayName as ownerName,
       u.photoUrl as ownerPhotoUrl,
       gp.joinedAt
     FROM goal_participants gp
     JOIN goals g ON gp.goalId = g.id
     JOIN users u ON g.userId = u.id
     WHERE gp.userId = ?
     ORDER BY gp.joinedAt DESC`,
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    performancePrivacy: (row.performancePrivacy || "FRIENDS") as Privacy,
  }));
}

/**
 * Get participant count for a goal
 */
export async function getGoalParticipantCount(goalId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM goal_participants WHERE goalId = ?",
    [goalId]
  );
  return result?.count ?? 0;
}

/**
 * Remove all participants when goal is deleted
 */
export async function removeAllGoalParticipants(goalId: string): Promise<void> {
  await execute("DELETE FROM goal_participants WHERE goalId = ?", [goalId]);
  logger.info("Removed all participants from goal", { goalId });
}
