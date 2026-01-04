/**
 * User Storage - Local SQLite operations for users and sessions
 * Device-first: local is source of truth, synced to cloud
 */

import { query, queryFirst, execute, transaction } from "./database";
import { logger } from "../lib/logger";
import type { User, Friendship, FriendRequest, Privacy } from "../types/user";
import type { SQLiteBindValue } from "expo-sqlite";

// Session stored in SQLite for persistence across restarts
export interface LocalSession {
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: string;
}

/**
 * Save or update user in local database
 */
export async function saveUser(user: User): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO users (id, appleId, displayName, email, photoUrl, bio, defaultPrivacy, createdAt, updatedAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       displayName = excluded.displayName,
       email = excluded.email,
       photoUrl = excluded.photoUrl,
       bio = excluded.bio,
       defaultPrivacy = excluded.defaultPrivacy,
       updatedAt = excluded.updatedAt,
       syncedAt = excluded.syncedAt`,
    [
      user.id,
      user.appleId || null,
      user.displayName,
      user.email || null,
      user.photoUrl || null,
      user.bio || null,
      user.defaultPrivacy,
      user.createdAt,
      user.updatedAt,
      now,
    ]
  );

  logger.info("User saved to local storage", { userId: user.id });
}

/**
 * Get user by ID from local database
 */
export async function getUserById(userId: string): Promise<User | null> {
  const row = await queryFirst<User>("SELECT * FROM users WHERE id = ? AND deletedAt IS NULL", [
    userId,
  ]);
  return row;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  return getUserById(session.userId);
}

/**
 * Update user profile fields
 */
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; photoUrl?: string; bio?: string }
): Promise<User | null> {
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (updates.displayName !== undefined) {
    setClauses.push("displayName = ?");
    params.push(updates.displayName);
  }
  if (updates.photoUrl !== undefined) {
    setClauses.push("photoUrl = ?");
    params.push(updates.photoUrl);
  }
  if (updates.bio !== undefined) {
    setClauses.push("bio = ?");
    params.push(updates.bio);
  }

  if (setClauses.length === 0) return getUserById(userId);

  setClauses.push("updatedAt = ?");
  params.push(now);
  params.push(userId);

  await execute(`UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`, params);

  return getUserById(userId);
}

/**
 * Update user default privacy setting
 */
export async function updateUserPrivacy(userId: string, privacy: Privacy): Promise<User | null> {
  const now = new Date().toISOString();

  await execute("UPDATE users SET defaultPrivacy = ?, updatedAt = ? WHERE id = ?", [
    privacy,
    now,
    userId,
  ]);

  return getUserById(userId);
}

/**
 * Save session to local database
 */
export async function saveSession(session: LocalSession): Promise<void> {
  await execute(
    `INSERT INTO session (id, userId, token, expiresAt, createdAt)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       userId = excluded.userId,
       token = excluded.token,
       expiresAt = excluded.expiresAt,
       createdAt = excluded.createdAt`,
    [session.userId, session.token, session.expiresAt, session.createdAt]
  );

  logger.info("Session saved to local storage", { userId: session.userId });
}

/**
 * Get current session from local database
 */
export async function getSession(): Promise<LocalSession | null> {
  const row = await queryFirst<LocalSession>("SELECT * FROM session WHERE id = 1");

  if (!row) return null;

  // Check if session is expired
  if (row.expiresAt < Date.now()) {
    logger.info("Session expired, clearing");
    await clearSession();
    return null;
  }

  return row;
}

/**
 * Clear current session
 */
export async function clearSession(): Promise<void> {
  await execute("DELETE FROM session WHERE id = 1");
  logger.info("Session cleared from local storage");
}

/**
 * Delete user and all related data (for account deletion)
 */
export async function deleteUserData(userId: string): Promise<void> {
  await transaction(async () => {
    // Mark user as deleted
    await execute("UPDATE users SET deletedAt = ? WHERE id = ?", [
      new Date().toISOString(),
      userId,
    ]);

    // Clear session
    await execute("DELETE FROM session WHERE userId = ?", [userId]);

    // Delete friendships
    await execute("DELETE FROM friendships WHERE userId = ? OR friendId = ?", [userId, userId]);

    // Delete friend requests
    await execute("DELETE FROM friend_requests WHERE fromUserId = ? OR toUserId = ?", [
      userId,
      userId,
    ]);

    // Delete blocked users records
    await execute("DELETE FROM blocked_users WHERE userId = ? OR blockedUserId = ?", [
      userId,
      userId,
    ]);

    logger.info("User data deleted from local storage", { userId });
  });
}

// Friendship operations

/**
 * Save friendship to local database
 */
export async function saveFriendship(friendship: Friendship): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO friendships (id, userId, friendId, status, createdAt, updatedAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       updatedAt = excluded.updatedAt,
       syncedAt = excluded.syncedAt`,
    [
      friendship.id,
      friendship.userId,
      friendship.friendId,
      friendship.status,
      friendship.createdAt,
      friendship.updatedAt,
      now,
    ]
  );
}

/**
 * Get all friendships for a user
 */
export async function getFriendships(userId: string): Promise<Friendship[]> {
  return query<Friendship>(
    "SELECT * FROM friendships WHERE (userId = ? OR friendId = ?) AND status = 'ACCEPTED'",
    [userId, userId]
  );
}

/**
 * Get friends (user objects) for a user
 */
export async function getFriends(userId: string): Promise<User[]> {
  return query<User>(
    `SELECT u.* FROM users u
     INNER JOIN friendships f ON (
       (f.userId = ? AND f.friendId = u.id) OR
       (f.friendId = ? AND f.userId = u.id)
     )
     WHERE f.status = 'ACCEPTED' AND u.deletedAt IS NULL`,
    [userId, userId]
  );
}

/**
 * Delete a friendship
 */
export async function deleteFriendship(friendshipId: string): Promise<void> {
  await execute("DELETE FROM friendships WHERE id = ?", [friendshipId]);
}

/**
 * Save friend request
 */
export async function saveFriendRequest(
  request: Omit<FriendRequest, "sender" | "recipient">
): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO friend_requests (id, fromUserId, toUserId, status, createdAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       syncedAt = excluded.syncedAt`,
    [request.id, request.fromUserId, request.toUserId, request.status, request.createdAt, now]
  );
}

/**
 * Get pending friend requests for a user (received)
 */
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const rows = await query<FriendRequest & { sender: string; recipient: string }>(
    `SELECT fr.*, 
            json_object('id', s.id, 'displayName', s.displayName, 'photoUrl', s.photoUrl) as sender,
            json_object('id', r.id, 'displayName', r.displayName, 'photoUrl', r.photoUrl) as recipient
     FROM friend_requests fr
     LEFT JOIN users s ON fr.fromUserId = s.id
     LEFT JOIN users r ON fr.toUserId = r.id
     WHERE fr.toUserId = ? AND fr.status = 'PENDING'`,
    [userId]
  );

  // Parse JSON sender/recipient
  return rows.map((row) => ({
    ...row,
    sender: typeof row.sender === "string" ? JSON.parse(row.sender) : row.sender,
    recipient: typeof row.recipient === "string" ? JSON.parse(row.recipient) : row.recipient,
  }));
}

/**
 * Delete friend request
 */
export async function deleteFriendRequest(requestId: string): Promise<void> {
  await execute("DELETE FROM friend_requests WHERE id = ?", [requestId]);
}

// Blocked users operations

/**
 * Block a user
 */
export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  const now = new Date().toISOString();
  const id = `block-${userId}-${blockedUserId}`;

  await execute(
    `INSERT INTO blocked_users (id, userId, blockedUserId, createdAt, syncedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(userId, blockedUserId) DO NOTHING`,
    [id, userId, blockedUserId, now, now]
  );

  // Also remove any existing friendship
  await execute(
    "DELETE FROM friendships WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)",
    [userId, blockedUserId, blockedUserId, userId]
  );
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  await execute("DELETE FROM blocked_users WHERE userId = ? AND blockedUserId = ?", [
    userId,
    blockedUserId,
  ]);
}

/**
 * Get blocked users for a user
 */
export async function getBlockedUsers(userId: string): Promise<User[]> {
  return query<User>(
    `SELECT u.* FROM users u
     INNER JOIN blocked_users bu ON bu.blockedUserId = u.id
     WHERE bu.userId = ? AND u.deletedAt IS NULL`,
    [userId]
  );
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string, otherUserId: string): Promise<boolean> {
  const result = await queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM blocked_users WHERE userId = ? AND blockedUserId = ?",
    [userId, otherUserId]
  );
  return (result?.count || 0) > 0;
}
