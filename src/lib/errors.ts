import type { ApiError } from "../types";

export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AppError";
  }

  toApiResponse(): { error: ApiError } {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

export const errors = {
  unauthorized: (msg = "unauthorized") => new AppError("UNAUTHORIZED", msg, 401),
  forbidden: (msg = "forbidden") => new AppError("FORBIDDEN", msg, 403),
  notFound: (msg = "not found") => new AppError("NOT_FOUND", msg, 404),
  badRequest: (msg = "bad request") => new AppError("BAD_REQUEST", msg, 400),
  rateLimited: (msg = "rate limit exceeded") => new AppError("RATE_LIMITED", msg, 429),
  validationFailed: (msg = "validation failed") => new AppError("VALIDATION_FAILED", msg, 400),
  conflict: (msg = "conflict") => new AppError("CONFLICT", msg, 409),
  serviceUnavailable: (msg = "service unavailable") =>
    new AppError("SERVICE_UNAVAILABLE", msg, 503),
};
