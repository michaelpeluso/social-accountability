import { auth } from "../../../services/auth";
import { logger } from "../../../src/lib/logger";

describe("auth service", () => {
  beforeEach(async () => {
    // Clear any stored auth data before each test
    await auth.signOut();
  });

  describe("signIn", () => {
    it("should return mock user and token", async () => {
      const session = await auth.signIn();

      expect(session).toBeDefined();
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe("mock-user-123");
      expect(session.token).toBeDefined();
      expect(session.token).toContain("mock-jwt-token-");
    });

    it("should store session in AsyncStorage", async () => {
      await auth.signIn();
      const session = await auth.getSession();

      expect(session).not.toBeNull();
      expect(session?.user.id).toBe("mock-user-123");
    });
  });

  describe("signOut", () => {
    it("should clear stored session", async () => {
      await auth.signIn();
      await auth.signOut();
      const session = await auth.getSession();

      expect(session).toBeNull();
    });
  });

  describe("getSession", () => {
    it("should return null when no session exists", async () => {
      const session = await auth.getSession();
      expect(session).toBeNull();
    });

    it("should return session when valid token exists", async () => {
      await auth.signIn();
      const session = await auth.getSession();

      expect(session).not.toBeNull();
      expect(session?.user.displayName).toBe("Test User");
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when not signed in", async () => {
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it("should return true when signed in", async () => {
      await auth.signIn();
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });
});
