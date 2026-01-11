/**
 * Database Debug Utilities
 * Helper functions to inspect database state and migrations
 * Import this in app/_layout.tsx or a debug screen to diagnose issues
 */

import { getDatabase } from "./database";
import { logger } from "../lib/logger";

/**
 * Get current migration version
 */
export async function getCurrentVersion(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ version: number }>(
      "SELECT MAX(version) as version FROM migrations"
    );
    return result?.version || 0;
  } catch (error) {
    logger.error("Failed to get current version", { error });
    return -1;
  }
}

/**
 * List all tables in the database
 */
export async function listTables(): Promise<string[]> {
  try {
    const db = await getDatabase();
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    return tables.map((t) => t.name);
  } catch (error) {
    logger.error("Failed to list tables", { error });
    return [];
  }
}

/**
 * Check if a specific table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return (result?.count ?? 0) > 0;
  } catch (error) {
    logger.error("Failed to check table existence", { error, tableName });
    return false;
  }
}

/**
 * Get table schema/columns
 */
export async function getTableInfo(tableName: string): Promise<
  {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }[]
> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>(`PRAGMA table_info(${tableName})`);
  } catch (error) {
    logger.error("Failed to get table info", { error, tableName });
    return [];
  }
}

/**
 * Print comprehensive database diagnostic info
 * Call this in a debug screen or on app start during development
 */
export async function printDatabaseDiagnostics(): Promise<void> {
  /* eslint-disable no-console */
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DATABASE DIAGNOSTICS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const version = await getCurrentVersion();
  console.log(`Current migration version: ${version}`);
  console.log(`Expected version: 8`);

  if (version < 8) {
    console.log(`⚠️  Database needs migration from v${version} to v8`);
  } else if (version === 8) {
    console.log("✅ Database is up to date");
  } else {
    console.log(`⚠️  Database version ${version} is newer than expected (8)`);
  }

  console.log("");
  console.log("Tables:");
  const tables = await listTables();
  for (const table of tables) {
    const exists = table !== "sqlite_sequence" && table !== "migrations";
    console.log(`  ${exists ? "✓" : "•"} ${table}`);
  }

  console.log("");
  console.log("Critical tables check:");
  const criticalTables = [
    "users",
    "habits",
    "habit_check_ins",
    "posts",
    "reactions",
    "comments",
    "nudges",
    "badges",
    "notifications",
  ];
  for (const table of criticalTables) {
    const exists = await tableExists(table);
    console.log(`  ${exists ? "✅" : "❌"} ${table}`);
  }

  // Check comments table specifically since that's the current issue
  const commentsExists = await tableExists("comments");
  if (!commentsExists) {
    console.log("");
    console.log("❌ ISSUE DETECTED: 'comments' table missing");
    console.log("   This table should exist in migration v7");
    console.log("   Current version:", version);
    console.log("");
    console.log("SOLUTION:");
    console.log("   1. Delete the app from your device");
    console.log("   2. Reinstall via: npm run dev");
    console.log("   3. Or run: ./scripts/reset-db.sh");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  /* eslint-enable no-console */
}

/**
 * Force database reset (nuclear option)
 * WARNING: This will delete all data
 */
export async function forceReset(): Promise<void> {
  try {
    const db = await getDatabase();

    // Get all tables
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop all tables
    /* eslint-disable no-console */
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
      console.log(`Dropped table: ${table.name}`);
    }

    console.log("✅ Database reset complete. Restart app to recreate schema.");
    /* eslint-enable no-console */
  } catch (error) {
    logger.error("Failed to reset database", { error });
    throw error;
  }
}
