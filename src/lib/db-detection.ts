/* eslint-disable @typescript-eslint/no-explicit-any */
import pool from "./db";

// TypeScript interfaces cho database detection results
export interface DatabaseDetectionResult {
  databaseExists: boolean;
  databaseName: string;
  charset?: string;
  collation?: string;
  tablesDetection: TableDetectionResult;
  detectionReport: DetectionReport;
  errors: DetectionError[];
  timestamp: Date;
  totalDetectionTime: number; // milliseconds
}

export interface TableDetectionResult {
  expectedTables: string[];
  existingTables: string[];
  missingTables: string[];
  extraTables: string[];
  schemaValidation: SchemaValidationResult[];
}

export interface SchemaValidationResult {
  tableName: string;
  exists: boolean;
  structureMatches: boolean;
  missingColumns: string[];
  extraColumns: string[];
  typeMismatches: ColumnTypeMismatch[];
}

export interface ColumnTypeMismatch {
  columnName: string;
  expectedType: string;
  actualType: string;
}

export interface DetectionReport {
  summary: {
    databaseStatus: "exists" | "missing";
    tablesStatus: "complete" | "partial" | "missing";
    overallHealth: "healthy" | "needs_attention" | "critical";
  };
  recommendations: string[];
  details: {
    databaseInfo?: {
      name: string;
      charset: string;
      collation: string;
    };
    missingComponents: string[];
    structuralIssues: string[];
  };
}

export interface DetectionError {
  type: "database" | "table" | "schema" | "connection";
  message: string;
  details?: any;
  timestamp: Date;
}

// Schema definition interfaces
export interface TableSchema {
  columns: Record<string, ColumnSchema>;
  primaryKey?: string[];
  indexes?: IndexSchema[];
}

export interface ColumnSchema {
  type: string;
  nullable?: boolean;
  default?: string | null;
  autoIncrement?: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique?: boolean;
}

// Configuration constants
const DETECTION_CONFIG = {
  DATABASE_NAME: "chatstoryai",
  EXPECTED_CHARSET: "utf8mb4",
  EXPECTED_COLLATION: "utf8mb4_unicode_ci",
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  EXPECTED_TABLES: [
    "users",
    "stories",
    "api_keys",
    "reset_codes",
    "story_chapters",
    "story_characters",
    "story_outlines",
    "chapter_dialogues",
    "main_categories",
    "story_tags",
    "story_tag_relations",
    "story_bookmarks",
    "story_favorites",
    "view_history",
    "chapter_reads",
    "ai_chat_history",
    "ai_chat_messages",
    "ai_chat_images",
    "ai_generated_dialogues",
  ],
} as const;

// Expected table schemas based on init.sql
const EXPECTED_SCHEMAS: Record<string, TableSchema> = {
  users: {
    columns: {
      user_id: { type: "int", autoIncrement: true },
      username: { type: "varchar", nullable: false },
      email: { type: "varchar", nullable: false },
      user_password: { type: "varchar", nullable: true },
      avatar: {
        type: "varchar",
        nullable: true,
        default: "/default-user.webp",
      },
      drive_file_id: { type: "varchar", nullable: true },
      has_badge: { type: "tinyint", nullable: true, default: "0" },
      created_at: { type: "timestamp", nullable: false },
      updated_at: { type: "timestamp", nullable: false },
    },
    primaryKey: ["user_id"],
  },
  stories: {
    columns: {
      story_id: { type: "int", autoIncrement: true },
      user_id: { type: "int", nullable: false },
      title: { type: "varchar", nullable: false },
      description: { type: "text", nullable: true },
      cover_image: { type: "varchar", nullable: true },
      status: { type: "enum", nullable: true, default: "draft" },
      view_count: { type: "int", nullable: true, default: "0" },
      created_at: { type: "timestamp", nullable: false },
      updated_at: { type: "timestamp", nullable: false },
      main_category_id: { type: "int", nullable: true },
      cover_file_id: { type: "varchar", nullable: true },
    },
    primaryKey: ["story_id"],
  },
  api_keys: {
    columns: {
      id: { type: "int", autoIncrement: true },
      user_id: { type: "int", nullable: false },
      api_key: { type: "varchar", nullable: false },
      name: { type: "varchar", nullable: false },
      is_active: { type: "tinyint", nullable: true, default: "1" },
      created_at: { type: "timestamp", nullable: false },
      updated_at: { type: "timestamp", nullable: false },
    },
    primaryKey: ["id"],
  },
  // Add more schemas as needed - keeping it minimal for now
};

/**
 * Main database detection function
 */
export async function detectDatabaseAndSchema(): Promise<DatabaseDetectionResult> {
  const startTime = Date.now();
  const result: DatabaseDetectionResult = {
    databaseExists: false,
    databaseName: DETECTION_CONFIG.DATABASE_NAME,
    tablesDetection: {
      expectedTables: [...DETECTION_CONFIG.EXPECTED_TABLES],
      existingTables: [],
      missingTables: [],
      extraTables: [],
      schemaValidation: [],
    },
    detectionReport: {
      summary: {
        databaseStatus: "missing",
        tablesStatus: "missing",
        overallHealth: "critical",
      },
      recommendations: [],
      details: {
        missingComponents: [],
        structuralIssues: [],
      },
    },
    errors: [],
    timestamp: new Date(),
    totalDetectionTime: 0,
  };

  try {
    // Step 1: Check database existence
    const databaseResult = await checkDatabaseExistence();
    result.databaseExists = databaseResult.exists;
    result.charset = databaseResult.charset;
    result.collation = databaseResult.collation;

    if (!databaseResult.exists) {
      const error: DetectionError = {
        type: "database",
        message: `Database '${DETECTION_CONFIG.DATABASE_NAME}' does not exist`,
        timestamp: new Date(),
      };
      result.errors.push(error);
      detectionLogger.logError(error);

      // Generate report for missing database
      result.detectionReport = generateMissingDatabaseReport();
      result.totalDetectionTime = Date.now() - startTime;
      detectionLogger.logDetectionResult(result);
      return result;
    }

    // Step 2: Detect tables if database exists
    const tablesResult = await detectTables();
    result.tablesDetection = tablesResult;

    // Step 3: Validate table schemas
    const schemaValidation = await validateTableSchemas(
      tablesResult.existingTables
    );
    result.tablesDetection.schemaValidation = schemaValidation;

    // Step 4: Generate comprehensive report
    result.detectionReport = generateDetectionReport(result);
  } catch (error) {
    const detectionError: DetectionError = {
      type: "connection",
      message: "Unexpected error during database detection",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(detectionError);
    detectionLogger.logError(detectionError);
  }

  result.totalDetectionTime = Date.now() - startTime;
  detectionLogger.logDetectionResult(result);
  return result;
}

/**
 * Check if the target database exists
 */
export async function checkDatabaseExistence(): Promise<{
  exists: boolean;
  charset?: string;
  collation?: string;
}> {
  try {
    detectionLogger.logDatabaseCheck(DETECTION_CONFIG.DATABASE_NAME);

    // Query to check database existence and get charset/collation
    const [rows] = await pool.execute(
      `SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
       FROM information_schema.SCHEMATA 
       WHERE SCHEMA_NAME = ?`,
      [DETECTION_CONFIG.DATABASE_NAME]
    );

    const databases = rows as any[];

    if (databases.length === 0) {
      detectionLogger.logDatabaseCheck(DETECTION_CONFIG.DATABASE_NAME, false);
      return { exists: false };
    }

    const dbInfo = databases[0];
    const result = {
      exists: true,
      charset: dbInfo.DEFAULT_CHARACTER_SET_NAME,
      collation: dbInfo.DEFAULT_COLLATION_NAME,
    };

    detectionLogger.logDatabaseCheck(
      DETECTION_CONFIG.DATABASE_NAME,
      true,
      result
    );
    return result;
  } catch (error) {
    detectionLogger.logDatabaseCheck(
      DETECTION_CONFIG.DATABASE_NAME,
      false,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Detect existing tables in the database
 */
export async function detectTables(): Promise<TableDetectionResult> {
  try {
    detectionLogger.logTableDetection("start");

    // Get all tables in the database
    const [rows] = await pool.execute(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [DETECTION_CONFIG.DATABASE_NAME]
    );

    const existingTables = (rows as any[]).map((row) => row.TABLE_NAME);
    const expectedTables = [...DETECTION_CONFIG.EXPECTED_TABLES];

    const missingTables = expectedTables.filter(
      (table) => !existingTables.includes(table)
    );
    const extraTables = existingTables.filter(
      (table) => !expectedTables.includes(table)
    );

    const result: TableDetectionResult = {
      expectedTables,
      existingTables,
      missingTables,
      extraTables,
      schemaValidation: [], // Will be populated by validateTableSchemas
    };

    detectionLogger.logTableDetection("complete", result);
    return result;
  } catch (error) {
    detectionLogger.logTableDetection(
      "error",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Structured logging system for detection operations
 */
export const detectionLogger = {
  logDatabaseCheck: (
    databaseName: string,
    exists?: boolean,
    details?: any,
    error?: string
  ) => {
    const logData = {
      operation: "database_existence_check",
      database: databaseName,
      exists,
      details,
      error,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      console.error("[DB-DETECTION]", JSON.stringify(logData));
    } else {
      console.info("[DB-DETECTION]", JSON.stringify(logData));
    }
  },

  logTableDetection: (
    phase: "start" | "complete" | "error",
    result?: TableDetectionResult,
    error?: string
  ) => {
    const logData = {
      operation: "table_detection",
      phase,
      result,
      error,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      console.error("[DB-DETECTION]", JSON.stringify(logData));
    } else {
      console.info("[DB-DETECTION]", JSON.stringify(logData));
    }
  },

  logError: (error: DetectionError) => {
    const logData = {
      operation: "detection_error",
      error,
      timestamp: new Date().toISOString(),
    };
    console.error("[DB-DETECTION]", JSON.stringify(logData));
  },

  logDetectionResult: (result: DatabaseDetectionResult) => {
    const logData = {
      operation: "detection_complete",
      summary: result.detectionReport.summary,
      totalTime: result.totalDetectionTime,
      errorCount: result.errors.length,
      timestamp: new Date().toISOString(),
    };
    console.info("[DB-DETECTION]", JSON.stringify(logData));
  },

  logSchemaValidation: (
    phase: "start" | "complete" | "error",
    tableCount?: number,
    error?: string
  ) => {
    const logData = {
      operation: "schema_validation",
      phase,
      tableCount,
      error,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      console.error("[DB-DETECTION]", JSON.stringify(logData));
    } else {
      console.info("[DB-DETECTION]", JSON.stringify(logData));
    }
  },
};

/**
 * Validate table schemas against expected structure
 */
async function validateTableSchemas(
  existingTables: string[]
): Promise<SchemaValidationResult[]> {
  const results: SchemaValidationResult[] = [];

  try {
    detectionLogger.logSchemaValidation("start", existingTables.length);

    for (const tableName of existingTables) {
      const expectedSchema = EXPECTED_SCHEMAS[tableName];
      if (!expectedSchema) {
        // Table exists but not in our expected schema (extra table)
        results.push({
          tableName,
          exists: true,
          structureMatches: false,
          missingColumns: [],
          extraColumns: [],
          typeMismatches: [],
        });
        continue;
      }

      const validationResult = await validateSingleTableSchema(
        tableName,
        expectedSchema
      );
      results.push(validationResult);
    }

    detectionLogger.logSchemaValidation("complete", results.length);
    return results;
  } catch (error) {
    detectionLogger.logSchemaValidation(
      "error",
      0,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Validate a single table's schema
 */
async function validateSingleTableSchema(
  tableName: string,
  expectedSchema: TableSchema
): Promise<SchemaValidationResult> {
  try {
    // Get actual table structure
    const [rows] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [DETECTION_CONFIG.DATABASE_NAME, tableName]
    );

    const actualColumns = rows as any[];
    const actualColumnMap = new Map(
      actualColumns.map((col) => [
        col.COLUMN_NAME,
        {
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === "YES",
          default: col.COLUMN_DEFAULT,
          extra: col.EXTRA,
        },
      ])
    );

    const expectedColumnNames = Object.keys(expectedSchema.columns);
    const actualColumnNames = actualColumns.map((col) => col.COLUMN_NAME);

    const missingColumns = expectedColumnNames.filter(
      (name) => !actualColumnNames.includes(name)
    );
    const extraColumns = actualColumnNames.filter(
      (name) => !expectedColumnNames.includes(name)
    );
    const typeMismatches: ColumnTypeMismatch[] = [];

    // Check type mismatches for existing columns
    for (const [columnName, expectedColumn] of Object.entries(
      expectedSchema.columns
    )) {
      const actualColumn = actualColumnMap.get(columnName);
      if (
        actualColumn &&
        !isTypeCompatible(expectedColumn.type, actualColumn.type)
      ) {
        typeMismatches.push({
          columnName,
          expectedType: expectedColumn.type,
          actualType: actualColumn.type,
        });
      }
    }

    const structureMatches =
      missingColumns.length === 0 &&
      extraColumns.length === 0 &&
      typeMismatches.length === 0;

    return {
      tableName,
      exists: true,
      structureMatches,
      missingColumns,
      extraColumns,
      typeMismatches,
    };
  } catch (error) {
    detectionLogger.logError({
      type: "schema",
      message: `Failed to validate schema for table ${tableName}`,
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    });

    return {
      tableName,
      exists: true,
      structureMatches: false,
      missingColumns: [],
      extraColumns: [],
      typeMismatches: [],
    };
  }
}

/**
 * Check if MySQL data types are compatible
 */
function isTypeCompatible(expectedType: string, actualType: string): boolean {
  // Normalize types for comparison
  const normalizeType = (type: string): string => {
    return type.toLowerCase().replace(/\(\d+\)/g, ""); // Remove size specifications
  };

  const expected = normalizeType(expectedType);
  const actual = normalizeType(actualType);

  // Direct match
  if (expected === actual) return true;

  // Type compatibility mappings
  const compatibilityMap: Record<string, string[]> = {
    int: ["int", "integer", "bigint", "smallint", "mediumint"],
    varchar: ["varchar", "text", "char"],
    text: ["text", "longtext", "mediumtext", "varchar"],
    timestamp: ["timestamp", "datetime"],
    tinyint: ["tinyint", "boolean", "bool"],
    enum: ["enum", "varchar"], // enum can be stored as varchar
  };

  const compatibleTypes = compatibilityMap[expected] || [expected];
  return compatibleTypes.includes(actual);
}

/**
 * Generate comprehensive detection report
 */
function generateDetectionReport(
  result: DatabaseDetectionResult
): DetectionReport {
  const report: DetectionReport = {
    summary: {
      databaseStatus: result.databaseExists ? "exists" : "missing",
      tablesStatus: "missing",
      overallHealth: "critical",
    },
    recommendations: [],
    details: {
      missingComponents: [],
      structuralIssues: [],
    },
  };

  // Add database info if exists
  if (result.databaseExists && result.charset && result.collation) {
    report.details.databaseInfo = {
      name: result.databaseName,
      charset: result.charset,
      collation: result.collation,
    };
  }

  // Analyze tables status
  const { missingTables, extraTables, schemaValidation } =
    result.tablesDetection;

  if (missingTables.length === 0 && extraTables.length === 0) {
    // Check schema validation results
    const structuralIssues = schemaValidation.filter(
      (v) => !v.structureMatches
    );
    if (structuralIssues.length === 0) {
      report.summary.tablesStatus = "complete";
      report.summary.overallHealth = "healthy";
    } else {
      report.summary.tablesStatus = "partial";
      report.summary.overallHealth = "needs_attention";
    }
  } else if (
    missingTables.length < result.tablesDetection.expectedTables.length
  ) {
    report.summary.tablesStatus = "partial";
    report.summary.overallHealth = "needs_attention";
  }

  // Generate missing components list
  if (!result.databaseExists) {
    report.details.missingComponents.push(`Database: ${result.databaseName}`);
  }

  missingTables.forEach((table) => {
    report.details.missingComponents.push(`Table: ${table}`);
  });

  // Generate structural issues list
  schemaValidation.forEach((validation) => {
    if (!validation.structureMatches) {
      const issues: string[] = [];

      if (validation.missingColumns.length > 0) {
        issues.push(`Missing columns: ${validation.missingColumns.join(", ")}`);
      }

      if (validation.extraColumns.length > 0) {
        issues.push(`Extra columns: ${validation.extraColumns.join(", ")}`);
      }

      if (validation.typeMismatches.length > 0) {
        const mismatches = validation.typeMismatches.map(
          (m) =>
            `${m.columnName}: expected ${m.expectedType}, got ${m.actualType}`
        );
        issues.push(`Type mismatches: ${mismatches.join(", ")}`);
      }

      if (issues.length > 0) {
        report.details.structuralIssues.push(
          `Table ${validation.tableName}: ${issues.join("; ")}`
        );
      }
    }
  });

  // Generate recommendations
  report.recommendations = generateRecommendations(result, report);

  return report;
}

/**
 * Generate actionable recommendations based on detection results
 */
function generateRecommendations(
  result: DatabaseDetectionResult,
  report: DetectionReport
): string[] {
  const recommendations: string[] = [];

  // Database-level recommendations
  if (!result.databaseExists) {
    recommendations.push(
      `Create database '${result.databaseName}' with charset '${DETECTION_CONFIG.EXPECTED_CHARSET}' and collation '${DETECTION_CONFIG.EXPECTED_COLLATION}'`
    );
    recommendations.push(
      "Run database initialization scripts from docker/mysql/init/init.sql"
    );
    recommendations.push(
      "Verify database connection configuration in environment variables"
    );
    return recommendations; // If no database, other recommendations are not relevant
  }

  // Charset/collation recommendations
  if (result.charset !== DETECTION_CONFIG.EXPECTED_CHARSET) {
    recommendations.push(
      `Update database charset from '${result.charset}' to '${DETECTION_CONFIG.EXPECTED_CHARSET}'`
    );
  }

  if (result.collation !== DETECTION_CONFIG.EXPECTED_COLLATION) {
    recommendations.push(
      `Update database collation from '${result.collation}' to '${DETECTION_CONFIG.EXPECTED_COLLATION}'`
    );
  }

  // Table-level recommendations
  const { missingTables, extraTables, schemaValidation } =
    result.tablesDetection;

  if (missingTables.length > 0) {
    recommendations.push(`Create missing tables: ${missingTables.join(", ")}`);
    recommendations.push(
      "Run table creation scripts from docker/mysql/init/init.sql"
    );
  }

  if (extraTables.length > 0) {
    recommendations.push(
      `Review extra tables not in schema: ${extraTables.join(", ")}`
    );
    recommendations.push(
      "Consider removing unused tables or updating schema definition"
    );
  }

  // Schema validation recommendations
  const tablesWithIssues = schemaValidation.filter((v) => !v.structureMatches);
  if (tablesWithIssues.length > 0) {
    recommendations.push("Fix table structure issues:");

    tablesWithIssues.forEach((validation) => {
      if (validation.missingColumns.length > 0) {
        recommendations.push(
          `  - Add missing columns to ${
            validation.tableName
          }: ${validation.missingColumns.join(", ")}`
        );
      }

      if (validation.extraColumns.length > 0) {
        recommendations.push(
          `  - Remove or document extra columns in ${
            validation.tableName
          }: ${validation.extraColumns.join(", ")}`
        );
      }

      if (validation.typeMismatches.length > 0) {
        validation.typeMismatches.forEach((mismatch) => {
          recommendations.push(
            `  - Fix type mismatch in ${validation.tableName}.${mismatch.columnName}: change from ${mismatch.actualType} to ${mismatch.expectedType}`
          );
        });
      }
    });
  }

  // General recommendations
  if (report.summary.overallHealth === "healthy") {
    recommendations.push(
      "Database schema is healthy and matches expected structure"
    );
    recommendations.push("Consider running periodic schema validation checks");
  } else {
    recommendations.push(
      "Run schema validation after making recommended changes"
    );
    recommendations.push(
      "Consider implementing automated schema migration scripts"
    );
  }

  return recommendations;
}

/**
 * Integration function for health check system
 * Returns a simplified health status based on detection results
 */
export async function getDetectionHealthStatus(): Promise<{
  isHealthy: boolean;
  summary: string;
  details: {
    databaseExists: boolean;
    tablesComplete: boolean;
    schemaValid: boolean;
  };
  recommendations: string[];
}> {
  try {
    const detectionResult = await detectDatabaseAndSchema();

    const isHealthy =
      detectionResult.detectionReport.summary.overallHealth === "healthy";
    const tablesComplete =
      detectionResult.tablesDetection.missingTables.length === 0;
    const schemaValid = detectionResult.tablesDetection.schemaValidation.every(
      (v) => v.structureMatches
    );

    return {
      isHealthy,
      summary: `Database: ${detectionResult.detectionReport.summary.databaseStatus}, Tables: ${detectionResult.detectionReport.summary.tablesStatus}, Health: ${detectionResult.detectionReport.summary.overallHealth}`,
      details: {
        databaseExists: detectionResult.databaseExists,
        tablesComplete,
        schemaValid,
      },
      recommendations: detectionResult.detectionReport.recommendations.slice(
        0,
        3
      ), // Top 3 recommendations
    };
  } catch {
    return {
      isHealthy: false,
      summary: "Detection system error",
      details: {
        databaseExists: false,
        tablesComplete: false,
        schemaValid: false,
      },
      recommendations: [
        "Fix database connection issues",
        "Check database configuration",
      ],
    };
  }
}

function generateMissingDatabaseReport(): DetectionReport {
  return {
    summary: {
      databaseStatus: "missing",
      tablesStatus: "missing",
      overallHealth: "critical",
    },
    recommendations: [
      `Create database '${DETECTION_CONFIG.DATABASE_NAME}' with charset '${DETECTION_CONFIG.EXPECTED_CHARSET}'`,
      "Run database initialization scripts",
      "Verify database connection configuration",
    ],
    details: {
      missingComponents: [`Database: ${DETECTION_CONFIG.DATABASE_NAME}`],
      structuralIssues: [],
    },
  };
}
