/**
 * Validation utilities tests
 */

import {
  validateDisplayName,
  validateBio,
  validateEmail,
  validatePhoto,
  validatePrivacy,
  validateDeleteConfirmation,
  sanitizeInput,
  getRemainingChars,
  isNearLimit,
  limits,
} from "../../src/lib/validation";

describe("validateDisplayName", () => {
  it("should accept valid display names", () => {
    expect(validateDisplayName("John Doe")).toEqual({ valid: true });
    expect(validateDisplayName("Jane")).toEqual({ valid: true });
    expect(validateDisplayName("O'Brien")).toEqual({ valid: true });
    expect(validateDisplayName("Mary-Jane")).toEqual({ valid: true });
    expect(validateDisplayName("123")).toEqual({ valid: true });
  });

  it("should reject empty display name", () => {
    expect(validateDisplayName("")).toEqual({
      valid: false,
      error: "Display name is required",
    });
    expect(validateDisplayName("   ")).toEqual({
      valid: false,
      error: "Display name is required",
    });
  });

  it("should reject display name that is too long", () => {
    const longName = "a".repeat(51);
    const result = validateDisplayName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("50 characters");
  });

  it("should reject display name with invalid characters", () => {
    const result = validateDisplayName("John@Doe");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("can only contain");
  });
});

describe("validateBio", () => {
  it("should accept valid bio", () => {
    expect(validateBio("Hello, I love hiking!")).toEqual({ valid: true });
    expect(validateBio("")).toEqual({ valid: true }); // Bio is optional
    expect(validateBio("🎉 Let's go! 🚀")).toEqual({ valid: true }); // Emoji supported
  });

  it("should reject bio that is too long", () => {
    const longBio = "a".repeat(281);
    const result = validateBio(longBio);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("280 characters");
  });

  it("should accept bio at exactly max length", () => {
    const maxBio = "a".repeat(280);
    expect(validateBio(maxBio)).toEqual({ valid: true });
  });
});

describe("validateEmail", () => {
  it("should accept valid emails", () => {
    expect(validateEmail("test@example.com")).toEqual({ valid: true });
    expect(validateEmail("user.name@domain.org")).toEqual({ valid: true });
    expect(validateEmail("user+tag@gmail.com")).toEqual({ valid: true });
  });

  it("should accept empty email (optional)", () => {
    expect(validateEmail("")).toEqual({ valid: true });
    expect(validateEmail("   ")).toEqual({ valid: true });
  });

  it("should reject invalid emails", () => {
    expect(validateEmail("notanemail").valid).toBe(false);
    expect(validateEmail("missing@domain").valid).toBe(false);
    expect(validateEmail("@nodomain.com").valid).toBe(false);
    expect(validateEmail("spaces in@email.com").valid).toBe(false);
  });
});

describe("validatePhoto", () => {
  const validSize = 1024 * 1024; // 1MB
  const tooLarge = 6 * 1024 * 1024; // 6MB

  it("should accept valid photos", () => {
    expect(validatePhoto(validSize, "image/jpeg")).toEqual({ valid: true });
    expect(validatePhoto(validSize, "image/png")).toEqual({ valid: true });
    expect(validatePhoto(validSize, "image/jpg")).toEqual({ valid: true });
  });

  it("should reject photos that are too large", () => {
    const result = validatePhoto(tooLarge, "image/jpeg");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5MB");
  });

  it("should reject invalid file types", () => {
    const result = validatePhoto(validSize, "image/gif");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("JPEG or PNG");
  });
});

describe("validatePrivacy", () => {
  it("should accept valid privacy values", () => {
    expect(validatePrivacy("SELF")).toEqual({ valid: true });
    expect(validatePrivacy("FRIENDS")).toEqual({ valid: true });
    expect(validatePrivacy("PUBLIC")).toEqual({ valid: true });
  });

  it("should reject invalid privacy values", () => {
    expect(validatePrivacy("INVALID").valid).toBe(false);
    expect(validatePrivacy("private").valid).toBe(false);
    expect(validatePrivacy("").valid).toBe(false);
  });
});

describe("validateDeleteConfirmation", () => {
  it("should accept correct confirmation", () => {
    expect(validateDeleteConfirmation("DELETE")).toEqual({ valid: true });
  });

  it("should reject incorrect confirmation", () => {
    expect(validateDeleteConfirmation("delete").valid).toBe(false);
    expect(validateDeleteConfirmation("Delete").valid).toBe(false);
    expect(validateDeleteConfirmation("").valid).toBe(false);
  });
});

describe("sanitizeInput", () => {
  it("should remove control characters", () => {
    expect(sanitizeInput("Hello\x00World")).toBe("HelloWorld");
    expect(sanitizeInput("Test\x1FInput")).toBe("TestInput");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("should preserve normal text", () => {
    expect(sanitizeInput("Hello World!")).toBe("Hello World!");
    expect(sanitizeInput("Test 123")).toBe("Test 123");
  });
});

describe("getRemainingChars", () => {
  it("should calculate remaining characters correctly", () => {
    expect(getRemainingChars("hello", 10)).toBe(5);
    expect(getRemainingChars("", 100)).toBe(100);
    expect(getRemainingChars("full", 4)).toBe(0);
  });
});

describe("isNearLimit", () => {
  it("should detect when near limit", () => {
    expect(isNearLimit("a".repeat(45), 50, 10)).toBe(true);
    expect(isNearLimit("a".repeat(40), 50, 10)).toBe(true);
  });

  it("should return false when not near limit", () => {
    expect(isNearLimit("short", 50, 10)).toBe(false);
    expect(isNearLimit("a".repeat(30), 50, 10)).toBe(false);
  });
});

describe("limits constants", () => {
  it("should export correct limits", () => {
    expect(limits.displayName.min).toBe(1);
    expect(limits.displayName.max).toBe(50);
    expect(limits.bio.max).toBe(280);
    expect(limits.photo.maxSizeBytes).toBe(5 * 1024 * 1024);
    expect(limits.photo.allowedTypes).toContain("image/jpeg");
    expect(limits.photo.allowedTypes).toContain("image/png");
  });
});
