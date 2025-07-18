/**
 * Tests for Database Error Handler
 *
 * Comprehensive test suite for error categorization, troubleshooting hints,
 * recovery suggestions, and error context capture functionality.
 */

import {
  DatabaseErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  RecoveryAction,
} from "../db-error-handler";
import { DatabaseLogger } from "../db-logging";

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

  // Clear environment variables
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_NAME;
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe("DatabaseErrorHandler", () => {
  describe("Error Categorization", () => {
    test("should categorize connection errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ECONNREFUSED: Connection refused");

      const categorized = handler.categorizeError(error, "database-connection");

      expect(categorized.category).toBe(ErrorCategory.CONNECTION);
      expect(categorized.severity).toBe(ErrorSeverity.HIGH);
      expect(categorized.code).toBe("DB_CONNECTION_FAILED");
      expect(categorized.isRetryable).toBe(true);
      expect(categorized.maxRetries).toBe(3);
      expect(categorized.retryDelay).toBe(5000);
    });

    test("should categorize permission errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_ACCESS_DENIED_ERROR: Access denied for user");

      const categorized = handler.categorizeError(error, "user-authentication");

      expect(categorized.category).toBe(ErrorCategory.PERMISSION);
      expect(categorized.severity).toBe(ErrorSeverity.HIGH);
      expect(categorized.code).toBe("DB_ACCESS_DENIED");
      expect(categorized.isRetryable).toBe(false);
    });

    test("should categorize schema errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_BAD_DB_ERROR: Unknown database 'test_db'");

      const categorized = handler.categorizeError(error, "database-selection");

      expect(categorized.category).toBe(ErrorCategory.SCHEMA);
      expect(categorized.severity).toBe(ErrorSeverity.HIGH);
      expect(categorized.code).toBe("DB_SCHEMA_NOT_FOUND");
      expect(categorized.isRetryable).toBe(false);
    });

    test("should categorize script errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_PARSE_ERROR: Syntax error in SQL statement");

      const categorized = handler.categorizeError(error, "sql-execution");

      expect(categorized.category).toBe(ErrorCategory.SCRIPT);
      expect(categorized.severity).toBe(ErrorSeverity.MEDIUM);
      expect(categorized.code).toBe("DB_SYNTAX_ERROR");
      expect(categorized.isRetryable).toBe(false);
    });

    test("should categorize timeout errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error(
        "ER_LOCK_WAIT_TIMEOUT: Lock wait timeout exceeded"
      );

      const categorized = handler.categorizeError(error, "data-update");

      expect(categorized.category).toBe(ErrorCategory.TIMEOUT);
      expect(categorized.severity).toBe(ErrorSeverity.MEDIUM);
      expect(categorized.code).toBe("DB_LOCK_TIMEOUT");
      expect(categorized.isRetryable).toBe(true);
      expect(categorized.maxRetries).toBe(2);
      expect(categorized.retryDelay).toBe(1000);
    });

    test("should categorize resource errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_CON_COUNT_ERROR: Too many connections");

      const categorized = handler.categorizeError(error, "connection-pool");

      expect(categorized.category).toBe(ErrorCategory.RESOURCE);
      expect(categorized.severity).toBe(ErrorSeverity.HIGH);
      expect(categorized.code).toBe("DB_CONNECTION_LIMIT");
      expect(categorized.isRetryable).toBe(true);
      expect(categorized.maxRetries).toBe(5);
      expect(categorized.retryDelay).toBe(2000);
    });

    test("should categorize unknown errors correctly", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error(
        "Some completely unknown error that does not match any pattern"
      );

      const categorized = handler.categorizeError(error, "unknown-operation");

      expect(categorized.category).toBe(ErrorCategory.UNKNOWN);
      expect(categorized.severity).toBe(ErrorSeverity.MEDIUM);
      expect(categorized.code).toBe("DB_UNKNOWN_ERROR");
      expect(categorized.isRetryable).toBe(false);
    });
  });

  describe("Error Context Capture", () => {
    test("should capture comprehensive error context", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("Test error");

      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "3306";
      process.env.DB_NAME = "test_db";
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });

      const categorized = handler.categorizeError(error, "test-operation");

      expect(categorized.context.operation).toBe("test-operation");
      expect(categorized.context.timestamp).toBeInstanceOf(Date);
      expect(categorized.context.environment.nodeEnv).toBe("test");
      expect(categorized.context.environment.platform).toBe(process.platform);
      expect(categorized.context.environment.nodeVersion).toBe(process.version);
      expect(categorized.context.environment.memoryUsage).toBeDefined();
      expect(categorized.context.database.host).toBe("localhost");
      expect(categorized.context.database.port).toBe(3306);
      expect(categorized.context.database.database).toBe("test_db");
      expect(categorized.context.system?.uptime).toBeGreaterThan(0);
    });

    test("should include additional context when provided", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("Test error");

      const additionalContext = {
        database: {
          connectionPool: {
            active: 5,
            idle: 2,
            total: 10,
          },
        },
        request: {
          query: "SELECT * FROM users",
          parameters: ["param1", "param2"],
          timeout: 30000,
        },
      };

      const categorized = handler.categorizeError(
        error,
        "test-operation",
        additionalContext
      );

      expect(categorized.context.database.connectionPool).toEqual({
        active: 5,
        idle: 2,
        total: 10,
      });
      expect(categorized.context.request).toEqual({
        query: "SELECT * FROM users",
        parameters: ["param1", "param2"],
        timeout: 30000,
      });
    });
  });

  describe("Troubleshooting Hints", () => {
    test("should generate connection troubleshooting hints", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ECONNREFUSED: Connection refused");

      const categorized = handler.categorizeError(error, "database-connection");

      expect(categorized.troubleshootingHints).toHaveLength(2);

      const connectionHint = categorized.troubleshootingHints.find(
        (h) => h.title === "Check Database Server Status"
      );
      expect(connectionHint).toBeDefined();
      expect(connectionHint?.priority).toBe("high");
      expect(connectionHint?.commands).toContain("ping localhost");

      const networkHint = categorized.troubleshootingHints.find(
        (h) => h.title === "Verify Network Configuration"
      );
      expect(networkHint).toBeDefined();
      expect(networkHint?.priority).toBe("medium");
    });

    test("should generate permission troubleshooting hints", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_ACCESS_DENIED_ERROR: Access denied");

      const categorized = handler.categorizeError(error, "user-authentication");

      expect(categorized.troubleshootingHints).toHaveLength(2);

      const credentialsHint = categorized.troubleshootingHints.find(
        (h) => h.title === "Check Database Credentials"
      );
      expect(credentialsHint).toBeDefined();
      expect(credentialsHint?.priority).toBe("high");

      const permissionsHint = categorized.troubleshootingHints.find(
        (h) => h.title === "Verify User Permissions"
      );
      expect(permissionsHint).toBeDefined();
      expect(permissionsHint?.commands).toContain(
        "SHOW GRANTS FOR 'username'@'host'"
      );
    });

    test("should generate schema troubleshooting hints", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_NO_SUCH_TABLE: Table 'users' doesn't exist");

      const categorized = handler.categorizeError(error, "table-query");

      expect(categorized.troubleshootingHints).toHaveLength(1);

      const schemaHint = categorized.troubleshootingHints[0];
      expect(schemaHint.title).toBe("Check Database Schema");
      expect(schemaHint.priority).toBe("high");
      expect(schemaHint.commands).toContain("SHOW DATABASES");
      expect(schemaHint.commands).toContain("SHOW TABLES");
    });

    test("should generate resource troubleshooting hints", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_CON_COUNT_ERROR: Too many connections");

      const categorized = handler.categorizeError(error, "connection-pool");

      expect(categorized.troubleshootingHints).toHaveLength(1);

      const resourceHint = categorized.troubleshootingHints[0];
      expect(resourceHint.title).toBe("Monitor Resource Usage");
      expect(resourceHint.priority).toBe("high");
      expect(resourceHint.commands).toContain("SHOW PROCESSLIST");
      expect(resourceHint.commands).toContain("SHOW STATUS LIKE 'Threads%'");
    });
  });

  describe("Recovery Suggestions", () => {
    test("should generate retry suggestions for retryable errors", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ECONNREFUSED: Connection refused");

      const categorized = handler.categorizeError(error, "database-connection");

      const retrySuggestion = categorized.recoverySuggestions.find(
        (s) => s.action === RecoveryAction.RETRY
      );

      expect(retrySuggestion).toBeDefined();
      expect(retrySuggestion?.description).toContain("Retry the operation");
      expect(retrySuggestion?.riskLevel).toBe("low");
      expect(retrySuggestion?.steps).toContain(
        "Wait for the specified delay period"
      );
      expect(retrySuggestion?.steps).toContain("Maximum 3 retry attempts");
    });

    test("should generate configuration change suggestions for connection errors", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ECONNREFUSED: Connection refused");

      const categorized = handler.categorizeError(error, "database-connection");

      const configSuggestion = categorized.recoverySuggestions.find(
        (s) => s.action === RecoveryAction.CONFIGURATION_CHANGE
      );

      expect(configSuggestion).toBeDefined();
      expect(configSuggestion?.description).toContain(
        "Update connection configuration"
      );
      expect(configSuggestion?.riskLevel).toBe("low");
      expect(configSuggestion?.steps).toContain(
        "Verify database server address and port"
      );
    });

    test("should generate resource allocation suggestions for resource errors", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_CON_COUNT_ERROR: Too many connections");

      const categorized = handler.categorizeError(error, "connection-pool");

      const resourceSuggestion = categorized.recoverySuggestions.find(
        (s) => s.action === RecoveryAction.RESOURCE_ALLOCATION
      );

      expect(resourceSuggestion).toBeDefined();
      expect(resourceSuggestion?.description).toContain(
        "Increase resource allocation"
      );
      expect(resourceSuggestion?.riskLevel).toBe("medium");
      expect(resourceSuggestion?.prerequisites).toContain(
        "Database administrator access"
      );
    });

    test("should generate manual intervention suggestions for permission errors", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ER_ACCESS_DENIED_ERROR: Access denied");

      const categorized = handler.categorizeError(error, "user-authentication");

      const manualSuggestion = categorized.recoverySuggestions.find(
        (s) => s.action === RecoveryAction.MANUAL_INTERVENTION
      );

      expect(manualSuggestion).toBeDefined();
      expect(manualSuggestion?.description).toContain("Fix permission issues");
      expect(manualSuggestion?.steps).toContain(
        "Contact database administrator"
      );
      expect(manualSuggestion?.prerequisites).toContain(
        "Database administrator access"
      );
    });
  });

  describe("Utility Methods", () => {
    test("should correctly identify retryable errors", () => {
      const handler = new DatabaseErrorHandler();

      const retryableError = new Error("ECONNREFUSED: Connection refused");
      const nonRetryableError = new Error(
        "ER_ACCESS_DENIED_ERROR: Access denied"
      );

      expect(handler.isRetryable(retryableError)).toBe(true);
      expect(handler.isRetryable(nonRetryableError)).toBe(false);
    });

    test("should return correct retry configuration", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error(
        "ER_LOCK_WAIT_TIMEOUT: Lock wait timeout exceeded"
      );

      const retryConfig = handler.getRetryConfig(error);

      expect(retryConfig.maxRetries).toBe(2);
      expect(retryConfig.retryDelay).toBe(1000);
    });

    test("should format error for user display", () => {
      const handler = new DatabaseErrorHandler();
      const error = new Error("ECONNREFUSED: Connection refused");

      const categorized = handler.categorizeError(error, "database-connection");
      const formatted = handler.formatErrorForUser(categorized);

      expect(formatted).toContain("Database connection error");
      expect(formatted).toContain("high severity");
      expect(formatted).toContain("Troubleshooting suggestions:");
      expect(formatted).toContain("Check Database Server Status");
    });
  });

  describe("Logging Integration", () => {
    test("should log categorized errors with structured information", () => {
      const logger = new DatabaseLogger({ format: "json", level: "debug" });
      const handler = new DatabaseErrorHandler(logger);
      const error = new Error("ECONNREFUSED: Connection refused");

      handler.categorizeError(error, "database-connection");

      expect(consoleOutput.length).toBeGreaterThan(0);

      // Check that error was logged
      const errorLog = consoleOutput.find(
        (output) =>
          output.includes('"level":"error"') &&
          output.includes("DB_CONNECTION_FAILED")
      );
      expect(errorLog).toBeDefined();

      // Check that recovery suggestions were logged
      const infoLog = consoleOutput.find(
        (output) =>
          output.includes('"level":"info"') &&
          output.includes("Recovery suggestions available")
      );
      expect(infoLog).toBeDefined();
    });
  });
});
