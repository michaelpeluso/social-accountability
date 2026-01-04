/**
 * Goals Storage Tests
 */

import {
  createGoal,
  getGoals,
  getGoalById,
  getGoalsByPillar,
  updateGoal,
  archiveGoal,
  deleteGoal,
  markGoalSynced,
  getUnsyncedGoals,
} from "../../src/storage/goals";
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

describe("Goals Storage", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createGoal", () => {
    it("creates a goal with required fields", async () => {
      const goal = await createGoal(mockUserId, {
        title: "Run a marathon",
        pillar: "BODY",
        privacy: "SELF",
        isIndefinite: false,
        dataSource: "MANUAL",
      });

      expect(goal.id).toMatch(/^goal-/);
      expect(goal.userId).toBe(mockUserId);
      expect(goal.title).toBe("Run a marathon");
      expect(goal.pillar).toBe("BODY");
      expect(goal.privacy).toBe("SELF");
      expect(goal.isArchived).toBe(false);
      expect(goal.createdAt).toBeDefined();
      expect(goal.updatedAt).toBeDefined();

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO goals"),
        expect.arrayContaining([goal.id, mockUserId, "Run a marathon", "BODY", "SELF"])
      );
    });

    it("trims whitespace from title", async () => {
      const goal = await createGoal(mockUserId, {
        title: "  Spaced Title  ",
        pillar: "MIND",
        privacy: "FRIENDS",
        isIndefinite: false,
        dataSource: "MANUAL",
      });

      expect(goal.title).toBe("Spaced Title");
    });

    it("enqueues goal for sync", async () => {
      const goal = await createGoal(mockUserId, {
        title: "Learn Spanish",
        pillar: "MIND",
        privacy: "SELF",
        isIndefinite: true,
        dataSource: "MANUAL",
      });

      expect(enqueue).toHaveBeenCalledWith("CREATE", "goals", goal.id, goal);
    });
  });

  describe("getGoals", () => {
    it("returns all non-archived goals for user", async () => {
      const mockRows = [
        {
          id: "goal-1",
          userId: mockUserId,
          title: "Goal 1",
          pillar: "BODY",
          privacy: "SELF",
          isArchived: 0,
          archivedAt: null,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          syncedAt: null,
        },
      ];
      (query as jest.Mock).mockResolvedValue(mockRows);

      const goals = await getGoals(mockUserId);

      expect(goals).toHaveLength(1);
      expect(goals[0].id).toBe("goal-1");
      expect(goals[0].isArchived).toBe(false);
      expect(query).toHaveBeenCalledWith(expect.stringContaining("isArchived = 0"), [mockUserId]);
    });

    it("includes archived goals when requested", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getGoals(mockUserId, { includeArchived: true });

      expect(query).toHaveBeenCalledWith(expect.not.stringContaining("isArchived = 0"), [
        mockUserId,
      ]);
    });
  });

  describe("getGoalsByPillar", () => {
    it("filters by pillar", async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await getGoalsByPillar(mockUserId, "HEART");

      expect(query).toHaveBeenCalledWith(expect.stringContaining("pillar = ?"), [
        mockUserId,
        "HEART",
      ]);
    });
  });

  describe("getGoalById", () => {
    it("returns goal when found", async () => {
      const mockRow = {
        id: "goal-1",
        userId: mockUserId,
        title: "Test Goal",
        pillar: "SOUL",
        privacy: "PUBLIC",
        isArchived: 0,
        archivedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        syncedAt: "2025-01-01T01:00:00.000Z",
      };
      (queryFirst as jest.Mock).mockResolvedValue(mockRow);

      const goal = await getGoalById("goal-1");

      expect(goal?.id).toBe("goal-1");
      expect(goal?.syncedAt).toBe("2025-01-01T01:00:00.000Z");
    });

    it("returns null when not found", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(null);

      const goal = await getGoalById("nonexistent");

      expect(goal).toBeNull();
    });
  });

  describe("updateGoal", () => {
    const mockExistingGoal = {
      id: "goal-1",
      userId: mockUserId,
      title: "Original Title",
      pillar: "BODY",
      privacy: "SELF",
      isArchived: 0,
      archivedAt: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      syncedAt: null,
    };

    it("updates title", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingGoal,
        title: "New Title",
      });

      const updated = await updateGoal("goal-1", { title: "New Title" });

      expect(updated?.title).toBe("New Title");
      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("title = ?"),
        expect.arrayContaining(["New Title"])
      );
    });

    it("updates pillar", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingGoal,
        pillar: "MIND",
      });

      const updated = await updateGoal("goal-1", { pillar: "MIND" });

      expect(updated?.pillar).toBe("MIND");
    });

    it("sets archivedAt when archiving", async () => {
      (queryFirst as jest.Mock).mockResolvedValue({
        ...mockExistingGoal,
        isArchived: 1,
        archivedAt: expect.any(String),
      });

      await updateGoal("goal-1", { isArchived: true });

      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("archivedAt = ?"),
        expect.any(Array)
      );
    });

    it("enqueues update for sync", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(mockExistingGoal);

      await updateGoal("goal-1", { title: "Updated" });

      expect(enqueue).toHaveBeenCalledWith("UPDATE", "goals", "goal-1", expect.any(Object));
    });

    it("returns existing goal if no updates provided", async () => {
      (queryFirst as jest.Mock).mockResolvedValue(mockExistingGoal);

      const result = await updateGoal("goal-1", {});

      expect(execute).not.toHaveBeenCalled();
      expect(result?.id).toBe("goal-1");
    });
  });

  describe("archiveGoal", () => {
    it("archives goal via updateGoal", async () => {
      const mockArchivedGoal = {
        id: "goal-1",
        userId: mockUserId,
        title: "Archived Goal",
        pillar: "BODY",
        privacy: "SELF",
        isArchived: 1,
        archivedAt: "2025-01-02T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
        syncedAt: null,
      };
      (queryFirst as jest.Mock).mockResolvedValue(mockArchivedGoal);

      const result = await archiveGoal("goal-1");

      expect(result?.isArchived).toBe(true);
      expect(execute).toHaveBeenCalledWith(
        expect.stringContaining("isArchived = ?"),
        expect.any(Array)
      );
    });
  });

  describe("deleteGoal", () => {
    it("deletes goal from local storage", async () => {
      await deleteGoal("goal-1");

      expect(execute).toHaveBeenCalledWith("DELETE FROM goals WHERE id = ?", ["goal-1"]);
    });
  });

  describe("markGoalSynced", () => {
    it("updates syncedAt timestamp", async () => {
      await markGoalSynced("goal-1");

      expect(execute).toHaveBeenCalledWith("UPDATE goals SET syncedAt = ? WHERE id = ?", [
        expect.any(String),
        "goal-1",
      ]);
    });
  });

  describe("getUnsyncedGoals", () => {
    it("returns goals where syncedAt is null or stale", async () => {
      const mockRows = [
        {
          id: "goal-1",
          userId: mockUserId,
          title: "Unsynced Goal",
          pillar: "BODY",
          privacy: "SELF",
          isArchived: 0,
          archivedAt: null,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          syncedAt: null,
        },
      ];
      (query as jest.Mock).mockResolvedValue(mockRows);

      const unsynced = await getUnsyncedGoals();

      expect(unsynced).toHaveLength(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("syncedAt IS NULL OR syncedAt < updatedAt")
      );
    });
  });
});
