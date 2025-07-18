/**
 * Database Error Handling and Categorization System
 *
 * Provides detailed error classification, actionable troubleshooting hints,
 * error context capture, and recovery suggestions for database operations.
 */

import { LogContext, DatabaseLogger, getDatabaseLogger } from "./db-logging";

// Error categories for database operations
export enum ErrorCategory {
  CONNECTION = "connection",
  PERMISSION = "permission",
  SCHEMA = "schema",
  SCRIPT = "script",
  TIMEOUT = "timeout",
  RESOURCE = "resource",
  CONFIGURATION = "configuration",
  UNKNOWN = "unknown",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error recovery action types
export enum RecoveryAction {
  RETRY = "retry",
  FALLBACK = "fallback",
  MANUAL_INTERVENTION = "manual_intervention",
  CONFIGURATION_CHANGE = "configuration_change",
  RESOURCE_ALLOCATION = "resource_allocation",
  NONE = "none",
}

// Troubleshooting hint interface
export interface TroubleshootingHint {
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  documentation?: string;
  commands?: string[];
}

// Recovery suggestion interface
export interface RecoverySuggestion {
  action: RecoveryAction;
  description: string;
  steps: string[];
  estimatedTime?: string;
  riskLevel: "low" | "medium" | "high";
  prerequisites?: string[];
}

// Error context interface
export interface ErrorContext {
  operation: string;
  timestamp: Date;
  environment: {
    nodeEnv: string;
    platform: string;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
  database: {
    host?: string;
    port?: number;
    database?: string;
    password?: string;
    connectionPool?: {
      active: number;
      idle: number;
      total: number;
    };
  };
  request?: {
    query?: string;
    parameters?: any[];
    timeout?: number;
  };
  system?: {
    cpuUsage?: NodeJS.CpuUsage;
    uptime: number;
    loadAverage?: number[];
  };
}

// Categorized database error interface
export interface CategorizedDatabaseError {
  originalError: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  troubleshootingHints: TroubleshootingHint[];
  recoverySuggestions: RecoverySuggestion[];
  context: ErrorContext;
  isRetryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Error pattern matching interface
interface ErrorPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  isRetryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Database error patterns for classification
const ERROR_PATTERNS: ErrorPattern[] = [
  // Connection errors
  {
    pattern: /ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i,
    category: ErrorCategory.CONNECTION,
    severity: ErrorSeverity.HIGH,
    code: "DB_CONNECTION_FAILED",
    isRetryable: true,
    maxRetries: 3,
    retryDelay: 5000,
  },
  {
    pattern: /ER_ACCESS_DENIED_ERROR|Access denied/i,
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.HIGH,
    code: "DB_ACCESS_DENIED",
    isRetryable: false,
  },
  {
    pattern: /ER_BAD_DB_ERROR|Unknown database/i,
    category: ErrorCategory.SCHEMA,
    severity: ErrorSeverity.HIGH,
    code: "DB_SCHEMA_NOT_FOUND",
    isRetryable: false,
  },
  {
    pattern: /ER_NO_SUCH_TABLE|Table.*doesn't exist/i,
    category: ErrorCategory.SCHEMA,
    severity: ErrorSeverity.MEDIUM,
    code: "DB_TABLE_NOT_FOUND",
    isRetryable: false,
  },
  {
    pattern: /ER_DUP_ENTRY|Duplicate entry/i,
    category: ErrorCategory.SCHEMA,
    severity: ErrorSeverity.LOW,
    code: "DB_DUPLICATE_ENTRY",
    isRetryable: false,
  },
  {
    pattern: /Syntax error|ER_PARSE_ERROR/i,
    category: ErrorCategory.SCRIPT,
    severity: ErrorSeverity.MEDIUM,
    code: "DB_SYNTAX_ERROR",
    isRetryable: false,
  },
  {
    pattern: /Lock wait timeout|ER_LOCK_WAIT_TIMEOUT/i,
    category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    code: "DB_LOCK_TIMEOUT",
    isRetryable: true,
    maxRetries: 2,
    retryDelay: 1000,
  },
  {
    pattern: /Too many connections|ER_CON_COUNT_ERROR/i,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.HIGH,
    code: "DB_CONNECTION_LIMIT",
    isRetryable: true,
    maxRetries: 5,
    retryDelay: 2000,
  },
  {
    pattern: /Out of memory|ER_OUT_OF_RESOURCES/i,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.CRITICAL,
    code: "DB_OUT_OF_MEMORY",
    isRetryable: false,
  },
];

/**
 * Database Error Handler Class
 *
 * Provides comprehensive error classification, context capture,
 * and recovery suggestion functionality for database operations.
 */
export class DatabaseErrorHandler {
  private logger: DatabaseLogger;

  constructor(logger?: DatabaseLogger) {
    this.logger = logger || getDatabaseLogger();
  }

  /**
   * Categorize and enhance a database error with detailed information
   */
  categorizeError(
    error: Error,
    operation: string,
    additionalContext?: Partial<ErrorContext>
  ): CategorizedDatabaseError {
    const pattern = this.matchErrorPattern(error);
    const context = this.captureErrorContext(operation, additionalContext);

    const categorizedError: CategorizedDatabaseError = {
      originalError: error,
      category: pattern.category,
      severity: pattern.severity,
      code: pattern.code,
      message: this.enhanceErrorMessage(error, pattern),
      troubleshootingHints: this.generateTroubleshootingHints(pattern, context),
      recoverySuggestions: this.generateRecoverySuggestions(pattern, context),
      context,
      isRetryable: pattern.isRetryable,
      maxRetries: pattern.maxRetries,
      retryDelay: pattern.retryDelay,
    };

    // Log the categorized error
    this.logCategorizedError(categorizedError);

    return categorizedError;
  }

  /**
   * Match error against known patterns
   */
  private matchErrorPattern(error: Error): ErrorPattern {
    const errorMessage = error.message || "";
    const errorName = error.name || "";
    const fullErrorText = `${errorName}: ${errorMessage}`;

    for (const pattern of ERROR_PATTERNS) {
      if (typeof pattern.pattern === "string") {
        if (fullErrorText.includes(pattern.pattern)) {
          return pattern;
        }
      } else {
        if (pattern.pattern.test(fullErrorText)) {
          return pattern;
        }
      }
    }

    // Default pattern for unknown errors
    return {
      pattern: /.*/,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: "DB_UNKNOWN_ERROR",
      isRetryable: false,
    };
  }

  /**
   * Safely get load average (handles platforms that don't support it)
   */
  private safeGetLoadAverage(): number[] | undefined {
    try {
      return process.platform !== "win32" && "loadavg" in process
        ? (process as any).loadavg()
        : undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Capture comprehensive error context
   */
  private captureErrorContext(
    operation: string,
    additionalContext?: Partial<ErrorContext>
  ): ErrorContext {
    const context: ErrorContext = {
      operation,
      timestamp: new Date(),
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        database: process.env.DB_NAME,
        ...additionalContext?.database,
      },
      system: {
        uptime: process.uptime(),
        loadAverage: this.safeGetLoadAverage(),
        ...additionalContext?.system,
      },
      ...additionalContext,
    };

    return context;
  }

  /**
   * Enhance error message with additional context
   */
  private enhanceErrorMessage(error: Error, pattern: ErrorPattern): string {
    const baseMessage = error.message || "Unknown database error";
    const categoryInfo = `[${pattern.category.toUpperCase()}]`;
    const codeInfo = `[${pattern.code}]`;

    return `${categoryInfo} ${codeInfo} ${baseMessage}`;
  }

  /**
   * Generate troubleshooting hints based on error pattern and context
   */
  private generateTroubleshootingHints(
    pattern: ErrorPattern,
    context: ErrorContext
  ): TroubleshootingHint[] {
    const hints: TroubleshootingHint[] = [];

    switch (pattern.category) {
      case ErrorCategory.CONNECTION:
        hints.push({
          title: "Check Database Server Status",
          description:
            "Verify that the database server is running and accessible",
          action: "Test connection to database server",
          priority: "high",
          commands: [
            `ping ${context.database.host || "localhost"}`,
            `telnet ${context.database.host || "localhost"} ${
              context.database.port || 3306
            }`,
          ],
        });
        hints.push({
          title: "Verify Network Configuration",
          description: "Check firewall settings and network connectivity",
          action: "Review network configuration and firewall rules",
          priority: "medium",
        });
        break;

      case ErrorCategory.PERMISSION:
        hints.push({
          title: "Check Database Credentials",
          description: "Verify username and password are correct",
          action: "Review database connection credentials",
          priority: "high",
        });
        hints.push({
          title: "Verify User Permissions",
          description: "Ensure the database user has required permissions",
          action: "Check user grants and permissions in database",
          priority: "high",
          commands: ["SHOW GRANTS FOR 'username'@'host'"],
        });
        break;

      case ErrorCategory.SCHEMA:
        hints.push({
          title: "Check Database Schema",
          description: "Verify that the database and tables exist",
          action: "Review database schema and table structure",
          priority: "high",
          commands: ["SHOW DATABASES", "SHOW TABLES"],
        });
        break;

      case ErrorCategory.RESOURCE:
        hints.push({
          title: "Monitor Resource Usage",
          description: "Check database server resource utilization",
          action: "Review CPU, memory, and connection usage",
          priority: "high",
          commands: ["SHOW PROCESSLIST", "SHOW STATUS LIKE 'Threads%'"],
        });
        break;
    }

    return hints;
  }

  /**
   * Generate recovery suggestions based on error pattern and context
   */
  private generateRecoverySuggestions(
    pattern: ErrorPattern,
    context: ErrorContext
  ): RecoverySuggestion[] {
    const suggestions: RecoverySuggestion[] = [];

    if (pattern.isRetryable) {
      suggestions.push({
        action: RecoveryAction.RETRY,
        description: "Retry the operation with exponential backoff",
        steps: [
          "Wait for the specified delay period",
          "Retry the operation",
          "Increase delay if retry fails",
          `Maximum ${pattern.maxRetries || 3} retry attempts`,
        ],
        estimatedTime: "30 seconds to 2 minutes",
        riskLevel: "low",
      });
    }

    switch (pattern.category) {
      case ErrorCategory.CONNECTION:
        suggestions.push({
          action: RecoveryAction.CONFIGURATION_CHANGE,
          description: "Update connection configuration",
          steps: [
            "Verify database server address and port",
            "Check connection timeout settings",
            "Update connection pool configuration",
            "Test connection with updated settings",
          ],
          estimatedTime: "5-10 minutes",
          riskLevel: "low",
        });
        break;

      case ErrorCategory.RESOURCE:
        suggestions.push({
          action: RecoveryAction.RESOURCE_ALLOCATION,
          description: "Increase resource allocation",
          steps: [
            "Monitor current resource usage",
            "Increase connection pool size if needed",
            "Scale database server resources",
            "Optimize queries to reduce resource usage",
          ],
          estimatedTime: "15-30 minutes",
          riskLevel: "medium",
          prerequisites: ["Database administrator access"],
        });
        break;

      case ErrorCategory.PERMISSION:
        suggestions.push({
          action: RecoveryAction.MANUAL_INTERVENTION,
          description: "Fix permission issues",
          steps: [
            "Contact database administrator",
            "Verify user credentials",
            "Grant required permissions",
            "Test access with updated permissions",
          ],
          estimatedTime: "10-20 minutes",
          riskLevel: "low",
          prerequisites: ["Database administrator access"],
        });
        break;
    }

    return suggestions;
  }

  /**
   * Log categorized error with structured information
   */
  private logCategorizedError(error: CategorizedDatabaseError): void {
    const logContext: LogContext = {
      operation: error.context.operation,
      errorCategory: error.category,
      errorSeverity: error.severity,
      errorCode: error.code,
      isRetryable: error.isRetryable,
      maxRetries: error.maxRetries,
      database: error.context.database.database,
      host: error.context.database.host,
      environment: error.context.environment.nodeEnv,
    };

    this.logger.error(error.message, logContext, error.originalError);

    // Log troubleshooting hints at debug level
    if (error.troubleshootingHints.length > 0) {
      this.logger.debug("Troubleshooting hints available", {
        ...logContext,
        hintsCount: error.troubleshootingHints.length,
        hints: error.troubleshootingHints.map((h) => h.title),
      });
    }

    // Log recovery suggestions at info level
    if (error.recoverySuggestions.length > 0) {
      this.logger.info("Recovery suggestions available", {
        ...logContext,
        suggestionsCount: error.recoverySuggestions.length,
        suggestions: error.recoverySuggestions.map((s) => s.action),
      });
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error): boolean {
    const pattern = this.matchErrorPattern(error);
    return pattern.isRetryable;
  }

  /**
   * Get retry configuration for an error
   */
  getRetryConfig(error: Error): { maxRetries: number; retryDelay: number } {
    const pattern = this.matchErrorPattern(error);
    return {
      maxRetries: pattern.maxRetries || 0,
      retryDelay: pattern.retryDelay || 1000,
    };
  }

  /**
   * Format error for user-friendly display
   */
  formatErrorForUser(categorizedError: CategorizedDatabaseError): string {
    const { category, severity, message, troubleshootingHints } =
      categorizedError;

    let formatted = `Database ${category} error (${severity} severity):\n`;
    formatted += `${message}\n\n`;

    if (troubleshootingHints.length > 0) {
      formatted += "Troubleshooting suggestions:\n";
      troubleshootingHints.forEach((hint, index) => {
        formatted += `${index + 1}. ${hint.title}: ${hint.description}\n`;
      });
    }

    return formatted;
  }
}
