import { logger } from "../../../src/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sanitize", () => {
    it("should redact token from metadata", () => {
      logger.info("test message", { token: "secret-token-123" });

      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.token).toBe("[REDACTED]");
    });

    it("should redact email from metadata", () => {
      logger.info("test message", { email: "user@example.com" });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.email).toBe("[REDACTED]");
    });

    it("should redact location from metadata", () => {
      logger.info("test message", { location: { lat: 40.7, lon: -74.0 } });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.location).toBe("[REDACTED]");
    });

    it("should redact messageContent from metadata", () => {
      logger.info("test message", { messageContent: "sensitive message" });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.messageContent).toBe("[REDACTED]");
    });

    it("should preserve non-PII fields", () => {
      logger.info("test message", { userId: "123", action: "login" });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.userId).toBe("123");
      expect(parsed.action).toBe("login");
    });

    it("should handle nested objects", () => {
      logger.info("test message", {
        user: { id: "123", email: "test@example.com" },
      });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.user.id).toBe("123");
      expect(parsed.user.email).toBe("[REDACTED]");
    });
  });

  describe("log levels", () => {
    it("should log INFO level", () => {
      logger.info("info message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should log WARN level", () => {
      logger.warn("warning message");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should log ERROR level", () => {
      logger.error("error message");
      expect(console.error).toHaveBeenCalled();
    });

    it("should include timestamp and level in output", () => {
      logger.info("test");
      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.level).toBe("INFO");
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.msg).toBe("test");
    });
  });
});
