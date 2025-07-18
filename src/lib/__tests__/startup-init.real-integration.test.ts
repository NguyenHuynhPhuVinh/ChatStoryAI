/**
 * Real Integration Tests for Startup Initialization
 * Tests with actual MySQL database using Docker containers
 */

import {
  initializeApplication,
  initializeForMiddleware,
  ensureInitialized,
  isStartupInitialized,
  resetStartupState,
  getLastHealthCheckResult,
} from "../startup-init";
import {
  testDbHelper,
  setupIntegrationTest,
  skipIfNoDatabaseAvailable,
} from "./helpers/test-db-helper";

// Skip tests if running in CI without Docker or if database is not available
const isCI = process.env.CI === "true";
const skipTests = isCI || process.env.SKIP_INTEGRATION_TESTS === "true";

const describeIntegration = skipTests ? describe.skip : describe;

describeIntegration("Startup Initialization - Real Integration", () => {
  setupIntegrationTest();
  skipIfNoDatabaseAvailable();

  beforeEach(() => {
    resetStartupState();
  });

  describe("Real MySQL Startup Initialization", () => {
    it("should initialize application successfully with healthy database", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";
      process.env.DB_INIT_MODE = "development";
      process.env.DB_AUTO_INIT_ENABLED = "true";

      try {
        const result = await initializeApplication();

        expect(result).toBe(true);

        // Verify startup state
        expect(isStartupInitialized()).toBe(true);

        const lastHealthCheck = getLastHealthCheckResult();
        expect(lastHealthCheck).not.toBeNull();
        expect(lastHealthCheck?.isHealthy).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should handle database connection failures during initialization", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "9999"; // Invalid port
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";
      process.env.DB_INIT_MODE = "development";
      process.env.DB_AUTO_INIT_ENABLED = "true";

      try {
        const result = await initializeApplication();

        expect(result).toBe(false);

        // Startup should not be marked as initialized
        expect(isStartupInitialized()).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should initialize for middleware successfully", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result = await initializeForMiddleware();

        expect(result).toBe(true);
        expect(isStartupInitialized()).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should handle middleware initialization failure", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "9999"; // Invalid port
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        const result = await initializeForMiddleware();

        expect(result).toBe(false);
        expect(isStartupInitialized()).toBe(false);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should ensure initialization when not already initialized", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        expect(isStartupInitialized()).toBe(false);

        await ensureInitialized();

        expect(isStartupInitialized()).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should skip initialization when already initialized", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        // First initialization
        await initializeApplication();
        expect(isStartupInitialized()).toBe(true);

        const firstHealthCheck = getLastHealthCheckResult();

        // Second call should not re-initialize
        await ensureInitialized();

        const secondHealthCheck = getLastHealthCheckResult();
        expect(secondHealthCheck).toBe(firstHealthCheck); // Should be same instance
      } finally {
        process.env = originalEnv;
      }
    }, 30000);
  });

  describe("Startup Configuration Validation", () => {
    it("should handle different initialization modes", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";

      try {
        // Test development mode
        process.env.DB_INIT_MODE = "development";
        const devResult = await initializeApplication();
        expect(devResult).toBe(true);

        resetStartupState();

        // Test production mode
        process.env.DB_INIT_MODE = "production";
        const prodResult = await initializeApplication();
        expect(prodResult).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 45000);

    it("should respect timeout configurations", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";
      process.env.DB_INIT_TIMEOUT = "5000"; // 5 second timeout
      process.env.DB_HEALTH_CHECK_TIMEOUT = "3000"; // 3 second timeout

      try {
        const startTime = Date.now();
        const result = await initializeApplication();
        const endTime = Date.now();

        expect(result).toBe(true);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within reasonable time
      } finally {
        process.env = originalEnv;
      }
    }, 30000);

    it("should handle retry configurations", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";
      process.env.DB_INIT_RETRY_ATTEMPTS = "2";
      process.env.DB_INIT_RETRY_DELAY = "1000";

      try {
        const result = await initializeApplication();

        expect(result).toBe(true);
        // Note: Can't check retry attempts directly since initializeApplication returns boolean
      } finally {
        process.env = originalEnv;
      }
    }, 30000);
  });

  describe("Error Recovery Scenarios", () => {
    it("should handle temporary database unavailability", async () => {
      const originalEnv = process.env;
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3307";
      process.env.DB_USER = "chatstory_test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_NAME = "chatstoryai_test";
      process.env.DB_INIT_RETRY_ATTEMPTS = "3";
      process.env.DB_INIT_RETRY_DELAY = "1000";

      try {
        // This should succeed even if there are temporary connection issues
        const result = await initializeApplication();

        // Should eventually succeed due to retry logic
        expect(result).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    }, 60000);
  });
});
