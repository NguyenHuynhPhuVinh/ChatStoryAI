/**
 * Comprehensive Database Logging System
 *
 * Provides structured logging with timestamps, log levels, context information,
 * and integration with existing application logging patterns.
 */

// Log levels in order of severity (lowest to highest)
export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Context information interface
export interface LogContext {
  operation?: string;
  component?: string;
  database?: string;
  table?: string;
  duration?: number;
  retryAttempt?: number;
  maxRetries?: number;
  environment?: string;
  processId?: string;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

// Structured log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  metadata?: {
    source: string;
    version: string;
    environment: string;
    processId: string;
  };
}

// Log output format options
export type LogFormat = "console" | "json" | "structured";

// Logger configuration interface
export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  enableTimestamps: boolean;
  enableContext: boolean;
  enableMetadata: boolean;
  enableColors: boolean;
  filterSensitiveData: boolean;
  maxContextDepth: number;
  environment?: string;
}

// Default logger configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: "info",
  format: "console",
  enableTimestamps: true,
  enableContext: true,
  enableMetadata: true,
  enableColors: true,
  filterSensitiveData: true,
  maxContextDepth: 10, // Increased to handle deeper nested objects
  environment: process.env.NODE_ENV || "development",
};

// ANSI color codes for console output
const COLORS = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  fatal: "\x1b[35m", // Magenta
  reset: "\x1b[0m", // Reset
  bold: "\x1b[1m", // Bold
  dim: "\x1b[2m", // Dim
};

// Sensitive data patterns to filter
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i,
];

/**
 * Database Logger Class
 *
 * Provides comprehensive logging functionality with structured output,
 * context information, and integration with existing logging patterns.
 */
export class DatabaseLogger {
  private config: LoggerConfig;
  private sessionId: string;
  private processId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.processId = process.pid.toString();
  }

  /**
   * Generate a unique session ID for this logger instance
   */
  private generateSessionId(): string {
    return `db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a log level should be output based on current configuration
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Filter sensitive data from context objects
   */
  private filterSensitiveData(obj: any, depth = 0): any {
    if (
      !this.config.filterSensitiveData ||
      depth > this.config.maxContextDepth
    ) {
      return obj;
    }

    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.filterSensitiveData(item, depth + 1));
    }

    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
        pattern.test(key)
      );
      if (isSensitive && (typeof value !== "object" || value === null)) {
        // Only filter primitive values directly, let objects be processed recursively
        filtered[key] = "[FILTERED]";
      } else if (typeof value === "object" && value !== null) {
        // Always process objects recursively, even if the key name is sensitive
        filtered[key] = this.filterSensitiveData(value, depth + 1);
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (this.config.enableContext) {
      const contextWithSession = {
        ...(context || {}),
        sessionId: this.sessionId,
      };
      entry.context = this.filterSensitiveData(contextWithSession);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    if (this.config.enableMetadata) {
      entry.metadata = {
        source: "db-logging",
        version: "1.0.0",
        environment: this.config.environment || "unknown",
        processId: this.processId,
      };
    }

    return entry;
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleOutput(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;

    let output = "";

    // Add timestamp if enabled
    if (this.config.enableTimestamps) {
      const time = new Date(timestamp).toLocaleTimeString();
      output += this.config.enableColors
        ? `${COLORS.dim}${time}${COLORS.reset} `
        : `${time} `;
    }

    // Add level with color
    const levelStr = level.toUpperCase().padEnd(5);
    if (this.config.enableColors) {
      output += `${COLORS[level]}${COLORS.bold}${levelStr}${COLORS.reset} `;
    } else {
      output += `${levelStr} `;
    }

    // Add message
    output += message;

    // Add context if available
    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context, null, 2);
      output += this.config.enableColors
        ? `\n${COLORS.dim}Context: ${contextStr}${COLORS.reset}`
        : `\nContext: ${contextStr}`;
    }

    // Add error if available
    if (error) {
      const errorStr = `${error.name}: ${error.message}`;
      output += this.config.enableColors
        ? `\n${COLORS.error}Error: ${errorStr}${COLORS.reset}`
        : `\nError: ${errorStr}`;

      if (error.stack && this.config.level === "debug") {
        output += this.config.enableColors
          ? `\n${COLORS.dim}${error.stack}${COLORS.reset}`
          : `\n${error.stack}`;
      }
    }

    return output;
  }

  /**
   * Output log entry based on configured format
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    switch (this.config.format) {
      case "json":
        console.log(JSON.stringify(entry));
        break;
      case "structured":
        console.log(JSON.stringify(entry, null, 2));
        break;
      case "console":
      default:
        console.log(this.formatConsoleOutput(entry));
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("debug", message, context);
    this.output(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("info", message, context);
    this.output(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("warn", message, context);
    this.output(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry("error", message, context, error);
    this.output(entry);
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry("fatal", message, context, error);
    this.output(entry);
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): DatabaseLogger {
    const childLogger = new DatabaseLogger(this.config);
    childLogger.sessionId = this.sessionId;

    // Override output method to include parent context
    const originalOutput = childLogger.output.bind(childLogger);
    childLogger.output = (entry: LogEntry) => {
      if (entry.context) {
        entry.context = { ...context, ...entry.context };
      } else {
        entry.context = context;
      }
      originalOutput(entry);
    };

    return childLogger;
  }
}

// Global logger instance
let globalLogger: DatabaseLogger | null = null;

/**
 * Logger factory functions and utilities
 */

/**
 * Create a new database logger with environment-based configuration
 */
export function createDatabaseLogger(
  config?: Partial<LoggerConfig>
): DatabaseLogger {
  const envConfig = getLoggerConfigFromEnv();
  const finalConfig = { ...envConfig, ...config };
  return new DatabaseLogger(finalConfig);
}

/**
 * Get or create the global database logger instance
 */
export function getDatabaseLogger(): DatabaseLogger {
  if (!globalLogger) {
    globalLogger = createDatabaseLogger();
  }
  return globalLogger;
}

/**
 * Set the global database logger instance
 */
export function setDatabaseLogger(logger: DatabaseLogger): void {
  globalLogger = logger;
}

/**
 * Reset the global database logger (useful for testing)
 */
export function resetDatabaseLogger(): void {
  globalLogger = null;
}

/**
 * Get logger configuration from environment variables
 */
export function getLoggerConfigFromEnv(): Partial<LoggerConfig> {
  const config: Partial<LoggerConfig> = {};

  // Log level from environment
  const envLevel = process.env.DB_LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && envLevel in LOG_LEVELS) {
    config.level = envLevel;
  }

  // Log format from environment
  const envFormat = process.env.DB_LOG_FORMAT?.toLowerCase() as LogFormat;
  if (envFormat && ["console", "json", "structured"].includes(envFormat)) {
    config.format = envFormat;
  }

  // Environment-specific defaults
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === "production") {
    config.level = config.level || "info";
    config.format = config.format || "json";
    config.enableColors = false;
    config.filterSensitiveData = true;
  } else if (nodeEnv === "test") {
    config.level = config.level || "warn";
    config.format = config.format || "console";
    config.enableColors = false;
    config.enableTimestamps = false;
  } else {
    // Development defaults
    config.level = config.level || "debug";
    config.format = config.format || "console";
    config.enableColors = true;
    config.enableTimestamps = true;
  }

  // Other environment variables
  if (process.env.DB_LOG_DISABLE_TIMESTAMPS === "true") {
    config.enableTimestamps = false;
  }

  if (process.env.DB_LOG_DISABLE_CONTEXT === "true") {
    config.enableContext = false;
  }

  if (process.env.DB_LOG_DISABLE_METADATA === "true") {
    config.enableMetadata = false;
  }

  if (process.env.DB_LOG_DISABLE_COLORS === "true") {
    config.enableColors = false;
  }

  if (process.env.DB_LOG_DISABLE_SENSITIVE_FILTER === "true") {
    config.filterSensitiveData = false;
  }

  config.environment = nodeEnv || "development";

  return config;
}

/**
 * Integration with existing console.log patterns
 */

/**
 * Create a console.log compatible wrapper for the database logger
 */
export function createConsoleLogWrapper(logger?: DatabaseLogger): {
  log: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
} {
  const dbLogger = logger || getDatabaseLogger();

  return {
    log: (message: string, ...args: any[]) => {
      const context = args.length > 0 ? { additionalData: args } : undefined;
      dbLogger.info(message, context);
    },
    info: (message: string, ...args: any[]) => {
      const context = args.length > 0 ? { additionalData: args } : undefined;
      dbLogger.info(message, context);
    },
    warn: (message: string, ...args: any[]) => {
      const context = args.length > 0 ? { additionalData: args } : undefined;
      dbLogger.warn(message, context);
    },
    error: (message: string, ...args: any[]) => {
      const context = args.length > 0 ? { additionalData: args } : undefined;
      const error = args.find((arg) => arg instanceof Error);
      dbLogger.error(message, context, error);
    },
    debug: (message: string, ...args: any[]) => {
      const context = args.length > 0 ? { additionalData: args } : undefined;
      dbLogger.debug(message, context);
    },
  };
}

/**
 * Utility functions for common logging patterns
 */

/**
 * Log database operation start
 */
export function logOperationStart(
  operation: string,
  context?: LogContext,
  logger?: DatabaseLogger
): void {
  const dbLogger = logger || getDatabaseLogger();
  dbLogger.info(`Starting ${operation}`, {
    ...context,
    operation,
    phase: "start",
  });
}

/**
 * Log database operation success
 */
export function logOperationSuccess(
  operation: string,
  duration?: number,
  context?: LogContext,
  logger?: DatabaseLogger
): void {
  const dbLogger = logger || getDatabaseLogger();
  dbLogger.info(`Completed ${operation} successfully`, {
    ...context,
    operation,
    phase: "success",
    duration,
  });
}

/**
 * Log database operation failure
 */
export function logOperationFailure(
  operation: string,
  error: Error,
  context?: LogContext,
  logger?: DatabaseLogger
): void {
  const dbLogger = logger || getDatabaseLogger();
  dbLogger.error(
    `Failed ${operation}`,
    {
      ...context,
      operation,
      phase: "failure",
    },
    error
  );
}

/**
 * Create a timing wrapper for database operations
 */
export function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext,
  logger?: DatabaseLogger
): Promise<T> {
  const dbLogger = logger || getDatabaseLogger();
  const startTime = Date.now();

  logOperationStart(operation, context, dbLogger);

  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      logOperationSuccess(operation, duration, context, dbLogger);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logOperationFailure(operation, error, { ...context, duration }, dbLogger);
      throw error;
    });
}
