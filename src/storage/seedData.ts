/**
 * Seed Data Module
 * Generates sample data for development/testing
 *
 * Usage: Call seedDemoData() from a dev menu or on first launch
 * This uses the app's storage layer, so it works with SQLite now
 * and will work with cloud DB later (same API, different backend)
 */

import { execute, query } from "./database";
import { logger } from "../lib/logger";

// Fixed IDs for predictable testing
export const DEMO_USERS = {
  MAIN: "demo_main_user",
  FRIEND_ALICE: "demo_alice",
  FRIEND_BOB: "demo_bob",
  PENDING_CAROL: "demo_carol",
} as const;

const genId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

/**
 * Check if demo data already exists
 */
export async function hasDemoData(): Promise<boolean> {
  const result = await query<{ id: string }>("SELECT id FROM users WHERE id = ? LIMIT 1", [
    DEMO_USERS.MAIN,
  ]);
  return result.length > 0;
}

/**
 * Clear all demo data
 */
export async function clearDemoData(): Promise<void> {
  const demoIds = Object.values(DEMO_USERS);

  // Delete in order (foreign key constraints)
  await execute(
    `DELETE FROM notifications WHERE userId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(
    `DELETE FROM reactions WHERE userId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(
    `DELETE FROM posts WHERE authorUserId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(
    `DELETE FROM habit_check_ins WHERE userId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(
    `DELETE FROM habits WHERE userId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(
    `DELETE FROM friendships WHERE userId IN (${demoIds.map(() => "?").join(",")})`,
    demoIds
  );
  await execute(`DELETE FROM users WHERE id IN (${demoIds.map(() => "?").join(",")})`, demoIds);

  logger.info("Demo data cleared");
}

/**
 * Seed demo data for testing
 * Safe to call multiple times (checks for existing data)
 */
export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already seeded
    if (await hasDemoData()) {
      return { success: true, message: "Demo data already exists" };
    }

    const now = new Date().toISOString();

    // 1. Users
    const users = [
      { id: DEMO_USERS.MAIN, name: "You (Demo)", bio: "Testing the app" },
      { id: DEMO_USERS.FRIEND_ALICE, name: "Alice", bio: "Marathon runner" },
      { id: DEMO_USERS.FRIEND_BOB, name: "Bob", bio: "Mindfulness enthusiast" },
      { id: DEMO_USERS.PENDING_CAROL, name: "Carol", bio: "New to habits" },
    ];

    for (const user of users) {
      await execute(
        `INSERT INTO users (id, displayName, bio, defaultPrivacy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.bio, "FRIENDS", daysAgo(30), now]
      );
    }

    // 2. Friendships
    await execute(
      `INSERT INTO friendships (id, userId, friendId, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("fr"), DEMO_USERS.MAIN, DEMO_USERS.FRIEND_ALICE, "ACCEPTED", daysAgo(20)]
    );
    await execute(
      `INSERT INTO friendships (id, userId, friendId, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("fr"), DEMO_USERS.MAIN, DEMO_USERS.FRIEND_BOB, "ACCEPTED", daysAgo(15)]
    );
    await execute(
      `INSERT INTO friendships (id, userId, friendId, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("fr"), DEMO_USERS.PENDING_CAROL, DEMO_USERS.MAIN, "PENDING", daysAgo(1)]
    );

    // 3. Habits
    const habits = [
      { id: genId("habit"), userId: DEMO_USERS.MAIN, title: "Morning Meditation", pillar: "SOUL" },
      { id: genId("habit"), userId: DEMO_USERS.MAIN, title: "Read 30 min", pillar: "MIND" },
      { id: genId("habit"), userId: DEMO_USERS.MAIN, title: "Gym Session", pillar: "BODY" },
      { id: genId("habit"), userId: DEMO_USERS.FRIEND_ALICE, title: "Morning Run", pillar: "BODY" },
    ];

    for (const habit of habits) {
      const schedule = JSON.stringify({ frequency: "DAILY", targetCount: 1 });
      await execute(
        `INSERT INTO habits (id, userId, title, pillar, schedule, privacy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [habit.id, habit.userId, habit.title, habit.pillar, schedule, "PUBLIC", daysAgo(20)]
      );
    }

    // 4. Check-ins (7-day streak for meditation)
    const meditationHabit = habits[0];
    for (let i = 1; i <= 7; i++) {
      await execute(
        `INSERT INTO habit_check_ins (id, habitId, userId, occurredAt, source, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [genId("ci"), meditationHabit.id, DEMO_USERS.MAIN, daysAgo(i), "MANUAL", daysAgo(i)]
      );
    }

    // 5. Posts
    const posts = [
      {
        id: genId("post"),
        userId: DEMO_USERS.MAIN,
        text: "7-day meditation streak!",
        privacy: "FRIENDS",
      },
      {
        id: genId("post"),
        userId: DEMO_USERS.FRIEND_ALICE,
        text: "Marathon training week 4 complete!",
        privacy: "PUBLIC",
      },
    ];

    for (const post of posts) {
      await execute(
        `INSERT INTO posts (id, authorUserId, bodyText, pillar, privacy, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [post.id, post.userId, post.text, "MIND", post.privacy, daysAgo(1)]
      );
    }

    // 6. Reaction on main user's post
    await execute(
      `INSERT INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("react"), posts[0].id, DEMO_USERS.FRIEND_ALICE, "🎉", now]
    );

    // 7. Notification
    await execute(
      `INSERT INTO notifications (id, userId, type, title, body, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        DEMO_USERS.MAIN,
        "REACTION",
        "New reaction",
        "Alice reacted to your post",
        0,
        now,
      ]
    );

    logger.info("Demo data seeded successfully");
    return { success: true, message: "Demo data created: 4 users, 4 habits, 7 check-ins, 2 posts" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to seed demo data", { error: message });
    return { success: false, message };
  }
}
