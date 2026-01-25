/**
 * Supabase Client - Cloud replica connection
 *
 * Architecture: SQLite (local source of truth) <--> Supabase Postgres (cloud replica)
 * This client is used for:
 * - Syncing local changes to cloud
 * - Pulling updates from cloud (multi-device sync)
 * - Authentication (Apple Sign-In)
 *
 * All read/write operations FIRST go to SQLite, then sync to Supabase in background.
 */

import { createClient, SupabaseClient, Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { env } from "../config/env";
import { logger } from "../lib/logger";

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

/**
 * Get or create Supabase client
 * Returns null if Supabase is not configured (local-only mode)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    logger.info("Supabase client initialized", { url: env.SUPABASE_URL });
  }

  return supabaseClient;
}

/**
 * Get current Supabase session
 */
export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

/**
 * Get current Supabase user
 */
export async function getSupabaseUser(): Promise<User | null> {
  const session = await getSupabaseSession();
  return session?.user ?? null;
}

/**
 * Sign in with Apple ID token (from expo-apple-authentication)
 */
export async function signInWithApple(identityToken: string): Promise<{
  user: User | null;
  session: Session | null;
  error: Error | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: new Error("Supabase not configured"),
    };
  }

  try {
    const { data, error } = await client.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
    });

    if (error) {
      logger.error("Supabase Apple sign-in failed", { error: error.message });
      return { user: null, session: null, error };
    }

    logger.info("Supabase Apple sign-in successful", { userId: data.user?.id });
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    logger.error("Supabase Apple sign-in error", { error: err.message });
    return { user: null, session: null, error: err };
  }
}

/**
 * Sign out from Supabase
 */
export async function signOut(): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: null };
  }

  const { error } = await client.auth.signOut();
  if (error) {
    logger.error("Supabase sign-out failed", { error: error.message });
    return { error };
  }

  logger.info("Supabase sign-out successful");
  return { error: null };
}

/**
 * Database operations - for syncing to cloud replica
 */
export const supabaseDb = {
  /**
   * Insert a record into a table
   */
  async insert<T extends Record<string, unknown>>(
    table: string,
    record: T
  ): Promise<{ data: T | null; error: Error | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    try {
      const { data, error } = await client.from(table).insert(record).select().single();

      if (error) {
        logger.error(`Supabase insert failed: ${table}`, { error: error.message });
        return { data: null, error };
      }

      return { data: data as T, error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return { data: null, error: err };
    }
  },

  /**
   * Update a record in a table
   */
  async update<T extends Record<string, unknown>>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<{ data: T | null; error: Error | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    try {
      const { data, error } = await client
        .from(table)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error(`Supabase update failed: ${table}`, { error: error.message });
        return { data: null, error };
      }

      return { data: data as T, error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return { data: null, error: err };
    }
  },

  /**
   * Delete a record from a table
   */
  async delete(table: string, id: string): Promise<{ error: Error | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { error: new Error("Supabase not configured") };
    }

    try {
      const { error } = await client.from(table).delete().eq("id", id);

      if (error) {
        logger.error(`Supabase delete failed: ${table}`, { error: error.message });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return { error: err };
    }
  },

  /**
   * Upsert a record (insert or update if exists)
   */
  async upsert<T extends Record<string, unknown>>(
    table: string,
    record: T
  ): Promise<{ data: T | null; error: Error | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    try {
      const { data, error } = await client
        .from(table)
        .upsert(record, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        logger.error(`Supabase upsert failed: ${table}`, { error: error.message });
        return { data: null, error };
      }

      return { data: data as T, error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return { data: null, error: err };
    }
  },

  /**
   * Fetch records updated after a given timestamp
   * Used for pulling cloud changes to local SQLite
   */
  async fetchUpdatedSince<T>(
    table: string,
    since: string,
    userId?: string
  ): Promise<{ data: T[]; error: Error | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: [], error: new Error("Supabase not configured") };
    }

    try {
      let query = client.from(table).select("*").gt("updated_at", since);

      // Filter by user if provided (for user-specific tables)
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error(`Supabase fetch failed: ${table}`, { error: error.message });
        return { data: [], error };
      }

      return { data: (data || []) as T[], error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return { data: [], error: err };
    }
  },
};

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}
