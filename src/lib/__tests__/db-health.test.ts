/**
 * Unit tests for database health check functionality
 */

import {
  checkDatabaseHealth,
  formatHealthCheckResult,
  handleGracefulFailure,
  shouldCrashOnFailure,
  DatabaseHealthResult,
  HealthCheckError,
  GracefulFailureConfig,
} from "../db-health";

// Mock the database pool
jest.mock("../db", () => ({
  getConnection: jest.fn(),
  execute: jest.fn(),
}));

// Mock pool for testing
const mockPool = {
  getConnection: jest.fn(),
  execute: jest.fn(),
};

// Mock connection object
const mockConnection = {
  ping: jest.fn(),
  release: jest.fn(),
};

describe("Database Health Check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("checkDatabaseHealth", () => {
    it("should return healthy result when all checks pass", async () => {
      // Mock successful connection
      mockPool.getConnection.mockResolvedValue(mockConnection);
      mockConnection.ping.mockResolvedValue(undefined);

      // Mock version check
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "8.0.35-0ubuntu0.22.04.1" }]])
        .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
        .mockResolvedValueOnce([
          [
            {
              "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`":
                "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`",
            },
          ],
        ]);

      // Mock the pool in the module
      jest.doMock("../db", () => mockPool);

      const { checkDatabaseHealth } = require("../db-health");
      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.connectionStatus.isConnected).toBe(true);
      expect(result.versionCheck.isCompatible).toBe(true);
      expect(result.permissionsCheck.hasAllPermissions).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle connection failures with retry mechanism", async () => {
      // Mock connection failures
      mockPool.getConnection
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockResolvedValueOnce(mockConnection);

      mockConnection.ping.mockResolvedValue(undefined);

      // Mock version and permissions checks
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "8.0.35" }]])
        .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
        .mockResolvedValueOnce([
          [
            {
              "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`":
                "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseHealth } = require("../db-health");
      const result = await checkDatabaseHealth();

      expect(result.connectionStatus.retryAttempts).toBe(3);
      expect(result.connectionStatus.isConnected).toBe(true);
    });

    it("should fail when connection cannot be established", async () => {
      // Mock all connection attempts failing
      mockPool.getConnection.mockRejectedValue(new Error("Connection failed"));

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseHealth } = require("../db-health");
      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.connectionStatus.isConnected).toBe(false);
      expect(result.connectionStatus.retryAttempts).toBe(5);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("connection");
    });

    it("should fail when MySQL version is incompatible", async () => {
      // Mock successful connection
      mockPool.getConnection.mockResolvedValue(mockConnection);
      mockConnection.ping.mockResolvedValue(undefined);

      // Mock old MySQL version
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "5.7.44" }]])
        .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
        .mockResolvedValueOnce([
          [
            {
              "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`":
                "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseHealth } = require("../db-health");
      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.versionCheck.isCompatible).toBe(false);
      expect(result.versionCheck.currentVersion).toBe("5.7.44");
      expect(result.errors.some((e: any) => e.type === "version")).toBe(true);
    });

    it("should fail when user lacks required permissions", async () => {
      // Mock successful connection
      mockPool.getConnection.mockResolvedValue(mockConnection);
      mockConnection.ping.mockResolvedValue(undefined);

      // Mock version check and limited permissions
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "8.0.35" }]])
        .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
        .mockResolvedValueOnce([
          [
            {
              "GRANT SELECT ON *.* TO `test_user`@`localhost`":
                "GRANT SELECT ON *.* TO `test_user`@`localhost`",
            },
          ],
        ]);

      jest.doMock("../db", () => mockPool);

      const { checkDatabaseHealth } = require("../db-health");
      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.permissionsCheck.hasAllPermissions).toBe(false);
      expect(result.permissionsCheck.missingPermissions.length).toBeGreaterThan(
        0
      );
      expect(result.errors.some((e: any) => e.type === "permission")).toBe(
        true
      );
    });
  });

  describe("formatHealthCheckResult", () => {
    it("should format healthy result correctly", () => {
      const healthyResult: DatabaseHealthResult = {
        isHealthy: true,
        connectionStatus: {
          isConnected: true,
          retryAttempts: 1,
          maxRetries: 5,
          connectionTime: 150,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {
            CREATE: true,
            DROP: true,
            INSERT: true,
            SELECT: true,
            UPDATE: true,
            DELETE: true,
          },
          missingPermissions: [],
        },
        errors: [],
        timestamp: new Date("2025-07-17T10:00:00Z"),
        totalCheckTime: 500,
      };

      const formatted = formatHealthCheckResult(healthyResult);

      expect(formatted).toContain("✅ HEALTHY");
      expect(formatted).toContain("Connection: ✅");
      expect(formatted).toContain("Version: ✅");
      expect(formatted).toContain("Permissions: ✅");
      expect(formatted).toContain("500ms");
    });

    it("should format unhealthy result with errors", () => {
      const unhealthyResult: DatabaseHealthResult = {
        isHealthy: false,
        connectionStatus: {
          isConnected: false,
          retryAttempts: 5,
          maxRetries: 5,
          lastError: "Connection timeout",
        },
        versionCheck: {
          isCompatible: false,
          currentVersion: "5.7.44",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: false,
          permissions: {
            CREATE: false,
            DROP: false,
            INSERT: true,
            SELECT: true,
            UPDATE: true,
            DELETE: false,
          },
          missingPermissions: ["CREATE", "DROP", "DELETE"],
        },
        errors: [
          {
            type: "connection",
            message: "Failed to connect",
            timestamp: new Date(),
          },
          {
            type: "version",
            message: "Version incompatible",
            timestamp: new Date(),
          },
        ],
        timestamp: new Date("2025-07-17T10:00:00Z"),
        totalCheckTime: 1000,
      };

      const formatted = formatHealthCheckResult(unhealthyResult);

      expect(formatted).toContain("❌ UNHEALTHY");
      expect(formatted).toContain("Connection: ❌");
      expect(formatted).toContain("Version: ❌");
      expect(formatted).toContain("Permissions: ❌");
      expect(formatted).toContain("Errors:");
      expect(formatted).toContain("[CONNECTION] Failed to connect");
      expect(formatted).toContain("[VERSION] Version incompatible");
    });
  });

  describe("handleGracefulFailure", () => {
    const failedResult: DatabaseHealthResult = {
      isHealthy: false,
      connectionStatus: {
        isConnected: false,
        retryAttempts: 5,
        maxRetries: 5,
        lastError: "Connection timeout",
      },
      versionCheck: {
        isCompatible: false,
        currentVersion: "5.7.44",
        requiredVersion: "8.0.0",
      },
      permissionsCheck: {
        hasAllPermissions: false,
        permissions: {
          CREATE: false,
          DROP: false,
          INSERT: true,
          SELECT: true,
          UPDATE: true,
          DELETE: false,
        },
        missingPermissions: ["CREATE", "DROP", "DELETE"],
      },
      errors: [
        {
          type: "connection",
          message: "Failed to connect",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
      totalCheckTime: 1000,
    };

    it("should generate troubleshooting hints", () => {
      const result = handleGracefulFailure(failedResult);

      expect(result.troubleshootingHints).toHaveLength(1);
      expect(result.troubleshootingHints[0].category).toBe("connection");
      expect(
        result.troubleshootingHints[0].possibleCauses.length
      ).toBeGreaterThan(0);
      expect(
        result.troubleshootingHints[0].suggestedActions.length
      ).toBeGreaterThan(0);
    });

    it("should respect fallback configuration", () => {
      const config: Partial<GracefulFailureConfig> = {
        enableFallback: true,
        fallbackBehavior: "continue",
      };

      const result = handleGracefulFailure(failedResult, config);

      expect(result.shouldContinue).toBe(true);
      expect(result.errorMessage).toContain(
        "Application will continue startup"
      );
    });

    it("should handle exit behavior", () => {
      const config: Partial<GracefulFailureConfig> = {
        enableFallback: true,
        fallbackBehavior: "exit",
      };

      const result = handleGracefulFailure(failedResult, config);

      expect(result.shouldContinue).toBe(false);
      expect(result.errorMessage).toContain("Application will exit");
    });
  });

  describe("shouldCrashOnFailure", () => {
    const failedResult: DatabaseHealthResult = {
      isHealthy: false,
      connectionStatus: { isConnected: false, retryAttempts: 5, maxRetries: 5 },
      versionCheck: {
        isCompatible: false,
        currentVersion: "5.7.44",
        requiredVersion: "8.0.0",
      },
      permissionsCheck: {
        hasAllPermissions: false,
        permissions: {
          CREATE: false,
          DROP: false,
          INSERT: true,
          SELECT: true,
          UPDATE: true,
          DELETE: false,
        },
        missingPermissions: ["CREATE", "DROP", "DELETE"],
      },
      errors: [],
      timestamp: new Date(),
      totalCheckTime: 1000,
    };

    it("should not crash with continue fallback", () => {
      const config: Partial<GracefulFailureConfig> = {
        enableFallback: true,
        fallbackBehavior: "continue",
      };

      const shouldCrash = shouldCrashOnFailure(failedResult, config);
      expect(shouldCrash).toBe(false);
    });

    it("should crash with exit fallback", () => {
      const config: Partial<GracefulFailureConfig> = {
        enableFallback: true,
        fallbackBehavior: "exit",
      };

      const shouldCrash = shouldCrashOnFailure(failedResult, config);
      expect(shouldCrash).toBe(true);
    });

    it("should not crash by default", () => {
      const shouldCrash = shouldCrashOnFailure(failedResult);
      expect(shouldCrash).toBe(false);
    });
  });
});
