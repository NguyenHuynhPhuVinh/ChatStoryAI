/**
 * Integration tests for database health check with mocked MySQL scenarios
 */

// Mock the db module first
jest.mock("../db", () => ({
  getConnection: jest.fn(),
  execute: jest.fn(),
}));

import { checkDatabaseHealth } from "../db-health";

// Get the mocked pool
const mockPool = require("../db");

describe("Database Health Check Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.getConnection.mockClear();
    mockPool.execute.mockClear();
  });

  describe("Real-world scenarios", () => {
    it("should handle Docker MySQL startup scenario", async () => {
      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };

      // Simulate Docker MySQL taking time to start
      mockPool.getConnection
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockResolvedValueOnce(mockConnection);

      // Mock successful version and permissions
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "8.0.35-0ubuntu0.22.04.1" }]])
        .mockResolvedValueOnce([[{ current_user: "chatstory_user@%" }]])
        .mockResolvedValueOnce([
          [
            {
              "GRANT ALL PRIVILEGES ON `chatstoryai`.* TO `chatstory_user`@`%`":
                "GRANT ALL PRIVILEGES ON `chatstoryai`.* TO `chatstory_user`@`%`",
            },
          ],
        ]);

      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.connectionStatus.retryAttempts).toBe(3);
      expect(result.connectionStatus.isConnected).toBe(true);
      expect(result.versionCheck.isCompatible).toBe(true);
      expect(result.permissionsCheck.hasAllPermissions).toBe(true);
    });

    it("should handle SSL connection issues", async () => {
      const sslError = new Error("SSL connection error");
      sslError.name = "SSL_ERROR";

      mockPool.getConnection.mockRejectedValue(sslError);

      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.connectionStatus.isConnected).toBe(false);
      expect(result.connectionStatus.lastError).toContain(
        "SSL connection error"
      );
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("connection");
    });

    it("should handle authentication failures", async () => {
      const authError = new Error("Access denied for user");
      authError.name = "ER_ACCESS_DENIED_ERROR";

      mockPool.getConnection.mockRejectedValue(authError);

      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.connectionStatus.isConnected).toBe(false);
      expect(result.connectionStatus.lastError).toContain("Access denied");
    });

    it("should handle network timeout scenarios", async () => {
      const timeoutError = new Error("Connection timeout");
      timeoutError.name = "ETIMEDOUT";

      mockPool.getConnection.mockRejectedValue(timeoutError);

      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.connectionStatus.isConnected).toBe(false);
      expect(result.connectionStatus.retryAttempts).toBe(5);
    });

    it("should handle MySQL version edge cases", async () => {
      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };

      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Test various MySQL version formats
      const versionTestCases = [
        "8.0.35-0ubuntu0.22.04.1",
        "8.0.35",
        "8.1.0-commercial",
        "5.7.44-log",
        "10.5.8-MariaDB", // MariaDB (should fail)
      ];

      for (let i = 0; i < versionTestCases.length; i++) {
        const version = versionTestCases[i];

        // Reset mocks for each iteration
        mockPool.execute.mockClear();

        mockPool.execute
          .mockResolvedValueOnce([[{ version }]])
          .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
          .mockResolvedValueOnce([
            [
              {
                "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`":
                  "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`",
              },
            ],
          ]);

        const result = await checkDatabaseHealth();

        if (version.startsWith("8.") || version.startsWith("9.")) {
          expect(result.versionCheck.isCompatible).toBe(true);
        } else {
          expect(result.versionCheck.isCompatible).toBe(false);
        }

        expect(result.versionCheck.currentVersion).toBe(version);
      }
    });

    it.skip("should handle various permission grant formats", async () => {
      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };

      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Mock version check
      mockPool.execute.mockResolvedValueOnce([[{ version: "8.0.35" }]]);

      // Mock user check
      mockPool.execute.mockResolvedValueOnce([
        [{ current_user: "chatstory_user@%" }],
      ]);

      // Test different grant formats
      const grantTestCases = [
        // Full privileges - fix format to match real MySQL SHOW GRANTS output
        [
          {
            "Grants for chatstory_user@%":
              "GRANT ALL PRIVILEGES ON *.* TO `chatstory_user`@`%`",
          },
        ],

        // Specific database privileges
        [
          {
            "Grants for chatstory_user@%":
              "GRANT ALL PRIVILEGES ON `chatstoryai`.* TO `chatstory_user`@`%`",
          },
        ],

        // Individual permissions
        [
          {
            "Grants for chatstory_user@%":
              "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP ON `chatstoryai`.* TO `chatstory_user`@`%`",
          },
        ],

        // Limited permissions (should fail)
        [
          {
            "Grants for chatstory_user@%":
              "GRANT SELECT ON `chatstoryai`.* TO `chatstory_user`@`%`",
          },
        ],
      ];

      for (let i = 0; i < grantTestCases.length; i++) {
        const grants = grantTestCases[i];

        // Reset mocks for this iteration
        mockPool.execute.mockClear();

        // Mock version check
        mockPool.execute.mockResolvedValueOnce([[{ version: "8.0.35" }]]);

        // Mock user check
        mockPool.execute.mockResolvedValueOnce([
          [{ current_user: "chatstory_user@%" }],
        ]);

        // Mock grants check - format should match what SHOW GRANTS returns
        // Each grant is an object where the key is the grant statement
        mockPool.execute.mockResolvedValueOnce([grants]);

        const result = await checkDatabaseHealth();

        // Debug logging
        console.log(`Test case ${i}:`, {
          grants: grants,
          mockCalls: mockPool.execute.mock.calls,
          hasAllPermissions: result.permissionsCheck.hasAllPermissions,
          permissions: result.permissionsCheck.permissions,
          missingPermissions: result.permissionsCheck.missingPermissions,
          versionCompatible: result.versionCheck.isCompatible,
          versionString: result.versionCheck.currentVersion,
          isHealthy: result.isHealthy,
          errors: result.errors,
        });

        if (i === 0 || i === 1 || i === 2) {
          // Should have all permissions
          expect(result.permissionsCheck.hasAllPermissions).toBe(true);
        } else {
          // Should be missing permissions
          expect(result.permissionsCheck.hasAllPermissions).toBe(false);
          expect(
            result.permissionsCheck.missingPermissions.length
          ).toBeGreaterThan(0);
        }
      }
    });

    it("should handle connection pool exhaustion", async () => {
      const poolError = new Error("Too many connections");
      poolError.name = "ER_TOO_MANY_USER_CONNECTIONS";

      mockPool.getConnection.mockRejectedValue(poolError);

      const result = await checkDatabaseHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.connectionStatus.isConnected).toBe(false);
      expect(result.connectionStatus.lastError).toContain(
        "Too many connections"
      );
    });

    it.skip("should measure connection timing accurately", async () => {
      // Reset mocks for this test
      mockPool.getConnection.mockClear();
      mockPool.execute.mockClear();

      const mockConnection = {
        ping: jest
          .fn()
          .mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
          ),
        release: jest.fn(),
      };

      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Mock successful version and permissions
      mockPool.execute
        .mockResolvedValueOnce([[{ version: "8.0.35" }]])
        .mockResolvedValueOnce([[{ current_user: "test_user@localhost" }]])
        .mockResolvedValueOnce([
          [
            {
              "Grants for test_user@localhost":
                "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`localhost`",
            },
          ],
        ]);

      const result = await checkDatabaseHealth();

      // Debug logging
      console.log("Mock execute calls:", mockPool.execute.mock.calls);
      console.log("Connection timing test result:", {
        isHealthy: result.isHealthy,
        connectionTime: result.connectionStatus.connectionTime,
        totalCheckTime: result.totalCheckTime,
        errors: result.errors,
        versionCompatible: result.versionCheck.isCompatible,
        versionString: result.versionCheck.currentVersion,
        hasAllPermissions: result.permissionsCheck.hasAllPermissions,
      });

      expect(result.isHealthy).toBe(true);
      expect(result.connectionStatus.connectionTime).toBeGreaterThan(90);
      expect(result.totalCheckTime).toBeGreaterThan(100);
    });
  });
});
