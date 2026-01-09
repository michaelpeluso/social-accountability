/**
 * Check-Ins Storage Tests
 * M2-2.3: Log Check-In
 */

import {
  createCheckIn,
  getCheckIns,
  getUserCheckIns,
  getCheckInById,
  getTodayCheckIns,
  deleteCheckIn,
  markCheckInSynced,
  getUnsyncedCheckIns,
  countCheckInsInRange,
} from "../../src/storage/checkIns";
import { getDatabase } from "../../src/storage/database";

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Get mocked database reference
let mockDb: {
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  getAllAsync: jest.Mock;
  execAsync: jest.Mock;
};

beforeEach(async () => {
  const db = await getDatabase();
  mockDb = db as unknown as typeof mockDb;
  // Reset all mocks to clear any queued return values
  mockDb.runAsync.mockReset().mockResolvedValue({ changes: 1 });
  mockDb.getFirstAsync.mockReset();
  mockDb.getAllAsync.mockReset().mockResolvedValue([]);
  mockDb.execAsync.mockReset().mockResolvedValue(undefined);
});

describe("checkIns storage", () => {
  const testUserId = "user_test123";
  const testHabitId = "habit_test123";

  describe("createCheckIn", () => {
    it("should create a check-in with default values", async () => {
      // First call: check habit exists, second call: get habit for streak update
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ id: testHabitId, UserId: testUserId })
        .mockResolvedValueOnce({ current_streak: 0, longest_streak: 0, last_check_in_at: null });

      const checkIn = await createCheckIn(testHabitId, testUserId, {});

      expect(checkIn.habitId).toBe(testHabitId);
      expect(checkIn.userId).toBe(testUserId);
      expect(checkIn.source).toBe("MANUAL");
      expect(checkIn.id).toMatch(/^checkin_/);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it("should create a check-in with custom values", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ id: testHabitId, UserId: testUserId })
        .mockResolvedValueOnce({ current_streak: 0, longest_streak: 0, last_check_in_at: null });

      const checkIn = await createCheckIn(testHabitId, testUserId, {
        occurredAt: "2024-01-15T10:00:00.000Z",
        source: "INTEGRATION",
        evidenceRef: "photo_123",
        note: "Completed morning run!",
      });

      expect(checkIn.occurredAt).toBe("2024-01-15T10:00:00.000Z");
      expect(checkIn.source).toBe("INTEGRATION");
      expect(checkIn.evidenceRef).toBe("photo_123");
      expect(checkIn.note).toBe("Completed morning run!");
    });

    it("should reject notes exceeding 500 characters", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ id: testHabitId, UserId: testUserId });

      const longNote = "a".repeat(501);

      await expect(createCheckIn(testHabitId, testUserId, { note: longNote })).rejects.toThrow(
        "Note cannot exceed 500 characters"
      );
    });

    it("should throw error if habit not found", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      await expect(createCheckIn(testHabitId, testUserId, {})).rejects.toThrow(
        "Habit not found or access denied"
      );
    });

    it("should throw error if habit belongs to different user", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null); // Query finds nothing for user

      await expect(createCheckIn(testHabitId, "wrong_user", {})).rejects.toThrow(
        "Habit not found or access denied"
      );
    });
  });

  describe("getCheckIns", () => {
    it("should return check-ins for a habit", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: "checkin_1",
          habitId: testHabitId,
          UserId: testUserId,
          occurredAt: "2024-01-15T10:00:00.000Z",
          source: "MANUAL",
          evidenceRef: null,
          note: "Test note",
          createdAt: "2024-01-15T10:00:00.000Z",
          syncedAt: null,
        },
      ]);

      const checkIns = await getCheckIns(testHabitId);

      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].habitId).toBe(testHabitId);
      expect(checkIns[0].note).toBe("Test note");
    });

    it("should respect limit and offset", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getCheckIns(testHabitId, { limit: 10, offset: 5 });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining("LIMIT ? OFFSET ?"), [
        testHabitId,
        10,
        5,
      ]);
    });
  });

  describe("getUserCheckIns", () => {
    it("should return all check-ins for a user", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: "checkin_1",
          habitId: "habit_1",
          UserId: testUserId,
          occurredAt: "2024-01-15T10:00:00.000Z",
          source: "MANUAL",
          evidenceRef: null,
          note: null,
          createdAt: "2024-01-15T10:00:00.000Z",
          syncedAt: null,
        },
        {
          id: "checkin_2",
          habitId: "habit_2",
          UserId: testUserId,
          occurredAt: "2024-01-15T11:00:00.000Z",
          source: "INTEGRATION",
          evidenceRef: "step_count",
          note: null,
          createdAt: "2024-01-15T11:00:00.000Z",
          syncedAt: "2024-01-15T11:01:00.000Z",
        },
      ]);

      const checkIns = await getUserCheckIns(testUserId);

      expect(checkIns).toHaveLength(2);
      expect(checkIns[0].habitId).toBe("habit_1");
      expect(checkIns[1].source).toBe("INTEGRATION");
    });

    it("should filter by date range", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getUserCheckIns(testUserId, {
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("occurredAt >= ?"),
        expect.arrayContaining([testUserId, "2024-01-01T00:00:00.000Z", "2024-01-31T23:59:59.999Z"])
      );
    });
  });

  describe("getCheckInById", () => {
    it("should return check-in by ID", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: "checkin_123",
        habitId: testHabitId,
        UserId: testUserId,
        occurredAt: "2024-01-15T10:00:00.000Z",
        source: "MANUAL",
        evidenceRef: null,
        note: null,
        createdAt: "2024-01-15T10:00:00.000Z",
        syncedAt: null,
      });

      const checkIn = await getCheckInById("checkin_123");

      expect(checkIn).not.toBeNull();
      expect(checkIn?.id).toBe("checkin_123");
    });

    it("should return null for non-existent check-in", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const checkIn = await getCheckInById("nonexistent");

      expect(checkIn).toBeNull();
    });
  });

  describe("getTodayCheckIns", () => {
    it("should return check-ins from today", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: "checkin_today",
          habitId: testHabitId,
          UserId: testUserId,
          occurredAt: new Date().toISOString(),
          source: "MANUAL",
          evidenceRef: null,
          note: null,
          createdAt: new Date().toISOString(),
          syncedAt: null,
        },
      ]);

      const checkIns = await getTodayCheckIns(testHabitId);

      expect(checkIns).toHaveLength(1);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("occurredAt >= ?"),
        expect.any(Array)
      );
    });
  });

  describe("deleteCheckIn", () => {
    it("should delete check-in and recalculate streaks", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ id: "checkin_1", habitId: testHabitId, UserId: testUserId })
        .mockResolvedValueOnce(null); // For recalculate query

      mockDb.getAllAsync.mockResolvedValueOnce([]); // No remaining check-ins

      const result = await deleteCheckIn("checkin_1", testUserId);

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith("DELETE FROM habit_check_ins WHERE id = ?", [
        "checkin_1",
      ]);
    });

    it("should throw error if check-in not found or belongs to different user", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      await expect(deleteCheckIn("checkin_1", "wrong_user")).rejects.toThrow(
        "Check-in not found or access denied"
      );
    });
  });

  describe("markCheckInSynced", () => {
    it("should update syncedAt timestamp", async () => {
      const syncedAt = "2024-01-15T12:00:00.000Z";

      await markCheckInSynced("checkin_123", syncedAt);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "UPDATE habit_check_ins SET syncedAt = ? WHERE id = ?",
        [syncedAt, "checkin_123"]
      );
    });
  });

  describe("getUnsyncedCheckIns", () => {
    it("should return check-ins without syncedAt", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: "checkin_unsynced",
          habitId: testHabitId,
          UserId: testUserId,
          occurredAt: "2024-01-15T10:00:00.000Z",
          source: "MANUAL",
          evidenceRef: null,
          note: null,
          createdAt: "2024-01-15T10:00:00.000Z",
          syncedAt: null,
        },
      ]);

      const checkIns = await getUnsyncedCheckIns(testUserId);

      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].syncedAt).toBeUndefined();
    });
  });

  describe("countCheckInsInRange", () => {
    it("should count check-ins within date range", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 5 });

      const count = await countCheckInsInRange(
        testHabitId,
        "2024-01-01T00:00:00.000Z",
        "2024-01-31T23:59:59.999Z"
      );

      expect(count).toBe(5);
    });

    it("should return 0 when no check-ins in range", async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });

      const count = await countCheckInsInRange(
        testHabitId,
        "2024-01-01T00:00:00.000Z",
        "2024-01-31T23:59:59.999Z"
      );

      expect(count).toBe(0);
    });
  });
});
