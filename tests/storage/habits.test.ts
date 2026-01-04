/**
 * Habits Storage Tests
 */

import {
  createHabit,
  getHabits,
  getHabitsByGoal,
  getSubHabits,
  updateHabit,
  archiveHabit,
  deleteHabit,
  markHabitSynced,
  getUnsyncedHabits,
} from "../../src/storage/habits";
import { execute, query, queryFirst } from "../../src/storage/database";
import { enqueue } from "../../src/services/sync";

// Mock dependencies
jest.mock("../../src/storage/database", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  queryFirst: jest.fn(),
}));

jest.mock("../../src/services/sync", () => ({
  enqueue: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Habits Storage", () => {
  const mockUserId = "user-123";
  const mockGoalId = "goal-456";

  const mockSchedule = {
    frequency: "daily" as const,
    targetCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createHabit", () => {
    it("creates a habit with required fields", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null); // No parent check needed

      const habit = await createHabit(mockUserId, {
        title: "Meditate",
        pillar: "SOUL",
        schedule: mockSchedule,
        privacy: "SELF",
      });

      expect(habit.id).toMatch(/^habit-/);
      expect(habit.userId).toBe(mockUserId);
      expect(habit.title).toBe("Meditate");
      expect(habit.pillar).toBe("SOUL");
      expect(habit.schedule).toEqual(mockSchedule);
      expect(habit.privacy).toBe("SELF");
      expect(habit.currentStreak).toBe(0);
      expect(habit.longestStreak).toBe(0);
      expect(habit.recoveryStreak).toBe(0);

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO habits"),
        expect.arrayContaining([habit.id, mockUserId])
      );
    });

    it("creates a habit linked to a goal", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const habit = await createHabit(mockUserId, {
        title: "Run",
        goalId: mockGoalId,
        pillar: "BODY",
        schedule: { frequency: "weekly", targetCount: 3 },
        privacy: "FRIENDS",
      });

      expect(habit.goalId).toBe(mockGoalId);
    });

    it("creates a sub-habit linked to parent", async () => {
      // Mock parent habit (no parent itself)
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "habit-parent",
        userId: mockUserId,
        parentHabitId: null,
        title: "Parent Habit",
        pillar: "BODY",
        schedule: JSON.stringify(mockSchedule),
        privacy: "SELF",
        isArchived: 0,
        currentStreak: 0,
        longestStreak: 0,
        recoveryStreak: 0,
        lastCheckInAt: null,
        lastMissedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        syncedAt: null,
      });

      const habit = await createHabit(mockUserId, {
        title: "Sub Habit",
        parentHabitId: "habit-parent",
        pillar: "BODY",
        schedule: mockSchedule,
        privacy: "SELF",
      });

      expect(habit.parentHabitId).toBe("habit-parent");
    });

    it("throws error when creating sub-habit of sub-habit", async () => {
      // Mock parent habit that already has a parent
      (queryFirst as jest.Mock).mockResolvedValue({
        id: "habit-sub",
        userId: mockUserId,
        parentHabitId: "habit-grandparent", // Has a parent!
        title: "Sub Habit",
        pillar: "BODY",
        schedule: JSON.stringify(mockSchedule),
        privacy: "SELF",
        isArchived: 0,
        currentStreak: 0,
        longestStreak: 0,
        recoveryStreak: 0,
        lastCheckInAt: null,
        lastMissedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        syncedAt: null,
      });

      await expect(
        createHabit(mockUserId, {
          title: "Grandchild Habit",
          parentHabitId: "habit-sub",
          pillar: "BODY",
          schedule: mockSchedule,
          privacy: "SELF",
        })
      ).rejects.toThrow("Cannot create sub-habit of a sub-habit");
    });

    it("enqueues habit for sync", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const habit = await createHabit(mockUserId, {
        title: "Test",
        pillar: "MIND",
        schedule: mockSchedule,
        privacy: "SELF",
      });

      expect(enqueue).toHaveBeenCalledWith("CREATE", "habits", habit.id, expect.any(Object));
    });
  });

  describe("getHabits", () => {
    it("returns non-archived habits for user", async () => {
      const mockRows = [
        {
          id: "habit-1",
          userId: mockUserId,
          goalId: null,
          parentHabitId: null,
          title: "Habit 1",
          pillar: "BODY",
          schedule: JSON.stringify(mockSchedule),
          privacy: "SELF",
          isArchived: 0,
          archivedAt: null,
          currentStreak: 5,
          longestStreak: 10,
          recoveryStreak: 0,
          lastCheckInAt: null,
          lastMissedAt: null,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          syncedAt: null,
        },
      ];
      (query as jest.Mock).mockResolvedValue(mockRows);

      const habits = await getHabits(mockUserId);

      expect(habits).toHaveLength(1);
      expect(habits[0].id).toBe("habit-1");
      expect(habits[0].currentStreak).toBe(5);
      expect(habits[0].schedule).toEqual(mockSchedule);
    });

    it("filters by goalId when provided", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getHabits(mockUserId, { goalId: mockGoalId });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("goalId = ?"),
        expect.arrayContaining([mockUserId, mockGoalId])
      );
    });
  });

  describe("getHabitsByGoal", () => {
    it("returns habits for specific goal", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getHabitsByGoal(mockGoalId);

      expect(query).toHaveBeenCalledWith(expect.stringContaining("goalId = ?"), [mockGoalId]);
    });
  });

  describe("getSubHabits", () => {
    it("returns sub-habits of parent", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getSubHabits("habit-parent");

      expect(query).toHaveBeenCalledWith(expect.stringContaining("parentHabitId = ?"), [
        "habit-parent",
      ]);
    });
  });

  describe("updateHabit", () => {
    const mockExistingHabit = {
      id: "habit-1",
      userId: mockUserId,
      goalId: null,
      parentHabitId: null,
      title: "Original",
      pillar: "BODY",
      schedule: JSON.stringify(mockSchedule),
      privacy: "SELF",
      isArchived: 0,
      archivedAt: null,
      currentStreak: 5,
      longestStreak: 10,
      recoveryStreak: 0,
      lastCheckInAt: null,
      lastMissedAt: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      syncedAt: null,
    };

    it("updates title", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingHabit,
        title: "Updated Title",
      });

      const updated = await updateHabit("habit-1", { title: "Updated Title" });

      expect(updated?.title).toBe("Updated Title");
      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("title = ?"),
        expect.arrayContaining(["Updated Title"])
      );
    });

    it("updates streak values", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingHabit,
        currentStreak: 6,
        longestStreak: 11,
      });

      await updateHabit("habit-1", {
        currentStreak: 6,
        longestStreak: 11,
      });

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("currentStreak = ?"),
        expect.any(Array)
      );
    });

    it("updates schedule", async () => {
      const newSchedule = { frequency: "weekly" as const, targetCount: 4 };
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingHabit,
        schedule: JSON.stringify(newSchedule),
      });

      const updated = await updateHabit("habit-1", { schedule: newSchedule });

      expect(updated?.schedule).toEqual(newSchedule);
    });
  });

  describe("archiveHabit", () => {
    it("archives habit via updateHabit", async () => {
      const mockArchivedHabit = {
        id: "habit-1",
        userId: mockUserId,
        goalId: null,
        parentHabitId: null,
        title: "Archived",
        pillar: "BODY",
        schedule: JSON.stringify(mockSchedule),
        privacy: "SELF",
        isArchived: 1,
        archivedAt: "2025-01-02T00:00:00.000Z",
        currentStreak: 0,
        longestStreak: 10,
        recoveryStreak: 0,
        lastCheckInAt: null,
        lastMissedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
        syncedAt: null,
      };
      (queryFirst as jest.Mock).mockResolvedValue(mockArchivedHabit);

      const result = await archiveHabit("habit-1");

      expect(result?.isArchived).toBe(true);
    });
  });

  describe("deleteHabit", () => {
    it("deletes habit from local storage", async () => {
      await deleteHabit("habit-1");

      expect(execute).toHaveBeenCalledWith("DELETE FROM habits WHERE id = ?", ["habit-1"]);
    });
  });

  describe("markHabitSynced", () => {
    it("updates syncedAt timestamp", async () => {
      await markHabitSynced("habit-1");

      expect(execute).toHaveBeenCalledWith("UPDATE habits SET syncedAt = ? WHERE id = ?", [
        expect.any(String),
        "habit-1",
      ]);
    });
  });

  describe("getUnsyncedHabits", () => {
    it("returns habits where syncedAt is null or stale", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getUnsyncedHabits();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("syncedAt IS NULL OR syncedAt < updatedAt")
      );
    });
  });
});
