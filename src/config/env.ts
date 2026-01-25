/**
 * Environment Configuration (Cloud-Only)
 *
 * All environment variables are managed via EAS:
 * - Development: EAS env vars (eas env:create)
 * - Production builds: EAS secrets injected at build time
 *
 * NO .env files in this project - all config lives in EAS.
 *
 * To add/update variables:
 *   npx eas-cli env:create --name VAR_NAME --value "value" --type string
 *   npx eas-cli env:list
 */

import Constants from "expo-constants";

// Config from app.config.js extra (populated by EAS at build time)
const extra = Constants.expoConfig?.extra ?? {};

/**
 * Get environment variable from EAS config
 */
function getEnv(key: string, defaultValue: string = ""): string {
  // Convert EXPO_PUBLIC_SUPABASE_URL -> supabaseUrl
  const extraKey = key
    .replace("EXPO_PUBLIC_", "")
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

  return (extra[extraKey] as string) ?? defaultValue;
}

function getRequired(key: string): string {
  const value = getEnv(key);
  if (!value) {
    // In development, provide helpful message
    if (__DEV__) {
      console.warn(
        `Missing env var: ${key}. Run: npx eas-cli env:create --name ${key} --value "your-value" --type string`
      );
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getBool(key: string, defaultValue: boolean): boolean {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

function getNumber(key: string, defaultValue: number): number {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const env = {
  // App variant (development | production)
  APP_VARIANT: extra.appVariant ?? "development",

  // API
  API_URL: getRequired("EXPO_PUBLIC_API_URL"),
  API_TIMEOUT_MS: getNumber("API_TIMEOUT_MS", 10000),

  // Supabase
  SUPABASE_URL: getEnv("EXPO_PUBLIC_SUPABASE_URL", ""),
  SUPABASE_ANON_KEY: getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", ""),

  // Feature flags
  ENABLE_APPLE_AUTH: getBool("ENABLE_APPLE_AUTH", true),
  ENABLE_HEALTHKIT: getBool("ENABLE_HEALTHKIT", false),
  ENABLE_CLOUD_SYNC: getBool("ENABLE_CLOUD_SYNC", false),

  // Logging
  LOG_LEVEL: getEnv("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",

  // Rate limiting
  RATE_LIMIT_NUDGES_PER_PAIR: getNumber("RATE_LIMIT_NUDGES_PER_PAIR", 3),
  RATE_LIMIT_NUDGES_PER_USER: getNumber("RATE_LIMIT_NUDGES_PER_USER", 10),
};
