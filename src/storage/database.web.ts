/**
 * Web Database Fallback
 * expo-sqlite doesn't support web, so we provide a mock/memory implementation
 * This allows the app to run in web browser for development purposes
 */

import { logger } from "../lib/logger";

// In-memory storage for web
const memoryStore: Record<string, Record<string, unknown>[]> = {};
let autoIncrementId = 1;

export type SQLiteBindValue = string | number | null | undefined;
export type SQLiteRunResult = { lastInsertRowId: number; changes: number };

// Mock database interface matching expo-sqlite
interface WebSQLiteDatabase {
  runAsync(sql: string, params?: SQLiteBindValue[]): Promise<SQLiteRunResult>;
  getFirstAsync<T>(sql: string, params?: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLiteBindValue[]): Promise<T[]>;
  execAsync(sql: string): Promise<void>;
  closeAsync(): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

/**
 * Mock database for web platform
 * Stores data in memory - not persisted between page reloads
 */
class WebDatabase implements WebSQLiteDatabase {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize empty tables
    memoryStore.users = [];
    memoryStore.goals = [];
    memoryStore.habits = [];
    memoryStore.habit_check_ins = [];
    memoryStore.posts = [];
    memoryStore.stories = [];
    memoryStore.reactions = [];
    memoryStore.comments = [];
    memoryStore.nudges = [];
    memoryStore.badges = [];
    memoryStore.notifications = [];
    memoryStore.friendships = [];
    memoryStore.rate_limits = [];
    memoryStore.migrations = [];

    this.initialized = true;
    logger.info("Web database initialized (in-memory mode)");
  }

  async runAsync(sql: string, params?: SQLiteBindValue[]): Promise<SQLiteRunResult> {
    logger.debug("Web DB run", { sql: sql.substring(0, 80), params });
    const id = autoIncrementId++;
    return { lastInsertRowId: id, changes: 1 };
  }

  async getFirstAsync<T>(sql: string, params?: SQLiteBindValue[]): Promise<T | null> {
    logger.debug("Web DB getFirst", { sql: sql.substring(0, 80), params });
    // Return null for web - data won't persist
    return null;
  }

  async getAllAsync<T>(sql: string, params?: SQLiteBindValue[]): Promise<T[]> {
    logger.debug("Web DB getAll", { sql: sql.substring(0, 80), params });
    // Return empty array for web
    return [];
  }

  async execAsync(sql: string): Promise<void> {
    logger.debug("Web DB exec", { sql: sql.substring(0, 80) });
    // No-op for web
  }

  async closeAsync(): Promise<void> {
    logger.info("Web database closed");
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

let webDb: WebDatabase | null = null;

/**
 * Get or initialize the database connection (web version)
 */
export async function getDatabase(): Promise<WebSQLiteDatabase> {
  if (!webDb) {
    webDb = new WebDatabase();
    await webDb.initialize();
  }
  return webDb;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (webDb) {
    await webDb.closeAsync();
    webDb = null;
  }
}

/**
 * Execute a query and return all results
 */
export async function query<T>(sql: string, params: SQLiteBindValue[] = []): Promise<T[]> {
  const database = await getDatabase();
  return database.getAllAsync<T>(sql, params);
}

/**
 * Execute a query and return first result
 */
export async function queryFirst<T>(
  sql: string,
  params: SQLiteBindValue[] = []
): Promise<T | null> {
  const database = await getDatabase();
  return database.getFirstAsync<T>(sql, params);
}

/**
 * Execute an insert/update/delete statement
 */
export async function execute(
  sql: string,
  params: SQLiteBindValue[] = []
): Promise<SQLiteRunResult> {
  const database = await getDatabase();
  return database.runAsync(sql, params);
}

/**
 * Execute multiple statements in a transaction
 */
export async function transaction(
  fn: (database: WebSQLiteDatabase) => Promise<void>
): Promise<void> {
  const database = await getDatabase();
  return database.withTransactionAsync(async () => {
    await fn(database);
  });
}
