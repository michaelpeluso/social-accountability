/**
 * Storage module - SQLite local database layer
 * Device-first architecture: SQLite is the source of truth
 */

export * from "./database";
export * from "./user";
export * from "./goals";
export * from "./habits";
export * from "./checkIns";
export * from "./dbDebug";
export * from "./habitParticipants";
export * from "./goalParticipants";

// M3 Social modules
export * from "./posts";
export * from "./reactions";
export * from "./comments";
export * from "./nudges";
export * from "./badges";
export * from "./notifications";
export * from "./rateLimits";

// Dev utilities
export { seedDemoData, clearDemoData, hasDemoData, DEMO_USERS } from "./seedData";
