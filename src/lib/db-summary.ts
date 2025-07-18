/**
 * Database Summary Reporting System
 *
 * Provides comprehensive summary reporting for database initialization,
 * including performance metrics, configuration summary, success/failure
 * status reporting, and both human-readable and JSON format output.
 */

import { LogContext, DatabaseLogger, getDatabaseLogger } from "./db-logging";
import { ProgressTracker } from "./db-progress";
import { CategorizedDatabaseError } from "./db-error-handler";

// Summary report types
export enum ReportType {
  INITIALIZATION = "initialization",
  HEALTH_CHECK = "health_check",
  MIGRATION = "migration",
  OPERATION = "operation",
}

// Report format options
export enum ReportFormat {
  HUMAN_READABLE = "human_readable",
  JSON = "json",
  MARKDOWN = "markdown",
  CSV = "csv",
}

// Performance metrics interface
export interface PerformanceMetrics {
  totalDuration: number; // milliseconds
  averageStepDuration?: number;
  longestStepDuration?: number;
  shortestStepDuration?: number;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    peak?: NodeJS.MemoryUsage;
  };
  cpuUsage?: {
    initial: NodeJS.CpuUsage;
    final: NodeJS.CpuUsage;
  };
  resourceUtilization?: {
    connectionPoolUsage?: number;
    queryCount?: number;
    errorCount?: number;
  };
}

// Configuration summary interface
export interface ConfigurationSummary {
  environment: string;
  database: {
    host: string;
    port: number;
    database: string;
    connectionPool?: {
      min: number;
      max: number;
      idle: number;
    };
  };
  initialization: {
    mode: string;
    autoInit: boolean;
    timeouts: {
      overall: number;
      healthCheck: number;
      migration: number;
    };
    retryConfig: {
      maxAttempts: number;
      delay: number;
    };
  };
  features: {
    loggingEnabled: boolean;
    progressTracking: boolean;
    errorHandling: boolean;
    summaryReporting: boolean;
  };
}

// Operation result interface
export interface OperationResult {
  operation: string;
  status: "success" | "failure" | "partial" | "skipped";
  startTime: Date;
  endTime: Date;
  duration: number;
  details?: Record<string, any>;
  error?: CategorizedDatabaseError;
  warnings?: string[];
}

// Summary report interface
export interface SummaryReport {
  id: string;
  type: ReportType;
  timestamp: Date;
  status: "success" | "failure" | "partial";
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    skippedOperations: number;
    warningCount: number;
  };
  performance: PerformanceMetrics;
  configuration: ConfigurationSummary;
  operations: OperationResult[];
  errors: CategorizedDatabaseError[];
  warnings: string[];
  recommendations?: string[];
  metadata: Record<string, any>;
}

/**
 * Summary Reporter Class
 *
 * Generates comprehensive summary reports for database operations
 * with performance metrics, configuration details, and recommendations.
 */
export class SummaryReporter {
  private logger: DatabaseLogger;
  private startTime: Date;
  private initialMemory: NodeJS.MemoryUsage;
  private initialCpu: NodeJS.CpuUsage;
  private operations: OperationResult[] = [];
  private errors: CategorizedDatabaseError[] = [];
  private warnings: string[] = [];
  private metadata: Record<string, any> = {};

  constructor(logger?: DatabaseLogger) {
    this.logger = logger || getDatabaseLogger();
    this.startTime = new Date();
    this.initialMemory = process.memoryUsage();
    this.initialCpu = process.cpuUsage();
  }

  /**
   * Start tracking an operation
   */
  startOperation(operation: string, details?: Record<string, any>): void {
    this.logger.debug(`Starting operation: ${operation}`, {
      operation: "summary-reporting",
      operationName: operation,
      details,
    });
  }

  /**
   * Record a successful operation
   */
  recordSuccess(
    operation: string,
    startTime: Date,
    endTime: Date,
    details?: Record<string, any>
  ): void {
    const result: OperationResult = {
      operation,
      status: "success",
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      details,
    };

    this.operations.push(result);

    this.logger.info(`Operation completed successfully: ${operation}`, {
      operation: "summary-reporting",
      operationName: operation,
      duration: result.duration,
      details,
    });
  }

  /**
   * Record a failed operation
   */
  recordFailure(
    operation: string,
    startTime: Date,
    endTime: Date,
    error: CategorizedDatabaseError,
    details?: Record<string, any>
  ): void {
    const result: OperationResult = {
      operation,
      status: "failure",
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      error,
      details,
    };

    this.operations.push(result);
    this.errors.push(error);

    this.logger.error(
      `Operation failed: ${operation}`,
      {
        operation: "summary-reporting",
        operationName: operation,
        duration: result.duration,
        errorCategory: error.category,
        errorCode: error.code,
        details,
      },
      error.originalError
    );
  }

  /**
   * Record a partially successful operation
   */
  recordPartial(
    operation: string,
    startTime: Date,
    endTime: Date,
    warnings: string[],
    details?: Record<string, any>
  ): void {
    const result: OperationResult = {
      operation,
      status: "partial",
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      warnings,
      details,
    };

    this.operations.push(result);
    this.warnings.push(...warnings);

    this.logger.warn(`Operation completed with warnings: ${operation}`, {
      operation: "summary-reporting",
      operationName: operation,
      duration: result.duration,
      warningCount: warnings.length,
      details,
    });
  }

  /**
   * Record a skipped operation
   */
  recordSkipped(
    operation: string,
    reason: string,
    details?: Record<string, any>
  ): void {
    const now = new Date();
    const result: OperationResult = {
      operation,
      status: "skipped",
      startTime: now,
      endTime: now,
      duration: 0,
      details: { ...details, reason },
    };

    this.operations.push(result);

    this.logger.info(`Operation skipped: ${operation} (${reason})`, {
      operation: "summary-reporting",
      operationName: operation,
      reason,
      details,
    });
  }

  /**
   * Add a warning
   */
  addWarning(warning: string, context?: Record<string, any>): void {
    this.warnings.push(warning);

    this.logger.warn(`Warning: ${warning}`, {
      operation: "summary-reporting",
      warning,
      ...context,
    });
  }

  /**
   * Add metadata
   */
  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * Generate comprehensive summary report
   */
  generateReport(
    type: ReportType,
    progressTracker?: ProgressTracker
  ): SummaryReport {
    const endTime = new Date();
    const finalMemory = process.memoryUsage();
    const finalCpu = process.cpuUsage(this.initialCpu);

    const performance = this.calculatePerformanceMetrics(
      endTime,
      finalMemory,
      finalCpu
    );
    const configuration = this.generateConfigurationSummary();
    const summary = this.generateOperationSummary();
    const recommendations = this.generateRecommendations();

    const report: SummaryReport = {
      id: this.generateReportId(),
      type,
      timestamp: endTime,
      status: this.determineOverallStatus(),
      summary,
      performance,
      configuration,
      operations: this.operations,
      errors: this.errors,
      warnings: this.warnings,
      recommendations,
      metadata: {
        ...this.metadata,
        progressTracker: progressTracker?.getSummary(),
      },
    };

    this.logger.info("Generated summary report", {
      operation: "summary-reporting",
      reportId: report.id,
      reportType: type,
      status: report.status,
      totalOperations: summary.totalOperations,
      successRate:
        summary.totalOperations > 0
          ? (
              (summary.successfulOperations / summary.totalOperations) *
              100
            ).toFixed(1) + "%"
          : "N/A",
      totalDuration: performance.totalDuration,
    });

    return report;
  }

  /**
   * Format report for output
   */
  formatReport(report: SummaryReport, format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return JSON.stringify(report, null, 2);
      case ReportFormat.MARKDOWN:
        return this.formatAsMarkdown(report);
      case ReportFormat.CSV:
        return this.formatAsCSV(report);
      case ReportFormat.HUMAN_READABLE:
      default:
        return this.formatAsHumanReadable(report);
    }
  }

  /**
   * Save report to file (if in Node.js environment)
   */
  async saveReport(
    report: SummaryReport,
    format: ReportFormat,
    filePath?: string
  ): Promise<string> {
    const content = this.formatReport(report, format);
    const fileName = filePath || this.generateFileName(report, format);

    // In a real implementation, you would save to file system
    // For now, we'll just log the content
    this.logger.info(`Report saved: ${fileName}`, {
      operation: "summary-reporting",
      fileName,
      format,
      contentLength: content.length,
    });

    return fileName;
  }

  // Private helper methods

  private calculatePerformanceMetrics(
    endTime: Date,
    finalMemory: NodeJS.MemoryUsage,
    finalCpu: NodeJS.CpuUsage
  ): PerformanceMetrics {
    const totalDuration = endTime.getTime() - this.startTime.getTime();
    const operationDurations = this.operations.map((op) => op.duration);

    return {
      totalDuration,
      averageStepDuration:
        operationDurations.length > 0
          ? operationDurations.reduce((a, b) => a + b, 0) /
            operationDurations.length
          : undefined,
      longestStepDuration:
        operationDurations.length > 0
          ? Math.max(...operationDurations)
          : undefined,
      shortestStepDuration:
        operationDurations.length > 0
          ? Math.min(...operationDurations)
          : undefined,
      memoryUsage: {
        initial: this.initialMemory,
        final: finalMemory,
      },
      cpuUsage: {
        initial: this.initialCpu,
        final: finalCpu,
      },
      resourceUtilization: {
        queryCount: this.operations.length,
        errorCount: this.errors.length,
      },
    };
  }

  private generateConfigurationSummary(): ConfigurationSummary {
    return {
      environment: process.env.NODE_ENV || "unknown",
      database: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306"),
        database: process.env.DB_NAME || "unknown",
      },
      initialization: {
        mode: process.env.DB_INIT_MODE || "development",
        autoInit: process.env.DB_AUTO_INIT !== "false",
        timeouts: {
          overall: parseInt(process.env.DB_INIT_TIMEOUT || "60000"),
          healthCheck: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || "10000"),
          migration: parseInt(process.env.DB_MIGRATION_TIMEOUT || "300000"),
        },
        retryConfig: {
          maxAttempts: parseInt(process.env.DB_INIT_RETRY_ATTEMPTS || "3"),
          delay: parseInt(process.env.DB_INIT_RETRY_DELAY || "5000"),
        },
      },
      features: {
        loggingEnabled: true,
        progressTracking: true,
        errorHandling: true,
        summaryReporting: true,
      },
    };
  }

  private generateOperationSummary() {
    const successful = this.operations.filter(
      (op) => op.status === "success"
    ).length;
    const failed = this.operations.filter(
      (op) => op.status === "failure"
    ).length;
    const skipped = this.operations.filter(
      (op) => op.status === "skipped"
    ).length;

    return {
      totalOperations: this.operations.length,
      successfulOperations: successful,
      failedOperations: failed,
      skippedOperations: skipped,
      warningCount: this.warnings.length,
    };
  }

  private determineOverallStatus(): "success" | "failure" | "partial" {
    const hasFailures = this.operations.some((op) => op.status === "failure");
    const hasWarnings = this.warnings.length > 0;
    const hasPartial = this.operations.some((op) => op.status === "partial");

    if (hasFailures) return "failure";
    if (hasWarnings || hasPartial) return "partial";
    return "success";
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Only generate recommendations if there are operations
    if (this.operations.length === 0) {
      return recommendations;
    }

    // Performance recommendations
    const avgDuration =
      this.operations.reduce((sum, op) => sum + op.duration, 0) /
      this.operations.length;

    if (avgDuration > 10000) {
      recommendations.push(
        "Consider optimizing database operations - average duration is high"
      );
    }

    // Error recommendations
    if (this.errors.length > 0) {
      recommendations.push(
        "Review and address the errors listed in this report"
      );
    }

    // Memory recommendations - only check if we have significant operations
    const currentMemory = process.memoryUsage();
    const memoryIncrease = currentMemory.heapUsed - this.initialMemory.heapUsed;
    if (memoryIncrease > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push(
        "Monitor memory usage - significant increase detected"
      );
    }

    return recommendations;
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFileName(
    report: SummaryReport,
    format: ReportFormat
  ): string {
    const timestamp = report.timestamp.toISOString().replace(/[:.]/g, "-");
    const extension = this.getFileExtension(format);
    return `db-summary-${report.type}-${timestamp}.${extension}`;
  }

  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return "json";
      case ReportFormat.MARKDOWN:
        return "md";
      case ReportFormat.CSV:
        return "csv";
      default:
        return "txt";
    }
  }

  private formatAsHumanReadable(report: SummaryReport): string {
    const lines: string[] = [];

    lines.push(`Database ${report.type} Summary Report`);
    lines.push("=".repeat(50));
    lines.push(`Report ID: ${report.id}`);
    lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
    lines.push(`Status: ${report.status.toUpperCase()}`);
    lines.push("");

    lines.push("Summary:");
    lines.push(`  Total Operations: ${report.summary.totalOperations}`);
    lines.push(`  Successful: ${report.summary.successfulOperations}`);
    lines.push(`  Failed: ${report.summary.failedOperations}`);
    lines.push(`  Skipped: ${report.summary.skippedOperations}`);
    lines.push(`  Warnings: ${report.summary.warningCount}`);
    lines.push("");

    lines.push("Performance:");
    lines.push(
      `  Total Duration: ${this.formatDuration(
        report.performance.totalDuration
      )}`
    );
    if (report.performance.averageStepDuration) {
      lines.push(
        `  Average Step Duration: ${this.formatDuration(
          report.performance.averageStepDuration
        )}`
      );
    }
    lines.push("");

    if (report.errors.length > 0) {
      lines.push("Errors:");
      report.errors.forEach((error, index) => {
        lines.push(`  ${index + 1}. [${error.category}] ${error.message}`);
      });
      lines.push("");
    }

    if (report.warnings.length > 0) {
      lines.push("Warnings:");
      report.warnings.forEach((warning, index) => {
        lines.push(`  ${index + 1}. ${warning}`);
      });
      lines.push("");
    }

    if (report.recommendations && report.recommendations.length > 0) {
      lines.push("Recommendations:");
      report.recommendations.forEach((rec, index) => {
        lines.push(`  ${index + 1}. ${rec}`);
      });
    }

    return lines.join("\n");
  }

  private formatAsMarkdown(report: SummaryReport): string {
    const lines: string[] = [];

    lines.push(`# Database ${report.type} Summary Report`);
    lines.push("");
    lines.push(`**Report ID:** ${report.id}`);
    lines.push(`**Timestamp:** ${report.timestamp.toISOString()}`);
    lines.push(`**Status:** ${report.status.toUpperCase()}`);
    lines.push("");

    lines.push("## Summary");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Total Operations | ${report.summary.totalOperations} |`);
    lines.push(`| Successful | ${report.summary.successfulOperations} |`);
    lines.push(`| Failed | ${report.summary.failedOperations} |`);
    lines.push(`| Skipped | ${report.summary.skippedOperations} |`);
    lines.push(`| Warnings | ${report.summary.warningCount} |`);
    lines.push("");

    lines.push("## Performance");
    lines.push(
      `- **Total Duration:** ${this.formatDuration(
        report.performance.totalDuration
      )}`
    );
    if (report.performance.averageStepDuration) {
      lines.push(
        `- **Average Step Duration:** ${this.formatDuration(
          report.performance.averageStepDuration
        )}`
      );
    }
    lines.push("");

    return lines.join("\n");
  }

  private formatAsCSV(report: SummaryReport): string {
    const lines: string[] = [];

    // Header
    lines.push("Operation,Status,Duration,StartTime,EndTime,Details");

    // Data rows
    report.operations.forEach((op) => {
      const details = op.details
        ? JSON.stringify(op.details).replace(/"/g, '""')
        : "";
      lines.push(
        `"${op.operation}","${op.status}",${
          op.duration
        },"${op.startTime.toISOString()}","${op.endTime.toISOString()}","${details}"`
      );
    });

    return lines.join("\n");
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
