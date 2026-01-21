/**
 * SQLite Database - Local Source of Truth
 * Device-first architecture: all writes go here first, then sync to cloud
 *
 * NAMING CONVENTIONS (enforced across all tables):
 * - Boolean fields: `is` prefix (isPreset, isArchived, isRead, isCloseFriend)
 * - Timestamps: `At` suffix (createdAt, updatedAt, syncedAt, deletedAt, earnedAt)
 * - User references: `userId` only (JOIN with users table for name/photo)
 * - Foreign keys: simple `{table}Id` pattern (habitId, goalId, postId)
 * - Text content: `text` (short), `description` (long), `note` (annotations)
 * - JSON arrays: stored as TEXT, parsed in application layer
 * - Enums: stored as TEXT, validated in application layer
 *
 * NORMALIZATION: 3NF (Third Normal Form)
 * - No repeating groups (1NF)
 * - No partial dependencies (2NF)
 * - No transitive dependencies (3NF)
 * - User data not denormalized on content tables (JOIN for name/photo)
 *
 * SCHEMA VERSION HISTORY:
 * - v1: Initial consolidated schema supporting M0-M8+ milestones
 * - v2: Normalized user references, consolidated tags, updated reactions
 */

import * as SQLite from "expo-sqlite";
import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";
import { logger } from "../lib/logger";

const DB_NAME = "social_accountability.db";
const SCHEMA_VERSION = 6;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Check current version and run migrations if needed
    const currentVersion = await getCurrentSchemaVersion(db);

    if (currentVersion === 0) {
      // Fresh install - initialize schema
      await initializeSchema(db);
      await setSchemaVersion(db, SCHEMA_VERSION);
    } else if (currentVersion < SCHEMA_VERSION) {
      // Existing database - run migrations
      await migrateSchema(db, currentVersion);
      await setSchemaVersion(db, SCHEMA_VERSION);
    }
    // If currentVersion === SCHEMA_VERSION, schema is up to date

    logger.info("Database initialized", {
      name: DB_NAME,
      version: SCHEMA_VERSION,
      previousVersion: currentVersion,
    });
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
 * Get database info (for dev tools)
 */
export async function getDatabaseInfo(): Promise<{
  version: number;
  tables: string[];
  size: number;
  tableCounts: Record<string, number>;
  totalRows: number;
}> {
  const database = await getDatabase();

  const version = await getCurrentSchemaVersion(database);

  const tablesResult = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const tables = tablesResult.map((row) => row.name);

  // Get size using correct PRAGMA syntax
  const pageCountResult = await database.getFirstAsync<{ page_count: number }>("PRAGMA page_count");
  const pageSizeResult = await database.getFirstAsync<{ page_size: number }>("PRAGMA page_size");
  const size = (pageCountResult?.page_count ?? 0) * (pageSizeResult?.page_size ?? 0);

  // Get row counts for each table
  const tableCounts: Record<string, number> = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const countResult = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      const count = countResult?.count ?? 0;
      tableCounts[table] = count;
      totalRows += count;
    } catch (error) {
      tableCounts[table] = 0;
    }
  }

  return { version, tables, size, tableCounts, totalRows };
}

/**
 * Reset database (for dev tools - DESTRUCTIVE)
 * Drops all tables and reinitializes schema
 */
export async function resetDatabase(): Promise<void> {
  logger.warn("Resetting database - all data will be lost");

  const database = await getDatabase();

  // Get all tables
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  // Drop all tables
  for (const table of tables) {
    await database.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
  }

  // Reset version to 0
  await database.execAsync("PRAGMA user_version = 0");

  logger.info("All tables dropped, reinitializing schema");

  // Reinitialize schema
  await initializeSchema(database);
  await setSchemaVersion(database, SCHEMA_VERSION);

  logger.info("Database reset complete", { version: SCHEMA_VERSION });
}

/**
 * Get current schema version from database
 */
async function getCurrentSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    return result?.user_version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Set schema version in database
 */
async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await database.execAsync(`PRAGMA user_version = ${version}`);
}

/**
 * Run schema migrations from old version to current
 * NOTE: Pre-alpha - use Reset Database button instead of migrations
 */
async function migrateSchema(_database: SQLite.SQLiteDatabase, fromVersion: number): Promise<void> {
  logger.warn("Schema migration skipped - pre-alpha mode", {
    fromVersion,
    toVersion: SCHEMA_VERSION,
    message: "Use Reset Database button in dev tools to apply schema changes",
  });
}

/**
 * Initialize database schema - Complete M0-M8+ schema
 * Single clean schema - no incremental migrations
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- ============================================
    -- USERS & AUTHENTICATION (M0-M1)
    -- ============================================
    
    -- Users table (local cache of user data)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      appleId TEXT,
      displayName TEXT NOT NULL,
      email TEXT,
      photoUrl TEXT,
      bio TEXT,
      defaultPrivacy TEXT NOT NULL DEFAULT 'SELF',
      isVacationMode INTEGER NOT NULL DEFAULT 0,
      vacationEndsAt TEXT,
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
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- SOCIAL RELATIONSHIPS (M1, M4, M8)
    -- ============================================

    -- Friendships table
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      isCloseFriend INTEGER NOT NULL DEFAULT 0,
      acceptedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (friendId) REFERENCES users(id),
      UNIQUE(userId, friendId)
    );

    -- Blocked users
    CREATE TABLE IF NOT EXISTS blocked_users (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      blockedUserId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (blockedUserId) REFERENCES users(id),
      UNIQUE(userId, blockedUserId)
    );

    -- Circles (M8: Private groups)
    CREATE TABLE IF NOT EXISTS circles (
      id TEXT PRIMARY KEY,
      ownerUserId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      privacy TEXT NOT NULL DEFAULT 'INVITE_ONLY',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      archivedAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (ownerUserId) REFERENCES users(id)
    );

    -- Circle members
    CREATE TABLE IF NOT EXISTS circle_members (
      id TEXT PRIMARY KEY,
      circleId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joinedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (circleId) REFERENCES circles(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(circleId, userId)
    );

    -- Circle messages
    CREATE TABLE IF NOT EXISTS circle_messages (
      id TEXT PRIMARY KEY,
      circleId TEXT NOT NULL,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      mediaUrl TEXT,
      mediaType TEXT,
      createdAt TEXT NOT NULL,
      deletedAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (circleId) REFERENCES circles(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- IDENTITIES & GOALS (M2, M4)
    -- ============================================

    -- Identities table (M4)
    CREATE TABLE IF NOT EXISTS identities (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      pillar TEXT NOT NULL,
      icon TEXT NOT NULL,
      isPreset INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Goals table
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      identityId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      pillar TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'SELF',
      performancePrivacy TEXT DEFAULT 'FRIENDS',
      isIndefinite INTEGER NOT NULL DEFAULT 0,
      metricType TEXT NOT NULL DEFAULT 'COUNT',
      metricUnit TEXT,
      startValue REAL,
      targetValue REAL,
      currentValue REAL,
      startDate TEXT,
      deadline TEXT,
      dataSource TEXT NOT NULL DEFAULT 'MANUAL',
      linkedHabitIds TEXT,
      isVacationMode INTEGER NOT NULL DEFAULT 0,
      vacationEndsAt TEXT,
      completedAt TEXT,
      isArchived INTEGER NOT NULL DEFAULT 0,
      archivedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (identityId) REFERENCES identities(id)
    );

    -- Goal participants (for goal joining feature, M5)
    CREATE TABLE IF NOT EXISTS goal_participants (
      id TEXT PRIMARY KEY,
      goalId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      performancePrivacy TEXT NOT NULL DEFAULT 'FRIENDS',
      joinedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (goalId) REFERENCES goals(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(goalId, userId)
    );

    -- ============================================
    -- HABITS & CHECK-INS (M2, M4, M5)
    -- ============================================

    -- Habits table
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      goalId TEXT,
      identityId TEXT,
      parentHabitId TEXT,
      stackAfterHabitId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      pillar TEXT NOT NULL,
      habitType TEXT NOT NULL DEFAULT 'BUILD',
      completionType TEXT NOT NULL DEFAULT 'BINARY',
      targetValue REAL,
      unit TEXT,
      icon TEXT,
      tags TEXT,
      schedule TEXT NOT NULL,
      timezone TEXT,
      difficulty INTEGER,
      miniVersion TEXT,
      graceDays INTEGER NOT NULL DEFAULT 0,
      privacy TEXT NOT NULL DEFAULT 'SELF',
      performancePrivacy TEXT DEFAULT 'FRIENDS',
      isArchived INTEGER NOT NULL DEFAULT 0,
      archivedAt TEXT,
      currentStreak INTEGER NOT NULL DEFAULT 0,
      longestStreak INTEGER NOT NULL DEFAULT 0,
      lastCheckInAt TEXT,
      lastMissedAt TEXT,
      recoveryStreak INTEGER NOT NULL DEFAULT 0,
      bestTimeHour INTEGER,
      bestTimeConfidence REAL,
      environmentalCue TEXT,
      progressiveOverload TEXT,
      progressiveOverloadStart REAL,
      progressiveOverloadPrevious REAL,
      progressiveOverloadLastAppliedAt TEXT,
      isReminderEnabled INTEGER NOT NULL DEFAULT 0,
      reminderTimes TEXT,
      reminderText TEXT,
      reflectionPrompt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (goalId) REFERENCES goals(id),
      FOREIGN KEY (identityId) REFERENCES identities(id),
      FOREIGN KEY (parentHabitId) REFERENCES habits(id),
      FOREIGN KEY (stackAfterHabitId) REFERENCES habits(id)
    );

    -- Habit check-ins table
    CREATE TABLE IF NOT EXISTS habit_check_ins (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      occurredAt TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL',
      success INTEGER NOT NULL DEFAULT 1,
      value REAL,
      evidenceUrl TEXT,
      note TEXT,
      intensity INTEGER,
      outcome TEXT,
      moodBefore INTEGER,
      moodAfter INTEGER,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Habit participants (for habit joining feature, M5)
    CREATE TABLE IF NOT EXISTS habit_participants (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      performancePrivacy TEXT NOT NULL DEFAULT 'FRIENDS',
      joinedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(habitId, userId)
    );

    -- Habit stacks (M5: habit chaining)
    CREATE TABLE IF NOT EXISTS habit_stacks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      habitIds TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Habit triggers (M5: contextual triggers)
    CREATE TABLE IF NOT EXISTS habit_triggers (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      triggerType TEXT NOT NULL,
      locationId TEXT,
      timeRange TEXT,
      eventType TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    -- Saved locations (M5: location-based triggers)
    CREATE TABLE IF NOT EXISTS saved_locations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radiusMeters REAL NOT NULL DEFAULT 100,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- JOURNAL & MOOD (M4)
    -- ============================================

    -- Journal entries
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      pillar TEXT,
      privacy TEXT NOT NULL DEFAULT 'SELF',
      tags TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Mood entries (quick mood logging with optional micro-emotion)
    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mood INTEGER NOT NULL,
      emotion TEXT,
      note TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- INTEGRATIONS & AUTO-LOGGING (M5+)
    -- ============================================

    -- Connected integrations
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      provider TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      expiresAt TEXT,
      scopes TEXT,
      isEnabled INTEGER NOT NULL DEFAULT 1,
      lastSyncAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, provider)
    );

    -- Auto-logged data from integrations (supports multiple value types)
    CREATE TABLE IF NOT EXISTS auto_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      integrationId TEXT NOT NULL,
      metricType TEXT NOT NULL,
      valueType TEXT NOT NULL DEFAULT 'NUMBER',
      valueNumber REAL,
      valueBoolean INTEGER,
      valueTimestamp TEXT,
      unit TEXT,
      occurredAt TEXT NOT NULL,
      rawData TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (integrationId) REFERENCES integrations(id)
    );

    -- ============================================
    -- BEHAVIORAL DRIFT & ANALYTICS (M6)
    -- ============================================

    -- Behavioral drift detection
    CREATE TABLE IF NOT EXISTS behavioral_drift (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      habitId TEXT,
      pillar TEXT,
      driftType TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'LOW',
      detectedAt TEXT NOT NULL,
      resolvedAt TEXT,
      supportRequestedAt TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    -- ============================================
    -- CHALLENGES (M4+)
    -- ============================================

    -- User challenges (supports multiple habits/goals)
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      creatorUserId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      pillar TEXT,
      habitIds TEXT,
      goalIds TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'FRIENDS',
      isArchived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (creatorUserId) REFERENCES users(id)
    );

    -- Challenge participants
    CREATE TABLE IF NOT EXISTS challenge_participants (
      id TEXT PRIMARY KEY,
      challengeId TEXT NOT NULL,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      score REAL NOT NULL DEFAULT 0,
      progress REAL NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL,
      completedAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (challengeId) REFERENCES challenges(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(challengeId, userId)
    );

    -- ============================================
    -- SOCIAL CONTENT (M3)
    -- ============================================

    -- Posts table (JOIN with users for userName/userPhotoUrl)
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      circleId TEXT,
      pillar TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'FRIENDS',
      text TEXT,
      mediaUrl TEXT,
      mediaType TEXT,
      mediaAspectRatio TEXT,
      postTypeTags TEXT,
      customTags TEXT,
      checkInId TEXT,
      habitId TEXT,
      goalId TEXT,
      linkedObjectId TEXT,
      linkedObjectType TEXT,
      contextTimeOfDay TEXT,
      contextLocationId TEXT,
      editedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (circleId) REFERENCES circles(id),
      FOREIGN KEY (checkInId) REFERENCES habit_check_ins(id),
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (goalId) REFERENCES goals(id),
      FOREIGN KEY (contextLocationId) REFERENCES saved_locations(id)
    );

    -- Stories table (24h TTL ephemeral posts, M3)
    -- JOIN with users for userName/userPhotoUrl
    -- Badges generate their own auto-posts, not stored here
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      pillar TEXT NOT NULL,
      privacy TEXT NOT NULL DEFAULT 'FRIENDS',
      mediaUrl TEXT NOT NULL,
      mediaType TEXT NOT NULL,
      caption TEXT,
      tags TEXT,
      checkInId TEXT,
      habitId TEXT,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (checkInId) REFERENCES habit_check_ins(id),
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    -- Reactions table (either postId OR storyId must be set)
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      postId TEXT,
      storyId TEXT,
      userId TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (storyId) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id),
      CHECK (postId IS NOT NULL OR storyId IS NOT NULL),
      CHECK (NOT (postId IS NOT NULL AND storyId IS NOT NULL))
    );

    -- Comments table (posts only, 50 words max)
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      isArchived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Nudges table
    CREATE TABLE IF NOT EXISTS nudges (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      habitId TEXT,
      templateId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (fromUserId) REFERENCES users(id),
      FOREIGN KEY (toUserId) REFERENCES users(id),
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    -- ============================================
    -- GAMIFICATION & ENGAGEMENT (M3)
    -- ============================================

    -- Badges table
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      badgeName TEXT NOT NULL,
      pillar TEXT,
      habitId TEXT,
      tier INTEGER,
      metadata TEXT,
      earnedAt TEXT NOT NULL,
      sharedAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (habitId) REFERENCES habits(id),
      UNIQUE(userId, badgeName, pillar, habitId)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      data TEXT,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- TAGS (M4+)
    -- ============================================

    -- Tags table (user-defined tags, M4+)
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      slug TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      pillar TEXT,
      useCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, slug)
    );

    -- ============================================
    -- SYSTEM TABLES
    -- ============================================

    -- Rate limit tracking
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      targetId TEXT,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, actionType, targetId, date)
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
      completedAt TEXT,
      syncedAt TEXT
    );

    -- App settings (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- ============================================
    -- INDEXES FOR QUERY PERFORMANCE
    -- ============================================

    -- Users
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_appleId ON users(appleId);

    -- Session
    CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);

    -- Friendships
    CREATE INDEX IF NOT EXISTS idx_friendships_userId ON friendships(userId);
    CREATE INDEX IF NOT EXISTS idx_friendships_friendId ON friendships(friendId);
    CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
    CREATE INDEX IF NOT EXISTS idx_friendships_isCloseFriend ON friendships(userId, isCloseFriend);

    -- Blocked users
    CREATE INDEX IF NOT EXISTS idx_blocked_users_userId ON blocked_users(userId);

    -- Circles
    CREATE INDEX IF NOT EXISTS idx_circles_ownerUserId ON circles(ownerUserId);
    CREATE INDEX IF NOT EXISTS idx_circle_members_circleId ON circle_members(circleId);
    CREATE INDEX IF NOT EXISTS idx_circle_members_userId ON circle_members(userId);
    CREATE INDEX IF NOT EXISTS idx_circle_messages_circleId ON circle_messages(circleId);
    CREATE INDEX IF NOT EXISTS idx_circle_messages_userId ON circle_messages(userId);
    CREATE INDEX IF NOT EXISTS idx_circle_messages_createdAt ON circle_messages(createdAt DESC);

    -- Identities
    CREATE INDEX IF NOT EXISTS idx_identities_userId ON identities(userId);
    CREATE INDEX IF NOT EXISTS idx_identities_pillar ON identities(pillar);

    -- Goals
    CREATE INDEX IF NOT EXISTS idx_goals_userId ON goals(userId);
    CREATE INDEX IF NOT EXISTS idx_goals_identityId ON goals(identityId);
    CREATE INDEX IF NOT EXISTS idx_goals_pillar ON goals(pillar);
    CREATE INDEX IF NOT EXISTS idx_goals_completedAt ON goals(userId, completedAt);
    CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
    CREATE INDEX IF NOT EXISTS idx_goals_isArchived ON goals(isArchived);

    -- Goal participants
    CREATE INDEX IF NOT EXISTS idx_goal_participants_goalId ON goal_participants(goalId);
    CREATE INDEX IF NOT EXISTS idx_goal_participants_userId ON goal_participants(userId);

    -- Habits
    CREATE INDEX IF NOT EXISTS idx_habits_userId ON habits(userId);
    CREATE INDEX IF NOT EXISTS idx_habits_goalId ON habits(goalId);
    CREATE INDEX IF NOT EXISTS idx_habits_identityId ON habits(identityId);
    CREATE INDEX IF NOT EXISTS idx_habits_pillar ON habits(pillar);
    CREATE INDEX IF NOT EXISTS idx_habits_habitType ON habits(habitType);
    CREATE INDEX IF NOT EXISTS idx_habits_isArchived ON habits(isArchived);
    CREATE INDEX IF NOT EXISTS idx_habits_stackAfterHabitId ON habits(stackAfterHabitId);

    -- Check-ins
    CREATE INDEX IF NOT EXISTS idx_check_ins_habitId ON habit_check_ins(habitId);
    CREATE INDEX IF NOT EXISTS idx_check_ins_userId ON habit_check_ins(userId);
    CREATE INDEX IF NOT EXISTS idx_check_ins_occurredAt ON habit_check_ins(occurredAt DESC);
    CREATE INDEX IF NOT EXISTS idx_check_ins_userId_occurredAt ON habit_check_ins(userId, occurredAt DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_unique ON habit_check_ins(habitId, occurredAt, source);

    -- Habit participants
    CREATE INDEX IF NOT EXISTS idx_habit_participants_habitId ON habit_participants(habitId);
    CREATE INDEX IF NOT EXISTS idx_habit_participants_userId ON habit_participants(userId);

    -- Habit stacks
    CREATE INDEX IF NOT EXISTS idx_habit_stacks_userId ON habit_stacks(userId);

    -- Habit triggers
    CREATE INDEX IF NOT EXISTS idx_habit_triggers_habitId ON habit_triggers(habitId);

    -- Saved locations
    CREATE INDEX IF NOT EXISTS idx_saved_locations_userId ON saved_locations(userId);

    -- Journal entries
    CREATE INDEX IF NOT EXISTS idx_journal_entries_userId ON journal_entries(userId);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_createdAt ON journal_entries(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_pillar ON journal_entries(pillar);

    -- Mood entries
    CREATE INDEX IF NOT EXISTS idx_mood_entries_userId ON mood_entries(userId);
    CREATE INDEX IF NOT EXISTS idx_mood_entries_createdAt ON mood_entries(createdAt DESC);

    -- Integrations
    CREATE INDEX IF NOT EXISTS idx_integrations_userId ON integrations(userId);
    CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

    -- Auto logs
    CREATE INDEX IF NOT EXISTS idx_auto_logs_userId ON auto_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_auto_logs_integrationId ON auto_logs(integrationId);
    CREATE INDEX IF NOT EXISTS idx_auto_logs_occurredAt ON auto_logs(occurredAt DESC);
    CREATE INDEX IF NOT EXISTS idx_auto_logs_metricType ON auto_logs(metricType);

    -- Behavioral drift
    CREATE INDEX IF NOT EXISTS idx_behavioral_drift_userId ON behavioral_drift(userId);
    CREATE INDEX IF NOT EXISTS idx_behavioral_drift_habitId ON behavioral_drift(habitId);
    CREATE INDEX IF NOT EXISTS idx_behavioral_drift_detectedAt ON behavioral_drift(detectedAt DESC);

    -- Challenges
    CREATE INDEX IF NOT EXISTS idx_challenges_creatorUserId ON challenges(creatorUserId);
    CREATE INDEX IF NOT EXISTS idx_challenges_pillar ON challenges(pillar);
    CREATE INDEX IF NOT EXISTS idx_challenge_participants_challengeId ON challenge_participants(challengeId);
    CREATE INDEX IF NOT EXISTS idx_challenge_participants_userId ON challenge_participants(userId);

    -- Posts
    CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy);
    CREATE INDEX IF NOT EXISTS idx_posts_pillar ON posts(pillar);
    CREATE INDEX IF NOT EXISTS idx_posts_checkInId ON posts(checkInId);
    CREATE INDEX IF NOT EXISTS idx_posts_habitId ON posts(habitId);
    CREATE INDEX IF NOT EXISTS idx_posts_circleId ON posts(circleId);

    -- Stories
    CREATE INDEX IF NOT EXISTS idx_stories_userId ON stories(userId);
    CREATE INDEX IF NOT EXISTS idx_stories_expiresAt ON stories(expiresAt);
    CREATE INDEX IF NOT EXISTS idx_stories_privacy ON stories(privacy);
    CREATE INDEX IF NOT EXISTS idx_stories_createdAt ON stories(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_stories_checkInId ON stories(checkInId);

    -- Reactions
    CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);
    CREATE INDEX IF NOT EXISTS idx_reactions_storyId ON reactions(storyId);
    CREATE INDEX IF NOT EXISTS idx_reactions_userId ON reactions(userId);
    CREATE INDEX IF NOT EXISTS idx_reactions_createdAt ON reactions(createdAt DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_post_user ON reactions(postId, userId) WHERE postId IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_story_user ON reactions(storyId, userId) WHERE storyId IS NOT NULL;

    -- Comments
    CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
    CREATE INDEX IF NOT EXISTS idx_comments_userId ON comments(userId);
    CREATE INDEX IF NOT EXISTS idx_comments_createdAt ON comments(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_isArchived ON comments(isArchived);

    -- Nudges
    CREATE INDEX IF NOT EXISTS idx_nudges_fromUserId ON nudges(fromUserId);
    CREATE INDEX IF NOT EXISTS idx_nudges_toUserId ON nudges(toUserId);
    CREATE INDEX IF NOT EXISTS idx_nudges_habitId ON nudges(habitId);
    CREATE INDEX IF NOT EXISTS idx_nudges_createdAt ON nudges(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_nudges_rate_limit ON nudges(fromUserId, toUserId, createdAt);

    -- Badges
    CREATE INDEX IF NOT EXISTS idx_badges_userId ON badges(userId);
    CREATE INDEX IF NOT EXISTS idx_badges_badgeName ON badges(badgeName);
    CREATE INDEX IF NOT EXISTS idx_badges_earnedAt ON badges(earnedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_badges_pillar ON badges(pillar);
    CREATE INDEX IF NOT EXISTS idx_badges_habitId ON badges(habitId);

    -- Notifications
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt DESC);

    -- Tags
    CREATE INDEX IF NOT EXISTS idx_tags_userId ON tags(userId);
    CREATE INDEX IF NOT EXISTS idx_tags_useCount ON tags(userId, useCount DESC);

    -- ============================================
    -- FUTURE TABLES (M5+) - In Progress
    -- These tables are drafted but implementation may change
    -- ============================================

    -- Habit followers (allow friends to join/follow habits)
    CREATE TABLE IF NOT EXISTS habit_followers (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'FOLLOWER',
      notifyOnCheckIn INTEGER NOT NULL DEFAULT 1,
      notifyOnMiss INTEGER NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL,
      leftAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (ownerId) REFERENCES users(id),
      UNIQUE(habitId, userId)
    );

    -- Accountability partners (dedicated partner relationships)
    CREATE TABLE IF NOT EXISTS accountability_partners (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      partnerId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      focusPillar TEXT,
      checkInFrequency TEXT NOT NULL DEFAULT 'WEEKLY',
      lastCheckInAt TEXT,
      nextCheckInAt TEXT,
      sharedHabitIds TEXT,
      sharedGoalIds TEXT,
      notes TEXT,
      startedAt TEXT NOT NULL,
      endedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (partnerId) REFERENCES users(id),
      UNIQUE(userId, partnerId)
    );

    -- User statistics (aggregated stats for dashboard)
    CREATE TABLE IF NOT EXISTS user_stats (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      periodType TEXT NOT NULL,
      periodStart TEXT,
      totalCheckIns INTEGER NOT NULL DEFAULT 0,
      successfulCheckIns INTEGER NOT NULL DEFAULT 0,
      completionRate REAL NOT NULL DEFAULT 0,
      currentStreakMax INTEGER NOT NULL DEFAULT 0,
      longestStreakEver INTEGER NOT NULL DEFAULT 0,
      pillarCheckIns TEXT,
      pillarCompletionRates TEXT,
      goalsCompleted INTEGER NOT NULL DEFAULT 0,
      goalsInProgress INTEGER NOT NULL DEFAULT 0,
      reactionsGiven INTEGER NOT NULL DEFAULT 0,
      reactionsReceived INTEGER NOT NULL DEFAULT 0,
      nudgesSent INTEGER NOT NULL DEFAULT 0,
      nudgesReceived INTEGER NOT NULL DEFAULT 0,
      postsCreated INTEGER NOT NULL DEFAULT 0,
      commentsGiven INTEGER NOT NULL DEFAULT 0,
      activeDays INTEGER NOT NULL DEFAULT 0,
      bestDayOfWeek INTEGER,
      bestTimeOfDay INTEGER,
      calculatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, periodType, periodStart)
    );

    -- Habit statistics (per-habit aggregated stats)
    CREATE TABLE IF NOT EXISTS habit_stats (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      periodType TEXT NOT NULL,
      periodStart TEXT,
      totalCheckIns INTEGER NOT NULL DEFAULT 0,
      successfulCheckIns INTEGER NOT NULL DEFAULT 0,
      completionRate REAL NOT NULL DEFAULT 0,
      currentStreak INTEGER NOT NULL DEFAULT 0,
      longestStreak INTEGER NOT NULL DEFAULT 0,
      avgCheckInHour REAL,
      mostFrequentDay INTEGER,
      avgTimeBetweenCheckIns REAL,
      avgValue REAL,
      maxValue REAL,
      totalValue REAL,
      avgMoodBefore REAL,
      avgMoodAfter REAL,
      moodImpact REAL,
      calculatedAt TEXT NOT NULL,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(habitId, periodType, periodStart)
    );

    -- Habit signals (computed warnings and ribbons)
    CREATE TABLE IF NOT EXISTS habit_signals (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      userId TEXT NOT NULL,
      signalType TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      message TEXT,
      metadata TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      triggeredAt TEXT NOT NULL,
      resolvedAt TEXT,
      acknowledgedAt TEXT,
      syncedAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- ============================================
    -- INDEXES FOR FUTURE TABLES
    -- ============================================

    -- Habit followers
    CREATE INDEX IF NOT EXISTS idx_habit_followers_habitId ON habit_followers(habitId);
    CREATE INDEX IF NOT EXISTS idx_habit_followers_userId ON habit_followers(userId);
    CREATE INDEX IF NOT EXISTS idx_habit_followers_ownerId ON habit_followers(ownerId);

    -- Accountability partners
    CREATE INDEX IF NOT EXISTS idx_accountability_partners_userId ON accountability_partners(userId);
    CREATE INDEX IF NOT EXISTS idx_accountability_partners_partnerId ON accountability_partners(partnerId);
    CREATE INDEX IF NOT EXISTS idx_accountability_partners_status ON accountability_partners(status);
    CREATE INDEX IF NOT EXISTS idx_accountability_partners_nextCheckIn ON accountability_partners(nextCheckInAt);

    -- User stats
    CREATE INDEX IF NOT EXISTS idx_user_stats_userId ON user_stats(userId);
    CREATE INDEX IF NOT EXISTS idx_user_stats_periodType ON user_stats(userId, periodType);

    -- Habit stats
    CREATE INDEX IF NOT EXISTS idx_habit_stats_habitId ON habit_stats(habitId);
    CREATE INDEX IF NOT EXISTS idx_habit_stats_userId ON habit_stats(userId);

    -- Habit signals
    CREATE INDEX IF NOT EXISTS idx_habit_signals_habitId ON habit_signals(habitId);
    CREATE INDEX IF NOT EXISTS idx_habit_signals_userId ON habit_signals(userId);
    CREATE INDEX IF NOT EXISTS idx_habit_signals_active ON habit_signals(habitId, isActive);

    -- Rate limits
    CREATE INDEX IF NOT EXISTS idx_rate_limits_userId_date ON rate_limits(userId, date);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_actionType ON rate_limits(actionType);

    -- Sync queue
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_tableName ON sync_queue(tableName);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_createdAt ON sync_queue(createdAt DESC);
  `);

  logger.info("Database schema initialized", { version: SCHEMA_VERSION });
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
