/**
 * Sync Queue Service - Offline-first sync mechanism
 * Pattern: [User Action] → [SQLite Write] → [UI Update] → [Sync Queue] → [Cloud Sync]
 */

import { query, queryFirst, execute } from "../storage/database";
import { logger } from "../lib/logger";

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";

export type SyncStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface SyncQueueItem {
  id: number;
  operation: SyncOperation;
  tableName: string;
  recordId: string;
  payload: string;
  status: SyncStatus;
  attempts: number;
  lastAttemptAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

const MAX_RETRIES = 3;

// Note: Retry delay is used in processQueue for backoff strategies (future enhancement)

/**
 * Add an operation to the sync queue
 */
export async function enqueue(
  operation: SyncOperation,
  tableName: string,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO sync_queue (operation, tableName, recordId, payload, status, createdAt)
     VALUES (?, ?, ?, ?, 'PENDING', ?)`,
    [operation, tableName, recordId, JSON.stringify(payload), now]
  );

  logger.info("Sync item queued", { operation, tableName, recordId });
}

/**
 * Get all pending items from the sync queue
 */
export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return query<SyncQueueItem>(
    `SELECT * FROM sync_queue 
     WHERE status = 'PENDING' OR (status = 'FAILED' AND attempts < ?)
     ORDER BY createdAt ASC`,
    [MAX_RETRIES]
  );
}

/**
 * Get count of pending items
 */
export async function getPendingCount(): Promise<number> {
  const result = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue 
     WHERE status = 'PENDING' OR (status = 'FAILED' AND attempts < ?)`,
    [MAX_RETRIES]
  );
  return result?.count || 0;
}

/**
 * Mark an item as in progress
 */
export async function markInProgress(id: number): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    `UPDATE sync_queue SET status = 'IN_PROGRESS', lastAttemptAt = ?, attempts = attempts + 1 
     WHERE id = ?`,
    [now, id]
  );
}

/**
 * Mark an item as completed
 */
export async function markCompleted(id: number): Promise<void> {
  const now = new Date().toISOString();
  await execute("UPDATE sync_queue SET status = 'COMPLETED', completedAt = ? WHERE id = ?", [
    now,
    id,
  ]);
  logger.info("Sync item completed", { id });
}

/**
 * Mark an item as failed
 */
export async function markFailed(id: number, error?: string): Promise<void> {
  await execute("UPDATE sync_queue SET status = 'FAILED' WHERE id = ?", [id]);
  logger.warn("Sync item failed", { id, error });
}

/**
 * Remove completed items older than specified days
 */
export async function cleanupCompleted(daysOld: number = 7): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await execute(
    "DELETE FROM sync_queue WHERE status = 'COMPLETED' AND completedAt < ?",
    [cutoff.toISOString()]
  );

  if (result.changes > 0) {
    logger.info("Cleaned up sync queue", { removed: result.changes });
  }

  return result.changes;
}

/**
 * Clear all items from queue (for testing or account deletion)
 */
export async function clearQueue(): Promise<void> {
  await execute("DELETE FROM sync_queue");
  logger.info("Sync queue cleared");
}

/**
 * Sync handler type - implement per table/operation
 */
export type SyncHandler = (
  item: SyncQueueItem,
  payload: Record<string, unknown>
) => Promise<boolean>;

// Registry of sync handlers
const handlers: Map<string, SyncHandler> = new Map();

/**
 * Register a sync handler for a table
 */
export function registerSyncHandler(tableName: string, handler: SyncHandler): void {
  handlers.set(tableName, handler);
  logger.info("Sync handler registered", { tableName });
}

/**
 * Process the sync queue
 * Call this when network becomes available
 */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const items = await getPendingItems();
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    const handler = handlers.get(item.tableName);

    if (!handler) {
      logger.warn("No sync handler for table", { tableName: item.tableName });
      await markFailed(item.id, "No handler registered");
      failed++;
      continue;
    }

    try {
      await markInProgress(item.id);
      const payload = JSON.parse(item.payload);
      const success = await handler(item, payload);

      if (success) {
        await markCompleted(item.id);
        processed++;
      } else {
        await markFailed(item.id, "Handler returned false");
        failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await markFailed(item.id, message);
      failed++;

      // If we've hit max retries, log as error
      if (item.attempts >= MAX_RETRIES - 1) {
        logger.error("Sync item exceeded max retries", { id: item.id, tableName: item.tableName });
      }
    }
  }

  if (processed > 0 || failed > 0) {
    logger.info("Sync queue processed", { processed, failed });
  }

  return { processed, failed };
}

/**
 * Create a sync service that processes queue periodically
 */
export function createSyncService(intervalMs: number = 30000) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;

  const start = () => {
    if (intervalId) return;

    intervalId = setInterval(async () => {
      if (isProcessing) return;

      isProcessing = true;
      try {
        await processQueue();
        await cleanupCompleted();
      } finally {
        isProcessing = false;
      }
    }, intervalMs);

    logger.info("Sync service started", { intervalMs });
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      logger.info("Sync service stopped");
    }
  };

  const processNow = async () => {
    if (isProcessing) return { processed: 0, failed: 0 };

    isProcessing = true;
    try {
      return await processQueue();
    } finally {
      isProcessing = false;
    }
  };

  return { start, stop, processNow };
}

// Export a default sync service instance
export const syncService = createSyncService();
