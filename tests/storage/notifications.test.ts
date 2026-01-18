/**
 * Notifications Storage Tests
 */

import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
} from "../../src/storage/notifications";
import { execute, query, queryFirst } from "../../src/storage/database";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const TEST_USER = "notif_user";

describe("Notifications Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNotification", () => {
    it("should create a notification", async () => {
      (execute as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });

      const notif = await createNotification(
        TEST_USER,
        "REACTION_RECEIVED",
        "New reaction",
        "Someone reacted to your post",
        { postId: "test_post" }
      );

      expect(notif).toHaveProperty("id");
      expect(notif.userId).toBe(TEST_USER);
      expect(notif.isRead).toBe(false);
    });
  });

  describe("getNotifications", () => {
    it("should retrieve notifications for a user", async () => {
      const mockNotifications = [
        {
          id: "n1",
          userId: TEST_USER,
          type: "BADGE_EARNED",
          title: "Badge earned",
          text: "You earned a new badge!",
          data: JSON.stringify({ badgeType: "streak-7" }),
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      (query as jest.Mock).mockResolvedValue(mockNotifications);

      const notifications = await getNotifications(TEST_USER, 10);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].userId).toBe(TEST_USER);
    });
  });

  describe("getUnreadCount", () => {
    it("should count unread notifications", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({ count: 3 });

      const count = await getUnreadCount(TEST_USER);
      expect(count).toBe(3);
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      (execute as jest.Mock).mockResolvedValue({});

      await markAsRead("notif-1");

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE notifications"),
        expect.arrayContaining(["notif-1"])
      );
    });
  });
});
