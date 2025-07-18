/**
 * Unit tests for database detection functionality
 */

import {
  detectDatabaseAndSchema,
  checkDatabaseExistence,
  detectTables,
  getDetectionHealthStatus,
  DatabaseDetectionResult,
  TableDetectionResult,
  DetectionError,
  SchemaValidationResult,
  detectionLogger,
} from "../db-detection";

// Mock the database pool
jest.mock("../db", () => ({
  execute: jest.fn(),
}));

// Mock pool for testing
const mockPool = {
  execute: jest.fn(),
};

describe("Database Detection System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("checkDatabaseExistence", () => {
    it("should return true when database exists with correct charset", async () => {
      // Mock successful database query
      mockPool.execute.mockResolvedValue([
        [
          {
            SCHEMA_NAME: "chatstoryai",
            DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
            DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
          },
        ],
      ]);

      // Mock the pool in the module
      jest.doMock("../db", () => mockPool);

      const { checkDatabaseExistence } = require("../db-detection");
      const result = await checkDatabaseExistence();

      expect(result.exists).toBe(true);
      expect(result.charset).toBe("utf8mb4");
      expect(result.collation).toBe("utf8mb4_unicode_ci");
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining("SELECT SCHEMA_NAME"),
        ["chatstoryai"]
      );
    });

    it("should return false when database does not exist", async () => {
      // Mock empty result (database not found)
      mockPool.execute.mockResolvedValue([[]]);

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseExistence } = require("../db-detection");
      const result = await checkDatabaseExistence();

      expect(result.exists).toBe(false);
      expect(result.charset).toBeUndefined();
      expect(result.collation).toBeUndefined();
    });

    it("should handle database query errors", async () => {
      // Mock database error
      mockPool.execute.mockRejectedValue(new Error("Connection failed"));

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseExistence } = require("../db-detection");

      await expect(checkDatabaseExistence()).rejects.toThrow(
        "Connection failed"
      );
    });
  });

  describe("detectTables", () => {
    it("should correctly identify existing and missing tables", async () => {
      // Mock tables query - some tables exist, some don't
      mockPool.execute.mockResolvedValue([
        [
          { TABLE_NAME: "users" },
          { TABLE_NAME: "stories" },
          { TABLE_NAME: "api_keys" },
          { TABLE_NAME: "extra_table" }, // This is not in expected list
        ],
      ]);

      jest.doMock("../db", () => mockPool);

      const { detectTables } = require("../db-detection");
      const result: TableDetectionResult = await detectTables();

      expect(result.existingTables).toEqual([
        "users",
        "stories",
        "api_keys",
        "extra_table",
      ]);
      expect(result.missingTables).toContain("reset_codes");
      expect(result.missingTables).toContain("story_chapters");
      expect(result.extraTables).toEqual(["extra_table"]);
      expect(result.expectedTables).toHaveLength(19); // All expected tables
    });

    it("should handle empty database (no tables)", async () => {
      // Mock empty tables result
      mockPool.execute.mockResolvedValue([[]]);

      jest.doMock("../db", () => mockPool);

      const { detectTables } = require("../db-detection");
      const result: TableDetectionResult = await detectTables();

      expect(result.existingTables).toEqual([]);
      expect(result.missingTables).toHaveLength(19); // All tables missing
      expect(result.extraTables).toEqual([]);
    });

    it("should handle table detection errors", async () => {
      // Mock database error
      mockPool.execute.mockRejectedValue(new Error("Table query failed"));

      jest.doMock("../db", () => mockPool);

      const { detectTables } = require("../db-detection");

      await expect(detectTables()).rejects.toThrow("Table query failed");
    });
  });

  describe("detectDatabaseAndSchema", () => {
    it("should return complete detection result when database exists", async () => {
      // Mock database existence check
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        // Mock tables detection
        .mockResolvedValueOnce([
          [
            { TABLE_NAME: "users" },
            { TABLE_NAME: "stories" },
            { TABLE_NAME: "api_keys" },
          ],
        ])
        // Mock schema validation for users table
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "username",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "email",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ])
        // Mock schema validation for stories table
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "story_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "title",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ])
        // Mock schema validation for api_keys table
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "api_key",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.databaseExists).toBe(true);
      expect(result.databaseName).toBe("chatstoryai");
      expect(result.charset).toBe("utf8mb4");
      expect(result.collation).toBe("utf8mb4_unicode_ci");
      expect(result.tablesDetection.existingTables).toEqual([
        "users",
        "stories",
        "api_keys",
      ]);
      expect(result.tablesDetection.missingTables.length).toBeGreaterThan(0);
      expect(result.tablesDetection.schemaValidation).toHaveLength(3); // 3 tables validated
      expect(result.errors).toEqual([]);
      expect(result.totalDetectionTime).toBeGreaterThanOrEqual(0);
    });

    it("should handle missing database scenario", async () => {
      // Mock database not found
      mockPool.execute.mockResolvedValue([[]]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.databaseExists).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("database");
      expect(result.errors[0].message).toContain("does not exist");
      expect(result.detectionReport.summary.databaseStatus).toBe("missing");
      expect(result.detectionReport.summary.overallHealth).toBe("critical");
      expect(result.detectionReport.recommendations).toEqual(
        expect.arrayContaining([expect.stringContaining("Create database")])
      );
    });

    it("should handle connection errors gracefully", async () => {
      // Mock connection error
      mockPool.execute.mockRejectedValue(new Error("Connection timeout"));

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.databaseExists).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("connection");
      expect(result.errors[0].message).toBe(
        "Unexpected error during database detection"
      );
      expect(result.errors[0].details).toBe("Connection timeout");
    });
  });

  describe("schema validation", () => {
    it("should detect schema mismatches correctly", async () => {
      // Mock database existence
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        // Mock tables detection
        .mockResolvedValueOnce([[{ TABLE_NAME: "users" }]])
        // Mock schema validation with mismatches
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "username",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "extra_column",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "YES",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            }, // Extra column
            // Missing: email column
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.databaseExists).toBe(true);
      expect(result.tablesDetection.schemaValidation).toHaveLength(1);

      const userTableValidation = result.tablesDetection.schemaValidation[0];
      expect(userTableValidation.tableName).toBe("users");
      expect(userTableValidation.structureMatches).toBe(false);
      expect(userTableValidation.missingColumns).toContain("email");
      expect(userTableValidation.extraColumns).toContain("extra_column");
    });

    it("should handle tables not in expected schema", async () => {
      // Mock database existence
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        // Mock tables detection with unknown table
        .mockResolvedValueOnce([[{ TABLE_NAME: "unknown_table" }]]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.databaseExists).toBe(true);
      expect(result.tablesDetection.schemaValidation).toHaveLength(1);

      const unknownTableValidation = result.tablesDetection.schemaValidation[0];
      expect(unknownTableValidation.tableName).toBe("unknown_table");
      expect(unknownTableValidation.structureMatches).toBe(false);
      expect(unknownTableValidation.exists).toBe(true);
    });
  });

  describe("report generation", () => {
    it("should generate healthy report for complete database", async () => {
      // Mock perfect database setup
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            { TABLE_NAME: "users" },
            { TABLE_NAME: "stories" },
            { TABLE_NAME: "api_keys" },
          ],
        ])
        // Mock perfect schema validation
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "username",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "email",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "story_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "title",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "api_key",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.detectionReport.summary.databaseStatus).toBe("exists");
      expect(result.detectionReport.summary.overallHealth).toBe(
        "needs_attention"
      ); // Still missing many tables
      expect(result.detectionReport.details.databaseInfo).toEqual({
        name: "chatstoryai",
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      });
      expect(result.detectionReport.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Create missing tables"),
        ])
      );
    });

    it("should generate critical report for missing database", async () => {
      // Mock missing database
      mockPool.execute.mockResolvedValue([[]]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.detectionReport.summary.databaseStatus).toBe("missing");
      expect(result.detectionReport.summary.tablesStatus).toBe("missing");
      expect(result.detectionReport.summary.overallHealth).toBe("critical");
      expect(result.detectionReport.details.missingComponents).toContain(
        "Database: chatstoryai"
      );
      expect(result.detectionReport.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Create database 'chatstoryai'"),
          expect.stringContaining("Run database initialization scripts"),
        ])
      );
    });

    it("should generate detailed structural issue reports", async () => {
      // Mock database with structural issues
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        .mockResolvedValueOnce([[{ TABLE_NAME: "users" }]])
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "username",
              DATA_TYPE: "text",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            }, // Type mismatch
            {
              COLUMN_NAME: "extra_col",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "YES",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            }, // Extra column
            // Missing email column
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { detectDatabaseAndSchema } = require("../db-detection");
      const result: DatabaseDetectionResult = await detectDatabaseAndSchema();

      expect(result.detectionReport.details.structuralIssues).toHaveLength(1);
      expect(result.detectionReport.details.structuralIssues[0]).toContain(
        "Table users:"
      );
      expect(result.detectionReport.details.structuralIssues[0]).toContain(
        "Missing columns: email"
      );
      expect(result.detectionReport.details.structuralIssues[0]).toContain(
        "Extra columns: extra_col"
      );
      expect(result.detectionReport.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Fix table structure issues"),
          expect.stringContaining("Add missing columns to users: email"),
        ])
      );
    });
  });

  describe("health check integration", () => {
    it("should provide simplified health status", async () => {
      // Mock healthy database
      mockPool.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: "chatstoryai",
              DEFAULT_CHARACTER_SET_NAME: "utf8mb4",
              DEFAULT_COLLATION_NAME: "utf8mb4_unicode_ci",
            },
          ],
        ])
        .mockResolvedValueOnce([[{ TABLE_NAME: "users" }]])
        .mockResolvedValueOnce([
          [
            {
              COLUMN_NAME: "user_id",
              DATA_TYPE: "int",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "auto_increment",
            },
            {
              COLUMN_NAME: "username",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
            {
              COLUMN_NAME: "email",
              DATA_TYPE: "varchar",
              IS_NULLABLE: "NO",
              COLUMN_DEFAULT: null,
              EXTRA: "",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { getDetectionHealthStatus } = require("../db-detection");
      const healthStatus = await getDetectionHealthStatus();

      expect(healthStatus.isHealthy).toBe(false); // Still missing many tables
      expect(healthStatus.summary).toContain("Database: exists");
      expect(healthStatus.details.databaseExists).toBe(true);
      expect(healthStatus.details.tablesComplete).toBe(false);
      expect(healthStatus.recommendations).toHaveLength(3);
    });

    it("should handle detection errors gracefully", async () => {
      // Mock connection error
      mockPool.execute.mockRejectedValue(new Error("Connection failed"));

      jest.doMock("../db", () => mockPool);

      const { getDetectionHealthStatus } = require("../db-detection");
      const healthStatus = await getDetectionHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.summary).toContain("Database: missing");
      expect(healthStatus.details.databaseExists).toBe(false);
      expect(healthStatus.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("detectionLogger", () => {
    it("should log database check operations", () => {
      const consoleSpy = jest.spyOn(console, "info");

      detectionLogger.logDatabaseCheck("chatstoryai", true, {
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DB-DETECTION]",
        expect.stringContaining("database_existence_check")
      );
    });

    it("should log errors with error level", () => {
      const consoleSpy = jest.spyOn(console, "error");

      const error: DetectionError = {
        type: "database",
        message: "Test error",
        timestamp: new Date(),
      };

      detectionLogger.logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DB-DETECTION]",
        expect.stringContaining("detection_error")
      );
    });

    it("should log table detection phases", () => {
      const consoleSpy = jest.spyOn(console, "info");

      detectionLogger.logTableDetection("start");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DB-DETECTION]",
        expect.stringContaining("table_detection")
      );
    });

    it("should log complete detection results", () => {
      const consoleSpy = jest.spyOn(console, "info");

      const mockResult: DatabaseDetectionResult = {
        databaseExists: true,
        databaseName: "chatstoryai",
        tablesDetection: {
          expectedTables: [],
          existingTables: [],
          missingTables: [],
          extraTables: [],
          schemaValidation: [],
        },
        detectionReport: {
          summary: {
            databaseStatus: "exists",
            tablesStatus: "complete",
            overallHealth: "healthy",
          },
          recommendations: [],
          details: {
            missingComponents: [],
            structuralIssues: [],
          },
        },
        errors: [],
        timestamp: new Date(),
        totalDetectionTime: 100,
      };

      detectionLogger.logDetectionResult(mockResult);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DB-DETECTION]",
        expect.stringContaining("detection_complete")
      );
    });
  });
});
