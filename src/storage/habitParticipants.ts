/**
 * Habit Participants Storage Module
 * Handles habit joining/leaving functionality (M3)
 *
 * Features:
 * - Join/leave habits owned by friends
 * - Get participants of a habit
 * - Get habits user has joined
 * - Send notifications on join
 */

import { execute, query, queryFirst } from "./database";
import { logger } from "../lib/logger";
import { createNotification } from "./notifications";
import type { HabitParticipant, HabitParticipantRole, Privacy } from "../types";

/**
 * Generate ID for participant records
 */
function generateId(): string {
  return `hp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Join a habit (adds user as participant and sends notification to owner)
 * performancePrivacy defaults to FRIENDS - user can change later
 */
export async function joinHabit(
  habitId: string,
  userId: string,
  userName: string,
  performancePrivacy: "SELF" | "FRIENDS" | "CLOSE_FRIENDS" | "PUBLIC" = "FRIENDS"
): Promise<HabitParticipant> {
  const now = new Date().toISOString();
  const id = generateId();

  // Get habit info for notification
  const habit = await queryFirst<{ userId: string; title: string }>(
    "SELECT userId, title FROM habits WHERE id = ?",
    [habitId]
  );

  if (!habit) {
    throw new Error("Habit not found");
  }

  // Check if already a participant
  const existing = await isParticipant(habitId, userId);
  if (existing) {
    throw new Error("Already joined this habit");
  }

  // Can't join your own habit
  if (habit.userId === userId) {
    throw new Error("Cannot join your own habit");
  }

  const participant: HabitParticipant = {
    id,
    habitId,
    userId,
    role: "MEMBER",
    performancePrivacy,
    joinedAt: now,
  };

  await execute(
    `INSERT INTO habit_participants (id, habitId, userId, role, performancePrivacy, joinedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      participant.id,
      participant.habitId,
      participant.userId,
      participant.role,
      participant.performancePrivacy,
      participant.joinedAt,
    ]
  );

  // Send notification to habit owner
  await createNotification(
    habit.userId,
    "HABIT_MEMBER_JOINED",
    "Someone joined your habit!",
    `${userName} joined your habit "${habit.title}"`,
    { habitId, participantId: participant.id, userId }
  );

  logger.info("User joined habit", { habitId, userId, participantId: id });

  return participant;
}

/**
 * Leave a habit (remove participant)
 */
export async function leaveHabit(habitId: string, userId: string): Promise<void> {
  const result = await execute("DELETE FROM habit_participants WHERE habitId = ? AND userId = ?", [
    habitId,
    userId,
  ]);

  if (result.changes === 0) {
    throw new Error("Not a participant of this habit");
  }

  logger.info("User left habit", { habitId, userId });
}

/**
 * Check if user is a participant of a habit
 */
export async function isParticipant(habitId: string, userId: string): Promise<boolean> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM habit_participants WHERE habitId = ? AND userId = ?",
    [habitId, userId]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Get a specific participant record
 */
export async function getParticipant(
  habitId: string,
  userId: string
): Promise<HabitParticipant | null> {
  const row = await queryFirst<{
    id: string;
    habitId: string;
    userId: string;
    role: string;
    performancePrivacy: string;
    joinedAt: string;
  }>("SELECT * FROM habit_participants WHERE habitId = ? AND userId = ?", [habitId, userId]);

  if (!row) return null;

  return {
    id: row.id,
    habitId: row.habitId,
    userId: row.userId,
    role: row.role as HabitParticipant["role"],
    performancePrivacy: (row.performancePrivacy as Privacy) || "FRIENDS",
    joinedAt: row.joinedAt,
  };
}

/**
 * Get all participants of a habit
 */
export async function getHabitParticipants(habitId: string): Promise<HabitParticipant[]> {
  const rows = await query<HabitParticipant & { displayName?: string; photoUrl?: string }>(
    `SELECT hp.*, u.displayName, u.photoUrl
     FROM habit_participants hp
     LEFT JOIN users u ON hp.userId = u.id
     WHERE hp.habitId = ?
     ORDER BY hp.joinedAt DESC`,
    [habitId]
  );

  return rows.map((row) => ({
    id: row.id,
    habitId: row.habitId,
    userId: row.userId,
    role: row.role as HabitParticipantRole,
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
export async function updateParticipantPerformancePrivacy(
  habitId: string,
  userId: string,
  performancePrivacy: Privacy
): Promise<void> {
  const result = await execute(
    "UPDATE habit_participants SET performancePrivacy = ? WHERE habitId = ? AND userId = ?",
    [performancePrivacy, habitId, userId]
  );

  if (result.changes === 0) {
    throw new Error("Participant not found");
  }

  logger.info("Updated participant performance privacy", { habitId, userId, performancePrivacy });
}

/**
 * Get habits that a user has joined (not their own)
 */
export async function getJoinedHabits(userId: string): Promise<
  {
    participantId: string;
    habitId: string;
    habitTitle: string;
    habitPillar: string;
    ownerName: string;
    ownerPhotoUrl: string | null;
    joinedAt: string;
  }[]
> {
  const rows = await query<{
    participantId: string;
    habitId: string;
    habitTitle: string;
    habitPillar: string;
    ownerName: string;
    ownerPhotoUrl: string | null;
    joinedAt: string;
  }>(
    `SELECT
       hp.id as participantId,
       hp.habitId,
       h.title as habitTitle,
       h.pillar as habitPillar,
       u.displayName as ownerName,
       u.photoUrl as ownerPhotoUrl,
       hp.joinedAt
     FROM habit_participants hp
     JOIN habits h ON hp.habitId = h.id
     JOIN users u ON h.userId = u.id
     WHERE hp.userId = ?
     ORDER BY hp.joinedAt DESC`,
    [userId]
  );

  return rows;
}

/**
 * Get participant count for a habit
 */
export async function getParticipantCount(habitId: string): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM habit_participants WHERE habitId = ?",
    [habitId]
  );
  return result?.count ?? 0;
}

/**
 * Remove all participants when habit is deleted
 */
export async function removeAllParticipants(habitId: string): Promise<void> {
  await execute("DELETE FROM habit_participants WHERE habitId = ?", [habitId]);
  logger.info("Removed all participants from habit", { habitId });
}
