/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  discoverMigrationScripts,
  loadScriptContent,
  validateScriptOrdering,
  executeSQLScript,
  createMigrationTrackingTable,
  checkMigrationStatus,
  markMigrationComplete,
  getScriptsToExecute,
  getMigrationHistory,
  runMigrations,
  filterSkippedScripts,
  MIGRATION_CONFIG,
  MigrationScript,
  MigrationExecutionResult,
} from "../db-migration";
import fs from "fs/promises";
import path from "path";

// Mock dependencies
jest.mock("mysql2/promise");
jest.mock("fs/promises");
jest.mock("path");

const mockConnection = {
  execute: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
} as any;

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConnection),
} as any;

// Mock the db module
jest.mock("../db");

describe("DB Migration System", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup db module mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbModule = require("../db");
    dbModule.default = mockPool;

    // Reset console methods
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("discoverMigrationScripts", () => {
    it("should discover and order migration scripts correctly", async () => {
      // Mock file system operations
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        "02-create-tables.sql",
        "01-create-user.sql",
        "00-init-database.sql",
        "readme.txt", // Should be ignored
      ]);
      (fs.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce("-- Create database\nCREATE DATABASE test;")
        .mockResolvedValueOnce("-- Create user\nCREATE USER test;")
        .mockResolvedValueOnce("-- Create tables\nCREATE TABLE users();");

      (path.resolve as jest.Mock).mockReturnValue("/test/migrations");
      (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

      const scripts = await discoverMigrationScripts("/test/migrations");

      expect(scripts).toHaveLength(3);
      expect(scripts[0].filename).toBe("00-init-database.sql");
      expect(scripts[0].order).toBe(0);
      expect(scripts[1].filename).toBe("01-create-user.sql");
      expect(scripts[1].order).toBe(1);
      expect(scripts[2].filename).toBe("02-create-tables.sql");
      expect(scripts[2].order).toBe(2);
    });

    it("should handle missing migration directory", async () => {
      (fs.access as jest.Mock).mockRejectedValue(
        new Error("Directory not found")
      );

      const scripts = await discoverMigrationScripts("/nonexistent");

      expect(scripts).toHaveLength(0);
    });

    it("should handle scripts without order prefix", async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue(["init.sql", "setup.sql"]);
      (fs.stat as jest.Mock).mockResolvedValue({ size: 1000 });
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce("-- Init script")
        .mockResolvedValueOnce("-- Setup script");

      (path.resolve as jest.Mock).mockReturnValue("/test/migrations");
      (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

      const scripts = await discoverMigrationScripts("/test/migrations");

      expect(scripts).toHaveLength(2);
      expect(scripts[0].order).toBe(999); // Default order for unordered scripts
      expect(scripts[1].order).toBe(999);
    });
  });

  describe("loadScriptContent", () => {
    it("should load script content successfully", async () => {
      const mockContent = "CREATE TABLE test (id INT);";
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const content = await loadScriptContent("/test/script.sql");

      expect(content).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith("/test/script.sql", "utf-8");
    });

    it("should reject files that are too large", async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        size: MIGRATION_CONFIG.MAX_SCRIPT_SIZE + 1,
      });

      await expect(loadScriptContent("/test/large-script.sql")).rejects.toThrow(
        "Script file too large"
      );
    });

    it("should reject empty files", async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue("   \n  \t  ");

      await expect(loadScriptContent("/test/empty-script.sql")).rejects.toThrow(
        "Script file is empty"
      );
    });
  });

  describe("validateScriptOrdering", () => {
    it("should validate correct script ordering", () => {
      const scripts: MigrationScript[] = [
        {
          filename: "00-init.sql",
          fullPath: "/test/00-init.sql",
          order: 0,
          content: "",
          checksum: "abc",
        },
        {
          filename: "01-users.sql",
          fullPath: "/test/01-users.sql",
          order: 1,
          content: "",
          checksum: "def",
        },
        {
          filename: "02-data.sql",
          fullPath: "/test/02-data.sql",
          order: 2,
          content: "",
          checksum: "ghi",
        },
      ];

      const result = validateScriptOrdering(scripts);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should detect duplicate order numbers", () => {
      const scripts: MigrationScript[] = [
        {
          filename: "00-init.sql",
          fullPath: "/test/00-init.sql",
          order: 0,
          content: "",
          checksum: "abc",
        },
        {
          filename: "00-setup.sql",
          fullPath: "/test/00-setup.sql",
          order: 0,
          content: "",
          checksum: "def",
        },
      ];

      const result = validateScriptOrdering(scripts);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain(
        "Duplicate order 0: 00-init.sql, 00-setup.sql"
      );
    });

    it("should detect scripts without order prefix", () => {
      const scripts: MigrationScript[] = [
        {
          filename: "init.sql",
          fullPath: "/test/init.sql",
          order: 999,
          content: "",
          checksum: "abc",
        },
        {
          filename: "setup.sql",
          fullPath: "/test/setup.sql",
          order: 999,
          content: "",
          checksum: "def",
        },
      ];

      const result = validateScriptOrdering(scripts);

      expect(result.valid).toBe(false);
      // The function detects both duplicate order (999) and scripts without order prefix
      expect(
        result.issues.some((issue) =>
          issue.includes("Scripts without order prefix")
        )
      ).toBe(true);
    });
  });

  describe("executeSQLScript", () => {
    const mockScript: MigrationScript = {
      filename: "01-test.sql",
      fullPath: "/test/01-test.sql",
      order: 1,
      content: "CREATE TABLE test (id INT);\nINSERT INTO test VALUES (1);",
      checksum: "abc123",
    };

    it("should execute script successfully", async () => {
      // Mock successful execution for both statements
      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]) // CREATE TABLE
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // INSERT

      const result = await executeSQLScript(mockScript, mockConnection);

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1); // Total affected rows from both statements
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();

      // Verify both statements were executed
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    });

    it("should handle SQL execution errors with rollback", async () => {
      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]) // CREATE TABLE succeeds
        .mockRejectedValueOnce(new Error("SQL syntax error")); // INSERT fails

      // Mock rollback to succeed
      mockConnection.rollback.mockResolvedValue(undefined);

      const result = await executeSQLScript(mockScript, mockConnection);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("execution");
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe("createMigrationTrackingTable", () => {
    it("should create migration tracking table", async () => {
      mockConnection.execute.mockResolvedValue([[], []]);

      await createMigrationTrackingTable(mockConnection);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining(
          `CREATE TABLE IF NOT EXISTS ${MIGRATION_CONFIG.TRACKING_TABLE}`
        )
      );
    });

    it("should handle table creation errors", async () => {
      mockConnection.execute.mockRejectedValue(new Error("Permission denied"));

      await expect(
        createMigrationTrackingTable(mockConnection)
      ).rejects.toThrow();
    });
  });

  describe("checkMigrationStatus", () => {
    it("should return null for non-executed script", async () => {
      mockConnection.execute.mockResolvedValue([[], []]);

      const status = await checkMigrationStatus("test.sql", mockConnection);

      expect(status).toBeNull();
    });

    it("should return status for executed script", async () => {
      const mockRow = {
        script_name: "test.sql",
        checksum: "abc123",
        executed_at: new Date(),
        execution_time: 1000,
        success: true,
      };
      mockConnection.execute.mockResolvedValue([[mockRow], []]);

      const status = await checkMigrationStatus("test.sql", mockConnection);

      expect(status).toEqual({
        scriptName: "test.sql",
        checksum: "abc123",
        executedAt: mockRow.executed_at,
        executionTime: 1000,
        success: true,
      });
    });
  });

  describe("markMigrationComplete", () => {
    const mockScript: MigrationScript = {
      filename: "test.sql",
      fullPath: "/test/test.sql",
      order: 1,
      content: "CREATE TABLE test;",
      checksum: "abc123",
    };

    const mockExecutionResult: MigrationExecutionResult = {
      success: true,
      scriptName: "test.sql",
      executionTime: 1000,
      affectedRows: 1,
      errors: [],
      timestamp: new Date(),
    };

    it("should mark migration as complete", async () => {
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }, []]);

      await markMigrationComplete(
        mockScript,
        mockExecutionResult,
        mockConnection
      );

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining(
          `INSERT INTO ${MIGRATION_CONFIG.TRACKING_TABLE}`
        ),
        ["test.sql", "abc123", 1000, true]
      );
    });
  });

  describe("getScriptsToExecute", () => {
    const mockScripts: MigrationScript[] = [
      {
        filename: "00-init.sql",
        fullPath: "/test/00-init.sql",
        order: 0,
        content: "CREATE DATABASE;",
        checksum: "abc",
      },
      {
        filename: "01-users.sql",
        fullPath: "/test/01-users.sql",
        order: 1,
        content: "CREATE TABLE users;",
        checksum: "def",
      },
      {
        filename: "02-data.sql",
        fullPath: "/test/02-data.sql",
        order: 2,
        content: "INSERT INTO users;",
        checksum: "ghi",
      },
    ];

    it("should identify scripts to execute and skip", async () => {
      // Mock tracking table creation
      mockConnection.execute.mockResolvedValueOnce([[], []]); // CREATE TABLE

      // Mock status checks
      mockConnection.execute
        .mockResolvedValueOnce([[], []]) // 00-init.sql not executed
        .mockResolvedValueOnce([
          [
            {
              script_name: "01-users.sql",
              checksum: "def",
              executed_at: new Date(),
              execution_time: 500,
              success: true,
            },
          ],
          [],
        ]) // 01-users.sql already executed
        .mockResolvedValueOnce([
          [
            {
              script_name: "02-data.sql",
              checksum: "old_checksum",
              executed_at: new Date(),
              execution_time: 300,
              success: true,
            },
          ],
          [],
        ]); // 02-data.sql changed

      const result = await getScriptsToExecute(mockScripts, mockConnection);

      expect(result.toExecute).toHaveLength(2); // 00-init.sql and 02-data.sql
      expect(result.toSkip).toHaveLength(1); // 01-users.sql
      expect(result.changed).toHaveLength(1); // 02-data.sql
      expect(result.toExecute[0].filename).toBe("00-init.sql");
      expect(result.toExecute[1].filename).toBe("02-data.sql");
      expect(result.toSkip[0].filename).toBe("01-users.sql");
    });
  });

  describe("getMigrationHistory", () => {
    it("should return migration history", async () => {
      const mockRows = [
        {
          script_name: "02-data.sql",
          checksum: "ghi",
          executed_at: new Date(),
          execution_time: 300,
          success: true,
        },
        {
          script_name: "01-users.sql",
          checksum: "def",
          executed_at: new Date(),
          execution_time: 500,
          success: true,
        },
        {
          script_name: "00-init.sql",
          checksum: "abc",
          executed_at: new Date(),
          execution_time: 200,
          success: false,
        },
      ];

      // Mock tracking table creation and history query
      mockConnection.execute
        .mockResolvedValueOnce([[], []]) // CREATE TABLE
        .mockResolvedValueOnce([mockRows, []]); // SELECT history

      const history = await getMigrationHistory(mockConnection);

      expect(history.totalMigrations).toBe(3);
      expect(history.successfulMigrations).toBe(2);
      expect(history.failedMigrations).toBe(1);
      expect(history.lastMigration?.scriptName).toBe("02-data.sql");
      expect(history.allMigrations).toHaveLength(3);
    });
  });

  describe("runMigrations", () => {
    it("should run complete migration process successfully", async () => {
      // Mock file system for script discovery
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue(["00-init.sql"]);
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue("CREATE TABLE test;");
      (path.resolve as jest.Mock).mockReturnValue("/test/migrations");
      (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

      // Mock database operations
      mockConnection.execute
        .mockResolvedValueOnce([[], []]) // CREATE tracking table
        .mockResolvedValueOnce([[], []]) // Check migration status
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]) // Execute script
        .mockResolvedValueOnce([[], []]) // Validation query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // Mark complete

      const result = await runMigrations();

      expect(result.success).toBe(true);
      expect(result.totalScripts).toBe(1);
      expect(result.executedScripts).toBe(1);
      expect(result.skippedScripts).toBe(0);
      expect(result.failedScripts).toBe(0);
    });

    it("should handle dry run mode", async () => {
      // Mock file system for script discovery
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue(["00-init.sql"]);
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue("CREATE TABLE test;");
      (path.resolve as jest.Mock).mockReturnValue("/test/migrations");
      (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

      // Mock database operations for script analysis only
      mockConnection.execute
        .mockResolvedValueOnce([[], []]) // CREATE tracking table
        .mockResolvedValueOnce([[], []]); // Check migration status

      const result = await runMigrations(undefined, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.totalScripts).toBe(1);
      expect(result.executedScripts).toBe(0); // No scripts actually executed in dry run
    });
  });

  describe("filterSkippedScripts", () => {
    const mockScripts: MigrationScript[] = [
      {
        filename: "01-create-users.sql",
        fullPath: "/path/01-create-users.sql",
        order: 1,
        content: "CREATE TABLE users...",
        checksum: "abc123",
      },
      {
        filename: "02-test-data.sql",
        fullPath: "/path/02-test-data.sql",
        order: 2,
        content: "INSERT INTO users...",
        checksum: "def456",
      },
      {
        filename: "03-demo-setup.sql",
        fullPath: "/path/03-demo-setup.sql",
        order: 3,
        content: "INSERT INTO demo...",
        checksum: "ghi789",
      },
      {
        filename: "04-production.sql",
        fullPath: "/path/04-production.sql",
        order: 4,
        content: "CREATE INDEX...",
        checksum: "jkl012",
      },
    ];

    it("should return all scripts when no skip options provided", () => {
      const result = filterSkippedScripts(mockScripts);

      expect(result.filteredScripts).toHaveLength(4);
      expect(result.skippedScripts).toHaveLength(0);
      expect(result.filteredScripts).toEqual(mockScripts);
    });

    it("should skip scripts by explicit names", () => {
      const result = filterSkippedScripts(mockScripts, [
        "02-test-data.sql",
        "03-demo-setup.sql",
      ]);

      expect(result.filteredScripts).toHaveLength(2);
      expect(result.skippedScripts).toHaveLength(2);
      expect(result.filteredScripts.map((s) => s.filename)).toEqual([
        "01-create-users.sql",
        "04-production.sql",
      ]);
      expect(result.skippedScripts.map((s) => s.filename)).toEqual([
        "02-test-data.sql",
        "03-demo-setup.sql",
      ]);
    });

    it("should skip scripts by regex pattern", () => {
      const result = filterSkippedScripts(mockScripts, undefined, "test|demo");

      expect(result.filteredScripts).toHaveLength(2);
      expect(result.skippedScripts).toHaveLength(2);
      expect(result.filteredScripts.map((s) => s.filename)).toEqual([
        "01-create-users.sql",
        "04-production.sql",
      ]);
      expect(result.skippedScripts.map((s) => s.filename)).toEqual([
        "02-test-data.sql",
        "03-demo-setup.sql",
      ]);
    });

    it("should skip scripts by both names and pattern", () => {
      const result = filterSkippedScripts(
        mockScripts,
        ["01-create-users.sql"],
        "demo"
      );

      expect(result.filteredScripts).toHaveLength(2);
      expect(result.skippedScripts).toHaveLength(2);
      expect(result.filteredScripts.map((s) => s.filename)).toEqual([
        "02-test-data.sql",
        "04-production.sql",
      ]);
      expect(result.skippedScripts.map((s) => s.filename)).toEqual([
        "01-create-users.sql",
        "03-demo-setup.sql",
      ]);
    });

    it("should handle case-insensitive regex patterns", () => {
      const result = filterSkippedScripts(mockScripts, undefined, "TEST");

      expect(result.filteredScripts).toHaveLength(3);
      expect(result.skippedScripts).toHaveLength(1);
      expect(result.skippedScripts[0].filename).toBe("02-test-data.sql");
    });

    it("should handle invalid regex patterns gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = filterSkippedScripts(mockScripts, undefined, "[invalid");

      // Should return all scripts when regex is invalid
      expect(result.filteredScripts).toHaveLength(4);
      expect(result.skippedScripts).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it("should handle empty skip arrays", () => {
      const result = filterSkippedScripts(mockScripts, []);

      expect(result.filteredScripts).toHaveLength(4);
      expect(result.skippedScripts).toHaveLength(0);
    });
  });
});
