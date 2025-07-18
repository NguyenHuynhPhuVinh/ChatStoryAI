/**
 * Unit tests for startup initialization functionality
 */

import {
  initializeApplication,
  getLastHealthCheckResult,
  isStartupInitialized,
  resetStartupState,
  getStartupConfigFromEnv,
  StartupConfig,
} from "../startup-init";

// Mock the db-health module
jest.mock("../db-health", () => ({
  checkDatabaseHealth: jest.fn(),
  handleGracefulFailure: jest.fn(),
  shouldCrashOnFailure: jest.fn(),
  dbHealthLogger: {
    logHealthCheck: jest.fn(),
    logError: jest.fn(),
  },
}));

const mockCheckDatabaseHealth = require("../db-health").checkDatabaseHealth;
const mockHandleGracefulFailure = require("../db-health").handleGracefulFailure;
const mockShouldCrashOnFailure = require("../db-health").shouldCrashOnFailure;

describe("Startup Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStartupState();

    // Reset environment variables
    delete process.env.DB_AUTO_INIT;
    delete process.env.DB_INIT_TIMEOUT;
    delete process.env.DB_HEALTH_CHECK_RETRY_DELAY;
    delete process.env.DB_MIGRATION_TIMEOUT;
    delete process.env.DB_MIGRATION_SKIP_SCRIPTS;
    delete process.env.DB_MIGRATION_SKIP_PATTERN;
    delete process.env.DB_HEALTH_CHECK_ENABLED;
    delete process.env.DB_HEALTH_CHECK_TIMEOUT;
    delete process.env.DB_HEALTH_CHECK_SKIP_PRODUCTION;
    delete process.env.DB_HEALTH_CHECK_LOG_LEVEL;
    delete process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK;
    delete process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR;
    delete process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS;
  });

  describe("initializeApplication", () => {
    it("should initialize successfully with healthy database", async () => {
      const healthyResult = {
        isHealthy: true,
        connectionStatus: {
          isConnected: true,
          retryAttempts: 1,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {},
          missingPermissions: [],
        },
        errors: [],
        timestamp: new Date(),
        totalCheckTime: 500,
      };

      mockCheckDatabaseHealth.mockResolvedValue(healthyResult);

      const result = await initializeApplication();

      expect(result).toBe(true);
      expect(isStartupInitialized()).toBe(true);
      expect(getLastHealthCheckResult()).toEqual(healthyResult);
      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle unhealthy database with graceful failure", async () => {
      const unhealthyResult = {
        isHealthy: false,
        connectionStatus: {
          isConnected: false,
          retryAttempts: 5,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: false,
          currentVersion: "5.7.44",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: false,
          permissions: {},
          missingPermissions: ["CREATE"],
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

      const gracefulResult = {
        shouldContinue: true,
        troubleshootingHints: [],
        errorMessage: "Database issues detected",
      };

      mockCheckDatabaseHealth.mockResolvedValue(unhealthyResult);
      mockHandleGracefulFailure.mockReturnValue(gracefulResult);
      mockShouldCrashOnFailure.mockReturnValue(false);

      const result = await initializeApplication();

      expect(result).toBe(false); // Partial success
      expect(isStartupInitialized()).toBe(true);
      expect(mockHandleGracefulFailure).toHaveBeenCalledWith(
        unhealthyResult,
        expect.any(Object)
      );
      expect(mockShouldCrashOnFailure).toHaveBeenCalledWith(
        unhealthyResult,
        expect.any(Object)
      );
    });

    it("should throw error when configured to crash on failure", async () => {
      const unhealthyResult = {
        isHealthy: false,
        connectionStatus: {
          isConnected: false,
          retryAttempts: 5,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {},
          missingPermissions: [],
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

      const gracefulResult = {
        shouldContinue: false,
        troubleshootingHints: [],
        errorMessage: "Database issues detected",
      };

      mockCheckDatabaseHealth.mockResolvedValue(unhealthyResult);
      mockHandleGracefulFailure.mockReturnValue(gracefulResult);
      mockShouldCrashOnFailure.mockReturnValue(true);

      await expect(initializeApplication()).rejects.toThrow(
        "Database health check failed"
      );
    });

    it.skip("should skip initialization in production when configured", async () => {
      // Reset startup state first
      resetStartupState();

      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        configurable: true,
      });

      const config: Partial<StartupConfig> = {
        skipOnProduction: true,
      };

      const result = await initializeApplication(config);

      expect(result).toBe(true);
      expect(isStartupInitialized()).toBe(true);
      expect(mockCheckDatabaseHealth).not.toHaveBeenCalled();

      // Cleanup
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        configurable: true,
      });
    });

    it("should skip when database health check is disabled", async () => {
      const config: Partial<StartupConfig> = {
        enableDatabaseHealthCheck: false,
      };

      const result = await initializeApplication(config);

      expect(result).toBe(true);
      expect(isStartupInitialized()).toBe(true);
      expect(mockCheckDatabaseHealth).not.toHaveBeenCalled();
    });

    it("should handle health check timeout", async () => {
      // Mock a health check that takes longer than timeout
      mockCheckDatabaseHealth.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      );

      const config: Partial<StartupConfig> = {
        healthCheckTimeout: 1000, // 1 second timeout
      };

      const gracefulResult = {
        shouldContinue: true,
        troubleshootingHints: [],
        errorMessage: "Timeout occurred",
      };

      mockHandleGracefulFailure.mockReturnValue(gracefulResult);
      mockShouldCrashOnFailure.mockReturnValue(false);

      const result = await initializeApplication(config);

      expect(result).toBe(false); // Partial success due to timeout
      expect(isStartupInitialized()).toBe(true);
    });

    it("should return existing promise if initialization is in progress", async () => {
      const healthyResult = {
        isHealthy: true,
        connectionStatus: {
          isConnected: true,
          retryAttempts: 1,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {},
          missingPermissions: [],
        },
        errors: [],
        timestamp: new Date(),
        totalCheckTime: 500,
      };

      mockCheckDatabaseHealth.mockResolvedValue(healthyResult);

      // Start two initializations simultaneously
      const promise1 = initializeApplication();
      const promise2 = initializeApplication();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it("should return immediately if already initialized", async () => {
      const healthyResult = {
        isHealthy: true,
        connectionStatus: {
          isConnected: true,
          retryAttempts: 1,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {},
          missingPermissions: [],
        },
        errors: [],
        timestamp: new Date(),
        totalCheckTime: 500,
      };

      mockCheckDatabaseHealth.mockResolvedValue(healthyResult);

      // First initialization
      await initializeApplication();
      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);

      // Second initialization should return immediately
      const result = await initializeApplication();
      expect(result).toBe(true);
      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1); // Still only called once
    });

    it("should skip initialization when autoInitEnabled is false", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await initializeApplication({ autoInitEnabled: false });

      expect(result).toBe(true);
      expect(isStartupInitialized()).toBe(true);
      expect(mockCheckDatabaseHealth).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[STARTUP] Auto-initialization disabled via DB_AUTO_INIT=false"
      );

      consoleSpy.mockRestore();
    });

    it("should respect DB_AUTO_INIT environment variable", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      process.env.DB_AUTO_INIT = "false";
      const config = getStartupConfigFromEnv();
      const result = await initializeApplication(config);

      expect(result).toBe(true);
      expect(isStartupInitialized()).toBe(true);
      expect(mockCheckDatabaseHealth).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[STARTUP] Auto-initialization disabled via DB_AUTO_INIT=false"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getStartupConfigFromEnv", () => {
    it("should return default config when no env vars are set", () => {
      const config = getStartupConfigFromEnv();

      expect(config.autoInitEnabled).toBe(true);
      expect(config.enableDatabaseHealthCheck).toBe(true);
      expect(config.healthCheckTimeout).toBe(10000);
      expect(config.initTimeout).toBe(60000);
      expect(config.healthCheckRetryDelay).toBe(2000);
      expect(config.migrationTimeout).toBe(300000);
      expect(config.skipOnProduction).toBe(false);
      expect(config.logLevel).toBe("detailed");
      expect(config.gracefulFailureConfig?.enableFallback).toBe(true);
      expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("continue");
      expect(config.gracefulFailureConfig?.troubleshootingHints).toBe(true);
    });

    it("should parse environment variables correctly", () => {
      process.env.DB_HEALTH_CHECK_ENABLED = "false";
      process.env.DB_HEALTH_CHECK_TIMEOUT = "5000";
      process.env.DB_HEALTH_CHECK_SKIP_PRODUCTION = "true";
      process.env.DB_HEALTH_CHECK_LOG_LEVEL = "minimal";
      process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK = "false";
      process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR = "exit";
      process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS = "false";

      const config = getStartupConfigFromEnv();

      expect(config.enableDatabaseHealthCheck).toBe(false);
      expect(config.healthCheckTimeout).toBe(5000);
      expect(config.skipOnProduction).toBe(true);
      expect(config.logLevel).toBe("minimal");
      expect(config.gracefulFailureConfig?.enableFallback).toBe(false);
      expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("exit");
      expect(config.gracefulFailureConfig?.troubleshootingHints).toBe(false);
    });

    describe("DB_AUTO_INIT environment variable", () => {
      it("should parse DB_AUTO_INIT=true correctly", () => {
        process.env.DB_AUTO_INIT = "true";
        const config = getStartupConfigFromEnv();
        expect(config.autoInitEnabled).toBe(true);
      });

      it("should parse DB_AUTO_INIT=false correctly", () => {
        process.env.DB_AUTO_INIT = "false";
        const config = getStartupConfigFromEnv();
        expect(config.autoInitEnabled).toBe(false);
      });

      it("should parse DB_AUTO_INIT=1 correctly", () => {
        process.env.DB_AUTO_INIT = "1";
        const config = getStartupConfigFromEnv();
        expect(config.autoInitEnabled).toBe(true);
      });

      it("should parse DB_AUTO_INIT=0 correctly", () => {
        process.env.DB_AUTO_INIT = "0";
        const config = getStartupConfigFromEnv();
        expect(config.autoInitEnabled).toBe(false);
      });

      it("should handle case-insensitive values", () => {
        process.env.DB_AUTO_INIT = "TRUE";
        const config1 = getStartupConfigFromEnv();
        expect(config1.autoInitEnabled).toBe(true);

        process.env.DB_AUTO_INIT = "FALSE";
        const config2 = getStartupConfigFromEnv();
        expect(config2.autoInitEnabled).toBe(false);
      });

      it("should default to true for invalid values and log warning", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        process.env.DB_AUTO_INIT = "invalid";
        const config = getStartupConfigFromEnv();

        expect(config.autoInitEnabled).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_AUTO_INIT value: "invalid". Using default: true. Valid values: true, false, 1, 0'
        );

        consoleSpy.mockRestore();
      });

      it("should default to true when DB_AUTO_INIT is not set", () => {
        delete process.env.DB_AUTO_INIT;
        const config = getStartupConfigFromEnv();
        expect(config.autoInitEnabled).toBe(true);
      });
    });

    describe("Timeout configuration", () => {
      it("should parse timeout environment variables correctly", () => {
        process.env.DB_INIT_TIMEOUT = "30000";
        process.env.DB_HEALTH_CHECK_RETRY_DELAY = "1500";
        process.env.DB_MIGRATION_TIMEOUT = "600000";

        const config = getStartupConfigFromEnv();

        expect(config.initTimeout).toBe(30000);
        expect(config.healthCheckRetryDelay).toBe(1500);
        expect(config.migrationTimeout).toBe(600000);
      });

      it("should use default values for invalid timeout values", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        process.env.DB_INIT_TIMEOUT = "invalid";
        process.env.DB_HEALTH_CHECK_RETRY_DELAY = "-100";
        process.env.DB_MIGRATION_TIMEOUT = "not_a_number";

        const config = getStartupConfigFromEnv();

        expect(config.initTimeout).toBe(60000); // default
        expect(config.healthCheckRetryDelay).toBe(2000); // default
        expect(config.migrationTimeout).toBe(300000); // default

        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_TIMEOUT value: "invalid". Using default: 60000ms. Must be a positive number.'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_HEALTH_CHECK_RETRY_DELAY value: "-100". Using default: 2000ms. Must be a positive number.'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_MIGRATION_TIMEOUT value: "not_a_number". Using default: 300000ms. Must be a positive number.'
        );

        consoleSpy.mockRestore();
      });

      it("should handle zero timeout values as invalid", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        process.env.DB_INIT_TIMEOUT = "0";

        const config = getStartupConfigFromEnv();

        expect(config.initTimeout).toBe(60000); // default
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_TIMEOUT value: "0". Using default: 60000ms. Must be a positive number.'
        );

        consoleSpy.mockRestore();
      });
    });

    describe("Migration script skipping configuration", () => {
      it("should parse DB_MIGRATION_SKIP_SCRIPTS correctly", () => {
        process.env.DB_MIGRATION_SKIP_SCRIPTS =
          "01-test.sql,02-demo.sql, 03-temp.sql ";

        const config = getStartupConfigFromEnv();

        expect(config.migrationOptions?.skipScripts).toEqual([
          "01-test.sql",
          "02-demo.sql",
          "03-temp.sql",
        ]);
      });

      it("should handle empty DB_MIGRATION_SKIP_SCRIPTS", () => {
        process.env.DB_MIGRATION_SKIP_SCRIPTS = "";

        const config = getStartupConfigFromEnv();

        expect(config.migrationOptions?.skipScripts).toBeUndefined();
      });

      it("should handle DB_MIGRATION_SKIP_SCRIPTS with only commas and spaces", () => {
        process.env.DB_MIGRATION_SKIP_SCRIPTS = " , , ";

        const config = getStartupConfigFromEnv();

        expect(config.migrationOptions?.skipScripts).toBeUndefined();
      });

      it("should parse DB_MIGRATION_SKIP_PATTERN correctly", () => {
        process.env.DB_MIGRATION_SKIP_PATTERN = "test|demo";

        const config = getStartupConfigFromEnv();

        expect(config.migrationOptions?.skipPattern).toBe("test|demo");
      });

      it("should handle undefined migration skip environment variables", () => {
        delete process.env.DB_MIGRATION_SKIP_SCRIPTS;
        delete process.env.DB_MIGRATION_SKIP_PATTERN;

        const config = getStartupConfigFromEnv();

        expect(config.migrationOptions?.skipScripts).toBeUndefined();
        expect(config.migrationOptions?.skipPattern).toBeUndefined();
      });
    });
  });

  describe("resetStartupState", () => {
    it("should reset all startup state", async () => {
      // Initialize first
      const healthyResult = {
        isHealthy: true,
        connectionStatus: {
          isConnected: true,
          retryAttempts: 1,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: true,
          currentVersion: "8.0.35",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: true,
          permissions: {},
          missingPermissions: [],
        },
        errors: [],
        timestamp: new Date(),
        totalCheckTime: 500,
      };

      mockCheckDatabaseHealth.mockResolvedValue(healthyResult);
      await initializeApplication();

      expect(isStartupInitialized()).toBe(true);
      expect(getLastHealthCheckResult()).not.toBeNull();

      // Reset state
      resetStartupState();

      expect(isStartupInitialized()).toBe(false);
      expect(getLastHealthCheckResult()).toBeNull();
    });
  });
});
