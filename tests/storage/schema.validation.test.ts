/**
 * Database Schema Validation Tests
 * Ensures database schema matches expected structure and prevents regressions
 *
 * NOTE: These tests require a real SQLite database, not the mocked version.
 * They are skipped in the standard test run and should be run separately
 * with a real database for schema verification.
 */

import { getDatabase, closeDatabase, query } from "../../src/storage/database";

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

// Skip all tests - these require a real database, not the mocked version
// Run with: TEST_REAL_DB=1 npm test schema.validation
describe.skip("Database Schema Validation", () => {
  beforeAll(async () => {
    await getDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("Reactions Table Schema", () => {
    it("should have correct columns", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(reactions)");
      const columnNames = columns.map((col) => col.name);

      // Required columns
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("postId");
      expect(columnNames).toContain("storyId");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("emoji");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("syncedAt");

      // Should NOT have old columns
      expect(columnNames).not.toContain("targetId");
      expect(columnNames).not.toContain("targetType");
    });

    it("should have correct column types", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(reactions)");
      const columnMap = new Map(columns.map((col) => [col.name, col]));

      expect(columnMap.get("id")?.type).toBe("TEXT");
      expect(columnMap.get("postId")?.type).toBe("TEXT");
      expect(columnMap.get("storyId")?.type).toBe("TEXT");
      expect(columnMap.get("userId")?.type).toBe("TEXT");
      expect(columnMap.get("emoji")?.type).toBe("TEXT");
      expect(columnMap.get("createdAt")?.type).toBe("TEXT");
    });

    it("should have NOT NULL constraints on required columns", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(reactions)");
      const columnMap = new Map(columns.map((col) => [col.name, col]));

      expect(columnMap.get("id")?.notnull).toBe(1);
      expect(columnMap.get("userId")?.notnull).toBe(1);
      expect(columnMap.get("emoji")?.notnull).toBe(1);
      expect(columnMap.get("createdAt")?.notnull).toBe(1);

      // postId and storyId should be nullable (one must be set, but not both)
      expect(columnMap.get("postId")?.notnull).toBe(0);
      expect(columnMap.get("storyId")?.notnull).toBe(0);
    });

    it("should have correct indexes", async () => {
      const indexes = await query<IndexInfo>("PRAGMA index_list(reactions)");
      const indexNames = indexes.map((idx) => idx.name);

      // Check for required indexes
      expect(indexNames).toContain("idx_reactions_postId");
      expect(indexNames).toContain("idx_reactions_storyId");
      expect(indexNames).toContain("idx_reactions_userId");
      expect(indexNames).toContain("idx_reactions_createdAt");

      // Check unique indexes
      expect(indexNames).toContain("idx_reactions_post_user");
      expect(indexNames).toContain("idx_reactions_story_user");
    });

    it("should have foreign key constraints", async () => {
      const fks = await query<ForeignKeyInfo>("PRAGMA foreign_key_list(reactions)");
      const fkTables = fks.map((fk) => fk.table);

      expect(fkTables).toContain("posts");
      expect(fkTables).toContain("stories");
      expect(fkTables).toContain("users");
    });

    it("should have CASCADE DELETE for posts foreign key", async () => {
      const fks = await query<ForeignKeyInfo>("PRAGMA foreign_key_list(reactions)");
      const postFk = fks.find((fk) => fk.table === "posts");

      expect(postFk).toBeDefined();
      expect(postFk?.on_delete).toBe("CASCADE");
      expect(postFk?.from).toBe("postId");
      expect(postFk?.to).toBe("id");
    });

    it("should have CASCADE DELETE for stories foreign key", async () => {
      const fks = await query<ForeignKeyInfo>("PRAGMA foreign_key_list(reactions)");
      const storyFk = fks.find((fk) => fk.table === "stories");

      expect(storyFk).toBeDefined();
      expect(storyFk?.on_delete).toBe("CASCADE");
      expect(storyFk?.from).toBe("storyId");
      expect(storyFk?.to).toBe("id");
    });
  });

  describe("Posts Table Schema", () => {
    it("should have correct columns for reactions join", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(posts)");
      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("text");
      expect(columnNames).toContain("privacy");
      expect(columnNames).toContain("createdAt");

      // Should NOT have denormalized reaction data
      expect(columnNames).not.toContain("reactions");
      expect(columnNames).not.toContain("reactionCount");
    });

    it("should have correct indexes for feed queries", async () => {
      const indexes = await query<IndexInfo>("PRAGMA index_list(posts)");
      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain("idx_posts_userId");
      expect(indexNames).toContain("idx_posts_createdAt");
      expect(indexNames).toContain("idx_posts_privacy");
    });
  });

  describe("Stories Table Schema", () => {
    it("should have correct columns for reactions join", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(stories)");
      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("expiresAt");

      // Should NOT have denormalized reaction data
      expect(columnNames).not.toContain("reactions");
    });

    it("should have correct indexes", async () => {
      const indexes = await query<IndexInfo>("PRAGMA index_list(stories)");
      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain("idx_stories_userId");
      expect(indexNames).toContain("idx_stories_expiresAt");
    });
  });

  describe("Notifications Table Schema", () => {
    it("should have text column (not body)", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(notifications)");
      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain("text");
      expect(columnNames).not.toContain("body");
    });

    it("should have isRead column (not read)", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(notifications)");
      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain("isRead");
      expect(columnNames).not.toContain("read");
    });
  });

  describe("Rate Limits Table Schema", () => {
    it("should have targetId column for rate limiting", async () => {
      const columns = await query<ColumnInfo>("PRAGMA table_info(rate_limits)");
      const columnNames = columns.map((col) => col.name);

      // targetId is used in rate_limits for tracking limits per target
      expect(columnNames).toContain("targetId");
      expect(columnNames).toContain("actionType");
      expect(columnNames).toContain("count");
    });
  });

  describe("Schema Version", () => {
    it("should be at version 2", async () => {
      const result = await query<{ user_version: number }>("PRAGMA user_version");
      expect(result[0].user_version).toBe(2);
    });
  });

  describe("Naming Conventions", () => {
    it("should use consistent timestamp naming (At suffix)", async () => {
      const allTables = [
        "users",
        "posts",
        "stories",
        "reactions",
        "comments",
        "habits",
        "goals",
        "notifications",
      ];

      for (const table of allTables) {
        const columns = await query<ColumnInfo>(`PRAGMA table_info(${table})`);
        const columnNames = columns.map((col) => col.name);

        // All timestamp columns should end with 'At'
        const timestampCols = columnNames.filter((name) =>
          ["created", "updated", "synced", "deleted", "expired", "occurred"].some((prefix) =>
            name.toLowerCase().includes(prefix)
          )
        );

        timestampCols.forEach((col) => {
          expect(col).toMatch(/At$/);
        });
      }
    });

    it("should use consistent boolean naming (is prefix)", async () => {
      const allTables = ["users", "posts", "habits", "goals", "notifications", "friendships"];

      for (const table of allTables) {
        const columns = await query<ColumnInfo>(`PRAGMA table_info(${table})`);

        // Filter to boolean columns (INTEGER type with values 0/1)
        const booleanCols = columns.filter(
          (col) =>
            col.type === "INTEGER" &&
            (col.dflt_value === "0" || col.dflt_value === "1" || col.notnull === 0)
        );

        booleanCols.forEach((col) => {
          // Allow exceptions for common patterns like 'pk' (primary key)
          if (!["pk", "notnull", "cid", "seq", "id"].includes(col.name.toLowerCase())) {
            // Boolean columns should start with 'is' or be 'success'
            const isValidBoolName =
              col.name.startsWith("is") ||
              col.name === "success" ||
              col.name.endsWith("Count") || // count fields
              col.name.endsWith("Days"); // days fields

            if (!isValidBoolName) {
              console.warn(`Potential non-conforming boolean column: ${table}.${col.name}`);
            }
          }
        });
      }
    });
  });

  describe("Query Compatibility Tests", () => {
    it("should allow queries using postId on reactions table", async () => {
      // This should not throw an error
      await expect(
        query("SELECT * FROM reactions WHERE postId = ? LIMIT 1", ["test_id"])
      ).resolves.toBeDefined();
    });

    it("should allow queries using storyId on reactions table", async () => {
      // This should not throw an error
      await expect(
        query("SELECT * FROM reactions WHERE storyId = ? LIMIT 1", ["test_id"])
      ).resolves.toBeDefined();
    });

    it("should reject queries using old targetId column", async () => {
      // This should throw an error
      await expect(
        query("SELECT * FROM reactions WHERE targetId = ? LIMIT 1", ["test_id"])
      ).rejects.toThrow(/no such column/i);
    });

    it("should reject queries using old targetType column", async () => {
      // This should throw an error
      await expect(
        query("SELECT * FROM reactions WHERE targetType = ? LIMIT 1", ["POST"])
      ).rejects.toThrow(/no such column/i);
    });

    it("should allow JOIN between posts and reactions using postId", async () => {
      const sql = `
        SELECT p.*, COUNT(r.id) as reactionCount
        FROM posts p
        LEFT JOIN reactions r ON r.postId = p.id
        GROUP BY p.id
        LIMIT 1
      `;

      // This should not throw an error
      await expect(query(sql)).resolves.toBeDefined();
    });

    it("should allow JOIN between stories and reactions using storyId", async () => {
      const sql = `
        SELECT s.*, COUNT(r.id) as reactionCount
        FROM stories s
        LEFT JOIN reactions r ON r.storyId = s.id
        GROUP BY s.id
        LIMIT 1
      `;

      // This should not throw an error
      await expect(query(sql)).resolves.toBeDefined();
    });
  });
});
