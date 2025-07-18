/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// TypeScript interfaces for migration operations
export interface MigrationScript {
  filename: string;
  fullPath: string;
  order: number;
  content: string;
  checksum: string;
}

export interface MigrationExecutionResult {
  success: boolean;
  scriptName: string;
  executionTime: number; // milliseconds
  affectedRows?: number;
  errors: MigrationError[];
  timestamp: Date;
}

export interface MigrationStatus {
  scriptName: string;
  checksum: string;
  executedAt: Date;
  executionTime: number;
  success: boolean;
}

export interface MigrationError {
  type: "discovery" | "loading" | "execution" | "tracking" | "validation";
  message: string;
  details?: any;
  scriptName?: string;
  lineNumber?: number;
  timestamp: Date;
}

export interface MigrationSystemResult {
  success: boolean;
  totalScripts: number;
  executedScripts: number;
  skippedScripts: number;
  failedScripts: number;
  executionResults: MigrationExecutionResult[];
  errors: MigrationError[];
  totalExecutionTime: number;
  timestamp: Date;
}

// Configuration constants for migration system
export const MIGRATION_CONFIG = {
  MIGRATION_DIRECTORY: "docker/mysql/init",
  SCRIPT_PATTERN: /\.(sql)$/i,
  ORDER_PATTERN: /^(\d+)-/,
  TRACKING_TABLE: "schema_migrations",
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  MAX_SCRIPT_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_EXTENSIONS: [".sql"],
} as const;

/**
 * Task 1: Migration Script Discovery và Loading System
 */

/**
 * Discover migration scripts in the specified directory
 * Scans for SQL files and orders them by filename prefix
 */
export async function discoverMigrationScripts(
  migrationDir: string = MIGRATION_CONFIG.MIGRATION_DIRECTORY
): Promise<MigrationScript[]> {
  const scripts: MigrationScript[] = [];
  const errors: MigrationError[] = [];

  try {
    migrationLogger.logDiscovery("start", migrationDir);

    // Check if migration directory exists
    const fullMigrationPath = path.resolve(migrationDir);

    try {
      await fs.access(fullMigrationPath);
    } catch (error) {
      const migrationError: MigrationError = {
        type: "discovery",
        message: `Migration directory not found: ${fullMigrationPath}`,
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
      errors.push(migrationError);
      migrationLogger.logError(migrationError);
      return scripts;
    }

    // Read directory contents
    const files = await fs.readdir(fullMigrationPath);

    // Filter and process SQL files
    const sqlFiles = files.filter(
      (file) =>
        MIGRATION_CONFIG.SCRIPT_PATTERN.test(file) &&
        MIGRATION_CONFIG.SUPPORTED_EXTENSIONS.some((ext) =>
          file.toLowerCase().endsWith(ext)
        )
    );

    migrationLogger.logDiscovery("found_files", migrationDir, {
      totalFiles: files.length,
      sqlFiles: sqlFiles.length,
    });

    // Process each SQL file
    for (const filename of sqlFiles) {
      try {
        const fullPath = path.join(fullMigrationPath, filename);

        // Extract order from filename (e.g., "00-create-user.sql" -> 0)
        const orderMatch = filename.match(MIGRATION_CONFIG.ORDER_PATTERN);
        const order = orderMatch ? parseInt(orderMatch[1], 10) : 999;

        // Load script content
        const content = await loadScriptContent(fullPath);

        // Generate checksum for content verification
        const checksum = generateChecksum(content);

        const script: MigrationScript = {
          filename,
          fullPath,
          order,
          content,
          checksum,
        };

        scripts.push(script);

        migrationLogger.logDiscovery("processed_script", migrationDir, {
          filename,
          order,
          contentLength: content.length,
          checksum,
        });
      } catch (error) {
        const migrationError: MigrationError = {
          type: "discovery",
          message: `Failed to process script: ${filename}`,
          details: error instanceof Error ? error.message : String(error),
          scriptName: filename,
          timestamp: new Date(),
        };
        errors.push(migrationError);
        migrationLogger.logError(migrationError);
      }
    }

    // Sort scripts by order
    scripts.sort((a, b) => a.order - b.order);

    migrationLogger.logDiscovery("complete", migrationDir, {
      totalScripts: scripts.length,
      errors: errors.length,
      scriptOrder: scripts.map((s) => ({
        filename: s.filename,
        order: s.order,
      })),
    });

    return scripts;
  } catch (error) {
    const migrationError: MigrationError = {
      type: "discovery",
      message: "Failed to discover migration scripts",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    errors.push(migrationError);
    migrationLogger.logError(migrationError);
    return scripts;
  }
}

/**
 * Load content from a SQL script file
 * Includes file size validation and encoding handling
 */
export async function loadScriptContent(scriptPath: string): Promise<string> {
  try {
    // Check file size before loading
    const stats = await fs.stat(scriptPath);

    if (stats.size > MIGRATION_CONFIG.MAX_SCRIPT_SIZE) {
      throw new Error(
        `Script file too large: ${stats.size} bytes (max: ${MIGRATION_CONFIG.MAX_SCRIPT_SIZE} bytes)`
      );
    }

    // Read file content with UTF-8 encoding
    const content = await fs.readFile(scriptPath, "utf-8");

    // Basic validation - ensure content is not empty
    if (!content.trim()) {
      throw new Error("Script file is empty or contains only whitespace");
    }

    migrationLogger.logLoading("loaded", scriptPath, {
      fileSize: stats.size,
      contentLength: content.length,
    });

    return content;
  } catch (error) {
    const migrationError: MigrationError = {
      type: "loading",
      message: `Failed to load script content: ${scriptPath}`,
      details: error instanceof Error ? error.message : String(error),
      scriptName: path.basename(scriptPath),
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Generate MD5 checksum for script content
 * Used for tracking script changes and ensuring integrity
 */
function generateChecksum(content: string): string {
  return crypto.createHash("md5").update(content, "utf-8").digest("hex");
}

/**
 * Structured logging system for migration operations
 */
export const migrationLogger = {
  logDiscovery: (
    phase: "start" | "found_files" | "processed_script" | "complete",
    directory: string,
    details?: any
  ) => {
    const logData = {
      operation: "migration_discovery",
      phase,
      directory,
      details,
      timestamp: new Date().toISOString(),
    };
    console.info("[DB-MIGRATION]", JSON.stringify(logData));
  },

  logLoading: (
    phase: "loaded" | "validated",
    scriptPath: string,
    details?: any
  ) => {
    const logData = {
      operation: "script_loading",
      phase,
      scriptPath,
      details,
      timestamp: new Date().toISOString(),
    };
    console.info("[DB-MIGRATION]", JSON.stringify(logData));
  },

  logExecution: (
    phase: "start" | "executing" | "complete" | "skipped",
    scriptName: string,
    details?: any
  ) => {
    const logData = {
      operation: "script_execution",
      phase,
      scriptName,
      details,
      timestamp: new Date().toISOString(),
    };
    console.info("[DB-MIGRATION]", JSON.stringify(logData));
  },

  logTracking: (
    phase: "check" | "mark_complete" | "create_table",
    details?: any
  ) => {
    const logData = {
      operation: "migration_tracking",
      phase,
      details,
      timestamp: new Date().toISOString(),
    };
    console.info("[DB-MIGRATION]", JSON.stringify(logData));
  },

  logError: (error: MigrationError) => {
    const logData = {
      operation: "migration_error",
      error,
      timestamp: new Date().toISOString(),
    };
    console.error("[DB-MIGRATION]", JSON.stringify(logData));
  },
};

/**
 * Validate script ordering and detect potential conflicts
 * Ensures scripts will be executed in correct order
 */
export function validateScriptOrdering(scripts: MigrationScript[]): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for duplicate order numbers
  const orderCounts = new Map<number, string[]>();
  scripts.forEach((script) => {
    if (!orderCounts.has(script.order)) {
      orderCounts.set(script.order, []);
    }
    orderCounts.get(script.order)!.push(script.filename);
  });

  // Find duplicates
  orderCounts.forEach((filenames, order) => {
    if (filenames.length > 1) {
      issues.push(`Duplicate order ${order}: ${filenames.join(", ")}`);
      recommendations.push(`Rename files to have unique order prefixes`);
    }
  });

  // Check for gaps in ordering (optional warning)
  const orders = Array.from(orderCounts.keys()).sort((a, b) => a - b);
  for (let i = 1; i < orders.length; i++) {
    if (orders[i] - orders[i - 1] > 1) {
      recommendations.push(
        `Consider filling gap between order ${orders[i - 1]} and ${
          orders[i]
        } for better organization`
      );
    }
  }

  // Check for scripts without order prefix
  const unorderedScripts = scripts.filter((script) => script.order === 999);
  if (unorderedScripts.length > 0) {
    issues.push(
      `Scripts without order prefix: ${unorderedScripts
        .map((s) => s.filename)
        .join(", ")}`
    );
    recommendations.push(
      `Add numeric prefixes (e.g., 01-, 02-) to ensure predictable execution order`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Task 2: SQL Script Execution Engine
 */

/**
 * Execute a single SQL script with comprehensive error handling
 * Supports transactions, detailed error reporting, and MySQL-specific syntax
 */
export async function executeSQLScript(
  script: MigrationScript,
  connection: mysql.Connection
): Promise<MigrationExecutionResult> {
  const startTime = Date.now();
  const result: MigrationExecutionResult = {
    success: false,
    scriptName: script.filename,
    executionTime: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    migrationLogger.logExecution("start", script.filename, {
      order: script.order,
      checksum: script.checksum,
      contentLength: script.content.length,
    });

    // Start transaction for script execution
    await connection.beginTransaction();

    try {
      // Split script into individual statements
      const statements = splitSQLStatements(script.content);

      migrationLogger.logExecution("executing", script.filename, {
        statementCount: statements.length,
      });

      let totalAffectedRows = 0;

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();

        // Skip empty statements and comments
        if (
          !statement ||
          statement.startsWith("--") ||
          statement.startsWith("/*")
        ) {
          continue;
        }

        try {
          const [rows] = await connection.execute(statement);

          // Track affected rows for INSERT/UPDATE/DELETE statements
          if (typeof rows === "object" && "affectedRows" in rows) {
            totalAffectedRows += (rows as any).affectedRows || 0;
          }

          migrationLogger.logExecution("executing", script.filename, {
            statementIndex: i + 1,
            statement:
              statement.substring(0, 100) +
              (statement.length > 100 ? "..." : ""),
            affectedRows:
              typeof rows === "object" && "affectedRows" in rows
                ? (rows as any).affectedRows
                : 0,
          });
        } catch (statementError) {
          // Handle statement-specific errors with line number context
          const migrationError: MigrationError = {
            type: "execution",
            message: `SQL execution failed at statement ${i + 1}`,
            details: {
              error:
                statementError instanceof Error
                  ? statementError.message
                  : String(statementError),
              statement: statement.substring(0, 200),
              statementIndex: i + 1,
            },
            scriptName: script.filename,
            lineNumber: i + 1,
            timestamp: new Date(),
          };
          result.errors.push(migrationError);
          migrationLogger.logError(migrationError);
          throw statementError;
        }
      }

      // Commit transaction if all statements succeeded
      await connection.commit();

      result.success = true;
      result.affectedRows = totalAffectedRows;
      result.executionTime = Date.now() - startTime;

      migrationLogger.logExecution("complete", script.filename, {
        success: true,
        executionTime: result.executionTime,
        affectedRows: totalAffectedRows,
        statementCount: statements.length,
      });
    } catch (executionError) {
      // Rollback transaction on any error
      try {
        await connection.rollback();
        migrationLogger.logExecution("complete", script.filename, {
          success: false,
          rolledBack: true,
          error:
            executionError instanceof Error
              ? executionError.message
              : String(executionError),
        });
      } catch (rollbackError) {
        const rollbackMigrationError: MigrationError = {
          type: "execution",
          message: "Failed to rollback transaction after execution error",
          details:
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
          scriptName: script.filename,
          timestamp: new Date(),
        };
        result.errors.push(rollbackMigrationError);
        migrationLogger.logError(rollbackMigrationError);
      }
      throw executionError;
    }
  } catch (error) {
    const migrationError: MigrationError = {
      type: "execution",
      message: `Failed to execute migration script: ${script.filename}`,
      details: error instanceof Error ? error.message : String(error),
      scriptName: script.filename,
      timestamp: new Date(),
    };
    result.errors.push(migrationError);
    result.executionTime = Date.now() - startTime;
    migrationLogger.logError(migrationError);
  }

  return result;
}

/**
 * Split SQL script content into individual statements
 * Handles MySQL-specific syntax and multi-line statements
 */
function splitSQLStatements(content: string): string[] {
  const statements: string[] = [];

  // Remove MySQL dump comments and directives that don't need execution
  const cleanContent = content
    .replace(/\/\*![0-9]{5}[^*]*\*\//g, "") // Remove MySQL version-specific comments
    .replace(/\/\*![0-9]{5}/g, "") // Remove opening MySQL version comments
    .replace(/\*\//g, "") // Remove closing comments
    .replace(/--[^\r\n]*/g, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

  // Split by semicolon, but be careful with strings and special cases
  const lines = cleanContent.split("\n");
  let currentStatement = "";
  let inString = false;
  let stringChar = "";

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Handle MySQL-specific commands that don't end with semicolon
    if (
      trimmedLine.startsWith("LOCK TABLES") ||
      trimmedLine.startsWith("UNLOCK TABLES") ||
      trimmedLine.startsWith("FLUSH PRIVILEGES")
    ) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
      statements.push(trimmedLine);
      continue;
    }

    // Add line to current statement
    currentStatement += line + "\n";

    // Check for statement termination
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && line[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
      } else if (!inString && char === ";") {
        // Found statement terminator
        statements.push(currentStatement.trim());
        currentStatement = "";
        break;
      }
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements.filter((stmt) => stmt.length > 0);
}

/**
 * Validate script execution success
 * Performs post-execution checks to ensure script ran correctly
 */
export async function validateScriptExecution(
  script: MigrationScript,
  executionResult: MigrationExecutionResult,
  connection: mysql.Connection
): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Basic validation - check if execution was successful
    if (!executionResult.success) {
      issues.push("Script execution failed");
      recommendations.push("Review execution errors and fix script issues");
      return { valid: false, issues, recommendations };
    }

    // Check execution time - warn if too slow
    if (executionResult.executionTime > 30000) {
      // 30 seconds
      recommendations.push(
        `Script took ${executionResult.executionTime}ms to execute. Consider optimizing for better performance.`
      );
    }

    // Validate database state after execution (basic checks)
    if (
      script.filename.includes("create") ||
      script.filename.includes("table")
    ) {
      // For table creation scripts, verify tables were created
      try {
        const [tables] = await connection.execute(
          "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
          [process.env.MYSQL_DATABASE || "chatstoryai"]
        );

        if (Array.isArray(tables) && tables.length === 0) {
          issues.push("No tables found after table creation script");
          recommendations.push(
            "Verify script contains valid CREATE TABLE statements"
          );
        }
      } catch {
        recommendations.push(
          "Could not validate table creation - manual verification recommended"
        );
      }
    }

    migrationLogger.logExecution("complete", script.filename, {
      validationPassed: issues.length === 0,
      issues: issues.length,
      recommendations: recommendations.length,
    });
  } catch (error) {
    const migrationError: MigrationError = {
      type: "validation",
      message: "Failed to validate script execution",
      details: error instanceof Error ? error.message : String(error),
      scriptName: script.filename,
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    issues.push("Validation process failed");
    recommendations.push("Manual verification of script execution recommended");
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Task 3: Migration State Tracking System
 */

/**
 * Create migration tracking table if it doesn't exist
 * This table tracks which migrations have been executed
 */
export async function createMigrationTrackingTable(
  connection: mysql.Connection
): Promise<void> {
  try {
    migrationLogger.logTracking("create_table", {
      tableName: MIGRATION_CONFIG.TRACKING_TABLE,
    });

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${MIGRATION_CONFIG.TRACKING_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        script_name VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(32) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INT NOT NULL DEFAULT 0,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_script_name (script_name),
        INDEX idx_executed_at (executed_at),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableSQL);

    migrationLogger.logTracking("create_table", {
      tableName: MIGRATION_CONFIG.TRACKING_TABLE,
      success: true,
    });
  } catch (error) {
    const migrationError: MigrationError = {
      type: "tracking",
      message: "Failed to create migration tracking table",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Check migration status for a specific script
 * Returns information about whether the script has been executed
 */
export async function checkMigrationStatus(
  scriptName: string,
  connection: mysql.Connection
): Promise<MigrationStatus | null> {
  try {
    migrationLogger.logTracking("check", { scriptName });

    const [rows] = await connection.execute(
      `SELECT script_name, checksum, executed_at, execution_time, success
       FROM ${MIGRATION_CONFIG.TRACKING_TABLE}
       WHERE script_name = ?`,
      [scriptName]
    );

    const results = rows as any[];

    if (results.length === 0) {
      migrationLogger.logTracking("check", {
        scriptName,
        status: "not_executed",
      });
      return null;
    }

    const result = results[0];
    const status: MigrationStatus = {
      scriptName: result.script_name,
      checksum: result.checksum,
      executedAt: result.executed_at,
      executionTime: result.execution_time,
      success: result.success,
    };

    migrationLogger.logTracking("check", {
      scriptName,
      status: "executed",
      executedAt: status.executedAt,
      success: status.success,
    });

    return status;
  } catch (error) {
    const migrationError: MigrationError = {
      type: "tracking",
      message: `Failed to check migration status for: ${scriptName}`,
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Mark migration as complete in tracking table
 * Records successful execution with timestamp and checksum
 */
export async function markMigrationComplete(
  script: MigrationScript,
  executionResult: MigrationExecutionResult,
  connection: mysql.Connection
): Promise<void> {
  try {
    migrationLogger.logTracking("mark_complete", {
      scriptName: script.filename,
      success: executionResult.success,
      executionTime: executionResult.executionTime,
    });

    // Insert or update migration record
    const insertSQL = `
      INSERT INTO ${MIGRATION_CONFIG.TRACKING_TABLE}
      (script_name, checksum, execution_time, success)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        checksum = VALUES(checksum),
        executed_at = CURRENT_TIMESTAMP,
        execution_time = VALUES(execution_time),
        success = VALUES(success),
        updated_at = CURRENT_TIMESTAMP
    `;

    await connection.execute(insertSQL, [
      script.filename,
      script.checksum,
      executionResult.executionTime,
      executionResult.success,
    ]);

    migrationLogger.logTracking("mark_complete", {
      scriptName: script.filename,
      success: true,
    });
  } catch (error) {
    const migrationError: MigrationError = {
      type: "tracking",
      message: `Failed to mark migration complete: ${script.filename}`,
      details: error instanceof Error ? error.message : String(error),
      scriptName: script.filename,
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Implement incremental migration logic
 * Determines which scripts need to be executed based on tracking table
 */
export async function getScriptsToExecute(
  scripts: MigrationScript[],
  connection: mysql.Connection
): Promise<{
  toExecute: MigrationScript[];
  toSkip: MigrationScript[];
  changed: MigrationScript[];
}> {
  const toExecute: MigrationScript[] = [];
  const toSkip: MigrationScript[] = [];
  const changed: MigrationScript[] = [];

  try {
    // Ensure tracking table exists
    await createMigrationTrackingTable(connection);

    // Check each script's status
    for (const script of scripts) {
      const status = await checkMigrationStatus(script.filename, connection);

      if (!status) {
        // Script has never been executed
        toExecute.push(script);
        migrationLogger.logTracking("check", {
          scriptName: script.filename,
          decision: "execute",
          reason: "never_executed",
        });
      } else if (status.checksum !== script.checksum) {
        // Script has changed since last execution
        changed.push(script);
        toExecute.push(script);
        migrationLogger.logTracking("check", {
          scriptName: script.filename,
          decision: "execute",
          reason: "checksum_changed",
          oldChecksum: status.checksum,
          newChecksum: script.checksum,
        });
      } else if (!status.success) {
        // Previous execution failed, retry
        toExecute.push(script);
        migrationLogger.logTracking("check", {
          scriptName: script.filename,
          decision: "execute",
          reason: "previous_failure",
          lastExecuted: status.executedAt,
        });
      } else {
        // Script already executed successfully with same checksum
        toSkip.push(script);
        migrationLogger.logTracking("check", {
          scriptName: script.filename,
          decision: "skip",
          reason: "already_executed",
          lastExecuted: status.executedAt,
        });
      }
    }

    migrationLogger.logTracking("check", {
      totalScripts: scripts.length,
      toExecute: toExecute.length,
      toSkip: toSkip.length,
      changed: changed.length,
    });

    return { toExecute, toSkip, changed };
  } catch (error) {
    const migrationError: MigrationError = {
      type: "tracking",
      message: "Failed to determine scripts to execute",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Get migration history and statistics
 * Provides overview of all executed migrations
 */
export async function getMigrationHistory(
  connection: mysql.Connection
): Promise<{
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  lastMigration?: MigrationStatus;
  allMigrations: MigrationStatus[];
}> {
  try {
    // Ensure tracking table exists
    await createMigrationTrackingTable(connection);

    const [rows] = await connection.execute(
      `SELECT script_name, checksum, executed_at, execution_time, success
       FROM ${MIGRATION_CONFIG.TRACKING_TABLE}
       ORDER BY executed_at DESC`
    );

    const results = rows as any[];
    const allMigrations: MigrationStatus[] = results.map((row) => ({
      scriptName: row.script_name,
      checksum: row.checksum,
      executedAt: row.executed_at,
      executionTime: row.execution_time,
      success: row.success,
    }));

    const totalMigrations = allMigrations.length;
    const successfulMigrations = allMigrations.filter((m) => m.success).length;
    const failedMigrations = totalMigrations - successfulMigrations;
    const lastMigration =
      allMigrations.length > 0 ? allMigrations[0] : undefined;

    migrationLogger.logTracking("check", {
      operation: "history",
      totalMigrations,
      successfulMigrations,
      failedMigrations,
      lastMigration: lastMigration?.scriptName,
    });

    return {
      totalMigrations,
      successfulMigrations,
      failedMigrations,
      lastMigration,
      allMigrations,
    };
  } catch (error) {
    const migrationError: MigrationError = {
      type: "tracking",
      message: "Failed to get migration history",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    migrationLogger.logError(migrationError);
    throw error;
  }
}

/**
 * Task 4: Integration với Database Creation System
 * Main orchestration function for running all migrations
 */
export async function runMigrations(
  migrationDir: string = MIGRATION_CONFIG.MIGRATION_DIRECTORY,
  options: {
    skipFailedScripts?: boolean;
    dryRun?: boolean;
    forceRerun?: boolean;
  } = {}
): Promise<MigrationSystemResult> {
  const startTime = Date.now();
  const result: MigrationSystemResult = {
    success: false,
    totalScripts: 0,
    executedScripts: 0,
    skippedScripts: 0,
    failedScripts: 0,
    executionResults: [],
    errors: [],
    totalExecutionTime: 0,
    timestamp: new Date(),
  };

  let connection: mysql.PoolConnection | null = null;

  try {
    migrationLogger.logExecution("start", "migration_system", {
      migrationDir,
      options,
    });

    // Import db connection from existing module
    const pool = (await import("./db")).default;
    connection = await pool.getConnection();

    // Step 1: Discover migration scripts
    const scripts = await discoverMigrationScripts(migrationDir);
    result.totalScripts = scripts.length;

    if (scripts.length === 0) {
      migrationLogger.logExecution("complete", "migration_system", {
        message: "No migration scripts found",
        directory: migrationDir,
      });
      result.success = true;
      result.totalExecutionTime = Date.now() - startTime;
      return result;
    }

    // Step 2: Validate script ordering
    const orderingValidation = validateScriptOrdering(scripts);
    if (!orderingValidation.valid) {
      const migrationError: MigrationError = {
        type: "discovery",
        message: "Script ordering validation failed",
        details: {
          issues: orderingValidation.issues,
          recommendations: orderingValidation.recommendations,
        },
        timestamp: new Date(),
      };
      result.errors.push(migrationError);
      migrationLogger.logError(migrationError);

      if (!options.skipFailedScripts) {
        result.totalExecutionTime = Date.now() - startTime;
        return result;
      }
    }

    // Step 3: Determine which scripts to execute
    if (!connection) {
      throw new Error("Database connection not established");
    }
    // At this point, connection is guaranteed to be non-null
    const nonNullConnection = connection;
    const { toExecute, toSkip, changed } = await getScriptsToExecute(
      scripts,
      nonNullConnection
    );
    result.skippedScripts = toSkip.length;

    if (changed.length > 0) {
      migrationLogger.logExecution("executing", "migration_system", {
        message: "Scripts with changes detected",
        changedScripts: changed.map((s) => s.filename),
      });
    }

    // Step 4: Execute migrations (or dry run)
    if (options.dryRun) {
      migrationLogger.logExecution("complete", "migration_system", {
        dryRun: true,
        scriptsToExecute: toExecute.map((s) => s.filename),
        scriptsToSkip: toSkip.map((s) => s.filename),
      });
      result.success = true;
      result.totalExecutionTime = Date.now() - startTime;
      return result;
    }

    // Execute each script
    for (const script of toExecute) {
      try {
        migrationLogger.logExecution("executing", script.filename, {
          order: script.order,
          checksum: script.checksum,
        });

        // Execute the script
        const executionResult = await executeSQLScript(
          script,
          nonNullConnection
        );
        result.executionResults.push(executionResult);

        if (executionResult.success) {
          // Validate execution
          const validation = await validateScriptExecution(
            script,
            executionResult,
            nonNullConnection
          );

          if (validation.valid) {
            // Mark as complete in tracking table
            await markMigrationComplete(
              script,
              executionResult,
              nonNullConnection
            );
            result.executedScripts++;

            migrationLogger.logExecution("complete", script.filename, {
              success: true,
              executionTime: executionResult.executionTime,
              affectedRows: executionResult.affectedRows,
            });
          } else {
            result.failedScripts++;
            const validationError: MigrationError = {
              type: "validation",
              message: `Script validation failed: ${script.filename}`,
              details: {
                issues: validation.issues,
                recommendations: validation.recommendations,
              },
              scriptName: script.filename,
              timestamp: new Date(),
            };
            result.errors.push(validationError);
            migrationLogger.logError(validationError);
          }
        } else {
          result.failedScripts++;
          result.errors.push(...executionResult.errors);

          if (!options.skipFailedScripts) {
            migrationLogger.logExecution("complete", "migration_system", {
              success: false,
              failedScript: script.filename,
              stopOnFailure: true,
            });
            break;
          }
        }
      } catch (error) {
        result.failedScripts++;
        const migrationError: MigrationError = {
          type: "execution",
          message: `Unexpected error executing script: ${script.filename}`,
          details: error instanceof Error ? error.message : String(error),
          scriptName: script.filename,
          timestamp: new Date(),
        };
        result.errors.push(migrationError);
        migrationLogger.logError(migrationError);

        if (!options.skipFailedScripts) {
          break;
        }
      }
    }

    // Step 5: Final assessment
    result.success = result.failedScripts === 0;
    result.totalExecutionTime = Date.now() - startTime;

    migrationLogger.logExecution("complete", "migration_system", {
      success: result.success,
      totalScripts: result.totalScripts,
      executedScripts: result.executedScripts,
      skippedScripts: result.skippedScripts,
      failedScripts: result.failedScripts,
      totalExecutionTime: result.totalExecutionTime,
    });
  } catch (error) {
    const migrationError: MigrationError = {
      type: "execution",
      message: "Migration system failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(migrationError);
    result.totalExecutionTime = Date.now() - startTime;
    migrationLogger.logError(migrationError);
  } finally {
    if (connection) {
      (connection as any).release();
    }
  }

  return result;
}
