/**
 * Database Debug Utilities
 * Helper functions to diagnose and fix database schema issues
 */

import { getDatabase } from "./database";
import { logger } from "../lib/logger";

/**
 * Check if a column exists in a table
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
    return info.some((col) => col.name === columnName);
  } catch (error) {
    logger.error("Failed to check column existence", { tableName, columnName, error });
    return false;
  }
}

/**
 * Get all columns for a table
 */
export async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const db = await getDatabase();
    const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
    return info.map((col) => col.name);
  } catch (error) {
    logger.error("Failed to get table columns", { tableName, error });
    return [];
  }
}

/**
 * Validate database schema for common issues
 */
export async function validateSchema(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Check habit_check_ins table
    const checkInsColumns = await getTableColumns("habit_check_ins");
    if (!checkInsColumns.includes("habitId")) {
      errors.push("habit_check_ins table missing 'habitId' column");
    }
    if (!checkInsColumns.includes("userId")) {
      errors.push("habit_check_ins table missing 'userId' column");
    }

    // Check habits table
    const habitsColumns = await getTableColumns("habits");
    if (!habitsColumns.includes("userId")) {
      errors.push("habits table missing 'userId' column");
    }

    logger.info("Schema validation complete", {
      valid: errors.length === 0,
      errors,
      checkInsColumns,
      habitsColumns,
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    logger.error("Schema validation failed", { error });
    return {
      valid: false,
      errors: ["Failed to validate schema"],
    };
  }
}

/**
 * Drop and recreate all tables (USE WITH CAUTION - DELETES ALL DATA)
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = await getDatabase();

    logger.warn("Resetting database - all data will be lost");

    // Drop all tables
    await db.execAsync(`
      DROP TABLE IF EXISTS habit_check_ins;
      DROP TABLE IF EXISTS habits;
      DROP TABLE IF EXISTS goals;
      DROP TABLE IF EXISTS identities;
      DROP TABLE IF EXISTS friendships;
      DROP TABLE IF EXISTS friend_requests;
      DROP TABLE IF EXISTS blocked_users;
      DROP TABLE IF EXISTS sync_queue;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS session;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS migrations;
    `);

    logger.info("Database reset complete - restart app to rebuild schema");
  } catch (error) {
    logger.error("Database reset failed", { error });
    throw error;
  }
}
