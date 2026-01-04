/**
 * SQLite Database - Local Source of Truth
 * Device-first architecture: all writes go here first, then sync to cloud
 */

import * as SQLite from "expo-sqlite";
import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";
import { logger } from "../lib/logger";

const DB_NAME = "social_accountability.db";
const CURRENT_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
    logger.info("Database initialized", { name: DB_NAME, version: CURRENT_VERSION });
    return db;
  } catch (error) {
    logger.error("Database initialization failed", { error });
    throw error;
  }
}

/**
 * Close database connection (for cleanup/testing)
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    logger.info("Database closed");
  }
}

/**
 * Run database migrations
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations table if it doesn't exist
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);

  // Get current version
  const result = await database.getFirstAsync<{ version: number }>(
    "SELECT MAX(version) as version FROM migrations"
  );
  const currentVersion = result?.version || 0;

  // Run pending migrations
  for (let version = currentVersion + 1; version <= CURRENT_VERSION; version++) {
    await applyMigration(database, version);
  }
}

/**
 * Apply a specific migration version
 */
async function applyMigration(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  logger.info("Applying migration", { version });

  try {
    switch (version) {
      case 1:
        await migrationV1(database);
        break;
      case 2:
        await migrationV2(database);
        break;
      default:
        throw new Error(`Unknown migration version: ${version}`);
    }

    // Record migration
    await database.runAsync("INSERT INTO migrations (version, appliedAt) VALUES (?, ?)", [
      version,
      new Date().toISOString(),
    ]);

    logger.info("Migration applied", { version });
  } catch (error) {
    logger.error("Migration failed", { version, error });
    throw error;
  }
}

/**
 * Migration V1: Initial schema for M1
 * Users, friendships, sync queue, and settings
 */
async function migrationV1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Users table (local cache of user data)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      appleId TEXT,
      displayName TEXT NOT NULL,
      email TEXT,
      photoUrl TEXT,
      bio TEXT,
      defaultPrivacy TEXT NOT NULL DEFAULT 'SELF',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      syncedAt TEXT
    );

    -- Current session (single row table)
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      userId TEXT NOT NULL,
      token TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );

    -- Friendships table
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      UNIQUE(userId, friendId)
    );

    -- Friend requests (pending)
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      syncedAt TEXT
    );

    -- Blocked users
    CREATE TABLE IF NOT EXISTS blocked_users (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      blockedUserId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      UNIQUE(userId, blockedUserId)
    );

    -- Sync queue for offline-first operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      tableName TEXT NOT NULL,
      recordId TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      lastAttemptAt TEXT,
      createdAt TEXT NOT NULL,
      completedAt TEXT
    );

    -- App settings (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_friendships_userId ON friendships(userId);
    CREATE INDEX IF NOT EXISTS idx_friendships_friendId ON friendships(friendId);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_toUserId ON friend_requests(toUserId);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);
}

/**
 * Migration V2: Goals and Habits tables for M2
 */
async function migrationV2(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Goals table
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      pillar TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'SELF',
      isArchived INTEGER NOT NULL DEFAULT 0,
      archivedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT
    );

    -- Habits table
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      goalId TEXT,
      parentHabitId TEXT,
      title TEXT NOT NULL,
      pillar TEXT NOT NULL,
      schedule TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'SELF',
      isArchived INTEGER NOT NULL DEFAULT 0,
      archivedAt TEXT,
      currentStreak INTEGER NOT NULL DEFAULT 0,
      longestStreak INTEGER NOT NULL DEFAULT 0,
      lastCheckInAt TEXT,
      lastMissedAt TEXT,
      recoveryStreak INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (goalId) REFERENCES goals(id),
      FOREIGN KEY (parentHabitId) REFERENCES habits(id)
    );

    -- Habit check-ins table
    CREATE TABLE IF NOT EXISTS habit_check_ins (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      occurredAt TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL',
      evidenceRef TEXT,
      note TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    -- Indexes for goals/habits queries
    CREATE INDEX IF NOT EXISTS idx_goals_userId ON goals(userId);
    CREATE INDEX IF NOT EXISTS idx_goals_pillar ON goals(pillar);
    CREATE INDEX IF NOT EXISTS idx_habits_userId ON habits(userId);
    CREATE INDEX IF NOT EXISTS idx_habits_goalId ON habits(goalId);
    CREATE INDEX IF NOT EXISTS idx_habits_pillar ON habits(pillar);
    CREATE INDEX IF NOT EXISTS idx_check_ins_habitId ON habit_check_ins(habitId);
    CREATE INDEX IF NOT EXISTS idx_check_ins_occurredAt ON habit_check_ins(occurredAt);
  `);
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
 * Note: Returns void due to expo-sqlite's transaction API
 */
export async function transaction(
  fn: (database: SQLite.SQLiteDatabase) => Promise<void>
): Promise<void> {
  const database = await getDatabase();
  return database.withTransactionAsync(async () => {
    await fn(database);
  });
}
