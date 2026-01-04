import { auth } from "../../services/auth";

describe("auth service", () => {
  beforeEach(async () => {
    await auth.signOut();
  });

  describe("signInWithApple", () => {
    it("should return success with mock user and token", async () => {
      const result = await auth.signInWithApple();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session).toBeDefined();
        expect(result.session.user).toBeDefined();
        expect(result.session.user.id).toBeDefined();
        expect(result.session.token).toBeDefined();
      }
    });

    it("should store session after sign-in", async () => {
      await auth.signInWithApple();
      const session = await auth.getSession();

      expect(session).not.toBeNull();
      expect(session?.user.id).toBeDefined();
    });
  });

  describe("signOut", () => {
    it("should clear stored session", async () => {
      await auth.signInWithApple();
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
      await auth.signInWithApple();
      const session = await auth.getSession();

      expect(session).not.toBeNull();
      expect(session?.user.displayName).toBeDefined();
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when not signed in", async () => {
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it("should return true when signed in", async () => {
      await auth.signInWithApple();
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  describe("getToken", () => {
    it("should return null when not signed in", async () => {
      const token = await auth.getToken();
      expect(token).toBeNull();
    });

    it("should return token when signed in", async () => {
      await auth.signInWithApple();
      const token = await auth.getToken();
      expect(token).toBeDefined();
    });
  });

  describe("getUser", () => {
    it("should return null when not signed in", async () => {
      const user = await auth.getUser();
      expect(user).toBeNull();
    });

    it("should return user when signed in", async () => {
      await auth.signInWithApple();
      const user = await auth.getUser();
      expect(user).toBeDefined();
      expect(user?.id).toBeDefined();
    });
  });
});
