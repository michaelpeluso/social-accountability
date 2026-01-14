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
  await execute(`DELETE FROM goals WHERE userId IN (${demoIds.map(() => "?").join(",")})`, demoIds);
  await execute(
    `DELETE FROM friendships WHERE userId IN (${demoIds.map(() => "?").join(",")}) OR friendId IN (${demoIds.map(() => "?").join(",")})`,
    [...demoIds, ...demoIds]
  );
  await execute(`DELETE FROM users WHERE id IN (${demoIds.map(() => "?").join(",")})`, demoIds);

  logger.info("Demo data cleared successfully");
}

/**
 * Seed demo data for testing
 * Safe to call multiple times (checks for existing data)
 *
 * @param currentUserId - Optional: Use current authenticated user ID instead of DEMO_USERS.MAIN
 *                        This allows seeding data for the currently logged-in user
 */
export async function seedDemoData(
  currentUserId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();

    // Use current user ID if provided, otherwise use demo main user
    const mainUserId = currentUserId || DEMO_USERS.MAIN;
    const isCurrentUser = !!currentUserId;

    // 1. Users (only create demo users if not using current user)
    if (!isCurrentUser) {
      const users = [
        { id: DEMO_USERS.MAIN, name: "You (Demo)", bio: "Testing the app" },
        { id: DEMO_USERS.FRIEND_ALICE, name: "Alice", bio: "Marathon runner" },
        { id: DEMO_USERS.FRIEND_BOB, name: "Bob", bio: "Mindfulness enthusiast" },
        { id: DEMO_USERS.PENDING_CAROL, name: "Carol", bio: "New to habits" },
      ];

      for (const user of users) {
        await execute(
          `INSERT OR REPLACE INTO users (id, displayName, bio, defaultPrivacy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [user.id, user.name, user.bio, "FRIENDS", daysAgo(30), now]
        );
      }
    } else {
      // Create demo friend users only
      const friends = [
        { id: DEMO_USERS.FRIEND_ALICE, name: "Alice", bio: "Marathon runner" },
        { id: DEMO_USERS.FRIEND_BOB, name: "Bob", bio: "Mindfulness enthusiast" },
        { id: DEMO_USERS.PENDING_CAROL, name: "Carol", bio: "New to habits" },
      ];

      for (const friend of friends) {
        await execute(
          `INSERT OR REPLACE INTO users (id, displayName, bio, defaultPrivacy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [friend.id, friend.name, friend.bio, "FRIENDS", daysAgo(30), now]
        );
      }
    }

    // 2. Friendships
    await execute(
      `INSERT OR REPLACE INTO friendships (id, userId, friendId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [genId("fr"), mainUserId, DEMO_USERS.FRIEND_ALICE, "ACCEPTED", daysAgo(20), now]
    );
    await execute(
      `INSERT OR REPLACE INTO friendships (id, userId, friendId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [genId("fr"), mainUserId, DEMO_USERS.FRIEND_BOB, "ACCEPTED", daysAgo(15), now]
    );
    await execute(
      `INSERT OR REPLACE INTO friendships (id, userId, friendId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [genId("fr"), DEMO_USERS.PENDING_CAROL, mainUserId, "PENDING", daysAgo(1), now]
    );

    // 3. Goals (all for main user)
    const goals = [
      {
        id: genId("goal"),
        userId: mainUserId,
        title: "Run a 5K",
        pillar: "BODY",
        description: "Complete my first 5K race",
        targetValue: 5,
      },
      {
        id: genId("goal"),
        userId: mainUserId,
        title: "Read 12 books this year",
        pillar: "MIND",
        description: "Expand my knowledge through reading",
        targetValue: 12,
      },
      {
        id: genId("goal"),
        userId: DEMO_USERS.FRIEND_ALICE,
        title: "Complete a marathon",
        pillar: "BODY",
        description: "Train for and finish a full marathon",
        targetValue: 42.2,
      },
    ];

    for (const goal of goals) {
      await execute(
        `INSERT OR REPLACE INTO goals (id, userId, title, pillar, description, targetValue, currentValue, dataSource, privacy, isArchived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goal.id,
          goal.userId,
          goal.title,
          goal.pillar,
          goal.description,
          goal.targetValue,
          0,
          "MANUAL",
          "FRIENDS",
          0,
          daysAgo(25),
          now,
        ]
      );
    }

    // 4. Habits (with all required columns, main user habits)
    const habits = [
      {
        id: genId("habit"),
        userId: mainUserId,
        goalId: goals[0].id,
        title: "Morning Meditation",
        pillar: "SOUL",
        description: "10 minutes of mindfulness",
        icon: "🧘",
        habitType: "BUILD",
      },
      {
        id: genId("habit"),
        userId: mainUserId,
        goalId: goals[1].id,
        title: "Read 30 min",
        pillar: "MIND",
        description: "Daily reading habit",
        icon: "📚",
        habitType: "BUILD",
      },
      {
        id: genId("habit"),
        userId: mainUserId,
        goalId: goals[0].id,
        title: "Gym Session",
        pillar: "BODY",
        description: "Strength training",
        icon: "💪",
        habitType: "BUILD",
      },
      {
        id: genId("habit"),
        userId: mainUserId,
        title: "No Social Media After 9pm",
        pillar: "MIND",
        description: "Better sleep hygiene",
        icon: "📱",
        habitType: "BREAK",
      },
      {
        id: genId("habit"),
        userId: DEMO_USERS.FRIEND_ALICE,
        goalId: goals[2].id,
        title: "Morning Run",
        pillar: "BODY",
        description: "5K training runs",
        icon: "🏃‍♀️",
        habitType: "BUILD",
      },
      {
        id: genId("habit"),
        userId: DEMO_USERS.FRIEND_BOB,
        title: "Gratitude Journal",
        pillar: "SOUL",
        description: "Write 3 things I'm grateful for",
        icon: "📝",
        habitType: "BUILD",
      },
    ];

    for (const habit of habits) {
      const schedule = JSON.stringify({ frequency: "DAILY", targetCount: 1 });
      await execute(
        `INSERT OR REPLACE INTO habits (
          id, userId, goalId, title, pillar, description, icon, habitType, completionType,
          schedule, privacy, isArchived, currentStreak, longestStreak, recoveryStreak, graceDays,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          habit.id,
          habit.userId,
          habit.goalId || null,
          habit.title,
          habit.pillar,
          habit.description,
          habit.icon,
          habit.habitType,
          "BINARY",
          schedule,
          "PUBLIC",
          0,
          0,
          0,
          0,
          0,
          daysAgo(20),
          now,
        ]
      );
    }

    // 5. Check-ins (create realistic patterns)
    const meditationHabit = habits[0];
    const readingHabit = habits[1];
    const gymHabit = habits[2];
    const aliceRunHabit = habits[4];

    // Meditation: perfect 10-day streak
    for (let i = 0; i < 10; i++) {
      await execute(
        `INSERT OR REPLACE INTO habit_check_ins (id, habitId, userId, occurredAt, source, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          genId("ci"),
          meditationHabit.id,
          mainUserId,
          daysAgo(i),
          "MANUAL",
          i === 0 ? "Feeling great!" : null,
          daysAgo(i),
        ]
      );
    }

    // Reading: 7 out of 10 days (realistic pattern)
    for (let i = 0; i < 10; i++) {
      if (i !== 3 && i !== 7) {
        // missed 2 days
        await execute(
          `INSERT OR REPLACE INTO habit_check_ins (id, habitId, userId, occurredAt, source, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [genId("ci"), readingHabit.id, mainUserId, daysAgo(i), "MANUAL", daysAgo(i)]
        );
      }
    }

    // Gym: 3x per week (Mon/Wed/Fri pattern)
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        // Mon, Wed, Fri
        await execute(
          `INSERT OR REPLACE INTO habit_check_ins (id, habitId, userId, occurredAt, source, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            genId("ci"),
            gymHabit.id,
            mainUserId,
            daysAgo(i),
            "MANUAL",
            i === 0 ? "New PR on bench press!" : null,
            daysAgo(i),
          ]
        );
      }
    }

    // Alice's runs: 5 days per week
    for (let i = 0; i < 10; i++) {
      if (i !== 2 && i !== 6) {
        // 2 rest days per week
        await execute(
          `INSERT OR REPLACE INTO habit_check_ins (id, habitId, userId, occurredAt, source, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [genId("ci"), aliceRunHabit.id, DEMO_USERS.FRIEND_ALICE, daysAgo(i), "MANUAL", daysAgo(i)]
        );
      }
    }

    // 6. Posts (main user and friends)
    const posts = [
      {
        id: genId("post"),
        userId: mainUserId,
        text: "🎉 10-day meditation streak! Feeling more centered and focused each day. Anyone else meditating?",
        privacy: "FRIENDS",
        pillar: "SOUL",
      },
      {
        id: genId("post"),
        userId: mainUserId,
        text: "New PR on bench press today! 💪 The consistency is paying off.",
        privacy: "FRIENDS",
        pillar: "BODY",
      },
      {
        id: genId("post"),
        userId: DEMO_USERS.FRIEND_ALICE,
        text: "Marathon training week 4 complete! 🏃‍♀️ Ran 50km this week. Legs are tired but spirits are high!",
        privacy: "PUBLIC",
        pillar: "BODY",
      },
      {
        id: genId("post"),
        userId: DEMO_USERS.FRIEND_BOB,
        text: "Started a gratitude journal this week. Small wins feel bigger when you write them down. 🔥",
        privacy: "FRIENDS",
        pillar: "SOUL",
      },
    ];

    for (const post of posts) {
      await execute(
        `INSERT OR REPLACE INTO posts (id, authorUserId, bodyText, pillar, privacy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          post.id,
          post.userId,
          post.text,
          post.pillar,
          post.privacy,
          daysAgo(Math.floor(Math.random() * 3)),
          now,
        ]
      );
    }

    // 7. Reactions (using new emoji set: 👍❤️👏🔥📈)
    await execute(
      `INSERT OR REPLACE INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("react"), posts[0].id, DEMO_USERS.FRIEND_ALICE, "👏", daysAgo(1)]
    );
    await execute(
      `INSERT OR REPLACE INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("react"), posts[0].id, DEMO_USERS.FRIEND_BOB, "❤️", daysAgo(1)]
    );
    await execute(
      `INSERT OR REPLACE INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("react"), posts[1].id, DEMO_USERS.FRIEND_ALICE, "🔥", now]
    );
    await execute(
      `INSERT OR REPLACE INTO reactions (id, postId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("react"), posts[2].id, mainUserId, "📈", daysAgo(1)]
    );

    // 8. Comments (on posts)
    await execute(
      `INSERT OR REPLACE INTO comments (id, postId, authorUserId, bodyText, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        genId("comment"),
        posts[0].id,
        DEMO_USERS.FRIEND_ALICE,
        "Love this! Keep it up! 🙌",
        daysAgo(1),
        now,
      ]
    );
    await execute(
      `INSERT OR REPLACE INTO comments (id, postId, authorUserId, bodyText, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [genId("comment"), posts[2].id, mainUserId, "Amazing progress Alice! 🏃‍♀️", daysAgo(1), now]
    );

    // 9. Nudges (encouragement between friends)
    await execute(
      `INSERT OR REPLACE INTO nudges (id, fromUserId, toUserId, templateId, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("nudge"), DEMO_USERS.FRIEND_BOB, mainUserId, "keep_going", daysAgo(1)]
    );
    await execute(
      `INSERT OR REPLACE INTO nudges (id, fromUserId, toUserId, templateId, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [genId("nudge"), DEMO_USERS.FRIEND_ALICE, mainUserId, "you_got_this", daysAgo(2)]
    );

    // 10. Notifications (using new emoji set, for main user)
    await execute(
      `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        mainUserId,
        "REACTION_RECEIVED",
        "New reaction",
        "Alice reacted 👏 to your post",
        JSON.stringify({ postId: posts[0].id }),
        0,
        daysAgo(1),
      ]
    );
    await execute(
      `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        mainUserId,
        "REACTION_RECEIVED",
        "New reaction",
        "Bob reacted ❤️ to your post",
        JSON.stringify({ postId: posts[0].id }),
        0,
        daysAgo(1),
      ]
    );
    await execute(
      `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        mainUserId,
        "FRIEND_REQUEST",
        "New friend request",
        "Carol wants to be friends",
        0,
        daysAgo(1),
      ]
    );
    await execute(
      `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        mainUserId,
        "NUDGE_RECEIVED",
        "You got a nudge!",
        "Bob sent you encouragement: Keep going!",
        JSON.stringify({ fromUserId: DEMO_USERS.FRIEND_BOB }),
        0,
        daysAgo(1),
      ]
    );
    await execute(
      `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        genId("notif"),
        mainUserId,
        "NUDGE_RECEIVED",
        "You got a nudge!",
        "Alice sent you encouragement: You got this!",
        JSON.stringify({ fromUserId: DEMO_USERS.FRIEND_ALICE }),
        0,
        daysAgo(2),
      ]
    );

    logger.info("Demo data seeded successfully", { mainUserId, isCurrentUser });
    return {
      success: true,
      message: isCurrentUser
        ? `Demo data created for your account: 2 goals, 4 habits, 40+ check-ins, 2 posts, 2 friends, 2 nudges, 2 comments`
        : "Demo data created: 4 users, 3 goals, 6 habits, 40+ check-ins, 4 posts, 4 reactions, 2 nudges, 2 comments",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to seed demo data", { error: message });
    return { success: false, message };
  }
}
