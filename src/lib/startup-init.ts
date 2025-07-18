import {
  checkDatabaseHealth,
  handleGracefulFailure,
  shouldCrashOnFailure,
  DatabaseHealthResult,
  GracefulFailureConfig,
} from "./db-health";
import {
  createAndVerifyDatabase,
  DatabaseCreationResult,
  UserCreationResult,
  CreationVerificationResult,
} from "./db-creation";
import { runMigrations, MigrationSystemResult } from "./db-migration";

// Startup initialization configuration
export interface StartupConfig {
  autoInitEnabled: boolean; // Master switch for entire initialization process
  initMode: "development" | "production" | "test"; // Initialization mode
  enableDatabaseHealthCheck: boolean;
  enableDatabaseCreation: boolean; // New option for automatic database creation
  enableMigrationExecution: boolean; // New option for automatic migration execution
  healthCheckTimeout: number; // milliseconds
  initTimeout: number; // Overall initialization timeout in milliseconds
  healthCheckRetryDelay: number; // Health check retry interval in milliseconds
  migrationTimeout: number; // Migration execution timeout in milliseconds
  gracefulFailureConfig: Partial<GracefulFailureConfig>;
  retryAttempts: number; // Number of retry attempts for failed operations
  retryDelay: number; // Delay between retry attempts in milliseconds
  skipOnProduction?: boolean;
  logLevel: "silent" | "minimal" | "detailed" | "verbose" | "debug";
  databaseCreationOptions?: {
    skipUserCreation?: boolean;
    username?: string;
    password?: string;
    host?: string;
  };
  migrationOptions?: {
    skipFailedScripts?: boolean;
    dryRun?: boolean;
    migrationDirectory?: string;
    skipScripts?: string[]; // Array of script names to skip
    skipPattern?: string; // Regex pattern for scripts to skip
  };
}

// Default startup configuration
const DEFAULT_STARTUP_CONFIG: StartupConfig = {
  autoInitEnabled: true, // Enable automatic initialization by default
  initMode: "development", // Default to development mode
  enableDatabaseHealthCheck: true,
  enableDatabaseCreation: true, // Enable automatic database creation by default
  enableMigrationExecution: true, // Enable automatic migration execution by default
  healthCheckTimeout: 10000, // 10 seconds
  initTimeout: 60000, // 60 seconds for overall initialization
  healthCheckRetryDelay: 2000, // 2 seconds between health check retries
  migrationTimeout: 300000, // 5 minutes for migration execution
  gracefulFailureConfig: {
    enableFallback: true,
    fallbackBehavior: "continue",
    troubleshootingHints: true,
  },
  retryAttempts: 3, // Default to 3 retry attempts
  retryDelay: 5000, // Default to 5 seconds between retries
  skipOnProduction: false,
  logLevel: "detailed",
  databaseCreationOptions: {
    skipUserCreation: false,
  },
  migrationOptions: {
    skipFailedScripts: false,
    dryRun: false,
  },
};

// Global startup state
let isStartupComplete = false;
let startupPromise: Promise<boolean> | null = null;
let lastHealthCheckResult: DatabaseHealthResult | null = null;
let lastDatabaseCreationResult: {
  databaseResult: DatabaseCreationResult;
  userResult?: UserCreationResult;
  verificationResult: CreationVerificationResult;
  overallSuccess: boolean;
  summary: string;
} | null = null;
let lastMigrationResult: MigrationSystemResult | null = null;

/**
 * Main startup initialization function
 */
export async function initializeApplication(
  config: Partial<StartupConfig> = {}
): Promise<boolean> {
  // Return existing promise if startup is already in progress
  if (startupPromise) {
    return startupPromise;
  }

  // Return immediately if startup is already complete
  if (isStartupComplete) {
    return true;
  }

  const finalConfig = { ...DEFAULT_STARTUP_CONFIG, ...config };

  // Set startup logger level based on configuration
  setStartupLogLevel(finalConfig.logLevel);
  const logger = getStartupLogger();

  // Validate configuration and log summary
  const validation = validateStartupConfig(finalConfig);
  if (!validation.isValid) {
    logger.error("❌ Configuration validation failed:");
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error(
      `Invalid startup configuration: ${validation.errors.join(", ")}`
    );
  }

  // Log configuration summary (only in detailed mode or higher)
  if (finalConfig.logLevel !== "silent" && finalConfig.logLevel !== "minimal") {
    logConfigurationSummary(finalConfig, logger);
  }

  // Skip if auto-initialization is disabled
  if (!finalConfig.autoInitEnabled) {
    logger.minimal("Auto-initialization disabled via DB_AUTO_INIT=false");
    isStartupComplete = true;
    return true;
  }

  // Skip in production if configured
  if (finalConfig.skipOnProduction && process.env.NODE_ENV === "production") {
    logger.minimal("Skipping database health check in production");
    isStartupComplete = true;
    return true;
  }

  // Skip if database health check is disabled
  if (!finalConfig.enableDatabaseHealthCheck) {
    logger.minimal("Database health check disabled");
    isStartupComplete = true;
    return true;
  }

  startupPromise = performStartupInitialization(finalConfig);
  return startupPromise;
}

/**
 * Perform the actual startup initialization
 */
async function performStartupInitialization(
  config: StartupConfig
): Promise<boolean> {
  const startTime = Date.now();

  // Create overall initialization timeout
  const initializationPromise = performActualInitialization(config, startTime);
  const timeoutPromise = new Promise<boolean>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(`Initialization timeout after ${config.initTimeout}ms`)
        ),
      config.initTimeout
    );
  });

  try {
    return await Promise.race([initializationPromise, timeoutPromise]);
  } catch (error) {
    console.error(
      "[STARTUP] 💥 Fatal error during application initialization:",
      error
    );

    // Check if we should crash on failure
    if (lastHealthCheckResult) {
      const shouldCrash = shouldCrashOnFailure(
        lastHealthCheckResult,
        config.gracefulFailureConfig
      );
      if (!shouldCrash) {
        console.warn("[STARTUP] ⚠️  Continuing despite initialization errors");
        isStartupComplete = true;
        return false;
      }
    }

    throw error;
  }
}

/**
 * Retry wrapper for operations that support retry behavior
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: StartupConfig,
  operationName: string,
  logger: StartupLogger
): Promise<T> {
  const maxAttempts = config.retryAttempts + 1; // +1 for initial attempt
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(`${operationName} - Attempt ${attempt}/${maxAttempts}`);
      const result = await operation();

      if (attempt > 1) {
        logger.detailed(
          `${operationName} succeeded on attempt ${attempt}/${maxAttempts}`
        );
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        logger.warn(
          `${operationName} failed on attempt ${attempt}/${maxAttempts}: ${lastError.message}. Retrying in ${config.retryDelay}ms...`
        );

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      } else {
        logger.error(
          `${operationName} failed after ${maxAttempts} attempts: ${lastError.message}`
        );
      }
    }
  }

  // All attempts failed
  throw lastError!;
}

/**
 * Perform the actual startup initialization without timeout wrapper
 */
async function performActualInitialization(
  config: StartupConfig,
  startTime: number
): Promise<boolean> {
  const logger = getStartupLogger();

  try {
    logger.minimal("🚀 Starting application initialization...");

    // Handle retry behavior for the entire initialization process
    if (
      config.gracefulFailureConfig.fallbackBehavior === "retry" &&
      config.retryAttempts > 0
    ) {
      return await withRetry(
        () => performInitializationSteps(config, startTime, logger),
        config,
        "Application Initialization",
        logger
      );
    } else {
      return await performInitializationSteps(config, startTime, logger);
    }
  } catch (error) {
    // Re-throw error to be handled by the timeout wrapper
    throw error;
  }
}

/**
 * Perform the individual initialization steps
 */
async function performInitializationSteps(
  config: StartupConfig,
  startTime: number,
  logger: StartupLogger
): Promise<boolean> {
  try {
    // Step 0: Database Creation (if enabled)
    if (config.enableDatabaseCreation) {
      console.log("[STARTUP] 🔧 Running automatic database creation...");

      try {
        const creationResult = await createAndVerifyDatabase(
          config.databaseCreationOptions || {}
        );
        lastDatabaseCreationResult = creationResult;

        if (config.logLevel === "detailed") {
          console.log(
            "[STARTUP] 📋 Database creation summary:",
            creationResult.summary
          );
        }

        if (!creationResult.overallSuccess) {
          console.warn(
            "[STARTUP] ⚠️ Database creation completed with issues, continuing with health check..."
          );
        } else {
          console.log("[STARTUP] ✅ Database creation completed successfully");
        }
      } catch (creationError) {
        console.error("[STARTUP] ❌ Database creation failed:", creationError);
        // Continue with migration execution even if creation fails
      }
    }

    // Step 0.5: Migration Execution (if enabled and database creation succeeded)
    if (
      config.enableMigrationExecution &&
      (!lastDatabaseCreationResult || lastDatabaseCreationResult.overallSuccess)
    ) {
      console.log("[STARTUP] 🔄 Running database migrations...");

      try {
        const migrationResult = await runMigrations(
          config.migrationOptions?.migrationDirectory,
          {
            skipFailedScripts:
              config.migrationOptions?.skipFailedScripts || false,
            dryRun: config.migrationOptions?.dryRun || false,
            skipScripts: config.migrationOptions?.skipScripts,
            skipPattern: config.migrationOptions?.skipPattern,
          }
        );
        lastMigrationResult = migrationResult;

        if (config.logLevel === "detailed") {
          console.log("[STARTUP] 📋 Migration summary:", {
            totalScripts: migrationResult.totalScripts,
            executedScripts: migrationResult.executedScripts,
            skippedScripts: migrationResult.skippedScripts,
            failedScripts: migrationResult.failedScripts,
            executionTime: migrationResult.totalExecutionTime,
          });
        }

        if (!migrationResult.success) {
          console.warn(
            "[STARTUP] ⚠️ Migration execution completed with issues, continuing with health check..."
          );
          if (
            migrationResult.errors.length > 0 &&
            config.logLevel === "detailed"
          ) {
            console.warn(
              "[STARTUP] Migration errors:",
              migrationResult.errors.map((e) => e.message)
            );
          }
        } else {
          console.log(
            `[STARTUP] ✅ Migration execution completed successfully (${migrationResult.executedScripts}/${migrationResult.totalScripts} scripts executed)`
          );
        }
      } catch (migrationError) {
        console.error(
          "[STARTUP] ❌ Migration execution failed:",
          migrationError
        );
        // Continue with health check even if migration fails
      }
    } else if (
      config.enableMigrationExecution &&
      lastDatabaseCreationResult &&
      !lastDatabaseCreationResult.overallSuccess
    ) {
      console.warn(
        "[STARTUP] ⚠️ Skipping migration execution due to database creation issues"
      );
    }

    // Step 1: Database Health Check
    console.log("[STARTUP] 📊 Running database health check...");

    const healthCheckPromise = checkDatabaseHealth();
    const timeoutPromise = new Promise<DatabaseHealthResult>((_, reject) => {
      setTimeout(
        () => reject(new Error("Health check timeout")),
        config.healthCheckTimeout
      );
    });

    let healthResult: DatabaseHealthResult;
    try {
      healthResult = await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch (error) {
      // Handle timeout or other errors
      healthResult = {
        isHealthy: false,
        connectionStatus: {
          isConnected: false,
          retryAttempts: 0,
          maxRetries: 5,
        },
        versionCheck: {
          isCompatible: false,
          currentVersion: "Unknown",
          requiredVersion: "8.0.0",
        },
        permissionsCheck: {
          hasAllPermissions: false,
          permissions: {
            CREATE: false,
            DROP: false,
            INSERT: false,
            SELECT: false,
            UPDATE: false,
            DELETE: false,
          },
          missingPermissions: ["ALL"],
        },
        errors: [
          {
            type: "connection",
            message:
              error instanceof Error ? error.message : "Health check failed",
            timestamp: new Date(),
          },
        ],
        timestamp: new Date(),
        totalCheckTime: Date.now() - startTime,
      };
    }

    lastHealthCheckResult = healthResult;

    // Step 2: Handle results
    if (healthResult.isHealthy) {
      const totalTime = Date.now() - startTime;
      console.log(
        `[STARTUP] ✅ Application initialization completed successfully in ${totalTime}ms`
      );

      if (config.logLevel === "detailed") {
        console.log("[STARTUP] 📋 Health check summary:", {
          connection: healthResult.connectionStatus.isConnected,
          version: healthResult.versionCheck.currentVersion,
          permissions: healthResult.permissionsCheck.hasAllPermissions,
          totalTime: healthResult.totalCheckTime,
        });
      }

      isStartupComplete = true;
      return true;
    } else {
      // Handle graceful failure
      const failureResult = handleGracefulFailure(
        healthResult,
        config.gracefulFailureConfig
      );

      console.error("[STARTUP] ❌ Database health check failed");
      if (config.logLevel === "detailed") {
        console.error(failureResult.errorMessage);
      }

      // Determine if we should crash or continue
      const shouldCrash = shouldCrashOnFailure(
        healthResult,
        config.gracefulFailureConfig
      );

      if (shouldCrash) {
        console.error(
          "[STARTUP] 🛑 Application cannot continue due to database issues"
        );
        throw new Error(
          "Database health check failed - application cannot start"
        );
      } else {
        console.warn(
          "[STARTUP] ⚠️  Continuing with limited functionality due to database issues"
        );
        isStartupComplete = true;
        return false; // Indicate partial success
      }
    }
  } catch (error) {
    // Re-throw error to be handled by the timeout wrapper
    throw error;
  }
}

/**
 * Get the last health check result
 */
export function getLastHealthCheckResult(): DatabaseHealthResult | null {
  return lastHealthCheckResult;
}

/**
 * Get the last database creation result
 */
export function getLastDatabaseCreationResult(): typeof lastDatabaseCreationResult {
  return lastDatabaseCreationResult;
}

/**
 * Get the last migration result
 */
export function getLastMigrationResult(): MigrationSystemResult | null {
  return lastMigrationResult;
}

/**
 * Check if startup initialization is complete
 */
export function isStartupInitialized(): boolean {
  return isStartupComplete;
}

/**
 * Reset startup state (useful for testing)
 */
export function resetStartupState(): void {
  isStartupComplete = false;
  startupPromise = null;
  lastHealthCheckResult = null;
  lastDatabaseCreationResult = null;
  lastMigrationResult = null;
}

/**
 * Logging levels in order of verbosity (lowest to highest)
 */
const LOG_LEVELS = {
  silent: 0,
  minimal: 1,
  detailed: 2,
  verbose: 3,
  debug: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Startup logger with configurable log levels
 */
class StartupLogger {
  private currentLevel: LogLevel;

  constructor(level: LogLevel = "detailed") {
    this.currentLevel = level;
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
  }

  silent(message: string, ...args: any[]) {
    // Silent level never logs anything
  }

  minimal(message: string, ...args: any[]) {
    if (this.shouldLog("minimal")) {
      console.log(`[STARTUP] ${message}`, ...args);
    }
  }

  detailed(message: string, ...args: any[]) {
    if (this.shouldLog("detailed")) {
      console.log(`[STARTUP] ${message}`, ...args);
    }
  }

  verbose(message: string, ...args: any[]) {
    if (this.shouldLog("verbose")) {
      console.log(`[STARTUP] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog("debug")) {
      console.log(`[STARTUP] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog("minimal")) {
      console.warn(`[STARTUP] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog("minimal")) {
      console.error(`[STARTUP] ${message}`, ...args);
    }
  }
}

// Global startup logger instance
let startupLogger = new StartupLogger();

/**
 * Get the current startup logger instance
 */
export function getStartupLogger(): StartupLogger {
  return startupLogger;
}

/**
 * Update the startup logger level
 */
export function setStartupLogLevel(level: LogLevel) {
  startupLogger.setLevel(level);
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    mode: string;
    logLevel: string;
    autoInitEnabled: boolean;
    timeouts: {
      init: number;
      healthCheck: number;
      migration: number;
    };
    retry: {
      attempts: number;
      delay: number;
      fallbackBehavior: string;
    };
  };
}

/**
 * Validate startup configuration and provide detailed feedback
 */
export function validateStartupConfig(
  config: StartupConfig
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate timeout values
  if (config.initTimeout <= 0) {
    errors.push(
      `Invalid initTimeout: ${config.initTimeout}. Must be positive.`
    );
  }
  if (config.healthCheckTimeout <= 0) {
    errors.push(
      `Invalid healthCheckTimeout: ${config.healthCheckTimeout}. Must be positive.`
    );
  }
  if (config.migrationTimeout <= 0) {
    errors.push(
      `Invalid migrationTimeout: ${config.migrationTimeout}. Must be positive.`
    );
  }
  if (config.healthCheckRetryDelay <= 0) {
    errors.push(
      `Invalid healthCheckRetryDelay: ${config.healthCheckRetryDelay}. Must be positive.`
    );
  }

  // Validate retry configuration
  if (config.retryAttempts < 0) {
    errors.push(
      `Invalid retryAttempts: ${config.retryAttempts}. Must be non-negative.`
    );
  }
  if (config.retryDelay <= 0) {
    errors.push(`Invalid retryDelay: ${config.retryDelay}. Must be positive.`);
  }

  // Validate timeout relationships
  if (config.healthCheckTimeout >= config.initTimeout) {
    warnings.push(
      `healthCheckTimeout (${config.healthCheckTimeout}ms) should be less than initTimeout (${config.initTimeout}ms)`
    );
  }

  // Validate retry configuration logic
  if (
    config.gracefulFailureConfig.fallbackBehavior === "retry" &&
    config.retryAttempts === 0
  ) {
    warnings.push(
      "Fallback behavior is set to 'retry' but retryAttempts is 0. No retries will be performed."
    );
  }

  // Production mode warnings
  if (config.initMode === "production") {
    if (config.logLevel === "debug" || config.logLevel === "verbose") {
      warnings.push(
        `Log level '${config.logLevel}' may produce excessive output in production. Consider 'minimal' or 'detailed'.`
      );
    }
    if (config.retryAttempts > 3) {
      warnings.push(
        `High retry attempts (${config.retryAttempts}) in production may cause delays. Consider reducing to 1-3.`
      );
    }
  }

  // Development mode suggestions
  if (config.initMode === "development") {
    if (config.logLevel === "silent") {
      warnings.push(
        "Log level 'silent' in development mode may hide important debugging information."
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      mode: config.initMode,
      logLevel: config.logLevel,
      autoInitEnabled: config.autoInitEnabled,
      timeouts: {
        init: config.initTimeout,
        healthCheck: config.healthCheckTimeout,
        migration: config.migrationTimeout,
      },
      retry: {
        attempts: config.retryAttempts,
        delay: config.retryDelay,
        fallbackBehavior:
          config.gracefulFailureConfig.fallbackBehavior || "continue",
      },
    },
  };
}

/**
 * Log configuration summary with validation results
 */
export function logConfigurationSummary(
  config: StartupConfig,
  logger: StartupLogger
) {
  const validation = validateStartupConfig(config);

  logger.detailed("📋 Startup Configuration Summary:");
  logger.detailed(`  Mode: ${validation.summary.mode}`);
  logger.detailed(
    `  Auto-init: ${
      validation.summary.autoInitEnabled ? "enabled" : "disabled"
    }`
  );
  logger.detailed(`  Log Level: ${validation.summary.logLevel}`);
  logger.detailed(
    `  Timeouts: init=${validation.summary.timeouts.init}ms, health=${validation.summary.timeouts.healthCheck}ms, migration=${validation.summary.timeouts.migration}ms`
  );
  logger.detailed(
    `  Retry: attempts=${validation.summary.retry.attempts}, delay=${validation.summary.retry.delay}ms, behavior=${validation.summary.retry.fallbackBehavior}`
  );

  // Log validation errors
  if (validation.errors.length > 0) {
    logger.error("❌ Configuration Errors:");
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
  }

  // Log validation warnings
  if (validation.warnings.length > 0) {
    logger.warn("⚠️  Configuration Warnings:");
    validation.warnings.forEach((warning) => logger.warn(`  - ${warning}`));
  }

  if (validation.isValid && validation.warnings.length === 0) {
    logger.detailed("✅ Configuration validation passed with no issues");
  }
}

/**
 * Environment variable documentation
 */
export interface EnvVarDoc {
  name: string;
  description: string;
  type: string;
  defaultValue: string;
  validValues?: string[];
  example?: string;
}

/**
 * Generate comprehensive environment variable documentation
 */
export function generateEnvVarDocumentation(): EnvVarDoc[] {
  return [
    {
      name: "DB_AUTO_INIT",
      description: "Master switch for entire database initialization process",
      type: "boolean",
      defaultValue: "true",
      validValues: ["true", "false", "1", "0"],
      example: "DB_AUTO_INIT=false",
    },
    {
      name: "DB_INIT_MODE",
      description: "Initialization mode with different default configurations",
      type: "string",
      defaultValue: "development (or based on NODE_ENV)",
      validValues: ["development", "production", "test"],
      example: "DB_INIT_MODE=production",
    },
    {
      name: "DB_LOG_LEVEL",
      description: "Logging verbosity level for startup process",
      type: "string",
      defaultValue: "detailed (development), minimal (production/test)",
      validValues: ["silent", "minimal", "detailed", "verbose", "debug"],
      example: "DB_LOG_LEVEL=verbose",
    },
    {
      name: "DB_INIT_TIMEOUT",
      description: "Overall timeout for entire initialization process",
      type: "number (milliseconds)",
      defaultValue: "120000 (development), 30000 (production), 10000 (test)",
      example: "DB_INIT_TIMEOUT=60000",
    },
    {
      name: "DB_HEALTH_CHECK_TIMEOUT",
      description: "Timeout for individual database health checks",
      type: "number (milliseconds)",
      defaultValue: "15000 (development), 5000 (production), 2000 (test)",
      example: "DB_HEALTH_CHECK_TIMEOUT=10000",
    },
    {
      name: "DB_HEALTH_CHECK_RETRY_DELAY",
      description: "Delay between health check retry attempts",
      type: "number (milliseconds)",
      defaultValue: "3000 (development), 1000 (production), 500 (test)",
      example: "DB_HEALTH_CHECK_RETRY_DELAY=2000",
    },
    {
      name: "DB_MIGRATION_TIMEOUT",
      description: "Timeout for migration execution",
      type: "number (milliseconds)",
      defaultValue: "600000 (development), 120000 (production), 30000 (test)",
      example: "DB_MIGRATION_TIMEOUT=300000",
    },
    {
      name: "DB_INIT_FALLBACK_BEHAVIOR",
      description: "Behavior when initialization encounters errors",
      type: "string",
      defaultValue: "continue (development), exit (production/test)",
      validValues: ["continue", "exit", "retry"],
      example: "DB_INIT_FALLBACK_BEHAVIOR=retry",
    },
    {
      name: "DB_INIT_RETRY_ATTEMPTS",
      description: "Number of retry attempts for failed operations",
      type: "number",
      defaultValue: "5 (development), 1 (production), 0 (test)",
      example: "DB_INIT_RETRY_ATTEMPTS=3",
    },
    {
      name: "DB_INIT_RETRY_DELAY",
      description: "Delay between retry attempts",
      type: "number (milliseconds)",
      defaultValue: "10000 (development), 2000 (production), 1000 (test)",
      example: "DB_INIT_RETRY_DELAY=5000",
    },
    {
      name: "DB_MIGRATION_SKIP_SCRIPTS",
      description: "Comma-separated list of migration script names to skip",
      type: "string (comma-separated)",
      defaultValue: "undefined",
      example: "DB_MIGRATION_SKIP_SCRIPTS=01-test.sql,02-demo.sql",
    },
    {
      name: "DB_MIGRATION_SKIP_PATTERN",
      description: "Regex pattern to match migration scripts to skip",
      type: "string (regex)",
      defaultValue: "undefined",
      example: "DB_MIGRATION_SKIP_PATTERN=test|demo",
    },
  ];
}

/**
 * Print environment variable documentation to console
 */
export function printEnvVarDocumentation() {
  const docs = generateEnvVarDocumentation();

  console.log(
    "\n📚 Database Initialization Environment Variables Documentation\n"
  );
  console.log("=".repeat(80));

  docs.forEach((doc, index) => {
    console.log(`\n${index + 1}. ${doc.name}`);
    console.log(`   Description: ${doc.description}`);
    console.log(`   Type: ${doc.type}`);
    console.log(`   Default: ${doc.defaultValue}`);

    if (doc.validValues) {
      console.log(`   Valid Values: ${doc.validValues.join(", ")}`);
    }

    if (doc.example) {
      console.log(`   Example: ${doc.example}`);
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log(
    "For more information, see the .env.example file in your project root.\n"
  );
}

/**
 * Determine initialization mode from environment variables
 */
function determineInitMode(): "development" | "production" | "test" {
  // Check DB_INIT_MODE first
  const dbInitMode = process.env.DB_INIT_MODE?.toLowerCase();
  if (
    dbInitMode === "development" ||
    dbInitMode === "production" ||
    dbInitMode === "test"
  ) {
    return dbInitMode;
  }

  // Fall back to NODE_ENV
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === "production") {
    return "production";
  } else if (nodeEnv === "test") {
    return "test";
  } else {
    return "development"; // Default to development
  }
}

/**
 * Get mode-specific configuration defaults
 */
function getModeSpecificDefaults(
  mode: "development" | "production" | "test"
): Partial<StartupConfig> {
  switch (mode) {
    case "production":
      return {
        initTimeout: 30000, // 30 seconds - stricter timeout
        healthCheckTimeout: 5000, // 5 seconds - stricter timeout
        healthCheckRetryDelay: 1000, // 1 second - faster retries
        migrationTimeout: 120000, // 2 minutes - stricter timeout
        retryAttempts: 1, // Minimal retries in production
        retryDelay: 2000, // 2 seconds between retries
        logLevel: "minimal", // Minimal logging in production
        gracefulFailureConfig: {
          enableFallback: false, // Fail fast in production
          fallbackBehavior: "exit",
          troubleshootingHints: false,
        },
      };

    case "test":
      return {
        initTimeout: 10000, // 10 seconds - fast for tests
        healthCheckTimeout: 2000, // 2 seconds - fast for tests
        healthCheckRetryDelay: 500, // 0.5 seconds - fast retries
        migrationTimeout: 30000, // 30 seconds - fast for tests
        retryAttempts: 0, // No retries in tests for fast failure
        retryDelay: 1000, // 1 second if retries are enabled
        logLevel: "minimal", // Minimal logging in tests
        gracefulFailureConfig: {
          enableFallback: false, // Fail fast in tests
          fallbackBehavior: "exit",
          troubleshootingHints: false,
        },
      };

    case "development":
    default:
      return {
        initTimeout: 120000, // 2 minutes - generous timeout for development
        healthCheckTimeout: 15000, // 15 seconds - generous timeout
        healthCheckRetryDelay: 3000, // 3 seconds - slower retries for debugging
        migrationTimeout: 600000, // 10 minutes - very generous for development
        retryAttempts: 5, // More retries in development for debugging
        retryDelay: 10000, // 10 seconds between retries for debugging
        logLevel: "detailed", // Verbose logging in development
        gracefulFailureConfig: {
          enableFallback: true, // Continue with warnings in development
          fallbackBehavior: "continue",
          troubleshootingHints: true,
        },
      };
  }
}

/**
 * Environment variable configuration helper
 */
export function getStartupConfigFromEnv(): Partial<StartupConfig> {
  // Determine initialization mode
  const initMode = determineInitMode();

  // Get mode-specific defaults
  const modeDefaults = getModeSpecificDefaults(initMode);

  // Parse DB_AUTO_INIT with validation and default value handling
  const autoInitValue = process.env.DB_AUTO_INIT;
  let autoInitEnabled = true; // Default to true

  if (autoInitValue !== undefined) {
    if (autoInitValue.toLowerCase() === "false" || autoInitValue === "0") {
      autoInitEnabled = false;
    } else if (
      autoInitValue.toLowerCase() === "true" ||
      autoInitValue === "1"
    ) {
      autoInitEnabled = true;
    } else {
      console.warn(
        `[STARTUP] Invalid DB_AUTO_INIT value: "${autoInitValue}". Using default: true. Valid values: true, false, 1, 0`
      );
    }
  }

  // Parse timeout values with validation
  const parseTimeout = (
    envVar: string | undefined,
    defaultValue: number,
    name: string
  ): number => {
    if (!envVar) return defaultValue;

    const parsed = parseInt(envVar);
    if (isNaN(parsed) || parsed <= 0) {
      console.warn(
        `[STARTUP] Invalid ${name} value: "${envVar}". Using default: ${defaultValue}ms. Must be a positive number.`
      );
      return defaultValue;
    }

    return parsed;
  };

  // Create base configuration with mode defaults
  const baseConfig = {
    autoInitEnabled,
    initMode,
    enableDatabaseHealthCheck: process.env.DB_HEALTH_CHECK_ENABLED !== "false",
    enableDatabaseCreation: process.env.DB_AUTO_CREATE_ENABLED !== "false", // Enable by default
    enableMigrationExecution: process.env.DB_MIGRATION_ENABLED !== "false", // Enable by default
    healthCheckTimeout: parseTimeout(
      process.env.DB_HEALTH_CHECK_TIMEOUT,
      modeDefaults.healthCheckTimeout || 10000,
      "DB_HEALTH_CHECK_TIMEOUT"
    ),
    initTimeout: parseTimeout(
      process.env.DB_INIT_TIMEOUT,
      modeDefaults.initTimeout || 60000,
      "DB_INIT_TIMEOUT"
    ),
    healthCheckRetryDelay: parseTimeout(
      process.env.DB_HEALTH_CHECK_RETRY_DELAY,
      modeDefaults.healthCheckRetryDelay || 2000,
      "DB_HEALTH_CHECK_RETRY_DELAY"
    ),
    migrationTimeout: parseTimeout(
      process.env.DB_MIGRATION_TIMEOUT,
      modeDefaults.migrationTimeout || 300000,
      "DB_MIGRATION_TIMEOUT"
    ),
    retryAttempts: parseTimeout(
      process.env.DB_INIT_RETRY_ATTEMPTS,
      modeDefaults.retryAttempts || 3,
      "DB_INIT_RETRY_ATTEMPTS"
    ),
    retryDelay: parseTimeout(
      process.env.DB_INIT_RETRY_DELAY,
      modeDefaults.retryDelay || 5000,
      "DB_INIT_RETRY_DELAY"
    ),
    skipOnProduction: process.env.DB_HEALTH_CHECK_SKIP_PRODUCTION === "true",
    logLevel: (() => {
      // Check DB_LOG_LEVEL first, then fall back to DB_HEALTH_CHECK_LOG_LEVEL for backward compatibility
      const dbLogLevel = process.env.DB_LOG_LEVEL?.toLowerCase();
      const legacyLogLevel =
        process.env.DB_HEALTH_CHECK_LOG_LEVEL?.toLowerCase();

      const validLevels: LogLevel[] = [
        "silent",
        "minimal",
        "detailed",
        "verbose",
        "debug",
      ];

      if (dbLogLevel && validLevels.includes(dbLogLevel as LogLevel)) {
        return dbLogLevel as LogLevel;
      }

      if (
        legacyLogLevel &&
        (legacyLogLevel === "minimal" || legacyLogLevel === "detailed")
      ) {
        return legacyLogLevel as LogLevel;
      }

      return modeDefaults.logLevel || "detailed";
    })(),
    gracefulFailureConfig: {
      enableFallback:
        process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK !== undefined
          ? process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK !== "false"
          : modeDefaults.gracefulFailureConfig?.enableFallback !== false,
      fallbackBehavior: (() => {
        // Check DB_INIT_FALLBACK_BEHAVIOR first, then fall back to legacy setting
        const initFallbackBehavior =
          process.env.DB_INIT_FALLBACK_BEHAVIOR?.toLowerCase();
        const legacyFallbackBehavior =
          process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR?.toLowerCase();

        const validBehaviors = ["continue", "exit", "retry"];

        if (
          initFallbackBehavior &&
          validBehaviors.includes(initFallbackBehavior)
        ) {
          return initFallbackBehavior as "continue" | "exit" | "retry";
        }

        if (
          legacyFallbackBehavior &&
          validBehaviors.includes(legacyFallbackBehavior)
        ) {
          return legacyFallbackBehavior as "continue" | "exit" | "retry";
        }

        return (
          modeDefaults.gracefulFailureConfig?.fallbackBehavior || "continue"
        );
      })(),
      troubleshootingHints:
        process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS !== undefined
          ? process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS !== "false"
          : modeDefaults.gracefulFailureConfig?.troubleshootingHints !== false,
    },
    databaseCreationOptions: {
      skipUserCreation: process.env.DB_SKIP_USER_CREATION === "true",
      username: process.env.DB_CREATE_USERNAME,
      password: process.env.DB_CREATE_PASSWORD,
      host: process.env.DB_CREATE_HOST,
    },
    migrationOptions: {
      skipFailedScripts: process.env.DB_MIGRATION_SKIP_FAILED === "true",
      dryRun: process.env.DB_MIGRATION_DRY_RUN === "true",
      migrationDirectory: process.env.DB_MIGRATION_DIRECTORY,
      skipScripts: process.env.DB_MIGRATION_SKIP_SCRIPTS
        ? (() => {
            const scripts = process.env
              .DB_MIGRATION_SKIP_SCRIPTS!.split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            return scripts.length > 0 ? scripts : undefined;
          })()
        : undefined,
      skipPattern: process.env.DB_MIGRATION_SKIP_PATTERN || undefined,
    },
  };

  return baseConfig;
}

/**
 * Middleware-compatible initialization function
 */
export async function initializeForMiddleware(): Promise<boolean> {
  try {
    const config = getStartupConfigFromEnv();
    return await initializeApplication(config);
  } catch (error) {
    console.error("[STARTUP] Middleware initialization failed:", error);
    return false;
  }
}

/**
 * Server-side initialization for API routes
 */
export async function ensureInitialized(): Promise<void> {
  if (!isStartupComplete) {
    const config = getStartupConfigFromEnv();
    await initializeApplication(config);
  }
}
