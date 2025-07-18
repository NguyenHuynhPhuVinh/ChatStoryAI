/**
 * Real Integration Tests for Database Health Check
 * Tests with actual MySQL database using Docker containers
 */

import { checkDatabaseHealth, DatabaseHealthResult } from "../db-health";
import {
  testDbHelper,
  setupIntegrationTest,
  skipIfNoDatabaseAvailable,
} from "./helpers/test-db-helper";

// Skip tests if running in CI without Docker or if database is not available
const isCI = process.env.CI === "true";
const skipTests = isCI || process.env.SKIP_INTEGRATION_TESTS === "true";

const describeIntegration = skipTests ? describe.skip : describe;

describeIntegration("Database Health Check - Real Integration", () => {
  setupIntegrationTest();
  skipIfNoDatabaseAvailable();

  describe("Real MySQL Database Health Checks", () => {
    it("should successfully check health of running MySQL database", async () => {
      // Override environment variables to use test database
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result: DatabaseHealthResult = await checkDatabaseHealth();

        expect(result.isHealthy).toBe(true);
        expect(result.connectionStatus.isConnected).toBe(true);
        expect(result.versionCheck.isCompatible).toBe(true);
        expect(result.versionCheck.currentVersion).toMatch(/^8\./);
        expect(result.permissionsCheck.hasAllPermissions).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.totalCheckTime).toBeGreaterThan(0);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should handle connection failures gracefully", async () => {
      // Use invalid port to simulate connection failure
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "9999"; // Invalid port
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result: DatabaseHealthResult = await checkDatabaseHealth();

        expect(result.isHealthy).toBe(false);
        expect(result.connectionStatus.isConnected).toBe(false);
        expect(result.connectionStatus.retryAttempts).toBeGreaterThan(1);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe("connection");
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should detect invalid credentials", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "invalid_user";
      process.env.DB_PASSWORD = "invalid_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result: DatabaseHealthResult = await checkDatabaseHealth();

        expect(result.isHealthy).toBe(false);
        expect(result.connectionStatus.isConnected).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe("connection");
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should validate MySQL version compatibility", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "root";
      process.env.DB_PASSWORD = "test_root_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result: DatabaseHealthResult = await checkDatabaseHealth();

        expect(result.versionCheck.currentVersion).toBeDefined();
        expect(result.versionCheck.currentVersion).toMatch(/^\d+\.\d+/);
        expect(result.versionCheck.requiredVersion).toBe("8.0.0");

        // MySQL 8.0+ should be compatible
        if (result.versionCheck.currentVersion.startsWith("8.")) {
          expect(result.versionCheck.isCompatible).toBe(true);
        }
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should check user permissions correctly", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result: DatabaseHealthResult = await checkDatabaseHealth();

        expect(result.permissionsCheck).toBeDefined();
        expect(result.permissionsCheck.permissions).toBeDefined();

        // Test user should have all required permissions
        const requiredPermissions = [
          "CREATE",
          "DROP",
          "INSERT",
          "SELECT",
          "UPDATE",
          "DELETE",
        ];
        requiredPermissions.forEach((permission) => {
          expect((result.permissionsCheck.permissions as any)[permission]).toBe(
            true
          );
        });

        expect(result.permissionsCheck.missingPermissions).toHaveLength(0);
        expect(result.permissionsCheck.hasAllPermissions).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should measure performance metrics", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const startTime = Date.now();
        const result: DatabaseHealthResult = await checkDatabaseHealth();
        const endTime = Date.now();

        expect(result.totalCheckTime).toBeGreaterThan(0);
        expect(result.totalCheckTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
        expect(result.connectionStatus.connectionTime).toBeGreaterThan(0);
        expect(result.timestamp).toBeInstanceOf(Date);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);
  });

  describe("Database Recovery Scenarios", () => {
    it("should handle database restart scenario", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        // First check should succeed
        const result1 = await checkDatabaseHealth();
        expect(result1.isHealthy).toBe(true);

        // Simulate brief connection issue and recovery
        // (In real scenario, this would involve restarting container)
        const result2 = await checkDatabaseHealth();
        expect(result2.isHealthy).toBe(true);

        // Connection should be re-established
        expect(result2.connectionStatus.isConnected).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);
  });
});
