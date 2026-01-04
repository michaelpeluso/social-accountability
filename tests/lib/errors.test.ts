import { AppError, errors } from "../../src/lib/errors";

describe("AppError", () => {
  describe("constructor", () => {
    it("should create error with code, message, and status", () => {
      const error = new AppError("NOT_FOUND", "Not found", 404);

      expect(error.message).toBe("Not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.status).toBe(404);
      expect(error.name).toBe("AppError");
    });

    it("should be an instance of Error", () => {
      const error = new AppError("UNKNOWN", "Test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it("should default status to 400", () => {
      const error = new AppError("BAD_REQUEST", "Test");

      expect(error.status).toBe(400);
    });
  });

  describe("toApiResponse", () => {
    it("should return API response format", () => {
      const error = new AppError("VALIDATION_ERROR", "Validation failed", 400);
      const response = error.toApiResponse();

      expect(response).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
        },
      });
    });
  });
});

describe("errors factory functions", () => {
  describe("unauthorized", () => {
    it("should create unauthorized error with default message", () => {
      const error = errors.unauthorized();

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.status).toBe(401);
      expect(error.message).toBe("unauthorized");
    });

    it("should accept custom message", () => {
      const error = errors.unauthorized("Token expired");

      expect(error.message).toBe("Token expired");
    });
  });

  describe("forbidden", () => {
    it("should create forbidden error", () => {
      const error = errors.forbidden();

      expect(error.code).toBe("FORBIDDEN");
      expect(error.status).toBe(403);
    });
  });

  describe("notFound", () => {
    it("should create not found error", () => {
      const error = errors.notFound();

      expect(error.code).toBe("NOT_FOUND");
      expect(error.status).toBe(404);
    });

    it("should accept custom message", () => {
      const error = errors.notFound("User not found");

      expect(error.message).toBe("User not found");
    });
  });

  describe("badRequest", () => {
    it("should create bad request error", () => {
      const error = errors.badRequest();

      expect(error.code).toBe("BAD_REQUEST");
      expect(error.status).toBe(400);
    });
  });

  describe("rateLimited", () => {
    it("should create rate limited error", () => {
      const error = errors.rateLimited();

      expect(error.code).toBe("RATE_LIMITED");
      expect(error.status).toBe(429);
    });
  });

  describe("validationFailed", () => {
    it("should create validation failed error", () => {
      const error = errors.validationFailed();

      expect(error.code).toBe("VALIDATION_FAILED");
      expect(error.status).toBe(400);
    });
  });

  describe("conflict", () => {
    it("should create conflict error", () => {
      const error = errors.conflict();

      expect(error.code).toBe("CONFLICT");
      expect(error.status).toBe(409);
    });
  });

  describe("serviceUnavailable", () => {
    it("should create service unavailable error", () => {
      const error = errors.serviceUnavailable();

      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.status).toBe(503);
    });
  });
});
