/**
 * Sync Handlers - Register sync handlers for each table
 * These handle syncing local SQLite changes to Supabase cloud replica
 *
 * Architecture: SQLite (local) → Sync Queue → Supabase (cloud)
 */

import { registerSyncHandler, type SyncQueueItem } from "./sync";
import { supabaseDb, isSupabaseConfigured } from "./supabase";
import { markGoalSynced } from "../storage/goals";
import { markHabitSynced } from "../storage/habits";
import { markCheckInSynced } from "../storage/checkIns";
import { logger } from "../lib/logger";
import type { Goal, Habit, HabitCheckIn } from "../types";
import { env } from "../config/env";

/**
 * Convert SQLite camelCase fields to Postgres snake_case
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Initialize all sync handlers
 * Call this at app startup
 */
export function initializeSyncHandlers(): void {
  // Check if cloud sync is enabled
  if (!env.ENABLE_CLOUD_SYNC) {
    logger.info("Cloud sync disabled, skipping handler initialization");
    return;
  }

  if (!isSupabaseConfigured()) {
    logger.warn("Supabase not configured, sync handlers will fail");
  }

  // Goals sync handler
  registerSyncHandler("goals", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const goal = payload as unknown as Goal;
    const cloudData = toSnakeCase(goal);

    switch (item.operation) {
      case "CREATE": {
        const { error } = await supabaseDb.upsert("goals", cloudData);
        if (error) {
          logger.error("Failed to sync goal creation", { goalId: goal.id, error: error.message });
          return false;
        }
        await markGoalSynced(goal.id);
        return true;
      }

      case "UPDATE": {
        const { error } = await supabaseDb.update(
          "goals",
          goal.id,
          toSnakeCase({
            title: goal.title,
            pillar: goal.pillar,
            privacy: goal.privacy,
            isArchived: goal.isArchived,
            updatedAt: new Date().toISOString(),
          })
        );
        if (error) {
          logger.error("Failed to sync goal update", { goalId: goal.id, error: error.message });
          return false;
        }
        await markGoalSynced(goal.id);
        return true;
      }

      case "DELETE": {
        const { error } = await supabaseDb.delete("goals", item.recordId);
        if (error) {
          logger.error("Failed to sync goal deletion", {
            goalId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      default:
        logger.warn("Unknown sync operation for goals", { operation: item.operation });
        return false;
    }
  });

  // Habits sync handler
  registerSyncHandler("habits", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const habit = payload as unknown as Habit;
    const cloudData = toSnakeCase(habit);

    switch (item.operation) {
      case "CREATE": {
        const { error } = await supabaseDb.upsert("habits", cloudData);
        if (error) {
          logger.error("Failed to sync habit creation", {
            habitId: habit.id,
            error: error.message,
          });
          return false;
        }
        await markHabitSynced(habit.id);
        return true;
      }

      case "UPDATE": {
        const { error } = await supabaseDb.update(
          "habits",
          habit.id,
          toSnakeCase({
            title: habit.title,
            pillar: habit.pillar,
            schedule: habit.schedule,
            privacy: habit.privacy,
            isArchived: habit.isArchived,
            currentStreak: habit.currentStreak,
            longestStreak: habit.longestStreak,
            lastCheckInAt: habit.lastCheckInAt,
            updatedAt: new Date().toISOString(),
          })
        );
        if (error) {
          logger.error("Failed to sync habit update", { habitId: habit.id, error: error.message });
          return false;
        }
        await markHabitSynced(habit.id);
        return true;
      }

      case "DELETE": {
        const { error } = await supabaseDb.delete("habits", item.recordId);
        if (error) {
          logger.error("Failed to sync habit deletion", {
            habitId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      default:
        logger.warn("Unknown sync operation for habits", { operation: item.operation });
        return false;
    }
  });

  // CheckIns sync handler
  registerSyncHandler(
    "habit_check_ins",
    async (item: SyncQueueItem, payload: Record<string, unknown>) => {
      const checkIn = payload as unknown as HabitCheckIn;
      const cloudData = toSnakeCase(checkIn);

      switch (item.operation) {
        case "CREATE": {
          const { error } = await supabaseDb.upsert("habit_check_ins", cloudData);
          if (error) {
            logger.error("Failed to sync check-in creation", {
              checkInId: checkIn.id,
              error: error.message,
            });
            return false;
          }
          await markCheckInSynced(checkIn.id, new Date().toISOString());
          return true;
        }

        case "DELETE": {
          const { error } = await supabaseDb.delete("habit_check_ins", item.recordId);
          if (error) {
            logger.error("Failed to sync check-in deletion", {
              checkInId: item.recordId,
              error: error.message,
            });
            return false;
          }
          return true;
        }

        default:
          logger.warn("Unknown sync operation for check-ins", { operation: item.operation });
          return false;
      }
    }
  );

  // Posts sync handler
  registerSyncHandler("posts", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const cloudData = toSnakeCase(payload);

    switch (item.operation) {
      case "CREATE": {
        const { error } = await supabaseDb.upsert("posts", cloudData);
        if (error) {
          logger.error("Failed to sync post creation", {
            postId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      case "UPDATE": {
        const { error } = await supabaseDb.update("posts", item.recordId, cloudData);
        if (error) {
          logger.error("Failed to sync post update", {
            postId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      case "DELETE": {
        const { error } = await supabaseDb.delete("posts", item.recordId);
        if (error) {
          logger.error("Failed to sync post deletion", {
            postId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      default:
        logger.warn("Unknown sync operation for posts", { operation: item.operation });
        return false;
    }
  });

  // Reactions sync handler
  registerSyncHandler(
    "reactions",
    async (item: SyncQueueItem, payload: Record<string, unknown>) => {
      const cloudData = toSnakeCase(payload);

      switch (item.operation) {
        case "CREATE": {
          const { error } = await supabaseDb.upsert("reactions", cloudData);
          if (error) {
            logger.error("Failed to sync reaction creation", {
              reactionId: item.recordId,
              error: error.message,
            });
            return false;
          }
          return true;
        }

        case "DELETE": {
          const { error } = await supabaseDb.delete("reactions", item.recordId);
          if (error) {
            logger.error("Failed to sync reaction deletion", {
              reactionId: item.recordId,
              error: error.message,
            });
            return false;
          }
          return true;
        }

        default:
          logger.warn("Unknown sync operation for reactions", { operation: item.operation });
          return false;
      }
    }
  );

  // Friendships sync handler
  registerSyncHandler(
    "friendships",
    async (item: SyncQueueItem, payload: Record<string, unknown>) => {
      const cloudData = toSnakeCase(payload);

      switch (item.operation) {
        case "CREATE":
        case "UPDATE": {
          const { error } = await supabaseDb.upsert("friendships", cloudData);
          if (error) {
            logger.error("Failed to sync friendship", {
              friendshipId: item.recordId,
              error: error.message,
            });
            return false;
          }
          return true;
        }

        case "DELETE": {
          const { error } = await supabaseDb.delete("friendships", item.recordId);
          if (error) {
            logger.error("Failed to sync friendship deletion", {
              friendshipId: item.recordId,
              error: error.message,
            });
            return false;
          }
          return true;
        }

        default:
          logger.warn("Unknown sync operation for friendships", { operation: item.operation });
          return false;
      }
    }
  );

  // Nudges sync handler
  registerSyncHandler("nudges", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const cloudData = toSnakeCase(payload);

    switch (item.operation) {
      case "CREATE": {
        const { error } = await supabaseDb.upsert("nudges", cloudData);
        if (error) {
          logger.error("Failed to sync nudge creation", {
            nudgeId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      default:
        logger.warn("Unknown sync operation for nudges", { operation: item.operation });
        return false;
    }
  });

  // Badges sync handler
  registerSyncHandler("badges", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const cloudData = toSnakeCase(payload);

    switch (item.operation) {
      case "CREATE": {
        const { error } = await supabaseDb.upsert("badges", cloudData);
        if (error) {
          logger.error("Failed to sync badge creation", {
            badgeId: item.recordId,
            error: error.message,
          });
          return false;
        }
        return true;
      }

      default:
        logger.warn("Unknown sync operation for badges", { operation: item.operation });
        return false;
    }
  });

  logger.info("Sync handlers initialized with Supabase");
}
