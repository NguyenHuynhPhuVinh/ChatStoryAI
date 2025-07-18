/**
 * Tests for Database Summary Reporting System
 *
 * Comprehensive test suite for summary report generation,
 * performance metrics, configuration summary, and report formatting.
 */

import {
  SummaryReporter,
  ReportType,
  ReportFormat,
  SummaryReport,
  OperationResult,
} from "../db-summary";
import { DatabaseLogger } from "../db-logging";
import { ProgressTracker } from "../db-progress";
import {
  DatabaseErrorHandler,
  ErrorCategory,
  ErrorSeverity,
} from "../db-error-handler";

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

  // Mock timers
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

describe("SummaryReporter", () => {
  describe("Basic Functionality", () => {
    test("should create summary reporter with default configuration", () => {
      const reporter = new SummaryReporter();

      expect(reporter).toBeInstanceOf(SummaryReporter);
    });

    test("should create summary reporter with custom logger", () => {
      const logger = new DatabaseLogger({ format: "json" });
      const reporter = new SummaryReporter(logger);

      expect(reporter).toBeInstanceOf(SummaryReporter);
    });
  });

  describe("Operation Recording", () => {
    test("should record successful operation", () => {
      const reporter = new SummaryReporter();
      const startTime = new Date();

      jest.advanceTimersByTime(1000);
      const endTime = new Date();

      reporter.recordSuccess("database-connection", startTime, endTime, {
        host: "localhost",
        port: 3306,
      });

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.operations).toHaveLength(1);
      expect(report.operations[0].operation).toBe("database-connection");
      expect(report.operations[0].status).toBe("success");
      expect(report.operations[0].duration).toBe(1000);
      expect(report.operations[0].details?.host).toBe("localhost");
      expect(report.summary.successfulOperations).toBe(1);
      expect(report.summary.failedOperations).toBe(0);
    });

    test("should record failed operation", () => {
      const reporter = new SummaryReporter();
      const errorHandler = new DatabaseErrorHandler();
      const startTime = new Date();

      jest.advanceTimersByTime(500);
      const endTime = new Date();

      const error = new Error("Connection refused");
      const categorizedError = errorHandler.categorizeError(
        error,
        "database-connection"
      );

      reporter.recordFailure(
        "database-connection",
        startTime,
        endTime,
        categorizedError,
        {
          host: "localhost",
          port: 3306,
        }
      );

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.operations).toHaveLength(1);
      expect(report.operations[0].status).toBe("failure");
      expect(report.operations[0].error).toBe(categorizedError);
      expect(report.summary.failedOperations).toBe(1);
      expect(report.errors).toHaveLength(1);
      expect(report.status).toBe("failure");
    });

    test("should record partial operation with warnings", () => {
      const reporter = new SummaryReporter();
      const startTime = new Date();

      jest.advanceTimersByTime(750);
      const endTime = new Date();

      const warnings = [
        "Connection timeout increased",
        "Retry attempt required",
      ];

      reporter.recordPartial(
        "database-migration",
        startTime,
        endTime,
        warnings,
        {
          migrationsApplied: 5,
          migrationsSkipped: 2,
        }
      );

      const report = reporter.generateReport(ReportType.MIGRATION);

      expect(report.operations).toHaveLength(1);
      expect(report.operations[0].status).toBe("partial");
      expect(report.operations[0].warnings).toEqual(warnings);
      expect(report.warnings).toEqual(warnings);
      expect(report.summary.warningCount).toBe(2);
      expect(report.status).toBe("partial");
    });

    test("should record skipped operation", () => {
      const reporter = new SummaryReporter();

      reporter.recordSkipped("database-seeding", "Production environment", {
        environment: "production",
      });

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.operations).toHaveLength(1);
      expect(report.operations[0].status).toBe("skipped");
      expect(report.operations[0].details?.reason).toBe(
        "Production environment"
      );
      expect(report.summary.skippedOperations).toBe(1);
    });

    test("should add warnings and metadata", () => {
      const reporter = new SummaryReporter();

      reporter.addWarning("Deprecated configuration detected", {
        config: "old_setting",
      });
      reporter.addMetadata("version", "1.0.0");
      reporter.addMetadata("environment", "test");

      const report = reporter.generateReport(ReportType.HEALTH_CHECK);

      expect(report.warnings).toContain("Deprecated configuration detected");
      expect(report.metadata.version).toBe("1.0.0");
      expect(report.metadata.environment).toBe("test");
    });
  });

  describe("Report Generation", () => {
    test("should generate comprehensive report", () => {
      const reporter = new SummaryReporter();
      const startTime = new Date();

      // Record multiple operations
      jest.advanceTimersByTime(1000);
      reporter.recordSuccess("database-connection", startTime, new Date());

      jest.advanceTimersByTime(2000);
      reporter.recordSuccess("schema-validation", new Date(), new Date());

      reporter.addWarning("Minor configuration issue");
      reporter.addMetadata("testRun", true);

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.id).toMatch(/^report-\d+-[a-z0-9]+$/);
      expect(report.type).toBe(ReportType.INITIALIZATION);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.status).toBe("partial"); // Has warnings
      expect(report.summary.totalOperations).toBe(2);
      expect(report.summary.successfulOperations).toBe(2);
      expect(report.summary.warningCount).toBe(1);
      expect(report.performance.totalDuration).toBeGreaterThan(0);
      expect(report.configuration).toBeDefined();
      expect(report.operations).toHaveLength(2);
      expect(report.warnings).toHaveLength(1);
      expect(report.metadata.testRun).toBe(true);
    });

    test("should include progress tracker data in report", () => {
      const reporter = new SummaryReporter();
      const progressTracker = new ProgressTracker("test-progress");

      progressTracker.addStep("step1", "First Step", "Description");
      progressTracker.start();
      progressTracker.startStep("step1");
      progressTracker.completeStep("step1");

      const report = reporter.generateReport(
        ReportType.INITIALIZATION,
        progressTracker
      );

      expect(report.metadata.progressTracker).toBeDefined();
      expect(report.metadata.progressTracker.name).toBe("test-progress");
      expect(report.metadata.progressTracker.overallProgress).toBe(100);
    });

    test("should calculate performance metrics correctly", () => {
      const reporter = new SummaryReporter();
      const startTime = new Date();

      // Record operations with different durations using actual time differences
      const start1 = new Date();
      const end1 = new Date(start1.getTime() + 1000); // 1 second
      reporter.recordSuccess("fast-operation", start1, end1);

      const start2 = new Date();
      const end2 = new Date(start2.getTime() + 3000); // 3 seconds
      reporter.recordSuccess("slow-operation", start2, end2);

      const report = reporter.generateReport(ReportType.OPERATION);

      expect(report.performance.averageStepDuration).toBe(2000); // (1000 + 3000) / 2
      expect(report.performance.longestStepDuration).toBe(3000);
      expect(report.performance.shortestStepDuration).toBe(1000);
      expect(report.performance.memoryUsage.initial).toBeDefined();
      expect(report.performance.memoryUsage.final).toBeDefined();
      expect(report.performance.cpuUsage).toBeDefined();
    });

    test("should generate appropriate recommendations", () => {
      const reporter = new SummaryReporter();
      const errorHandler = new DatabaseErrorHandler();

      // Add two slow operations to ensure average > 10 seconds
      const startTime1 = new Date();
      const endTime1 = new Date(startTime1.getTime() + 12000); // 12 seconds
      reporter.recordSuccess("slow-operation-1", startTime1, endTime1);

      const startTime2 = new Date();
      const endTime2 = new Date(startTime2.getTime() + 15000); // 15 seconds
      reporter.recordSuccess("slow-operation-2", startTime2, endTime2);
      // Average: (12000 + 15000) / 2 = 13500ms > 10000ms

      // Add an error
      const error = new Error("Connection failed");
      const categorizedError = errorHandler.categorizeError(
        error,
        "connection"
      );
      reporter.recordFailure(
        "failed-operation",
        new Date(),
        new Date(),
        categorizedError
      );

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      // The failed operation has 0 duration, so average = (12000 + 15000 + 0) / 3 = 9000ms < 10000
      // So we won't get the performance recommendation, only the error recommendation
      expect(report.recommendations).toContain(
        "Review and address the errors listed in this report"
      );

      // Test performance recommendation separately
      const perfReporter = new SummaryReporter();
      const slowStart = new Date();
      const slowEnd = new Date(slowStart.getTime() + 20000); // 20 seconds
      perfReporter.recordSuccess("very-slow-operation", slowStart, slowEnd);

      const perfReport = perfReporter.generateReport(ReportType.INITIALIZATION);
      expect(perfReport.recommendations).toContain(
        "Consider optimizing database operations - average duration is high"
      );
    });
  });

  describe("Report Formatting", () => {
    test("should format report as JSON", () => {
      const reporter = new SummaryReporter();
      reporter.recordSuccess("test-operation", new Date(), new Date());

      const report = reporter.generateReport(ReportType.INITIALIZATION);
      const formatted = reporter.formatReport(report, ReportFormat.JSON);

      expect(() => JSON.parse(formatted)).not.toThrow();
      const parsed = JSON.parse(formatted);
      expect(parsed.id).toBe(report.id);
      expect(parsed.type).toBe(report.type);
    });

    test("should format report as human readable", () => {
      const reporter = new SummaryReporter();
      reporter.recordSuccess("test-operation", new Date(), new Date());
      reporter.addWarning("Test warning");

      const report = reporter.generateReport(ReportType.INITIALIZATION);
      const formatted = reporter.formatReport(
        report,
        ReportFormat.HUMAN_READABLE
      );

      expect(formatted).toContain("Database initialization Summary Report");
      expect(formatted).toContain("Total Operations: 1");
      expect(formatted).toContain("Successful: 1");
      expect(formatted).toContain("Warnings:");
      expect(formatted).toContain("Test warning");
    });

    test("should format report as Markdown", () => {
      const reporter = new SummaryReporter();
      reporter.recordSuccess("test-operation", new Date(), new Date());

      const report = reporter.generateReport(ReportType.INITIALIZATION);
      const formatted = reporter.formatReport(report, ReportFormat.MARKDOWN);

      expect(formatted).toContain("# Database initialization Summary Report");
      expect(formatted).toContain("## Summary");
      expect(formatted).toContain("| Total Operations | 1 |");
      expect(formatted).toContain("## Performance");
    });

    test("should format report as CSV", () => {
      const reporter = new SummaryReporter();
      const startTime = new Date();
      const endTime = new Date();

      reporter.recordSuccess("test-operation", startTime, endTime, {
        key: "value",
      });

      const report = reporter.generateReport(ReportType.INITIALIZATION);
      const formatted = reporter.formatReport(report, ReportFormat.CSV);

      expect(formatted).toContain(
        "Operation,Status,Duration,StartTime,EndTime,Details"
      );
      expect(formatted).toContain('"test-operation","success"');
      expect(formatted).toContain('""key"":""value""');
    });
  });

  describe("Configuration Summary", () => {
    test("should generate configuration summary from environment", () => {
      // Set environment variables
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });
      process.env.DB_HOST = "test-host";
      process.env.DB_PORT = "5432";
      process.env.DB_NAME = "test-db";
      process.env.DB_INIT_TIMEOUT = "30000";

      const reporter = new SummaryReporter();
      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.configuration.environment).toBe("test");
      expect(report.configuration.database.host).toBe("test-host");
      expect(report.configuration.database.port).toBe(5432);
      expect(report.configuration.database.database).toBe("test-db");
      expect(report.configuration.initialization.timeouts.overall).toBe(30000);
      expect(report.configuration.features.loggingEnabled).toBe(true);

      // Clean up
      Object.defineProperty(process.env, "NODE_ENV", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_INIT_TIMEOUT;
    });
  });

  describe("File Operations", () => {
    test("should generate appropriate file names", async () => {
      const reporter = new SummaryReporter();
      const report = reporter.generateReport(ReportType.INITIALIZATION);

      const jsonFileName = await reporter.saveReport(report, ReportFormat.JSON);
      const markdownFileName = await reporter.saveReport(
        report,
        ReportFormat.MARKDOWN
      );
      const csvFileName = await reporter.saveReport(report, ReportFormat.CSV);

      expect(jsonFileName).toMatch(/^db-summary-initialization-.*\.json$/);
      expect(markdownFileName).toMatch(/^db-summary-initialization-.*\.md$/);
      expect(csvFileName).toMatch(/^db-summary-initialization-.*\.csv$/);
    });

    test("should use custom file path when provided", async () => {
      const reporter = new SummaryReporter();
      const report = reporter.generateReport(ReportType.INITIALIZATION);

      const customPath = "custom-report.json";
      const fileName = await reporter.saveReport(
        report,
        ReportFormat.JSON,
        customPath
      );

      expect(fileName).toBe(customPath);
    });
  });

  describe("Integration with Logging", () => {
    test("should log report generation events", () => {
      const logger = new DatabaseLogger({ format: "json", level: "debug" });
      const reporter = new SummaryReporter(logger);

      reporter.recordSuccess("test-operation", new Date(), new Date());
      const report = reporter.generateReport(ReportType.INITIALIZATION);

      // Check that report generation was logged
      const reportLog = consoleOutput.find((output) =>
        output.includes("Generated summary report")
      );
      expect(reportLog).toBeDefined();
    });

    test("should log operation recording events", () => {
      const logger = new DatabaseLogger({ format: "json", level: "debug" });
      const reporter = new SummaryReporter(logger);

      reporter.startOperation("test-operation");
      reporter.recordSuccess("test-operation", new Date(), new Date());

      const startLog = consoleOutput.find((output) =>
        output.includes("Starting operation: test-operation")
      );
      expect(startLog).toBeDefined();

      const successLog = consoleOutput.find((output) =>
        output.includes("Operation completed successfully: test-operation")
      );
      expect(successLog).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty operations list", () => {
      const reporter = new SummaryReporter();
      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.summary.totalOperations).toBe(0);
      expect(report.status).toBe("success");
      expect(report.performance.averageStepDuration).toBeUndefined();
      expect(report.recommendations).toHaveLength(0);
    });

    test("should handle mixed operation statuses", () => {
      const reporter = new SummaryReporter();
      const errorHandler = new DatabaseErrorHandler();

      reporter.recordSuccess("success-op", new Date(), new Date());
      reporter.recordFailure(
        "failed-op",
        new Date(),
        new Date(),
        errorHandler.categorizeError(new Error("Test"), "test")
      );
      reporter.recordSkipped("skipped-op", "Not needed");
      reporter.recordPartial("partial-op", new Date(), new Date(), ["Warning"]);

      const report = reporter.generateReport(ReportType.INITIALIZATION);

      expect(report.summary.totalOperations).toBe(4);
      expect(report.summary.successfulOperations).toBe(1);
      expect(report.summary.failedOperations).toBe(1);
      expect(report.summary.skippedOperations).toBe(1);
      expect(report.status).toBe("failure"); // Has failures
    });
  });
});
