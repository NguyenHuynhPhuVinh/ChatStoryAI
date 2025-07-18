/**
 * Real Integration Tests for Database Migration System
 * Tests with actual MySQL database using Docker containers
 */

import { runMigrations, MigrationSystemResult } from "../db-migration";
import {
  testDbHelper,
  setupIntegrationTest,
  skipIfNoDatabaseAvailable,
} from "./helpers/test-db-helper";
import fs from "fs/promises";
import path from "path";

// Skip tests if running in CI without Docker or if database is not available
const isCI = process.env.CI === "true";
const skipTests = isCI || process.env.SKIP_INTEGRATION_TESTS === "true";

const describeIntegration = skipTests ? describe.skip : describe;

describeIntegration("Database Migration - Real Integration", () => {
  setupIntegrationTest();
  skipIfNoDatabaseAvailable();

  const testMigrationsDir = path.join(__dirname, "test-migrations");

  beforeAll(async () => {
    // Create test migrations directory
    try {
      await fs.mkdir(testMigrationsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Create test migration files
    await fs.writeFile(
      path.join(testMigrationsDir, "001-create-users.sql"),
      `
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `.trim()
    );

    await fs.writeFile(
      path.join(testMigrationsDir, "002-create-posts.sql"),
      `
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `.trim()
    );

    await fs.writeFile(
      path.join(testMigrationsDir, "003-add-user-status.sql"),
      `
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';
      `.trim()
    );
  }, 30000);

  afterAll(async () => {
    // Clean up test migrations directory
    try {
      await fs.rm(testMigrationsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("Real MySQL Migration Execution", () => {
    it("should execute migrations successfully on fresh database", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_migration_test";

      try {
        const rootConn = await testDbHelper.getRootConnection();

        // Create fresh database
        await rootConn.execute(
          "DROP DATABASE IF EXISTS chatstoryai_migration_test"
        );
        await rootConn.execute(
          "CREATE DATABASE chatstoryai_migration_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        const result: MigrationSystemResult = await runMigrations(
          testMigrationsDir
        );

        expect(result.success).toBe(true);
        expect(result.totalScripts).toBe(3);
        expect(result.executedScripts).toBe(3);
        expect(result.failedScripts).toBe(0);
        expect(result.skippedScripts).toBe(0);
        expect(result.errors).toHaveLength(0);

        // Verify tables were created
        await rootConn.execute("USE chatstoryai_migration_test");

        const [tables] = await rootConn.execute("SHOW TABLES");
        const tableNames = Array.isArray(tables)
          ? (tables as any[]).map((row) => Object.values(row)[0])
          : [];

        expect(tableNames).toContain("users");
        expect(tableNames).toContain("posts");
        expect(tableNames).toContain("migration_history"); // Migration tracking table

        // Verify table structure
        const [userColumns] = await rootConn.execute("DESCRIBE users");
        const columnNames = Array.isArray(userColumns)
          ? (userColumns as any[]).map((col) => col.Field)
          : [];

        expect(columnNames).toContain("id");
        expect(columnNames).toContain("username");
        expect(columnNames).toContain("email");
        expect(columnNames).toContain("status"); // Added by migration 003
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should skip already executed migrations", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_migration_skip_test";

      try {
        const rootConn = await testDbHelper.getRootConnection();

        // Create fresh database
        await rootConn.execute(
          "DROP DATABASE IF EXISTS chatstoryai_migration_skip_test"
        );
        await rootConn.execute(
          "CREATE DATABASE chatstoryai_migration_skip_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // First run - should execute all migrations
        const result1 = await runMigrations(testMigrationsDir);
        expect(result1.success).toBe(true);
        expect(result1.executedScripts).toBe(3);

        // Second run - should skip all migrations
        const result2 = await runMigrations(testMigrationsDir);
        expect(result2.success).toBe(true);
        expect(result2.executedScripts).toBe(0);
        expect(result2.skippedScripts).toBe(3);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should handle migration failures gracefully", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_migration_fail_test";

      try {
        const rootConn = await testDbHelper.getRootConnection();

        // Create fresh database
        await rootConn.execute(
          "DROP DATABASE IF EXISTS chatstoryai_migration_fail_test"
        );
        await rootConn.execute(
          "CREATE DATABASE chatstoryai_migration_fail_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // Create a migration with invalid SQL
        const failMigrationPath = path.join(
          testMigrationsDir,
          "004-invalid-sql.sql"
        );
        await fs.writeFile(failMigrationPath, "INVALID SQL STATEMENT;");

        try {
          const result = await runMigrations(testMigrationsDir);

          // Should fail due to invalid SQL
          expect(result.success).toBe(false);
          expect(result.failedScripts).toBeGreaterThan(0);
          expect(result.errors.length).toBeGreaterThan(0);
        } finally {
          // Clean up the invalid migration file
          await fs.unlink(failMigrationPath).catch(() => {});
        }
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should track migration history correctly", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_migration_history_test";

      try {
        const rootConn = await testDbHelper.getRootConnection();

        // Create fresh database
        await rootConn.execute(
          "DROP DATABASE IF EXISTS chatstoryai_migration_history_test"
        );
        await rootConn.execute(
          "CREATE DATABASE chatstoryai_migration_history_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        const result = await runMigrations(testMigrationsDir);
        expect(result.success).toBe(true);

        // Check migration history table
        await rootConn.execute("USE chatstoryai_migration_history_test");
        const [history] = await rootConn.execute(
          "SELECT * FROM migration_history ORDER BY executed_at"
        );

        expect(Array.isArray(history)).toBe(true);
        const historyArray = history as any[];
        expect(historyArray.length).toBe(3);

        const historyRecords = history as any[];
        expect(historyRecords[0].script_name).toBe("001-create-users.sql");
        expect(historyRecords[1].script_name).toBe("002-create-posts.sql");
        expect(historyRecords[2].script_name).toBe("003-add-user-status.sql");

        // All should be successful
        historyRecords.forEach((record) => {
          expect(record.success).toBe(1);
          expect(record.execution_time).toBeGreaterThan(0);
          expect(record.checksum).toBeDefined();
        });
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should handle dry run mode", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_migration_dryrun_test";

      try {
        const rootConn = await testDbHelper.getRootConnection();

        // Create fresh database
        await rootConn.execute(
          "DROP DATABASE IF EXISTS chatstoryai_migration_dryrun_test"
        );
        await rootConn.execute(
          "CREATE DATABASE chatstoryai_migration_dryrun_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        const result = await runMigrations(testMigrationsDir, { dryRun: true });

        expect(result.success).toBe(true);
        expect(result.totalScripts).toBe(3);
        expect(result.executedScripts).toBe(0); // No scripts should be executed in dry run
        expect(result.skippedScripts).toBe(0);

        // Verify no tables were created (except migration tracking)
        await rootConn.execute("USE chatstoryai_migration_dryrun_test");
        const [tables] = await rootConn.execute("SHOW TABLES");

        // Should only have migration_history table
        expect((tables as any[]).length).toBeLessThanOrEqual(1);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);
  });
});
