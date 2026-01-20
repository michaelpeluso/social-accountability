/**
 * Environment Configuration
 *
 * This module provides a unified way to access environment variables that works
 * in both local development and EAS builds.
 *
 * Pattern (Expo best practice):
 * - Local dev: .env file loaded automatically by Metro bundler (EXPO_PUBLIC_* vars)
 * - EAS builds: Values from eas.json env + EAS Secrets (via Constants.expoConfig.extra)
 *
 * IMPORTANT: Do NOT use dotenv package - it's Node.js only and incompatible with React Native.
 * Expo Metro bundler handles EXPO_PUBLIC_* variables automatically.
 *
 * Priority: Constants.expoConfig.extra (EAS/Metro) → process.env (fallback)
 */

import Constants from "expo-constants";

type LogLevel = "debug" | "info" | "warn" | "error";

// Get extra config from app.config.js (populated by EAS build)
const expoExtra = Constants.expoConfig?.extra ?? {};

/**
 * Get environment variable with fallback
 * Priority: Constants.expoConfig.extra (works in RN + EAS) → process.env (Node.js fallback) → default
 */
function getEnv(key: string, defaultValue: string = ""): string {
  // First try Expo Constants extra (works in React Native + EAS builds)
  // Map EXPO_PUBLIC_X to camelCase keys in extra
  const extraKey = key
    .replace("EXPO_PUBLIC_", "")
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  if (expoExtra[extraKey]) {
    return expoExtra[extraKey] as string;
  }

  // Fallback to process.env (only works in Node.js context like app.config.js)
  // Metro bundler injects EXPO_PUBLIC_* vars here during bundling
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  return defaultValue;
}

function getRequiredEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return getEnv(key, defaultValue);
}

function getNumberEnv(key: string, defaultValue: number): number {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

export const env = {
  // App variant (development | preview | production)
  APP_VARIANT: getOptionalEnv("APP_VARIANT", "development"),

  // Node environment
  NODE_ENV: getOptionalEnv("NODE_ENV", "development"),

  // API configuration
  API_URL: getRequiredEnv("EXPO_PUBLIC_API_URL"),
  API_TIMEOUT_MS: getNumberEnv("API_TIMEOUT_MS", 10000),

  // Auth configuration (server-side only - not bundled in client)
  // These are optional in client context, only required when ENABLE_APPLE_AUTH=true
  APPLE_CLIENT_ID: getOptionalEnv("APPLE_CLIENT_ID", ""),
  JWT_SECRET: getOptionalEnv("JWT_SECRET", "dev-secret-replace-in-production"),

  // Logging
  LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info") as LogLevel,

  // Rate limiting
  RATE_LIMIT_WINDOW: getNumberEnv("RATE_LIMIT_WINDOW", 86400),
  RATE_LIMIT_NUDGES_PER_PAIR: getNumberEnv("RATE_LIMIT_NUDGES_PER_PAIR", 3),
  RATE_LIMIT_NUDGES_PER_USER: getNumberEnv("RATE_LIMIT_NUDGES_PER_USER", 10),

  // Supabase configuration (using EXPO_PUBLIC_ for client bundle)
  SUPABASE_URL: getOptionalEnv("EXPO_PUBLIC_SUPABASE_URL", ""),
  SUPABASE_ANON_KEY: getOptionalEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", ""),

  // Feature flags
  ENABLE_APPLE_AUTH: getBooleanEnv("ENABLE_APPLE_AUTH", true),
  ENABLE_HEALTHKIT: getBooleanEnv("ENABLE_HEALTHKIT", false),
  ENABLE_CLOUD_SYNC: getBooleanEnv("ENABLE_CLOUD_SYNC", false),
};
