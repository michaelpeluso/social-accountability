import { AppError, errors } from "../../src/lib/errors";

describe("AppError", () => {
  it("creates an error with code, message, and status", () => {
    const error = new AppError("TEST_ERROR", "test message", 500);

    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("test message");
    expect(error.status).toBe(500);
    expect(error.name).toBe("AppError");
  });

  it("defaults status to 400", () => {
    const error = new AppError("BAD_REQUEST", "bad request");

    expect(error.status).toBe(400);
  });

  it("extends Error", () => {
    const error = new AppError("TEST", "test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  describe("toApiResponse", () => {
    it("returns error object with code and message", () => {
      const error = new AppError("NOT_FOUND", "resource not found", 404);
      const response = error.toApiResponse();

      expect(response).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "resource not found",
        },
      });
    });

    it("does not expose status in API response", () => {
      const error = new AppError("SERVER_ERROR", "internal error", 500);
      const response = error.toApiResponse();

      expect(response.error).not.toHaveProperty("status");
    });
  });
});

describe("error helpers", () => {
  it("creates unauthorized error (401)", () => {
    const error = errors.unauthorized();

    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
    expect(error.message).toBe("unauthorized");
  });

  it("creates unauthorized error with custom message", () => {
    const error = errors.unauthorized("invalid token");

    expect(error.message).toBe("invalid token");
  });

  it("creates forbidden error (403)", () => {
    const error = errors.forbidden();

    expect(error.code).toBe("FORBIDDEN");
    expect(error.status).toBe(403);
  });

  it("creates notFound error (404)", () => {
    const error = errors.notFound("user not found");

    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.message).toBe("user not found");
  });

  it("creates badRequest error (400)", () => {
    const error = errors.badRequest();

    expect(error.code).toBe("BAD_REQUEST");
    expect(error.status).toBe(400);
  });

  it("creates rateLimited error (429)", () => {
    const error = errors.rateLimited();

    expect(error.code).toBe("RATE_LIMITED");
    expect(error.status).toBe(429);
  });

  it("creates validationFailed error (400)", () => {
    const error = errors.validationFailed("email is required");

    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.status).toBe(400);
    expect(error.message).toBe("email is required");
  });

  it("creates conflict error (409)", () => {
    const error = errors.conflict("username taken");

    expect(error.code).toBe("CONFLICT");
    expect(error.status).toBe(409);
    expect(error.message).toBe("username taken");
  });

  it("creates serviceUnavailable error (503)", () => {
    const error = errors.serviceUnavailable();

    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.status).toBe(503);
  });

  it("all helpers return AppError instances", () => {
    const allErrors = [
      errors.unauthorized(),
      errors.forbidden(),
      errors.notFound(),
      errors.badRequest(),
      errors.rateLimited(),
      errors.validationFailed(),
      errors.conflict(),
      errors.serviceUnavailable(),
    ];

    allErrors.forEach((error) => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
