/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise";
import pool from "./db";

// TypeScript types cho health check results
export interface DatabaseHealthResult {
  isHealthy: boolean;
  connectionStatus: ConnectionStatus;
  versionCheck: VersionCheckResult;
  permissionsCheck: PermissionsCheckResult;
  errors: HealthCheckError[];
  timestamp: Date;
  totalCheckTime: number; // milliseconds
}

export interface ConnectionStatus {
  isConnected: boolean;
  retryAttempts: number;
  maxRetries: number;
  lastError?: string;
  connectionTime?: number; // milliseconds
}

export interface VersionCheckResult {
  isCompatible: boolean;
  currentVersion: string;
  requiredVersion: string;
  versionNumber?: number;
}

export interface PermissionsCheckResult {
  hasAllPermissions: boolean;
  permissions: {
    CREATE: boolean;
    DROP: boolean;
    INSERT: boolean;
    SELECT: boolean;
    UPDATE: boolean;
    DELETE: boolean;
  };
  missingPermissions: string[];
}

export interface HealthCheckError {
  type: "connection" | "version" | "permission";
  message: string;
  details?: any;
  timestamp: Date;
}

// Configuration constants
const HEALTH_CHECK_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_INTERVAL: 2000, // 2 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  REQUIRED_MYSQL_VERSION: "8.0.0",
  REQUIRED_PERMISSIONS: [
    "CREATE",
    "DROP",
    "INSERT",
    "SELECT",
    "UPDATE",
    "DELETE",
  ],
} as const;

/**
 * Main health check function với retry mechanism
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const result: DatabaseHealthResult = {
    isHealthy: false,
    connectionStatus: {
      isConnected: false,
      retryAttempts: 0,
      maxRetries: HEALTH_CHECK_CONFIG.MAX_RETRIES,
    },
    versionCheck: {
      isCompatible: false,
      currentVersion: "",
      requiredVersion: HEALTH_CHECK_CONFIG.REQUIRED_MYSQL_VERSION,
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
      missingPermissions: [],
    },
    errors: [],
    timestamp: new Date(),
    totalCheckTime: 0,
  };

  try {
    // Step 1: Test connection với retry mechanism
    const connectionResult = await testConnectionWithRetry();
    result.connectionStatus = connectionResult;

    if (!connectionResult.isConnected) {
      const error: HealthCheckError = {
        type: "connection",
        message: `Failed to connect to database after ${connectionResult.retryAttempts} attempts`,
        details: connectionResult.lastError,
        timestamp: new Date(),
      };
      result.errors.push(error);
      dbHealthLogger.logError(error);
      result.totalCheckTime = Date.now() - startTime;
      dbHealthLogger.logHealthCheck(result);
      return result;
    }

    // Step 2: Check MySQL version
    const versionResult = await checkMySQLVersion();
    result.versionCheck = versionResult;
    dbHealthLogger.logVersionCheck(
      versionResult.currentVersion,
      versionResult.isCompatible
    );

    if (!versionResult.isCompatible) {
      const error: HealthCheckError = {
        type: "version",
        message: `MySQL version ${versionResult.currentVersion} is not compatible. Required: ${versionResult.requiredVersion}+`,
        timestamp: new Date(),
      };
      result.errors.push(error);
      dbHealthLogger.logError(error);
    }

    // Step 3: Check user permissions
    const permissionsResult = await checkUserPermissions();
    result.permissionsCheck = permissionsResult;
    dbHealthLogger.logPermissionCheck(permissionsResult);

    if (!permissionsResult.hasAllPermissions) {
      const error: HealthCheckError = {
        type: "permission",
        message: `Missing required permissions: ${permissionsResult.missingPermissions.join(
          ", "
        )}`,
        details: permissionsResult.permissions,
        timestamp: new Date(),
      };
      result.errors.push(error);
      dbHealthLogger.logError(error);
    }

    // Determine overall health
    result.isHealthy =
      connectionResult.isConnected &&
      versionResult.isCompatible &&
      permissionsResult.hasAllPermissions;
  } catch (error) {
    const healthError: HealthCheckError = {
      type: "connection",
      message: "Unexpected error during health check",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(healthError);
    dbHealthLogger.logError(healthError);
  }

  result.totalCheckTime = Date.now() - startTime;
  dbHealthLogger.logHealthCheck(result);
  return result;
}

/**
 * Test database connection với retry mechanism
 */
async function testConnectionWithRetry(): Promise<ConnectionStatus> {
  const result: ConnectionStatus = {
    isConnected: false,
    retryAttempts: 0,
    maxRetries: HEALTH_CHECK_CONFIG.MAX_RETRIES,
  };

  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.MAX_RETRIES; attempt++) {
    result.retryAttempts = attempt;

    try {
      const connectionStart = Date.now();

      // Test connection using existing pool
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      result.isConnected = true;
      result.connectionTime = Date.now() - connectionStart;
      dbHealthLogger.logConnectionAttempt(
        attempt,
        HEALTH_CHECK_CONFIG.MAX_RETRIES
      );
      break;
    } catch (error) {
      result.lastError = error instanceof Error ? error.message : String(error);
      dbHealthLogger.logConnectionAttempt(
        attempt,
        HEALTH_CHECK_CONFIG.MAX_RETRIES,
        result.lastError
      );

      // If not the last attempt, wait before retry
      if (attempt < HEALTH_CHECK_CONFIG.MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, HEALTH_CHECK_CONFIG.RETRY_INTERVAL)
        );
      }
    }
  }

  return result;
}

/**
 * Check MySQL server version compatibility
 */
async function checkMySQLVersion(): Promise<VersionCheckResult> {
  const result: VersionCheckResult = {
    isCompatible: false,
    currentVersion: "",
    requiredVersion: HEALTH_CHECK_CONFIG.REQUIRED_MYSQL_VERSION,
  };

  try {
    const [rows] = await pool.execute("SELECT VERSION() as version");
    const versionData = (rows as any[])[0];

    if (versionData && versionData.version) {
      result.currentVersion = versionData.version;

      // Check if it's actually MySQL (not MariaDB or other)
      const isMariaDB = result.currentVersion.toLowerCase().includes("mariadb");

      if (isMariaDB) {
        // MariaDB is not compatible
        result.isCompatible = false;
      } else {
        // Extract version number (e.g., "8.0.35-0ubuntu0.22.04.1" -> 8.0.35)
        const versionMatch = result.currentVersion.match(/^(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          const versionParts = versionMatch[1].split(".").map(Number);
          result.versionNumber =
            versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2];

          // Check if version is 8.0.0 or higher
          const requiredParts =
            HEALTH_CHECK_CONFIG.REQUIRED_MYSQL_VERSION.split(".").map(Number);
          const requiredNumber =
            requiredParts[0] * 10000 +
            requiredParts[1] * 100 +
            requiredParts[2];

          result.isCompatible = result.versionNumber >= requiredNumber;
        }
      }
    }
  } catch (error) {
    // Version check failed, but don't throw - let the caller handle it
    result.currentVersion = "Unknown";
  }

  return result;
}

/**
 * Check user permissions for required database operations
 */
async function checkUserPermissions(): Promise<PermissionsCheckResult> {
  const result: PermissionsCheckResult = {
    hasAllPermissions: false,
    permissions: {
      CREATE: false,
      DROP: false,
      INSERT: false,
      SELECT: false,
      UPDATE: false,
      DELETE: false,
    },
    missingPermissions: [],
  };

  try {
    // Get current user and host
    const [userRows] = await pool.execute("SELECT USER() as current_user");
    const currentUser = (userRows as any[])[0]?.current_user;

    if (!currentUser) {
      result.missingPermissions = [...HEALTH_CHECK_CONFIG.REQUIRED_PERMISSIONS];
      return result;
    }

    // Parse user@host format
    const [username, hostname] = currentUser.split("@");

    // Check grants for the current user
    const [grantRows] = await pool.execute(
      `SHOW GRANTS FOR '${username}'@'${hostname}'`
    );
    const grants = (grantRows as any[]).map(
      (row) => Object.values(row)[0] as string
    );

    // Debug logging for tests (remove in production)
    // console.log("[DEBUG] Parsed grants:", grants);

    // Check each required permission
    for (const permission of HEALTH_CHECK_CONFIG.REQUIRED_PERMISSIONS) {
      const hasPermission = grants.some(
        (grant) =>
          grant.includes("ALL PRIVILEGES") ||
          grant.toUpperCase().includes(permission.toUpperCase())
      );

      result.permissions[permission as keyof typeof result.permissions] =
        hasPermission;

      if (!hasPermission) {
        result.missingPermissions.push(permission);
      }
    }

    result.hasAllPermissions = result.missingPermissions.length === 0;
  } catch (error) {
    // Permission check failed, assume no permissions
    result.missingPermissions = [...HEALTH_CHECK_CONFIG.REQUIRED_PERMISSIONS];
  }

  return result;
}

// Logging system for database health checks
export interface DatabaseHealthLogger {
  logHealthCheck(result: DatabaseHealthResult): void;
  logConnectionAttempt(
    attempt: number,
    maxRetries: number,
    error?: string
  ): void;
  logVersionCheck(version: string, isCompatible: boolean): void;
  logPermissionCheck(permissions: PermissionsCheckResult): void;
  logError(error: HealthCheckError): void;
}

/**
 * Structured logging implementation for database health checks
 */
export class DatabaseHealthLoggerImpl implements DatabaseHealthLogger {
  private readonly prefix = "[DB-HEALTH]";

  logHealthCheck(result: DatabaseHealthResult): void {
    const status = result.isHealthy ? "HEALTHY" : "UNHEALTHY";
    const logLevel = result.isHealthy ? "info" : "error";

    const logData = {
      timestamp: result.timestamp.toISOString(),
      status,
      totalCheckTime: result.totalCheckTime,
      connection: {
        connected: result.connectionStatus.isConnected,
        attempts: result.connectionStatus.retryAttempts,
        maxRetries: result.connectionStatus.maxRetries,
        connectionTime: result.connectionStatus.connectionTime,
      },
      version: {
        compatible: result.versionCheck.isCompatible,
        current: result.versionCheck.currentVersion,
        required: result.versionCheck.requiredVersion,
      },
      permissions: {
        hasAll: result.permissionsCheck.hasAllPermissions,
        missing: result.permissionsCheck.missingPermissions,
      },
      errorCount: result.errors.length,
    };

    if (logLevel === "error") {
      console.error(`${this.prefix} Database health check FAILED:`, logData);

      // Log individual errors
      result.errors.forEach((error) => this.logError(error));
    } else {
      console.log(`${this.prefix} Database health check PASSED:`, logData);
    }
  }

  logConnectionAttempt(
    attempt: number,
    maxRetries: number,
    error?: string
  ): void {
    if (error) {
      console.warn(
        `${this.prefix} Connection attempt ${attempt}/${maxRetries} failed:`,
        {
          attempt,
          maxRetries,
          error,
          timestamp: new Date().toISOString(),
        }
      );
    } else {
      console.log(
        `${this.prefix} Connection attempt ${attempt}/${maxRetries} succeeded:`,
        {
          attempt,
          maxRetries,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  logVersionCheck(version: string, isCompatible: boolean): void {
    const logLevel = isCompatible ? "info" : "warn";
    const message = isCompatible
      ? "Version check passed"
      : "Version check failed";

    const logData = {
      version,
      isCompatible,
      requiredVersion: HEALTH_CHECK_CONFIG.REQUIRED_MYSQL_VERSION,
      timestamp: new Date().toISOString(),
    };

    if (logLevel === "warn") {
      console.warn(`${this.prefix} ${message}:`, logData);
    } else {
      console.log(`${this.prefix} ${message}:`, logData);
    }
  }

  logPermissionCheck(permissions: PermissionsCheckResult): void {
    const logLevel = permissions.hasAllPermissions ? "info" : "warn";
    const message = permissions.hasAllPermissions
      ? "Permission check passed"
      : "Permission check failed";

    const logData = {
      hasAllPermissions: permissions.hasAllPermissions,
      permissions: permissions.permissions,
      missingPermissions: permissions.missingPermissions,
      timestamp: new Date().toISOString(),
    };

    if (logLevel === "warn") {
      console.warn(`${this.prefix} ${message}:`, logData);
    } else {
      console.log(`${this.prefix} ${message}:`, logData);
    }
  }

  logError(error: HealthCheckError): void {
    console.error(
      `${this.prefix} [${error.type.toUpperCase()}] ${error.message}:`,
      {
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
      }
    );
  }
}

// Global logger instance
export const dbHealthLogger = new DatabaseHealthLoggerImpl();

// Graceful error handling types and functions
export interface GracefulFailureConfig {
  enableFallback: boolean;
  maxStartupDelay: number; // milliseconds
  fallbackBehavior: "continue" | "exit" | "retry";
  retryInterval: number; // milliseconds for retry behavior
  troubleshootingHints: boolean;
}

export interface TroubleshootingHint {
  category: "connection" | "version" | "permission" | "configuration";
  issue: string;
  possibleCauses: string[];
  suggestedActions: string[];
}

// Default graceful failure configuration
const DEFAULT_GRACEFUL_CONFIG: GracefulFailureConfig = {
  enableFallback: true,
  maxStartupDelay: 30000, // 30 seconds
  fallbackBehavior: "continue",
  retryInterval: 5000, // 5 seconds
  troubleshootingHints: true,
};

/**
 * Handle graceful failure sau max retries với troubleshooting hints
 */
export function handleGracefulFailure(
  result: DatabaseHealthResult,
  config: Partial<GracefulFailureConfig> = {}
): {
  shouldContinue: boolean;
  troubleshootingHints: TroubleshootingHint[];
  errorMessage: string;
} {
  const finalConfig = { ...DEFAULT_GRACEFUL_CONFIG, ...config };
  const troubleshootingHints: TroubleshootingHint[] = [];

  // Generate troubleshooting hints based on errors
  if (finalConfig.troubleshootingHints) {
    result.errors.forEach((error) => {
      const hint = generateTroubleshootingHint(error, result);
      if (hint) {
        troubleshootingHints.push(hint);
      }
    });
  }

  // Determine if application should continue
  const shouldContinue =
    finalConfig.enableFallback && finalConfig.fallbackBehavior === "continue";

  // Generate comprehensive error message
  const errorMessage = generateGracefulErrorMessage(
    result,
    troubleshootingHints,
    finalConfig
  );

  return {
    shouldContinue,
    troubleshootingHints,
    errorMessage,
  };
}

/**
 * Generate troubleshooting hints based on error type
 */
function generateTroubleshootingHint(
  error: HealthCheckError,
  result: DatabaseHealthResult
): TroubleshootingHint | null {
  switch (error.type) {
    case "connection":
      return {
        category: "connection",
        issue: "Database connection failed",
        possibleCauses: [
          "MySQL server is not running",
          "Incorrect host/port configuration",
          "Network connectivity issues",
          "Firewall blocking connection",
          "SSL configuration mismatch",
        ],
        suggestedActions: [
          "Verify MySQL server is running: `docker ps` or `systemctl status mysql`",
          "Check environment variables: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD",
          "Test network connectivity: `telnet ${process.env.MYSQL_HOST} ${process.env.MYSQL_PORT}`",
          "Review SSL configuration if enabled",
          "Check Docker container logs: `docker logs chatstory_mysql`",
        ],
      };

    case "version":
      return {
        category: "version",
        issue: `MySQL version ${result.versionCheck.currentVersion} is incompatible`,
        possibleCauses: [
          "Using MySQL version older than 8.0",
          "Connected to wrong database server",
          "Version detection failed",
        ],
        suggestedActions: [
          "Upgrade MySQL to version 8.0 or higher",
          "Verify connection to correct database server",
          "Check MySQL version: `SELECT VERSION();`",
          "Update Docker image to mysql:8.0 or higher",
        ],
      };

    case "permission":
      return {
        category: "permission",
        issue: `Missing database permissions: ${result.permissionsCheck.missingPermissions.join(
          ", "
        )}`,
        possibleCauses: [
          "Database user lacks required privileges",
          "Connected with wrong user account",
          "Permissions not granted properly",
        ],
        suggestedActions: [
          "Grant required permissions to database user",
          "Verify user credentials in environment variables",
          "Check user grants: `SHOW GRANTS FOR CURRENT_USER();`",
          "Contact database administrator for permission updates",
        ],
      };

    default:
      return null;
  }
}

/**
 * Generate comprehensive error message for graceful failure
 */
function generateGracefulErrorMessage(
  result: DatabaseHealthResult,
  troubleshootingHints: TroubleshootingHint[],
  config: GracefulFailureConfig
): string {
  const lines = [
    "🚨 DATABASE HEALTH CHECK FAILED",
    `⏱️  Check completed in ${result.totalCheckTime}ms`,
    `🔄 Connection attempts: ${result.connectionStatus.retryAttempts}/${result.connectionStatus.maxRetries}`,
    "",
    "📊 HEALTH CHECK SUMMARY:",
    `   Connection: ${result.connectionStatus.isConnected ? "✅" : "❌"}`,
    `   Version: ${result.versionCheck.isCompatible ? "✅" : "❌"} (${
      result.versionCheck.currentVersion
    })`,
    `   Permissions: ${
      result.permissionsCheck.hasAllPermissions ? "✅" : "❌"
    }`,
    "",
  ];

  if (result.errors.length > 0) {
    lines.push("🔍 DETECTED ISSUES:");
    result.errors.forEach((error, index) => {
      lines.push(
        `   ${index + 1}. [${error.type.toUpperCase()}] ${error.message}`
      );
    });
    lines.push("");
  }

  if (troubleshootingHints.length > 0) {
    lines.push("💡 TROUBLESHOOTING GUIDE:");
    troubleshootingHints.forEach((hint, index) => {
      lines.push(`   ${index + 1}. ${hint.issue}`);
      lines.push("      Possible causes:");
      hint.possibleCauses.forEach((cause) => {
        lines.push(`         • ${cause}`);
      });
      lines.push("      Suggested actions:");
      hint.suggestedActions.forEach((action) => {
        lines.push(`         → ${action}`);
      });
      lines.push("");
    });
  }

  lines.push("⚙️  FALLBACK BEHAVIOR:");
  if (config.enableFallback) {
    switch (config.fallbackBehavior) {
      case "continue":
        lines.push(
          "   ✅ Application will continue startup (some features may be limited)"
        );
        break;
      case "exit":
        lines.push("   🛑 Application will exit due to database issues");
        break;
      case "retry":
        lines.push(`   🔄 Will retry in ${config.retryInterval}ms`);
        break;
    }
  } else {
    lines.push("   🛑 No fallback configured - application behavior undefined");
  }

  return lines.join("\n");
}

/**
 * Check if application should crash on database failure
 */
export function shouldCrashOnFailure(
  result: DatabaseHealthResult,
  config: Partial<GracefulFailureConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_GRACEFUL_CONFIG, ...config };

  // Never crash if fallback is enabled and behavior is continue
  if (
    finalConfig.enableFallback &&
    finalConfig.fallbackBehavior === "continue"
  ) {
    return false;
  }

  // Crash if explicitly configured to exit
  if (finalConfig.fallbackBehavior === "exit") {
    return true;
  }

  // Default: don't crash, but log the issue
  return false;
}

/**
 * Utility function để format health check results cho logging
 */
export function formatHealthCheckResult(result: DatabaseHealthResult): string {
  const status = result.isHealthy ? "✅ HEALTHY" : "❌ UNHEALTHY";
  const lines = [
    `Database Health Check: ${status}`,
    `Timestamp: ${result.timestamp.toISOString()}`,
    `Total Check Time: ${result.totalCheckTime}ms`,
    "",
    `Connection: ${result.connectionStatus.isConnected ? "✅" : "❌"} (${
      result.connectionStatus.retryAttempts
    }/${result.connectionStatus.maxRetries} attempts)`,
    `Version: ${result.versionCheck.isCompatible ? "✅" : "❌"} ${
      result.versionCheck.currentVersion
    } (required: ${result.versionCheck.requiredVersion}+)`,
    `Permissions: ${result.permissionsCheck.hasAllPermissions ? "✅" : "❌"} ${
      result.permissionsCheck.missingPermissions.length > 0
        ? `Missing: ${result.permissionsCheck.missingPermissions.join(", ")}`
        : "All granted"
    }`,
  ];

  if (result.errors.length > 0) {
    lines.push("", "Errors:");
    result.errors.forEach((error) => {
      lines.push(`  - [${error.type.toUpperCase()}] ${error.message}`);
    });
  }

  return lines.join("\n");
}
