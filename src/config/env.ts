type LogLevel = "debug" | "info" | "warn" | "error";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

export const env = {
  // Node environment
  NODE_ENV: getOptionalEnv("NODE_ENV", "development"),

  // API configuration
  API_URL: getRequiredEnv("API_URL"),
  API_TIMEOUT_MS: getNumberEnv("API_TIMEOUT_MS", 10000),

  // Auth configuration
  APPLE_CLIENT_ID: getRequiredEnv("APPLE_CLIENT_ID"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),

  // Logging
  LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info") as LogLevel,

  // Rate limiting
  RATE_LIMIT_WINDOW: getNumberEnv("RATE_LIMIT_WINDOW", 86400),
  RATE_LIMIT_NUDGES_PER_PAIR: getNumberEnv("RATE_LIMIT_NUDGES_PER_PAIR", 3),
  RATE_LIMIT_NUDGES_PER_USER: getNumberEnv("RATE_LIMIT_NUDGES_PER_USER", 10),

  // Feature flags
  ENABLE_APPLE_AUTH: getBooleanEnv("ENABLE_APPLE_AUTH", true),
  ENABLE_HEALTHKIT: getBooleanEnv("ENABLE_HEALTHKIT", false),
};
