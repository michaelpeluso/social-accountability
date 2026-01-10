/**
 * SQLite Database - Local Source of Truth
 * Device-first architecture: all writes go here first, then sync to cloud
 */

import * as SQLite from "expo-sqlite";
import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";
import { logger } from "../lib/logger";

const DB_NAME = "social_accountability.db";
const CURRENT_VERSION = 7;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);

    // Validate schema after migrations
    await validateCriticalColumns(db);

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
      case 3:
        await migrationV3(database);
        break;
      case 4:
        await migrationV4(database);
        break;
      case 5:
        await migrationV5(database);
        break;
      case 6:
        await migrationV6(database);
        break;
      case 7:
        await migrationV7(database);
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
 * Validate critical columns exist after migrations
 * If validation fails, log detailed error to help debug
 */
async function validateCriticalColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check habit_check_ins table (only if it exists)
    const checkInsInfo = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(habit_check_ins)"
    );

    // If table doesn't exist yet, skip validation (migrations will create it)
    if (checkInsInfo.length === 0) {
      logger.info("habit_check_ins table not yet created, skipping validation");
      return;
    }

    const checkInsColumns = checkInsInfo.map((col) => col.name);

    const missingColumns: string[] = [];

    if (!checkInsColumns.includes("habitId")) {
      missingColumns.push("habit_check_ins.habitId");
    }
    if (!checkInsColumns.includes("userId")) {
      missingColumns.push("habit_check_ins.userId");
    }

    if (missingColumns.length > 0) {
      logger.error("Database schema validation failed - missing columns", {
        missingColumns,
        actualColumns: checkInsColumns,
        table: "habit_check_ins",
      });

      throw new Error(
        `Database schema corrupted. Missing columns: ${missingColumns.join(", ")}. ` +
          `Please delete and reinstall the app to fix.`
      );
    }

    logger.info("Database schema validation passed", {
      checkInsColumns,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing columns")) {
      throw error; // Re-throw our validation error
    }
    logger.error("Schema validation check failed", { error });
    // Don't throw on validation errors - let app continue
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
 * Migration V3: Add description and deadline fields
 */
async function migrationV3(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if columns already exist to avoid errors
  const goalsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(goals)");
  const habitsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(habits)");

  const goalsColumns = goalsInfo.map((col) => col.name);
  const habitsColumns = habitsInfo.map((col) => col.name);

  // Add goals columns if they don't exist
  if (!goalsColumns.includes("description")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN description TEXT;`);
  }
  if (!goalsColumns.includes("deadline")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN deadline TEXT;`);
  }

  // Add habits description if it doesn't exist
  if (!habitsColumns.includes("description")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN description TEXT;`);
  }
}

/**
 * Migration V4: Add habit type, measurement, visual, and flexibility fields
 */
async function migrationV4(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check existing columns
  const goalsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(goals)");
  const habitsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(habits)");
  const checkInsInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(habit_check_ins)"
  );

  const goalsColumns = goalsInfo.map((col) => col.name);
  const habitsColumns = habitsInfo.map((col) => col.name);
  const checkInsColumns = checkInsInfo.map((col) => col.name);

  // Goals: vacation mode
  if (!goalsColumns.includes("vacationMode")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN vacationMode INTEGER DEFAULT 0;`);
  }
  if (!goalsColumns.includes("vacationEndsAt")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN vacationEndsAt TEXT;`);
  }

  // Habits: type & measurement
  if (!habitsColumns.includes("habitType")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN habitType TEXT DEFAULT 'BUILD';`);
  }
  if (!habitsColumns.includes("completionType")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN completionType TEXT DEFAULT 'BINARY';`);
  }
  if (!habitsColumns.includes("targetValue")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN targetValue REAL;`);
  }
  if (!habitsColumns.includes("unit")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN unit TEXT;`);
  }

  // Habits: visual
  if (!habitsColumns.includes("icon")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN icon TEXT;`);
  }
  if (!habitsColumns.includes("tags")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN tags TEXT;`); // JSON array
  }

  // Habits: scheduling & flexibility
  if (!habitsColumns.includes("timezone")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN timezone TEXT;`);
  }
  if (!habitsColumns.includes("difficulty")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN difficulty INTEGER;`);
  }
  if (!habitsColumns.includes("miniVersion")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN miniVersion TEXT;`);
  }
  if (!habitsColumns.includes("graceDays")) {
    await database.execAsync(`ALTER TABLE habits ADD COLUMN graceDays INTEGER DEFAULT 0;`);
  }

  // Check-ins: value for count/duration
  if (!checkInsColumns.includes("value")) {
    await database.execAsync(`ALTER TABLE habit_check_ins ADD COLUMN value REAL;`);
  }
}

/**
 * Migration V5: Add enhanced goal fields (type, measurement, timeframe, linking)
 */
async function migrationV5(database: SQLite.SQLiteDatabase): Promise<void> {
  const goalsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(goals)");
  const goalsColumns = goalsInfo.map((col) => col.name);

  // Goal type & measurement
  if (!goalsColumns.includes("goalType")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN goalType TEXT DEFAULT 'CUSTOM';`);
  }
  if (!goalsColumns.includes("metric")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN metric TEXT;`);
  }
  if (!goalsColumns.includes("customMetric")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN customMetric TEXT;`);
  }

  // Goal values
  if (!goalsColumns.includes("isIndefinite")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN isIndefinite INTEGER DEFAULT 0;`);
  }
  if (!goalsColumns.includes("startValue")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN startValue REAL;`);
  }
  if (!goalsColumns.includes("targetValue")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN targetValue REAL;`);
  }
  if (!goalsColumns.includes("currentValue")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN currentValue REAL;`);
  }

  // Timeframe
  if (!goalsColumns.includes("startDate")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN startDate TEXT;`);
  }
  if (!goalsColumns.includes("endDate")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN endDate TEXT;`);
  }
  if (!goalsColumns.includes("timeframeType")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN timeframeType TEXT DEFAULT 'FIXED';`);
  }
  if (!goalsColumns.includes("isRepeating")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN isRepeating INTEGER DEFAULT 0;`);
  }
  if (!goalsColumns.includes("repeatInterval")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN repeatInterval TEXT;`);
  }

  // Data source & linking
  if (!goalsColumns.includes("dataSource")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN dataSource TEXT DEFAULT 'MANUAL';`);
  }
  if (!goalsColumns.includes("linkedHabitIds")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN linkedHabitIds TEXT;`); // JSON array
  }
}

/**
 * Migration V6: Simplify goals - remove goalType/metric/timeframe/repeating, add identityId, merge deadline
 */
async function migrationV6(database: SQLite.SQLiteDatabase): Promise<void> {
  const goalsInfo = await database.getAllAsync<{ name: string }>("PRAGMA table_info(goals)");
  const goalsColumns = goalsInfo.map((col) => col.name);

  // Add identityId for linking to identities (M4)
  if (!goalsColumns.includes("identityId")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN identityId TEXT;`);
  }

  // Remove endDate column (deadline is now the only date field besides startDate)
  // Note: SQLite doesn't support DROP COLUMN easily, so we'll just ignore endDate in queries
  // Migration preserves existing data but new code won't use goalType, metric, customMetric,
  // endDate, timeframeType, isRepeating, repeatInterval

  // Add deadline if missing (merged from endDate for backwards compatibility)
  if (!goalsColumns.includes("deadline")) {
    await database.execAsync(`ALTER TABLE goals ADD COLUMN deadline TEXT;`);
    // Copy endDate to deadline for existing goals
    await database.execAsync(
      `UPDATE goals SET deadline = endDate WHERE deadline IS NULL AND endDate IS NOT NULL;`
    );
  }

  // Create identities table (M4 will populate presets)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS identities (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      pillar TEXT NOT NULL,
      icon TEXT NOT NULL,
      preset INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_identities_userId ON identities(userId);
  `);
}

/**
 * Migration V7: Social tables for M3 (posts, reactions, nudges, badges, notifications)
 */
async function migrationV7(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Posts table
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorUserId TEXT NOT NULL,
      circleId TEXT,
      pillar TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'FRIENDS',
      bodyText TEXT,
      mediaUrl TEXT,
      linkedCheckInId TEXT,
      linkedHabitId TEXT,
      editedAt TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (linkedCheckInId) REFERENCES habit_check_ins(id),
      FOREIGN KEY (linkedHabitId) REFERENCES habits(id)
    );

    -- Reactions table
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      userId TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(postId, userId)
    );

    -- Nudges table
    CREATE TABLE IF NOT EXISTS nudges (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      templateId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT
    );

    -- Badges table
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      badgeType TEXT NOT NULL,
      earnedAt TEXT NOT NULL,
      sharedAt TEXT,
      syncedAt TEXT,
      UNIQUE(userId, badgeType)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    -- Habit participants (for habit joining feature)
    CREATE TABLE IF NOT EXISTS habit_participants (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joinedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      UNIQUE(habitId, userId)
    );

    -- Rate limit tracking
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      targetId TEXT,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(userId, actionType, targetId, date)
    );

    -- Indexes for social queries
    CREATE INDEX IF NOT EXISTS idx_posts_authorUserId ON posts(authorUserId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);
    CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy);
    CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);
    CREATE INDEX IF NOT EXISTS idx_reactions_userId ON reactions(userId);
    CREATE INDEX IF NOT EXISTS idx_nudges_fromUserId ON nudges(fromUserId);
    CREATE INDEX IF NOT EXISTS idx_nudges_toUserId ON nudges(toUserId);
    CREATE INDEX IF NOT EXISTS idx_nudges_createdAt ON nudges(createdAt);
    CREATE INDEX IF NOT EXISTS idx_badges_userId ON badges(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_habit_participants_habitId ON habit_participants(habitId);
    CREATE INDEX IF NOT EXISTS idx_habit_participants_userId ON habit_participants(userId);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_userId_date ON rate_limits(userId, date);
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
