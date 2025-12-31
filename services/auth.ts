import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../src/lib/logger";

const TOKEN_KEY = "@auth:token";
const USER_KEY = "@auth:user";

type AuthToken = {
  token: string;
  expiresAt: number;
};

type AuthUser = {
  id: string;
  displayName: string;
  email?: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

/**
 * Mock authentication service
 * TODO: Replace with real Apple Sign-In integration
 */

export const auth = {
  /**
   * Sign in with Apple (mocked)
   * Returns a mock JWT token and user
   */
  async signIn(): Promise<AuthSession> {
    logger.info("Auth: signIn called (mocked)");

    // Mock user and token
    const mockUser: AuthUser = {
      id: "mock-user-123",
      displayName: "Test User",
      email: "test@example.com",
    };

    const mockToken: AuthToken = {
      token: "mock-jwt-token-" + Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Store in AsyncStorage
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(mockToken));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    logger.info("Auth: signIn successful", { userId: mockUser.id });

    return {
      user: mockUser,
      token: mockToken.token,
    };
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    logger.info("Auth: signOut called");
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    logger.info("Auth: signOut successful");
  },

  /**
   * Get current session (if exists and valid)
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const tokenData = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (!tokenData || !userData) {
        return null;
      }

      const token: AuthToken = JSON.parse(tokenData);
      const user: AuthUser = JSON.parse(userData);

      // Check if token expired
      if (token.expiresAt < Date.now()) {
        logger.warn("Auth: token expired");
        await this.signOut();
        return null;
      }

      return {
        user,
        token: token.token,
      };
    } catch (error) {
      logger.error("Auth: getSession error", { error });
      return null;
    }
  },

  /**
   * Refresh token (stub for future implementation)
   */
  async refreshToken(): Promise<string | null> {
    logger.warn("Auth: refreshToken not implemented yet");
    // TODO: Implement token refresh logic
    return null;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },
};
