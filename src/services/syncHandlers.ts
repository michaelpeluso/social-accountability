/**
 * Sync Handlers - Register sync handlers for each table
 * These handle syncing local changes to the cloud
 */

import { registerSyncHandler, type SyncQueueItem } from "./sync";
import { api } from "./api";
import { markGoalSynced } from "../storage/goals";
import { markHabitSynced } from "../storage/habits";
import { markCheckInSynced } from "../storage/checkIns";
import { logger } from "../lib/logger";
import type { Goal, Habit, HabitCheckIn } from "../types";

/**
 * Initialize all sync handlers
 * Call this at app startup
 */
export function initializeSyncHandlers(): void {
  // Goals sync handler
  registerSyncHandler("goals", async (item: SyncQueueItem, payload: Record<string, unknown>) => {
    const goal = payload as unknown as Goal;

    switch (item.operation) {
      case "CREATE": {
        const result = await api.goals.create(goal);
        if ("error" in result) {
          logger.error("Failed to sync goal creation", { goalId: goal.id, error: result.error });
          return false;
        }
        await markGoalSynced(goal.id);
        return true;
      }

      case "UPDATE": {
        const result = await api.goals.update(goal.id, {
          title: goal.title,
          pillar: goal.pillar,
          privacy: goal.privacy,
          isArchived: goal.isArchived,
        });
        if ("error" in result) {
          logger.error("Failed to sync goal update", { goalId: goal.id, error: result.error });
          return false;
        }
        await markGoalSynced(goal.id);
        return true;
      }

      case "DELETE": {
        const result = await api.goals.delete(item.recordId);
        if ("error" in result) {
          logger.error("Failed to sync goal deletion", {
            goalId: item.recordId,
            error: result.error,
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

    switch (item.operation) {
      case "CREATE": {
        const result = await api.habits.create(habit);
        if ("error" in result) {
          logger.error("Failed to sync habit creation", { habitId: habit.id, error: result.error });
          return false;
        }
        await markHabitSynced(habit.id);
        return true;
      }

      case "UPDATE": {
        const result = await api.habits.update(habit.id, {
          title: habit.title,
          pillar: habit.pillar,
          schedule: habit.schedule,
          privacy: habit.privacy,
          isArchived: habit.isArchived,
        });
        if ("error" in result) {
          logger.error("Failed to sync habit update", { habitId: habit.id, error: result.error });
          return false;
        }
        await markHabitSynced(habit.id);
        return true;
      }

      case "DELETE": {
        const result = await api.habits.delete(item.recordId);
        if ("error" in result) {
          logger.error("Failed to sync habit deletion", {
            habitId: item.recordId,
            error: result.error,
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

      switch (item.operation) {
        case "CREATE": {
          const result = await api.checkIns.create(checkIn);
          if ("error" in result) {
            logger.error("Failed to sync check-in creation", {
              checkInId: checkIn.id,
              error: result.error,
            });
            return false;
          }
          await markCheckInSynced(checkIn.id, new Date().toISOString());
          return true;
        }

        case "DELETE": {
          const result = await api.checkIns.delete(item.recordId);
          if ("error" in result) {
            logger.error("Failed to sync check-in deletion", {
              checkInId: item.recordId,
              error: result.error,
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

  logger.info("Sync handlers initialized");
}
