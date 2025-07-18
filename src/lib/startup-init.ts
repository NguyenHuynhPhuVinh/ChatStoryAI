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
  skipOnProduction?: boolean;
  logLevel: "minimal" | "detailed";
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

  // Skip if auto-initialization is disabled
  if (!finalConfig.autoInitEnabled) {
    console.log(
      "[STARTUP] Auto-initialization disabled via DB_AUTO_INIT=false"
    );
    isStartupComplete = true;
    return true;
  }

  // Skip in production if configured
  if (finalConfig.skipOnProduction && process.env.NODE_ENV === "production") {
    console.log("[STARTUP] Skipping database health check in production");
    isStartupComplete = true;
    return true;
  }

  // Skip if database health check is disabled
  if (!finalConfig.enableDatabaseHealthCheck) {
    console.log("[STARTUP] Database health check disabled");
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
 * Perform the actual startup initialization without timeout wrapper
 */
async function performActualInitialization(
  config: StartupConfig,
  startTime: number
): Promise<boolean> {
  try {
    console.log("[STARTUP] 🚀 Starting application initialization...");

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
 * Environment variable configuration helper
 */
export function getStartupConfigFromEnv(): Partial<StartupConfig> {
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

  return {
    autoInitEnabled,
    enableDatabaseHealthCheck: process.env.DB_HEALTH_CHECK_ENABLED !== "false",
    enableDatabaseCreation: process.env.DB_AUTO_CREATE_ENABLED !== "false", // Enable by default
    enableMigrationExecution: process.env.DB_MIGRATION_ENABLED !== "false", // Enable by default
    healthCheckTimeout: parseTimeout(
      process.env.DB_HEALTH_CHECK_TIMEOUT,
      10000,
      "DB_HEALTH_CHECK_TIMEOUT"
    ),
    initTimeout: parseTimeout(
      process.env.DB_INIT_TIMEOUT,
      60000,
      "DB_INIT_TIMEOUT"
    ),
    healthCheckRetryDelay: parseTimeout(
      process.env.DB_HEALTH_CHECK_RETRY_DELAY,
      2000,
      "DB_HEALTH_CHECK_RETRY_DELAY"
    ),
    migrationTimeout: parseTimeout(
      process.env.DB_MIGRATION_TIMEOUT,
      300000,
      "DB_MIGRATION_TIMEOUT"
    ),
    skipOnProduction: process.env.DB_HEALTH_CHECK_SKIP_PRODUCTION === "true",
    logLevel:
      (process.env.DB_HEALTH_CHECK_LOG_LEVEL as "minimal" | "detailed") ||
      "detailed",
    gracefulFailureConfig: {
      enableFallback: process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK !== "false",
      fallbackBehavior:
        (process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR as
          | "continue"
          | "exit"
          | "retry") || "continue",
      troubleshootingHints:
        process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS !== "false",
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
