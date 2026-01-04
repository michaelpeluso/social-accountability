/**
 * Validation Utilities - Input validation for M1 features
 * Client + server validation (defense in depth)
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Display name: 1-50 chars, alphanumeric + space, dash, apostrophe
const DISPLAY_NAME_MIN = 1;
const DISPLAY_NAME_MAX = 50;
const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s\-']+$/;

// Bio: 0-280 chars, supports emoji
const BIO_MAX = 280;

// Email regex (simple but effective)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Photo file size: 5MB max
const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed photo types
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/jpg"];

/**
 * Validate display name
 */
export function validateDisplayName(value: string): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length < DISPLAY_NAME_MIN) {
    return { valid: false, error: "Display name is required" };
  }

  if (trimmed.length > DISPLAY_NAME_MAX) {
    return { valid: false, error: `Display name must be ${DISPLAY_NAME_MAX} characters or less` };
  }

  if (!DISPLAY_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Display name can only contain letters, numbers, spaces, dashes, and apostrophes",
    };
  }

  return { valid: true };
}

/**
 * Validate bio
 */
export function validateBio(value: string): ValidationResult {
  if (value.length > BIO_MAX) {
    return { valid: false, error: `Bio must be ${BIO_MAX} characters or less` };
  }

  return { valid: true };
}

/**
 * Validate email address
 */
export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: true }; // Email is optional
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
}

/**
 * Validate photo file
 */
export function validatePhoto(fileSize: number, mimeType: string): ValidationResult {
  if (fileSize > PHOTO_MAX_SIZE_BYTES) {
    const maxMB = PHOTO_MAX_SIZE_BYTES / (1024 * 1024);
    return { valid: false, error: `Photo must be smaller than ${maxMB}MB` };
  }

  if (!ALLOWED_PHOTO_TYPES.includes(mimeType.toLowerCase())) {
    return { valid: false, error: "Photo must be a JPEG or PNG file" };
  }

  return { valid: true };
}

/**
 * Validate privacy value
 */
export function validatePrivacy(value: string): ValidationResult {
  const validValues = ["SELF", "FRIENDS", "PUBLIC"];

  if (!validValues.includes(value)) {
    return { valid: false, error: "Invalid privacy value" };
  }

  return { valid: true };
}

/**
 * Validate password/confirmation text (for deletion)
 */
export function validateDeleteConfirmation(value: string): ValidationResult {
  if (value !== "DELETE") {
    return { valid: false, error: "Please type DELETE to confirm" };
  }

  return { valid: true };
}

/**
 * Sanitize user input (strip dangerous characters)
 */
export function sanitizeInput(value: string): string {
  // Remove control characters and null bytes
  return value.replace(/[\x00-\x1F\x7F]/g, "").trim();
}

/**
 * Get remaining character count for a field
 */
export function getRemainingChars(value: string, maxLength: number): number {
  return maxLength - value.length;
}

/**
 * Check if character count is near limit (for UI warning)
 */
export function isNearLimit(value: string, maxLength: number, threshold: number = 20): boolean {
  return value.length >= maxLength - threshold;
}

// Export constants for use in UI
export const limits = {
  displayName: { min: DISPLAY_NAME_MIN, max: DISPLAY_NAME_MAX },
  bio: { max: BIO_MAX },
  photo: { maxSizeBytes: PHOTO_MAX_SIZE_BYTES, allowedTypes: ALLOWED_PHOTO_TYPES },
};
