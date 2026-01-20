/**
 * Authentication Service - M1 Implementation
 * Supports Apple Sign-In with Supabase backend and mock fallback for development
 *
 * Architecture:
 * - Real mode: Apple Sign-In → Supabase Auth → SQLite + Cloud
 * - Mock mode: Fake token → SQLite only (no cloud)
 */

import * as AppleAuthentication from "expo-apple-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "../lib/logger";
import { api } from "./api";
import {
  signInWithApple as supabaseSignInWithApple,
  signOut as supabaseSignOut,
  isSupabaseConfigured,
} from "./supabase";
import type { User, SignInWithAppleRequest } from "../types/user";
import { saveUser } from "../storage/user";
import { env } from "../config/env";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

// Feature flag from environment
const ENABLE_APPLE_AUTH = env.ENABLE_APPLE_AUTH;

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: number;
};

export type AuthError = {
  code: string;
  message: string;
};

export type AuthResult =
  | { success: true; session: AuthSession }
  | { success: false; error: AuthError };

/**
 * Secure storage helpers
 */
async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * Check if Apple Sign-In is available on this device
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!ENABLE_APPLE_AUTH) return false;

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export const auth = {
  /**
   * Sign in with Apple
   * Uses Supabase when configured, mock API when not
   */
  async signInWithApple(): Promise<AuthResult> {
    const useSupabase = isSupabaseConfigured() && env.ENABLE_CLOUD_SYNC;
    logger.info("Auth: signInWithApple called", {
      mockMode: !ENABLE_APPLE_AUTH,
      useSupabase,
    });

    try {
      // Real Apple Sign-In flow (iOS only, when enabled)
      if (ENABLE_APPLE_AUTH && Platform.OS !== "web") {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          ],
        });

        if (!credential.identityToken) {
          return {
            success: false,
            error: { code: "NO_TOKEN", message: "Apple Sign-In did not return a token" },
          };
        }

        // If Supabase is configured, use it for auth
        if (useSupabase) {
          const {
            user: supabaseUser,
            session,
            error,
          } = await supabaseSignInWithApple(credential.identityToken);

          if (error || !supabaseUser) {
            logger.error("Auth: Supabase sign-in failed", { error: error?.message });
            return {
              success: false,
              error: { code: "SUPABASE_ERROR", message: error?.message || "Sign-in failed" },
            };
          }

          // Build user from Supabase session
          const user: User = {
            id: supabaseUser.id,
            appleId: credential.user,
            displayName: credential.fullName
              ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
              : supabaseUser.email?.split("@")[0] || "User",
            email: supabaseUser.email || credential.email || undefined,
            photoUrl: undefined,
            bio: undefined,
            defaultPrivacy: "SELF",
            createdAt: supabaseUser.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: undefined,
          };

          const token = session?.access_token || "";
          const expiresAt = session?.expires_at
            ? session.expires_at * 1000
            : Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days default

          // Save to SecureStore
          await secureSet(TOKEN_KEY, token);
          await secureSet(USER_KEY, JSON.stringify(user));
          await secureSet(TOKEN_EXPIRY_KEY, expiresAt.toString());

          // Save to SQLite (device-first)
          await saveUser(user);

          logger.info("Auth: Supabase signIn successful", { userId: user.id });
          return { success: true, session: { user, token, expiresAt } };
        }

        // Fallback to mock API if Supabase not configured
        const request: SignInWithAppleRequest = {
          appleToken: credential.identityToken,
          appleUserId: credential.user,
          email: credential.email || undefined,
          fullName: credential.fullName
            ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
            : undefined,
        };

        const response = await api.auth.signInWithApple(request);

        if ("error" in response) {
          logger.error("Auth: API sign-in failed", { error: response.error });
          return { success: false, error: response.error };
        }

        const { user, token, expiresAt } = response.data;

        await secureSet(TOKEN_KEY, token);
        await secureSet(USER_KEY, JSON.stringify(user));
        await secureSet(TOKEN_EXPIRY_KEY, expiresAt.toString());
        await saveUser(user);

        logger.info("Auth: API signIn successful", { userId: user.id });
        return { success: true, session: { user, token, expiresAt } };
      }

      // Mock mode for development
      const request: SignInWithAppleRequest = {
        appleToken: "mock-apple-token-dev",
        appleUserId: "dev-user-12345",
        email: "dev@example.com",
        fullName: "Dev User",
      };

      const response = await api.auth.signInWithApple(request);

      if ("error" in response) {
        logger.error("Auth: API sign-in failed", { error: response.error });
        return { success: false, error: response.error };
      }

      const { user, token, expiresAt } = response.data;

      await secureSet(TOKEN_KEY, token);
      await secureSet(USER_KEY, JSON.stringify(user));
      await secureSet(TOKEN_EXPIRY_KEY, expiresAt.toString());
      await saveUser(user);

      logger.info("Auth: Mock signIn successful", { userId: user.id });
      return { success: true, session: { user, token, expiresAt } };
    } catch (error) {
      if (error instanceof Error && error.message.includes("ERR_CANCELED")) {
        return { success: false, error: { code: "CANCELLED", message: "Sign-in was cancelled" } };
      }

      logger.error("Auth: signIn error", { error });
      return { success: false, error: { code: "UNKNOWN", message: "Sign-in failed" } };
    }
  },

  async signOut(): Promise<void> {
    logger.info("Auth: signOut called");

    // Sign out from Supabase if configured
    if (isSupabaseConfigured()) {
      await supabaseSignOut();
    }

    // Clear local session
    await secureDelete(TOKEN_KEY);
    await secureDelete(USER_KEY);
    await secureDelete(TOKEN_EXPIRY_KEY);
    logger.info("Auth: signOut successful");
  },

  async getSession(): Promise<AuthSession | null> {
    try {
      const token = await secureGet(TOKEN_KEY);
      const userJson = await secureGet(USER_KEY);
      const expiryStr = await secureGet(TOKEN_EXPIRY_KEY);

      if (!token || !userJson || !expiryStr) {
        return null;
      }

      const expiresAt = parseInt(expiryStr, 10);

      if (expiresAt < Date.now()) {
        logger.warn("Auth: token expired");
        await this.signOut();
        return null;
      }

      const user: User = JSON.parse(userJson);
      return { user, token, expiresAt };
    } catch (error) {
      logger.error("Auth: getSession error", { error });
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },

  async getToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.token || null;
  },

  async getUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  },

  async updateUser(user: User): Promise<void> {
    await secureSet(USER_KEY, JSON.stringify(user));
  },
};
