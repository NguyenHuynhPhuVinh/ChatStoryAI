/**
 * Unit tests for startup initialization functionality
 */

import {
  initializeApplication,
  getLastHealthCheckResult,
  isStartupInitialized,
  resetStartupState,
  getStartupConfigFromEnv,
  getStartupLogger,
  setStartupLogLevel,
  validateStartupConfig,
  logConfigurationSummary,
  generateEnvVarDocumentation,
  printEnvVarDocumentation,
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
    delete process.env.DB_INIT_MODE;
    delete (process.env as any).NODE_ENV;
    delete process.env.DB_LOG_LEVEL;
    delete process.env.DB_INIT_FALLBACK_BEHAVIOR;
    delete process.env.DB_INIT_RETRY_ATTEMPTS;
    delete process.env.DB_INIT_RETRY_DELAY;
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
      expect(config.initMode).toBe("development"); // Default mode
      expect(config.enableDatabaseHealthCheck).toBe(true);
      expect(config.healthCheckTimeout).toBe(15000); // Development mode default
      expect(config.initTimeout).toBe(120000); // Development mode default
      expect(config.healthCheckRetryDelay).toBe(3000); // Development mode default
      expect(config.migrationTimeout).toBe(600000); // Development mode default
      expect(config.retryAttempts).toBe(5); // Development mode default
      expect(config.retryDelay).toBe(10000); // Development mode default
      expect(config.skipOnProduction).toBe(false);
      expect(config.logLevel).toBe("detailed"); // Development mode default
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

        expect(config.initTimeout).toBe(120000); // development mode default
        expect(config.healthCheckRetryDelay).toBe(3000); // development mode default
        expect(config.migrationTimeout).toBe(600000); // development mode default

        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_TIMEOUT value: "invalid". Using default: 120000ms. Must be a positive number.'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_HEALTH_CHECK_RETRY_DELAY value: "-100". Using default: 3000ms. Must be a positive number.'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_MIGRATION_TIMEOUT value: "not_a_number". Using default: 600000ms. Must be a positive number.'
        );

        consoleSpy.mockRestore();
      });

      it("should handle zero timeout values as invalid", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        process.env.DB_INIT_TIMEOUT = "0";

        const config = getStartupConfigFromEnv();

        expect(config.initTimeout).toBe(120000); // development mode default
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_TIMEOUT value: "0". Using default: 120000ms. Must be a positive number.'
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

    describe("Mode-specific configuration", () => {
      it("should use development mode defaults when NODE_ENV is not set", () => {
        delete (process.env as any).NODE_ENV;
        delete process.env.DB_INIT_MODE;

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("development");
        expect(config.logLevel).toBe("detailed");
        expect(config.initTimeout).toBe(120000); // 2 minutes
        expect(config.healthCheckTimeout).toBe(15000); // 15 seconds
        expect(config.gracefulFailureConfig?.enableFallback).toBe(true);
        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("continue");
      });

      it("should use production mode defaults when NODE_ENV=production", () => {
        (process.env as any).NODE_ENV = "production";
        delete process.env.DB_INIT_MODE;

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("production");
        expect(config.logLevel).toBe("minimal");
        expect(config.initTimeout).toBe(30000); // 30 seconds
        expect(config.healthCheckTimeout).toBe(5000); // 5 seconds
        expect(config.gracefulFailureConfig?.enableFallback).toBe(false);
        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("exit");
      });

      it("should use test mode defaults when NODE_ENV=test", () => {
        (process.env as any).NODE_ENV = "test";
        delete process.env.DB_INIT_MODE;

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("test");
        expect(config.logLevel).toBe("minimal");
        expect(config.initTimeout).toBe(10000); // 10 seconds
        expect(config.healthCheckTimeout).toBe(2000); // 2 seconds
        expect(config.gracefulFailureConfig?.enableFallback).toBe(false);
        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("exit");
      });

      it("should prioritize DB_INIT_MODE over NODE_ENV", () => {
        (process.env as any).NODE_ENV = "production";
        process.env.DB_INIT_MODE = "development";

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("development");
        expect(config.logLevel).toBe("detailed"); // Development mode
      });

      it("should handle invalid DB_INIT_MODE values", () => {
        process.env.DB_INIT_MODE = "invalid";
        (process.env as any).NODE_ENV = "production";

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("production"); // Falls back to NODE_ENV
      });

      it("should allow environment variables to override mode defaults", () => {
        (process.env as any).NODE_ENV = "production";
        process.env.DB_HEALTH_CHECK_LOG_LEVEL = "detailed"; // Override production default
        process.env.DB_INIT_TIMEOUT = "90000"; // Override production default

        const config = getStartupConfigFromEnv();

        expect(config.initMode).toBe("production");
        expect(config.logLevel).toBe("detailed"); // Overridden
        expect(config.initTimeout).toBe(90000); // Overridden
        expect(config.healthCheckTimeout).toBe(5000); // Still production default
      });
    });

    describe("Logging level configuration", () => {
      it("should parse DB_LOG_LEVEL correctly", () => {
        process.env.DB_LOG_LEVEL = "verbose";

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("verbose");
      });

      it("should handle all valid log levels", () => {
        const validLevels = [
          "silent",
          "minimal",
          "detailed",
          "verbose",
          "debug",
        ];

        validLevels.forEach((level) => {
          process.env.DB_LOG_LEVEL = level;
          const config = getStartupConfigFromEnv();
          expect(config.logLevel).toBe(level);
        });
      });

      it("should fall back to legacy DB_HEALTH_CHECK_LOG_LEVEL", () => {
        delete process.env.DB_LOG_LEVEL;
        process.env.DB_HEALTH_CHECK_LOG_LEVEL = "minimal";

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("minimal");
      });

      it("should prioritize DB_LOG_LEVEL over legacy setting", () => {
        process.env.DB_LOG_LEVEL = "debug";
        process.env.DB_HEALTH_CHECK_LOG_LEVEL = "minimal";

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("debug");
      });

      it("should handle invalid log levels gracefully", () => {
        process.env.DB_LOG_LEVEL = "invalid";
        delete process.env.DB_HEALTH_CHECK_LOG_LEVEL;

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("detailed"); // Development mode default
      });

      it("should handle case-insensitive log levels", () => {
        process.env.DB_LOG_LEVEL = "VERBOSE";

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("verbose");
      });

      it("should use mode-specific log level defaults", () => {
        (process.env as any).NODE_ENV = "production";
        delete process.env.DB_LOG_LEVEL;
        delete process.env.DB_HEALTH_CHECK_LOG_LEVEL;

        const config = getStartupConfigFromEnv();

        expect(config.logLevel).toBe("minimal"); // Production mode default
      });
    });

    describe("StartupLogger", () => {
      let consoleSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation();
      });

      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it("should respect log level filtering", () => {
        const logger = getStartupLogger();

        // Set to minimal level
        setStartupLogLevel("minimal");

        logger.minimal("minimal message");
        logger.detailed("detailed message");
        logger.verbose("verbose message");

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith("[STARTUP] minimal message");
      });

      it("should log all levels when set to debug", () => {
        const logger = getStartupLogger();

        setStartupLogLevel("debug");

        logger.minimal("minimal message");
        logger.detailed("detailed message");
        logger.verbose("verbose message");
        logger.debug("debug message");

        expect(consoleSpy).toHaveBeenCalledTimes(4);
      });

      it("should not log anything when set to silent", () => {
        const logger = getStartupLogger();

        setStartupLogLevel("silent");

        logger.minimal("minimal message");
        logger.detailed("detailed message");
        logger.verbose("verbose message");
        logger.debug("debug message");

        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });

    describe("Fallback behavior and retry configuration", () => {
      it("should parse DB_INIT_FALLBACK_BEHAVIOR correctly", () => {
        process.env.DB_INIT_FALLBACK_BEHAVIOR = "retry";

        const config = getStartupConfigFromEnv();

        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("retry");
      });

      it("should handle all valid fallback behaviors", () => {
        const validBehaviors = ["continue", "exit", "retry"];

        validBehaviors.forEach((behavior) => {
          process.env.DB_INIT_FALLBACK_BEHAVIOR = behavior;
          const config = getStartupConfigFromEnv();
          expect(config.gracefulFailureConfig?.fallbackBehavior).toBe(behavior);
        });
      });

      it("should prioritize DB_INIT_FALLBACK_BEHAVIOR over legacy setting", () => {
        process.env.DB_INIT_FALLBACK_BEHAVIOR = "retry";
        process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR = "exit";

        const config = getStartupConfigFromEnv();

        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("retry");
      });

      it("should fall back to legacy DB_HEALTH_CHECK_FALLBACK_BEHAVIOR", () => {
        delete process.env.DB_INIT_FALLBACK_BEHAVIOR;
        process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR = "exit";

        const config = getStartupConfigFromEnv();

        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("exit");
      });

      it("should handle invalid fallback behaviors gracefully", () => {
        process.env.DB_INIT_FALLBACK_BEHAVIOR = "invalid";
        delete process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR;

        const config = getStartupConfigFromEnv();

        expect(config.gracefulFailureConfig?.fallbackBehavior).toBe("continue"); // Development mode default
      });

      it("should parse retry configuration correctly", () => {
        process.env.DB_INIT_RETRY_ATTEMPTS = "2";
        process.env.DB_INIT_RETRY_DELAY = "3000";

        const config = getStartupConfigFromEnv();

        expect(config.retryAttempts).toBe(2);
        expect(config.retryDelay).toBe(3000);
      });

      it("should use mode-specific retry defaults", () => {
        (process.env as any).NODE_ENV = "production";
        delete process.env.DB_INIT_RETRY_ATTEMPTS;
        delete process.env.DB_INIT_RETRY_DELAY;

        const config = getStartupConfigFromEnv();

        expect(config.retryAttempts).toBe(1); // Production mode default
        expect(config.retryDelay).toBe(2000); // Production mode default
      });

      it("should handle invalid retry values gracefully", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        process.env.DB_INIT_RETRY_ATTEMPTS = "invalid";
        process.env.DB_INIT_RETRY_DELAY = "-100";

        const config = getStartupConfigFromEnv();

        expect(config.retryAttempts).toBe(5); // Development mode default
        expect(config.retryDelay).toBe(10000); // Development mode default

        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_RETRY_ATTEMPTS value: "invalid". Using default: 5ms. Must be a positive number.'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[STARTUP] Invalid DB_INIT_RETRY_DELAY value: "-100". Using default: 10000ms. Must be a positive number.'
        );

        consoleSpy.mockRestore();
      });
    });

    describe("Configuration validation", () => {
      it("should validate valid configuration", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "development",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: 10000,
          initTimeout: 60000,
          healthCheckRetryDelay: 2000,
          migrationTimeout: 300000,
          retryAttempts: 3,
          retryDelay: 5000,
          gracefulFailureConfig: {
            enableFallback: true,
            fallbackBehavior: "continue",
            troubleshootingHints: true,
          },
          skipOnProduction: false,
          logLevel: "detailed",
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.summary.mode).toBe("development");
        expect(result.summary.autoInitEnabled).toBe(true);
      });

      it("should detect invalid timeout values", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "development",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: -1000,
          initTimeout: 0,
          healthCheckRetryDelay: -500,
          migrationTimeout: -1,
          retryAttempts: 3,
          retryDelay: 5000,
          gracefulFailureConfig: {},
          skipOnProduction: false,
          logLevel: "detailed",
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Invalid initTimeout: 0. Must be positive."
        );
        expect(result.errors).toContain(
          "Invalid healthCheckTimeout: -1000. Must be positive."
        );
        expect(result.errors).toContain(
          "Invalid healthCheckRetryDelay: -500. Must be positive."
        );
        expect(result.errors).toContain(
          "Invalid migrationTimeout: -1. Must be positive."
        );
      });

      it("should detect invalid retry configuration", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "development",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: 10000,
          initTimeout: 60000,
          healthCheckRetryDelay: 2000,
          migrationTimeout: 300000,
          retryAttempts: -1,
          retryDelay: -1000,
          gracefulFailureConfig: {},
          skipOnProduction: false,
          logLevel: "detailed",
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Invalid retryAttempts: -1. Must be non-negative."
        );
        expect(result.errors).toContain(
          "Invalid retryDelay: -1000. Must be positive."
        );
      });

      it("should generate warnings for timeout relationships", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "development",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: 60000,
          initTimeout: 30000, // Smaller than health check timeout
          healthCheckRetryDelay: 2000,
          migrationTimeout: 300000,
          retryAttempts: 3,
          retryDelay: 5000,
          gracefulFailureConfig: {},
          skipOnProduction: false,
          logLevel: "detailed",
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "healthCheckTimeout (60000ms) should be less than initTimeout (30000ms)"
        );
      });

      it("should generate warnings for retry configuration mismatch", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "development",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: 10000,
          initTimeout: 60000,
          healthCheckRetryDelay: 2000,
          migrationTimeout: 300000,
          retryAttempts: 0,
          retryDelay: 5000,
          gracefulFailureConfig: {
            fallbackBehavior: "retry",
          },
          skipOnProduction: false,
          logLevel: "detailed",
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Fallback behavior is set to 'retry' but retryAttempts is 0. No retries will be performed."
        );
      });

      it("should generate production mode warnings", () => {
        const config: StartupConfig = {
          autoInitEnabled: true,
          initMode: "production",
          enableDatabaseHealthCheck: true,
          enableDatabaseCreation: true,
          enableMigrationExecution: true,
          healthCheckTimeout: 10000,
          initTimeout: 60000,
          healthCheckRetryDelay: 2000,
          migrationTimeout: 300000,
          retryAttempts: 10, // High retry attempts
          retryDelay: 5000,
          gracefulFailureConfig: {},
          skipOnProduction: false,
          logLevel: "debug", // Verbose logging in production
          databaseCreationOptions: {},
          migrationOptions: {},
        };

        const result = validateStartupConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Log level 'debug' may produce excessive output in production. Consider 'minimal' or 'detailed'."
        );
        expect(result.warnings).toContain(
          "High retry attempts (10) in production may cause delays. Consider reducing to 1-3."
        );
      });
    });

    describe("Environment variable documentation", () => {
      it("should generate comprehensive documentation", () => {
        const docs = generateEnvVarDocumentation();

        expect(docs).toBeInstanceOf(Array);
        expect(docs.length).toBeGreaterThan(10);

        // Check that key environment variables are documented
        const envVarNames = docs.map((doc) => doc.name);
        expect(envVarNames).toContain("DB_AUTO_INIT");
        expect(envVarNames).toContain("DB_INIT_MODE");
        expect(envVarNames).toContain("DB_LOG_LEVEL");
        expect(envVarNames).toContain("DB_INIT_TIMEOUT");
        expect(envVarNames).toContain("DB_INIT_FALLBACK_BEHAVIOR");

        // Check documentation structure
        docs.forEach((doc) => {
          expect(doc).toHaveProperty("name");
          expect(doc).toHaveProperty("description");
          expect(doc).toHaveProperty("type");
          expect(doc).toHaveProperty("defaultValue");
          expect(typeof doc.name).toBe("string");
          expect(typeof doc.description).toBe("string");
          expect(typeof doc.type).toBe("string");
          expect(typeof doc.defaultValue).toBe("string");
        });
      });

      it("should print documentation without errors", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        expect(() => printEnvVarDocumentation()).not.toThrow();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
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
