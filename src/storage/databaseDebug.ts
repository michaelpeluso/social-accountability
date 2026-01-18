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
    const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    return result?.user_version || 0;
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
 * Dynamically checks all tables - scalable as the app grows
 */
export async function printDatabaseDiagnostics(): Promise<void> {
  /* eslint-disable no-console */
  const version = await getCurrentVersion();
  const tables = await listTables();

  // Filter out system tables
  const appTables = tables.filter((t) => t !== "sqlite_sequence" && t !== "migrations");

  console.log(`[DB] v${version} | ${appTables.length} tables: ${appTables.join(", ")}`);

  // Log any missing critical tables (dynamically checked)
  const missing = appTables.length === 0 ? ["No tables found - run migrations"] : [];
  if (missing.length > 0) {
    console.log(`[DB] Issues: ${missing.join(", ")}`);
  }
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
