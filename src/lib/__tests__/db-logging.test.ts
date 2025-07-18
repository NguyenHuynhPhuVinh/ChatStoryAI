/**
 * Tests for Database Logging System
 *
 * Comprehensive test suite for structured logging functionality,
 * including log levels, context information, and integration patterns.
 */

import {
  DatabaseLogger,
  LogLevel,
  LogContext,
  LogEntry,
  createDatabaseLogger,
  getDatabaseLogger,
  setDatabaseLogger,
  resetDatabaseLogger,
  getLoggerConfigFromEnv,
  createConsoleLogWrapper,
  logOperationStart,
  logOperationSuccess,
  logOperationFailure,
  withTiming,
  LOG_LEVELS,
} from "../db-logging";

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

let consoleOutput: string[] = [];

beforeEach(() => {
  consoleOutput = [];

  // Mock console methods to capture output
  console.log = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  console.warn = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  console.error = jest.fn((message: string) => {
    consoleOutput.push(message);
  });

  // Reset global logger
  resetDatabaseLogger();

  // Clear environment variables
  delete process.env.DB_LOG_LEVEL;
  delete process.env.DB_LOG_FORMAT;
  delete process.env.DB_LOG_DISABLE_TIMESTAMPS;
  delete process.env.DB_LOG_DISABLE_CONTEXT;
  delete process.env.DB_LOG_DISABLE_METADATA;
  delete process.env.DB_LOG_DISABLE_COLORS;
  delete process.env.DB_LOG_DISABLE_SENSITIVE_FILTER;
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe("DatabaseLogger", () => {
  describe("Basic Logging Functionality", () => {
    test("should create logger with default configuration", () => {
      const logger = new DatabaseLogger();
      const config = logger.getConfig();

      expect(config.level).toBe("info");
      expect(config.format).toBe("console");
      expect(config.enableTimestamps).toBe(true);
      expect(config.enableContext).toBe(true);
      expect(config.enableMetadata).toBe(true);
    });

    test("should create logger with custom configuration", () => {
      const customConfig = {
        level: "debug" as LogLevel,
        format: "json" as const,
        enableColors: false,
      };

      const logger = new DatabaseLogger(customConfig);
      const config = logger.getConfig();

      expect(config.level).toBe("debug");
      expect(config.format).toBe("json");
      expect(config.enableColors).toBe(false);
    });

    test("should generate unique session IDs", () => {
      const logger1 = new DatabaseLogger();
      const logger2 = new DatabaseLogger();

      expect(logger1.getSessionId()).not.toBe(logger2.getSessionId());
      expect(logger1.getSessionId()).toMatch(/^db-\d+-[a-z0-9]+$/);
    });
  });

  describe("Log Level Filtering", () => {
    test("should respect log level filtering", () => {
      const logger = new DatabaseLogger({ level: "warn" });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      expect(consoleOutput).toHaveLength(2); // Only warn and error should be logged
      expect(consoleOutput[0]).toContain("Warning message");
      expect(consoleOutput[1]).toContain("Error message");
    });

    test("should log all levels when set to debug", () => {
      const logger = new DatabaseLogger({ level: "debug" });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");
      logger.fatal("Fatal message");

      expect(consoleOutput).toHaveLength(5);
    });
  });

  describe("Context Information", () => {
    test("should include context information in logs", () => {
      const logger = new DatabaseLogger({ format: "json" });
      const context: LogContext = {
        operation: "test-operation",
        database: "test-db",
        duration: 100,
      };

      logger.info("Test message", context);

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.context.operation).toBe("test-operation");
      expect(logEntry.context.database).toBe("test-db");
      expect(logEntry.context.duration).toBe(100);
    });

    test("should filter sensitive data from context", () => {
      const logger = new DatabaseLogger({
        format: "json",
        filterSensitiveData: true,
      });
      const context: LogContext = {
        operation: "login",
        password: "secret123",
        apiKey: "key123",
        username: "testuser",
      };

      logger.info("Login attempt", context);

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.context.password).toBe("[FILTERED]");
      expect(logEntry.context.apiKey).toBe("[FILTERED]");
      expect(logEntry.context.username).toBe("testuser");
    });

    test("should not filter sensitive data when disabled", () => {
      const logger = new DatabaseLogger({
        format: "json",
        filterSensitiveData: false,
      });
      const context: LogContext = {
        password: "secret123",
        username: "testuser",
      };

      logger.info("Login attempt", context);

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.context.password).toBe("secret123");
      expect(logEntry.context.username).toBe("testuser");
    });
  });

  describe("Error Handling", () => {
    test("should include error information in logs", () => {
      const logger = new DatabaseLogger({ format: "json" });
      const error = new Error("Test error");
      error.stack = "Error stack trace";

      logger.error("Operation failed", undefined, error);

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error.name).toBe("Error");
      expect(logEntry.error.message).toBe("Test error");
      expect(logEntry.error.stack).toBe("Error stack trace");
    });

    test("should handle errors with custom properties", () => {
      const logger = new DatabaseLogger({ format: "json" });
      const error = new Error("Database error") as any;
      error.code = "ER_ACCESS_DENIED";

      logger.error("Database connection failed", undefined, error);

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.error.code).toBe("ER_ACCESS_DENIED");
    });
  });

  describe("Output Formats", () => {
    test("should output JSON format correctly", () => {
      const logger = new DatabaseLogger({
        format: "json",
        enableMetadata: false,
      });

      logger.info("Test message");

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.level).toBe("info");
      expect(logEntry.message).toBe("Test message");
      expect(logEntry.timestamp).toBeDefined();
    });

    test("should output structured format correctly", () => {
      const logger = new DatabaseLogger({
        format: "structured",
        enableMetadata: false,
      });

      logger.info("Test message");

      expect(consoleOutput).toHaveLength(1);
      // Structured format should be pretty-printed JSON
      expect(consoleOutput[0]).toContain('"level": "info"');
      expect(consoleOutput[0]).toContain('"message": "Test message"');
    });

    test("should output console format correctly", () => {
      const logger = new DatabaseLogger({
        format: "console",
        enableColors: false,
        enableTimestamps: false,
        enableMetadata: false,
      });

      logger.info("Test message");

      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toContain("INFO  Test message");
    });
  });

  describe("Child Loggers", () => {
    test("should create child logger with additional context", () => {
      const parentLogger = new DatabaseLogger({ format: "json" });
      const childContext: LogContext = {
        component: "database",
        operation: "migration",
      };

      const childLogger = parentLogger.child(childContext);
      childLogger.info("Child log message", { step: "validation" });

      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.context.component).toBe("database");
      expect(logEntry.context.operation).toBe("migration");
      expect(logEntry.context.step).toBe("validation");
    });

    test("should inherit session ID from parent", () => {
      const parentLogger = new DatabaseLogger();
      const childLogger = parentLogger.child({ component: "test" });

      expect(childLogger.getSessionId()).toBe(parentLogger.getSessionId());
    });
  });
});

describe("Factory Functions", () => {
  test("should create logger with environment configuration", () => {
    process.env.DB_LOG_LEVEL = "debug";
    process.env.DB_LOG_FORMAT = "json";

    const logger = createDatabaseLogger();
    const config = logger.getConfig();

    expect(config.level).toBe("debug");
    expect(config.format).toBe("json");
  });

  test("should get and set global logger", () => {
    const customLogger = new DatabaseLogger({ level: "debug" });
    setDatabaseLogger(customLogger);

    const retrievedLogger = getDatabaseLogger();
    expect(retrievedLogger.getConfig().level).toBe("debug");
  });

  test("should create global logger if none exists", () => {
    resetDatabaseLogger();
    const logger = getDatabaseLogger();

    expect(logger).toBeInstanceOf(DatabaseLogger);
    expect(logger.getConfig()).toBeDefined();
  });
});

describe("Environment Configuration", () => {
  test("should parse environment variables correctly", () => {
    process.env.DB_LOG_LEVEL = "error";
    process.env.DB_LOG_FORMAT = "structured";
    process.env.DB_LOG_DISABLE_TIMESTAMPS = "true";
    process.env.DB_LOG_DISABLE_COLORS = "true";

    const config = getLoggerConfigFromEnv();

    expect(config.level).toBe("error");
    expect(config.format).toBe("structured");
    expect(config.enableTimestamps).toBe(false);
    expect(config.enableColors).toBe(false);
  });

  test("should use environment-specific defaults", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    // Test production defaults
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
      configurable: true,
    });
    let config = getLoggerConfigFromEnv();
    expect(config.level).toBe("info");
    expect(config.format).toBe("json");
    expect(config.enableColors).toBe(false);

    // Test test defaults
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      writable: true,
      configurable: true,
    });
    config = getLoggerConfigFromEnv();
    expect(config.level).toBe("warn");
    expect(config.enableTimestamps).toBe(false);

    // Test development defaults
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
    });
    config = getLoggerConfigFromEnv();
    expect(config.level).toBe("debug");
    expect(config.enableColors).toBe(true);

    // Restore original NODE_ENV
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    });
  });
});

describe("Console Log Wrapper", () => {
  test("should create console.log compatible wrapper", () => {
    const logger = new DatabaseLogger({ format: "json", level: "debug" });
    const wrapper = createConsoleLogWrapper(logger);

    wrapper.log("Test log message");
    wrapper.info("Test info message");
    wrapper.warn("Test warn message");
    wrapper.error("Test error message");
    wrapper.debug("Test debug message");

    expect(consoleOutput).toHaveLength(5);

    // Check that messages are properly formatted as JSON
    consoleOutput.forEach((output) => {
      const logEntry = JSON.parse(output);
      expect(logEntry.message).toContain("Test");
      expect(logEntry.level).toBeDefined();
    });
  });

  test("should handle additional arguments in wrapper", () => {
    const logger = new DatabaseLogger({
      format: "json",
      filterSensitiveData: false,
    });
    const wrapper = createConsoleLogWrapper(logger);

    wrapper.info("Test message", { name: "value" }, "extra data");

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.context.additionalData).toEqual([
      { name: "value" },
      "extra data",
    ]);
  });

  test("should handle errors in wrapper", () => {
    const logger = new DatabaseLogger({ format: "json" });
    const wrapper = createConsoleLogWrapper(logger);
    const error = new Error("Test error");

    wrapper.error("Error occurred", error, "additional info");

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.error.message).toBe("Test error");
    // Error objects don't serialize well in JSON, so we check the structure
    expect(logEntry.context.additionalData).toHaveLength(2);
    expect(logEntry.context.additionalData[1]).toBe("additional info");
  });
});

describe("Utility Functions", () => {
  test("should log operation start correctly", () => {
    const logger = new DatabaseLogger({ format: "json" });
    const context: LogContext = { database: "test-db" };

    logOperationStart("database-migration", context, logger);

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.message).toBe("Starting database-migration");
    expect(logEntry.context.operation).toBe("database-migration");
    expect(logEntry.context.phase).toBe("start");
    expect(logEntry.context.database).toBe("test-db");
  });

  test("should log operation success correctly", () => {
    const logger = new DatabaseLogger({ format: "json" });
    const context: LogContext = { database: "test-db" };

    logOperationSuccess("database-migration", 1500, context, logger);

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.message).toBe("Completed database-migration successfully");
    expect(logEntry.context.operation).toBe("database-migration");
    expect(logEntry.context.phase).toBe("success");
    expect(logEntry.context.duration).toBe(1500);
  });

  test("should log operation failure correctly", () => {
    const logger = new DatabaseLogger({ format: "json" });
    const context: LogContext = { database: "test-db" };
    const error = new Error("Migration failed");

    logOperationFailure("database-migration", error, context, logger);

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.message).toBe("Failed database-migration");
    expect(logEntry.context.operation).toBe("database-migration");
    expect(logEntry.context.phase).toBe("failure");
    expect(logEntry.error.message).toBe("Migration failed");
  });

  test("should use global logger when none provided", () => {
    const globalLogger = new DatabaseLogger({ format: "json" });
    setDatabaseLogger(globalLogger);

    logOperationStart("test-operation");

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);
    expect(logEntry.message).toBe("Starting test-operation");
  });
});

describe("Timing Wrapper", () => {
  test("should wrap async operations with timing", async () => {
    const logger = new DatabaseLogger({ format: "json" });
    const context: LogContext = { database: "test-db" };

    const mockOperation = jest.fn().mockResolvedValue("success");

    const result = await withTiming(
      "test-operation",
      mockOperation,
      context,
      logger
    );

    expect(result).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(consoleOutput).toHaveLength(2); // Start and success logs

    const startLog = JSON.parse(consoleOutput[0]);
    const successLog = JSON.parse(consoleOutput[1]);

    expect(startLog.message).toBe("Starting test-operation");
    expect(startLog.context.phase).toBe("start");

    expect(successLog.message).toBe("Completed test-operation successfully");
    expect(successLog.context.phase).toBe("success");
    expect(successLog.context.duration).toBeGreaterThanOrEqual(0);
  });

  test("should handle operation failures with timing", async () => {
    const logger = new DatabaseLogger({ format: "json" });
    const context: LogContext = { database: "test-db" };
    const error = new Error("Operation failed");

    const mockOperation = jest.fn().mockRejectedValue(error);

    await expect(
      withTiming("test-operation", mockOperation, context, logger)
    ).rejects.toThrow("Operation failed");

    expect(consoleOutput).toHaveLength(2); // Start and failure logs

    const startLog = JSON.parse(consoleOutput[0]);
    const failureLog = JSON.parse(consoleOutput[1]);

    expect(startLog.context.phase).toBe("start");
    expect(failureLog.context.phase).toBe("failure");
    expect(failureLog.error.message).toBe("Operation failed");
    expect(failureLog.context.duration).toBeGreaterThanOrEqual(0);
  });

  test("should use global logger when none provided", async () => {
    const globalLogger = new DatabaseLogger({ format: "json" });
    setDatabaseLogger(globalLogger);

    const mockOperation = jest.fn().mockResolvedValue("success");

    await withTiming("test-operation", mockOperation);

    expect(consoleOutput).toHaveLength(2);
    expect(JSON.parse(consoleOutput[0]).message).toBe(
      "Starting test-operation"
    );
    expect(JSON.parse(consoleOutput[1]).message).toBe(
      "Completed test-operation successfully"
    );
  });
});

describe("Integration Tests", () => {
  test("should work with existing console.log patterns", () => {
    const logger = new DatabaseLogger({
      format: "console",
      enableColors: false,
    });
    const wrapper = createConsoleLogWrapper(logger);

    // Simulate existing console.log usage
    wrapper.log("[STARTUP] Database initialization started");
    wrapper.info("[STARTUP] Health check passed");
    wrapper.warn("[STARTUP] Migration warning");
    wrapper.error("[STARTUP] Connection failed");

    expect(consoleOutput).toHaveLength(4);
    expect(consoleOutput[0]).toContain(
      "INFO  [STARTUP] Database initialization started"
    );
    expect(consoleOutput[1]).toContain("INFO  [STARTUP] Health check passed");
    expect(consoleOutput[2]).toContain("WARN  [STARTUP] Migration warning");
    expect(consoleOutput[3]).toContain("ERROR [STARTUP] Connection failed");
  });

  test("should maintain session consistency across operations", () => {
    const logger = new DatabaseLogger({ format: "json" });
    const sessionId = logger.getSessionId();

    logger.info("First operation");
    logger.warn("Second operation");
    logger.error("Third operation");

    expect(consoleOutput).toHaveLength(3);

    consoleOutput.forEach((output) => {
      const logEntry = JSON.parse(output);
      expect(logEntry.context.sessionId).toBe(sessionId);
    });
  });

  test("should handle complex nested context objects", () => {
    const logger = new DatabaseLogger({
      format: "json",
      filterSensitiveData: true,
      maxContextDepth: 10,
    });
    const complexContext: LogContext = {
      operation: "user-authentication",
      user: {
        id: 123,
        username: "testuser",
        credentials: {
          password: "secret123",
          apiKey: "key456",
        },
        profile: {
          email: "test@example.com",
          preferences: {
            theme: "dark",
            secretSetting: "hidden",
          },
        },
      },
      database: "test_db",
      connectionInfo: {
        host: "localhost",
        port: 3306,
        password: "dbpass",
      },
    };

    logger.info("Complex operation", complexContext);

    expect(consoleOutput).toHaveLength(1);
    const logEntry = JSON.parse(consoleOutput[0]);

    // Check that sensitive data is filtered
    expect(logEntry.context.user.credentials.password).toBe("[FILTERED]");
    expect(logEntry.context.user.credentials.apiKey).toBe("[FILTERED]");
    expect(logEntry.context.user.profile.preferences.secretSetting).toBe(
      "[FILTERED]"
    );
    expect(logEntry.context.connectionInfo.password).toBe("[FILTERED]");

    // Check that non-sensitive data is preserved
    expect(logEntry.context.user.username).toBe("testuser");
    expect(logEntry.context.user.profile.email).toBe("test@example.com");
    expect(logEntry.context.connectionInfo.host).toBe("localhost");
  });
});
