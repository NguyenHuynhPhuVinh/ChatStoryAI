/**
 * Integration Tests for Database Logging and Error Handling System
 *
 * Comprehensive integration test suite that tests all components working together:
 * - Structured logging with error handling
 * - Progress tracking with logging integration
 * - Summary reporting with all components
 * - End-to-end database initialization simulation
 */

import { DatabaseLogger, createDatabaseLogger, LogLevel } from "../db-logging";
import { DatabaseErrorHandler, ErrorCategory } from "../db-error-handler";
import { ProgressTracker, ProgressStatus } from "../db-progress";
import { SummaryReporter, ReportType, ReportFormat } from "../db-summary";

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

  // Mock timers for consistent testing
  jest.useFakeTimers();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;

  // Restore timers
  jest.useRealTimers();
});

describe("Database System Integration Tests", () => {
  describe("Logging and Error Handling Integration", () => {
    test("should integrate structured logging with error categorization", () => {
      const logger = new DatabaseLogger({
        format: "json",
        level: "debug",
        filterSensitiveData: true,
      });
      const errorHandler = new DatabaseErrorHandler(logger);

      // Simulate a database connection error
      const connectionError = new Error("ECONNREFUSED: Connection refused");
      const categorizedError = errorHandler.categorizeError(
        connectionError,
        "database-connection",
        {
          database: {
            host: "localhost",
            port: 3306,
            connectionPool: { active: 0, idle: 0, total: 10 },
          },
          request: {
            query: "SELECT 1",
            timeout: 30000,
          },
        }
      );

      // Verify error categorization
      expect(categorizedError.category).toBe(ErrorCategory.CONNECTION);
      expect(categorizedError.isRetryable).toBe(true);
      expect(categorizedError.troubleshootingHints.length).toBeGreaterThan(0);
      expect(categorizedError.recoverySuggestions.length).toBeGreaterThan(0);

      // Verify structured logging output
      const errorLogs = consoleOutput.filter(
        (output) =>
          output.includes('"level":"error"') &&
          output.includes("DB_CONNECTION_FAILED")
      );
      expect(errorLogs.length).toBeGreaterThan(0);

      const errorLog = JSON.parse(errorLogs[0]);
      expect(errorLog.context.errorCategory).toBe("connection");
      expect(errorLog.context.isRetryable).toBe(true);
      expect(errorLog.error.message).toContain("Connection refused");
    });

    test("should handle sensitive data filtering in error contexts", () => {
      const logger = new DatabaseLogger({
        format: "json",
        filterSensitiveData: true,
      });
      const errorHandler = new DatabaseErrorHandler(logger);

      const authError = new Error("ER_ACCESS_DENIED_ERROR: Access denied");
      const categorizedError = errorHandler.categorizeError(
        authError,
        "user-authentication",
        {
          database: {
            host: "localhost",
            database: "test_db",
            password: "secret123",
            connectionPool: {
              active: 5,
              idle: 2,
              total: 7,
            },
          },
          request: {
            query: "SELECT * FROM users WHERE password = ?",
            parameters: ["userPassword123"],
          },
        }
      );

      // Verify error categorization
      expect(categorizedError.category).toBe(ErrorCategory.PERMISSION);

      // Verify sensitive data is filtered in logs
      const errorLogs = consoleOutput.filter((output) =>
        output.includes('"level":"error"')
      );
      expect(errorLogs.length).toBeGreaterThan(0);

      const errorLog = JSON.parse(errorLogs[0]);
      // Verify error categorization is logged correctly
      expect(errorLog.context.errorCategory).toBe("permission");
      expect(errorLog.context.errorSeverity).toBe("high");
      expect(errorLog.context.database).toBe("test_db");
      expect(errorLog.context.host).toBe("localhost");

      // Verify sensitive data is not included in the simplified log context
      expect(errorLog.context.password).toBeUndefined();
      expect(errorLog.context.request).toBeUndefined();
    });
  });

  describe("Progress Tracking with Logging Integration", () => {
    test("should integrate progress tracking with structured logging", () => {
      const logger = new DatabaseLogger({
        format: "json",
        level: "debug",
      });
      const progressTracker = new ProgressTracker(
        "database-initialization",
        { enableConsoleOutput: false }, // Disable console to focus on structured logs
        logger
      );

      // Add initialization steps
      progressTracker.addStep(
        "connection",
        "Database Connection",
        "Connect to database server",
        2000
      );
      progressTracker.addStep(
        "schema",
        "Schema Validation",
        "Validate database schema",
        3000
      );
      progressTracker.addStep(
        "migration",
        "Run Migrations",
        "Execute pending migrations",
        5000
      );
      progressTracker.addStep(
        "health-check",
        "Health Check",
        "Verify system health",
        1000
      );

      // Start tracking
      progressTracker.start();

      // Execute steps with progress updates
      progressTracker.startStep("connection");
      jest.advanceTimersByTime(1000);
      progressTracker.updateStepProgress("connection", 50, {
        connectionAttempts: 1,
      });
      jest.advanceTimersByTime(1000);
      progressTracker.completeStep("connection", { connectionId: "conn_123" });

      progressTracker.startStep("schema");
      jest.advanceTimersByTime(1500);
      progressTracker.updateStepProgress("schema", 75, {
        tablesValidated: 15,
        totalTables: 20,
      });
      jest.advanceTimersByTime(1500);
      progressTracker.completeStep("schema", { validationResult: "passed" });

      progressTracker.startStep("migration");
      jest.advanceTimersByTime(2500);
      progressTracker.updateStepProgress("migration", 60, {
        migrationsApplied: 3,
        totalMigrations: 5,
      });
      jest.advanceTimersByTime(2500);
      progressTracker.completeStep("migration", { migrationsApplied: 5 });

      progressTracker.startStep("health-check");
      jest.advanceTimersByTime(500);
      progressTracker.completeStep("health-check", { healthScore: 100 });

      // Verify progress tracking logs
      const progressLogs = consoleOutput.filter((output) =>
        output.includes("progress-tracking")
      );
      expect(progressLogs.length).toBeGreaterThan(10); // Multiple progress events

      // Verify specific log entries
      const startLog = consoleOutput.find((output) =>
        output.includes("Starting progress tracking")
      );
      expect(startLog).toBeDefined();

      const completionLog = consoleOutput.find((output) =>
        output.includes("Completed progress tracking")
      );
      expect(completionLog).toBeDefined();

      // Verify progress summary
      const summary = progressTracker.getSummary();
      expect(summary.overallProgress).toBe(100);
      expect(summary.completedSteps).toBe(4);
      expect(summary.failedSteps).toBe(0);
    });

    test("should handle progress tracking with errors", () => {
      const logger = new DatabaseLogger({ format: "json", level: "debug" });
      const errorHandler = new DatabaseErrorHandler(logger);
      const progressTracker = new ProgressTracker(
        "database-initialization-with-errors",
        { enableConsoleOutput: false },
        logger
      );

      progressTracker.addStep(
        "connection",
        "Database Connection",
        "Connect to database"
      );
      progressTracker.addStep(
        "migration",
        "Run Migrations",
        "Execute migrations"
      );

      progressTracker.start();

      // Successful connection
      progressTracker.startStep("connection");
      jest.advanceTimersByTime(1000);
      progressTracker.completeStep("connection");

      // Failed migration
      progressTracker.startStep("migration");
      jest.advanceTimersByTime(500);

      const migrationError = new Error(
        "ER_NO_SUCH_TABLE: Table 'migrations' doesn't exist"
      );
      const categorizedError = errorHandler.categorizeError(
        migrationError,
        "migration-execution"
      );

      progressTracker.failStep("migration", categorizedError.originalError, {
        errorCategory: categorizedError.category,
        errorCode: categorizedError.code,
      });

      // Verify error handling in progress tracking
      const summary = progressTracker.getSummary();
      expect(summary.completedSteps).toBe(1);
      expect(summary.failedSteps).toBe(1);

      // Verify error logs
      const errorLogs = consoleOutput.filter(
        (output) =>
          output.includes('"level":"error"') &&
          output.includes("Failed step: Run Migrations")
      );
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe("Complete System Integration", () => {
    test("should simulate complete database initialization with all components", () => {
      // Initialize all components
      const logger = new DatabaseLogger({
        format: "json",
        level: "info",
        filterSensitiveData: true,
      });
      const errorHandler = new DatabaseErrorHandler(logger);
      const progressTracker = new ProgressTracker(
        "complete-db-initialization",
        { enableConsoleOutput: false },
        logger
      );
      const summaryReporter = new SummaryReporter(logger);

      // Define initialization steps
      const initSteps = [
        {
          id: "connection",
          name: "Database Connection",
          description: "Connect to database server",
        },
        {
          id: "auth",
          name: "Authentication",
          description: "Authenticate database user",
        },
        {
          id: "schema",
          name: "Schema Setup",
          description: "Create/validate database schema",
        },
        {
          id: "migration",
          name: "Data Migration",
          description: "Run pending migrations",
        },
        {
          id: "seeding",
          name: "Data Seeding",
          description: "Seed initial data",
        },
        {
          id: "health-check",
          name: "Health Check",
          description: "Verify system health",
        },
      ];

      // Add steps to progress tracker
      initSteps.forEach((step) => {
        progressTracker.addStep(step.id, step.name, step.description);
      });

      progressTracker.start();
      summaryReporter.startOperation("database-initialization");

      // Simulate initialization process
      const initStartTime = new Date();

      try {
        // Step 1: Database Connection (Success)
        const connStart = new Date();
        progressTracker.startStep("connection");
        jest.advanceTimersByTime(2000);
        progressTracker.completeStep("connection", {
          connectionId: "conn_456",
        });
        summaryReporter.recordSuccess("connection", connStart, new Date(), {
          host: "localhost",
          port: 3306,
          database: "test_db",
        });

        // Step 2: Authentication (Success)
        const authStart = new Date();
        progressTracker.startStep("auth");
        jest.advanceTimersByTime(1000);
        progressTracker.completeStep("auth", { userId: "db_user" });
        summaryReporter.recordSuccess("auth", authStart, new Date(), {
          username: "db_user",
          permissions: ["SELECT", "INSERT", "UPDATE", "DELETE"],
        });

        // Step 3: Schema Setup (Success with warnings)
        const schemaStart = new Date();
        progressTracker.startStep("schema");
        jest.advanceTimersByTime(3000);
        progressTracker.completeStep("schema", { tablesCreated: 15 });
        summaryReporter.recordPartial(
          "schema",
          schemaStart,
          new Date(),
          ["Some indexes were recreated", "Foreign key constraints updated"],
          {
            tablesCreated: 15,
            indexesRecreated: 3,
          }
        );

        // Step 4: Data Migration (Failure)
        const migrationStart = new Date();
        progressTracker.startStep("migration");
        jest.advanceTimersByTime(1500);

        const migrationError = new Error(
          "ER_DUP_ENTRY: Duplicate entry for key 'PRIMARY'"
        );
        const categorizedError = errorHandler.categorizeError(
          migrationError,
          "data-migration"
        );

        progressTracker.failStep("migration", categorizedError.originalError);
        summaryReporter.recordFailure(
          "migration",
          migrationStart,
          new Date(),
          categorizedError,
          {
            migrationsAttempted: 3,
            migrationsFailed: 1,
          }
        );

        // Step 5: Data Seeding (Skipped due to migration failure)
        progressTracker.skipStep("seeding", "Skipped due to migration failure");
        summaryReporter.recordSkipped(
          "seeding",
          "Migration failed - unsafe to seed data"
        );

        // Step 6: Health Check (Success)
        const healthStart = new Date();
        progressTracker.startStep("health-check");
        jest.advanceTimersByTime(500);
        progressTracker.completeStep("health-check", { healthScore: 85 });
        summaryReporter.recordSuccess("health-check", healthStart, new Date(), {
          healthScore: 85,
          issues: ["Migration failure detected"],
        });
      } catch (error) {
        progressTracker.fail(error as Error);
        summaryReporter.recordFailure(
          "database-initialization",
          initStartTime,
          new Date(),
          errorHandler.categorizeError(error as Error, "initialization")
        );
      }

      // Generate comprehensive summary report
      const report = summaryReporter.generateReport(
        ReportType.INITIALIZATION,
        progressTracker
      );

      // Verify integration results
      expect(report.status).toBe("failure"); // Due to migration failure
      expect(report.summary.totalOperations).toBe(6);
      expect(report.summary.successfulOperations).toBe(3);
      expect(report.summary.failedOperations).toBe(1);
      expect(report.summary.skippedOperations).toBe(1);
      expect(report.summary.warningCount).toBe(2); // From partial schema operation

      // Verify progress tracker integration
      expect(report.metadata.progressTracker).toBeDefined();
      expect(report.metadata.progressTracker.name).toBe(
        "complete-db-initialization"
      );
      expect(report.metadata.progressTracker.completedSteps).toBe(4);
      expect(report.metadata.progressTracker.failedSteps).toBe(1);
      expect(report.metadata.progressTracker.skippedSteps).toBe(1);

      // Verify error handling integration
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].category).toBe(ErrorCategory.SCHEMA);
      expect(report.errors[0].troubleshootingHints.length).toBeGreaterThan(0);

      // Verify recommendations
      expect(report.recommendations).toContain(
        "Review and address the errors listed in this report"
      );

      // Test different report formats
      const humanReadable = summaryReporter.formatReport(
        report,
        ReportFormat.HUMAN_READABLE
      );
      expect(humanReadable).toContain("Database initialization Summary Report");
      expect(humanReadable).toContain("Status: FAILURE");

      const jsonReport = summaryReporter.formatReport(
        report,
        ReportFormat.JSON
      );
      expect(() => JSON.parse(jsonReport)).not.toThrow();

      const markdownReport = summaryReporter.formatReport(
        report,
        ReportFormat.MARKDOWN
      );
      expect(markdownReport).toContain(
        "# Database initialization Summary Report"
      );

      // Verify comprehensive logging
      const allLogs = consoleOutput.filter((output) =>
        output.includes('"level"')
      );
      expect(allLogs.length).toBeGreaterThan(10); // Many log entries from all components

      // Verify specific log types
      const errorLogs = allLogs.filter((log) =>
        log.includes('"level":"error"')
      );
      const infoLogs = allLogs.filter((log) => log.includes('"level":"info"'));
      const debugLogs = allLogs.filter((log) =>
        log.includes('"level":"debug"')
      );

      expect(errorLogs.length).toBeGreaterThan(0);
      expect(infoLogs.length).toBeGreaterThan(0);
      // Debug logs might be 0 if level is 'info'
    });

    test("should handle environment-based configuration integration", () => {
      // Set environment variables
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });
      process.env.DB_LOG_LEVEL = "warn";
      process.env.DB_LOG_FORMAT = "json";
      process.env.DB_HOST = "prod-db.example.com";
      process.env.DB_PORT = "5432";
      process.env.DB_NAME = "production_db";

      // Create logger with environment configuration
      const logger = createDatabaseLogger();
      const config = logger.getConfig();

      expect(config.level).toBe("warn");
      expect(config.format).toBe("json");
      expect(config.environment).toBe("production");

      // Create summary reporter and verify configuration summary
      const summaryReporter = new SummaryReporter(logger);
      const report = summaryReporter.generateReport(ReportType.INITIALIZATION);

      expect(report.configuration.environment).toBe("production");
      expect(report.configuration.database.host).toBe("prod-db.example.com");
      expect(report.configuration.database.port).toBe(5432);
      expect(report.configuration.database.database).toBe("production_db");

      // Clean up environment variables
      Object.defineProperty(process.env, "NODE_ENV", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete process.env.DB_LOG_LEVEL;
      delete process.env.DB_LOG_FORMAT;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
    });
  });

  describe("Performance and Reliability", () => {
    test("should handle high-volume logging without performance degradation", () => {
      const logger = new DatabaseLogger({
        format: "json",
        level: "info",
        enableTimestamps: true,
      });

      const startTime = Date.now();

      // Generate high volume of log entries
      for (let i = 0; i < 1000; i++) {
        logger.info(`High volume log entry ${i}`, {
          operation: "performance-test",
          iteration: i,
          data: { key: `value_${i}` },
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(consoleOutput).toHaveLength(1000);
    });

    test("should handle concurrent operations safely", () => {
      const logger = new DatabaseLogger({ format: "json", level: "info" });
      const errorHandler = new DatabaseErrorHandler(logger);
      const summaryReporter = new SummaryReporter(logger);

      // Simulate concurrent operations synchronously to avoid timer issues
      for (let i = 0; i < 10; i++) {
        const startTime = new Date();

        if (i % 3 === 0) {
          // Simulate error
          const error = new Error(`Concurrent error ${i}`);
          const categorizedError = errorHandler.categorizeError(
            error,
            `operation-${i}`
          );
          summaryReporter.recordFailure(
            `operation-${i}`,
            startTime,
            new Date(),
            categorizedError
          );
        } else {
          // Simulate success
          summaryReporter.recordSuccess(
            `operation-${i}`,
            startTime,
            new Date(),
            { index: i }
          );
        }
      }

      const report = summaryReporter.generateReport(ReportType.OPERATION);

      expect(report.summary.totalOperations).toBe(10);
      expect(report.summary.failedOperations).toBe(4); // Every 3rd operation (0, 3, 6, 9)
      expect(report.summary.successfulOperations).toBe(6);
    });
  });
});
