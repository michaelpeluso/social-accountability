type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
type LogMeta = Record<string, unknown>;

// PII fields to redact from logs
const PII_FIELDS = ["token", "password", "email", "location", "messageContent", "phoneNumber"];

/**
 * Sanitize metadata to remove PII before logging
 */
function sanitize(meta: LogMeta): LogMeta {
  const sanitized: LogMeta = {};

  for (const [key, value] of Object.entries(meta)) {
    // Check if key contains PII field name
    const isPII = PII_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()));

    if (isPII) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitize(value as LogMeta);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function log(level: LogLevel, msg: string, meta: LogMeta = {}) {
  const sanitizedMeta = sanitize(meta);
  const timestamp = new Date().toISOString();
  const logEntry = {
    level,
    timestamp,
    msg,
    ...sanitizedMeta,
  };

  switch (level) {
    case "DEBUG":
      console.log(JSON.stringify(logEntry));
      break;
    case "INFO":
      console.log(JSON.stringify(logEntry));
      break;
    case "WARN":
      console.warn(JSON.stringify(logEntry));
      break;
    case "ERROR":
      console.error(JSON.stringify(logEntry));
      break;
  }
}

export const logger = {
  debug: (msg: string, meta: LogMeta = {}) => log("DEBUG", msg, meta),
  info: (msg: string, meta: LogMeta = {}) => log("INFO", msg, meta),
  warn: (msg: string, meta: LogMeta = {}) => log("WARN", msg, meta),
  error: (msg: string, meta: LogMeta = {}) => log("ERROR", msg, meta),
};
