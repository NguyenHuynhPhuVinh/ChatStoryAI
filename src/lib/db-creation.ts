/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise";

// TypeScript interfaces for database creation operations
export interface DatabaseCreationResult {
  success: boolean;
  databaseName: string;
  created: boolean; // true if database was created, false if already existed
  charset: string;
  collation: string;
  errors: CreationError[];
  timestamp: Date;
  totalCreationTime: number; // milliseconds
}

export interface UserCreationResult {
  success: boolean;
  username: string;
  created: boolean; // true if user was created, false if already existed
  permissionsGranted: boolean;
  errors: CreationError[];
  timestamp: Date;
}

export interface CreationVerificationResult {
  databaseVerified: boolean;
  userVerified: boolean;
  permissionsVerified: boolean;
  charsetCorrect: boolean;
  collationCorrect: boolean;
  overallSuccess: boolean;
  verificationReport: VerificationReport;
  errors: CreationError[];
  timestamp: Date;
}

export interface VerificationReport {
  summary: {
    databaseStatus: "created" | "exists" | "missing";
    userStatus: "created" | "exists" | "missing";
    permissionsStatus: "granted" | "partial" | "missing";
    overallHealth: "healthy" | "needs_attention" | "failed";
  };
  details: {
    databaseInfo: {
      name: string;
      charset: string;
      collation: string;
    };
    userInfo?: {
      username: string;
      host: string;
      permissions: string[];
    };
    issues: string[];
  };
  recommendations: string[];
}

export interface CreationError {
  type: "database" | "user" | "permissions" | "connection" | "verification";
  message: string;
  details?: any;
  timestamp: Date;
}

// Configuration constants for database creation
export const DB_CREATION_CONFIG = {
  DATABASE_NAME: "chatstoryai",
  CHARSET: "utf8mb4",
  COLLATION: "utf8mb4_unicode_ci",
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  REQUIRED_PERMISSIONS: [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "INDEX",
    "ALTER",
  ],
  USER_HOST: "%", // Allow connections from any host
} as const;

/**
 * Main function to create database if it doesn't exist
 */
export async function createDatabaseIfNotExists(): Promise<DatabaseCreationResult> {
  const startTime = Date.now();
  const result: DatabaseCreationResult = {
    success: false,
    databaseName: DB_CREATION_CONFIG.DATABASE_NAME,
    created: false,
    charset: DB_CREATION_CONFIG.CHARSET,
    collation: DB_CREATION_CONFIG.COLLATION,
    errors: [],
    timestamp: new Date(),
    totalCreationTime: 0,
  };

  let connection: mysql.Connection | null = null;

  try {
    creationLogger.logDatabaseCreation(
      "start",
      DB_CREATION_CONFIG.DATABASE_NAME
    );

    // Create connection without specifying database
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      // Don't specify database here as it might not exist
      connectTimeout: DB_CREATION_CONFIG.CONNECTION_TIMEOUT,
    });

    // Check if database already exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
       FROM information_schema.SCHEMATA 
       WHERE SCHEMA_NAME = ?`,
      [DB_CREATION_CONFIG.DATABASE_NAME]
    );

    const databases = rows as any[];

    if (databases.length > 0) {
      // Database exists, check charset and collation
      const dbInfo = databases[0];
      result.charset = dbInfo.DEFAULT_CHARACTER_SET_NAME;
      result.collation = dbInfo.DEFAULT_COLLATION_NAME;
      result.success = true;
      result.created = false;

      creationLogger.logDatabaseCreation(
        "exists",
        DB_CREATION_CONFIG.DATABASE_NAME,
        { charset: result.charset, collation: result.collation }
      );

      // Check if charset/collation need updating
      if (
        result.charset !== DB_CREATION_CONFIG.CHARSET ||
        result.collation !== DB_CREATION_CONFIG.COLLATION
      ) {
        creationLogger.logDatabaseCreation(
          "updating_charset",
          DB_CREATION_CONFIG.DATABASE_NAME,
          {
            currentCharset: result.charset,
            targetCharset: DB_CREATION_CONFIG.CHARSET,
            currentCollation: result.collation,
            targetCollation: DB_CREATION_CONFIG.COLLATION,
          }
        );

        // Update database charset and collation
        await connection.execute(
          `ALTER DATABASE ${DB_CREATION_CONFIG.DATABASE_NAME} 
           CHARACTER SET = ? COLLATE = ?`,
          [DB_CREATION_CONFIG.CHARSET, DB_CREATION_CONFIG.COLLATION]
        );

        result.charset = DB_CREATION_CONFIG.CHARSET;
        result.collation = DB_CREATION_CONFIG.COLLATION;
      }
    } else {
      // Database doesn't exist, create it
      creationLogger.logDatabaseCreation(
        "creating",
        DB_CREATION_CONFIG.DATABASE_NAME
      );

      await connection.execute(
        `CREATE DATABASE ${DB_CREATION_CONFIG.DATABASE_NAME} 
         CHARACTER SET = ? COLLATE = ?`,
        [DB_CREATION_CONFIG.CHARSET, DB_CREATION_CONFIG.COLLATION]
      );

      result.success = true;
      result.created = true;

      creationLogger.logDatabaseCreation(
        "created",
        DB_CREATION_CONFIG.DATABASE_NAME,
        { charset: result.charset, collation: result.collation }
      );
    }
  } catch (error) {
    const creationError: CreationError = {
      type: "database",
      message: "Failed to create or verify database",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(creationError);
    creationLogger.logError(creationError);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  result.totalCreationTime = Date.now() - startTime;
  creationLogger.logDatabaseCreation(
    "complete",
    DB_CREATION_CONFIG.DATABASE_NAME,
    result
  );
  return result;
}

/**
 * Structured logging system for database creation operations
 */
export const creationLogger = {
  logDatabaseCreation: (
    phase:
      | "start"
      | "exists"
      | "creating"
      | "created"
      | "updating_charset"
      | "complete",
    databaseName: string,
    details?: any
  ) => {
    const logData = {
      operation: "database_creation",
      phase,
      database: databaseName,
      details,
      timestamp: new Date().toISOString(),
    };

    console.info("[DB-CREATION]", JSON.stringify(logData));
  },

  logUserCreation: (
    phase:
      | "start"
      | "exists"
      | "creating"
      | "created"
      | "granting_permissions"
      | "complete",
    username: string,
    details?: any
  ) => {
    const logData = {
      operation: "user_creation",
      phase,
      username,
      details,
      timestamp: new Date().toISOString(),
    };

    console.info("[DB-CREATION]", JSON.stringify(logData));
  },

  logVerification: (
    phase: "start" | "database" | "user" | "permissions" | "complete",
    details?: any
  ) => {
    const logData = {
      operation: "creation_verification",
      phase,
      details,
      timestamp: new Date().toISOString(),
    };

    console.info("[DB-CREATION]", JSON.stringify(logData));
  },

  logError: (error: CreationError) => {
    const logData = {
      operation: "creation_error",
      error,
      timestamp: new Date().toISOString(),
    };
    console.error("[DB-CREATION]", JSON.stringify(logData));
  },
};

/**
 * Create database user if needed (Task 2)
 */
export async function createDatabaseUserIfNeeded(
  username?: string,
  password?: string,
  host: string = DB_CREATION_CONFIG.USER_HOST
): Promise<UserCreationResult> {
  const targetUsername =
    username || process.env.MYSQL_USER || "chatstoryai_user";
  const targetPassword =
    password || process.env.MYSQL_PASSWORD || generateSecurePassword();

  const result: UserCreationResult = {
    success: false,
    username: targetUsername,
    created: false,
    permissionsGranted: false,
    errors: [],
    timestamp: new Date(),
  };

  let connection: mysql.Connection | null = null;

  try {
    creationLogger.logUserCreation("start", targetUsername);

    // Create connection with admin privileges
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD,
      connectTimeout: DB_CREATION_CONFIG.CONNECTION_TIMEOUT,
    });

    // Check if user already exists
    const [userRows] = await connection.execute(
      `SELECT User, Host FROM mysql.user WHERE User = ? AND Host = ?`,
      [targetUsername, host]
    );

    const existingUsers = userRows as any[];

    if (existingUsers.length > 0) {
      result.success = true;
      result.created = false;
      creationLogger.logUserCreation("exists", targetUsername, { host });
    } else {
      // Create user
      creationLogger.logUserCreation("creating", targetUsername, { host });

      // Use parameterized query for security
      await connection.execute(`CREATE USER ?@? IDENTIFIED BY ?`, [
        targetUsername,
        host,
        targetPassword,
      ]);

      result.success = true;
      result.created = true;
      creationLogger.logUserCreation("created", targetUsername, { host });
    }

    // Grant permissions
    creationLogger.logUserCreation("granting_permissions", targetUsername);

    const permissionsString =
      DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.join(", ");
    await connection.execute(
      `GRANT ${permissionsString} ON ${DB_CREATION_CONFIG.DATABASE_NAME}.* TO ?@?`,
      [targetUsername, host]
    );

    // Flush privileges to ensure changes take effect
    await connection.execute("FLUSH PRIVILEGES");

    result.permissionsGranted = true;
    creationLogger.logUserCreation("complete", targetUsername, result);
  } catch (error) {
    const creationError: CreationError = {
      type: "user",
      message: "Failed to create or configure database user",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(creationError);
    creationLogger.logError(creationError);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  return result;
}

/**
 * Generate a secure random password for database user
 * Uses cryptographically secure random number generation
 */
function generateSecurePassword(length: number = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // Use crypto.randomInt for better security if available
  const crypto = require("crypto");

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt
      ? crypto.randomInt(0, charset.length)
      : Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Verify database creation success (Task 3)
 */
export async function verifyDatabaseCreation(
  username?: string,
  host: string = DB_CREATION_CONFIG.USER_HOST
): Promise<CreationVerificationResult> {
  const targetUsername =
    username || process.env.MYSQL_USER || "chatstoryai_user";

  const result: CreationVerificationResult = {
    databaseVerified: false,
    userVerified: false,
    permissionsVerified: false,
    charsetCorrect: false,
    collationCorrect: false,
    overallSuccess: false,
    verificationReport: {
      summary: {
        databaseStatus: "missing",
        userStatus: "missing",
        permissionsStatus: "missing",
        overallHealth: "failed",
      },
      details: {
        databaseInfo: {
          name: DB_CREATION_CONFIG.DATABASE_NAME,
          charset: "",
          collation: "",
        },
        issues: [],
      },
      recommendations: [],
    },
    errors: [],
    timestamp: new Date(),
  };

  let connection: mysql.Connection | null = null;

  try {
    creationLogger.logVerification("start");

    // Create connection for verification
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_ROOT_USER || process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD,
      connectTimeout: DB_CREATION_CONFIG.CONNECTION_TIMEOUT,
    });

    // Step 1: Verify database existence and properties
    creationLogger.logVerification("database");

    const [dbRows] = await connection.execute(
      `SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
       FROM information_schema.SCHEMATA
       WHERE SCHEMA_NAME = ?`,
      [DB_CREATION_CONFIG.DATABASE_NAME]
    );

    const databases = dbRows as any[];

    if (databases.length > 0) {
      const dbInfo = databases[0];
      result.databaseVerified = true;
      result.verificationReport.summary.databaseStatus = "exists";
      result.verificationReport.details.databaseInfo.charset =
        dbInfo.DEFAULT_CHARACTER_SET_NAME;
      result.verificationReport.details.databaseInfo.collation =
        dbInfo.DEFAULT_COLLATION_NAME;

      result.charsetCorrect =
        dbInfo.DEFAULT_CHARACTER_SET_NAME === DB_CREATION_CONFIG.CHARSET;
      result.collationCorrect =
        dbInfo.DEFAULT_COLLATION_NAME === DB_CREATION_CONFIG.COLLATION;

      if (!result.charsetCorrect) {
        result.verificationReport.details.issues.push(
          `Database charset is '${dbInfo.DEFAULT_CHARACTER_SET_NAME}', expected '${DB_CREATION_CONFIG.CHARSET}'`
        );
      }

      if (!result.collationCorrect) {
        result.verificationReport.details.issues.push(
          `Database collation is '${dbInfo.DEFAULT_COLLATION_NAME}', expected '${DB_CREATION_CONFIG.COLLATION}'`
        );
      }
    } else {
      result.verificationReport.details.issues.push("Database does not exist");
    }

    // Step 2: Verify user existence
    creationLogger.logVerification("user");

    const [userRows] = await connection.execute(
      `SELECT User, Host FROM mysql.user WHERE User = ? AND Host = ?`,
      [targetUsername, host]
    );

    const users = userRows as any[];

    if (users.length > 0) {
      result.userVerified = true;
      result.verificationReport.summary.userStatus = "exists";
      result.verificationReport.details.userInfo = {
        username: targetUsername,
        host: host,
        permissions: [],
      };
    } else {
      result.verificationReport.details.issues.push(
        `Database user '${targetUsername}@${host}' does not exist`
      );
    }

    // Step 3: Verify user permissions
    if (result.userVerified) {
      creationLogger.logVerification("permissions");

      const [permRows] = await connection.execute(
        `SELECT PRIVILEGE_TYPE FROM information_schema.USER_PRIVILEGES
         WHERE GRANTEE = ? AND PRIVILEGE_TYPE IN (${DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(
           () => "?"
         ).join(",")})`,
        [
          `'${targetUsername}'@'${host}'`,
          ...DB_CREATION_CONFIG.REQUIRED_PERMISSIONS,
        ]
      );

      const globalPermissions = (permRows as any[]).map(
        (row) => row.PRIVILEGE_TYPE
      );

      // Also check database-specific permissions
      const [dbPermRows] = await connection.execute(
        `SELECT PRIVILEGE_TYPE FROM information_schema.SCHEMA_PRIVILEGES
         WHERE GRANTEE = ? AND TABLE_SCHEMA = ? AND PRIVILEGE_TYPE IN (${DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(
           () => "?"
         ).join(",")})`,
        [
          `'${targetUsername}'@'${host}'`,
          DB_CREATION_CONFIG.DATABASE_NAME,
          ...DB_CREATION_CONFIG.REQUIRED_PERMISSIONS,
        ]
      );

      const dbSpecificPermissions = (dbPermRows as any[]).map(
        (row) => row.PRIVILEGE_TYPE
      );
      const allPermissions = [
        ...new Set([...globalPermissions, ...dbSpecificPermissions]),
      ];

      result.verificationReport.details.userInfo!.permissions = allPermissions;

      const missingPermissions = DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.filter(
        (perm) => !allPermissions.includes(perm)
      );

      if (missingPermissions.length === 0) {
        result.permissionsVerified = true;
        result.verificationReport.summary.permissionsStatus = "granted";
      } else {
        result.verificationReport.summary.permissionsStatus = "partial";
        result.verificationReport.details.issues.push(
          `Missing permissions: ${missingPermissions.join(", ")}`
        );
      }
    }
  } catch (error) {
    const verificationError: CreationError = {
      type: "verification",
      message: "Failed to verify database creation",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
    result.errors.push(verificationError);
    creationLogger.logError(verificationError);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // Generate final assessment
  result.overallSuccess =
    result.databaseVerified &&
    result.userVerified &&
    result.permissionsVerified &&
    result.charsetCorrect &&
    result.collationCorrect;

  if (result.overallSuccess) {
    result.verificationReport.summary.overallHealth = "healthy";
  } else if (result.databaseVerified && result.userVerified) {
    result.verificationReport.summary.overallHealth = "needs_attention";
  } else {
    result.verificationReport.summary.overallHealth = "failed";
  }

  // Generate recommendations
  result.verificationReport.recommendations =
    generateVerificationRecommendations(result);

  creationLogger.logVerification("complete", result);
  return result;
}

/**
 * Generate verification recommendations
 */
function generateVerificationRecommendations(
  result: CreationVerificationResult
): string[] {
  const recommendations: string[] = [];

  if (!result.databaseVerified) {
    recommendations.push(
      "Create the database using createDatabaseIfNotExists()"
    );
  }

  if (!result.charsetCorrect) {
    recommendations.push(
      `Update database charset to '${DB_CREATION_CONFIG.CHARSET}'`
    );
  }

  if (!result.collationCorrect) {
    recommendations.push(
      `Update database collation to '${DB_CREATION_CONFIG.COLLATION}'`
    );
  }

  if (!result.userVerified) {
    recommendations.push(
      "Create database user using createDatabaseUserIfNeeded()"
    );
  }

  if (!result.permissionsVerified && result.userVerified) {
    recommendations.push("Grant required permissions to database user");
  }

  if (result.overallSuccess) {
    recommendations.push(
      "Database creation verification successful - no action needed"
    );
  } else {
    recommendations.push(
      "Run automated database creation process to fix issues"
    );
  }

  return recommendations;
}

/**
 * Main orchestration function - creates database, user, and verifies everything (Task 4 integration)
 */
export async function createAndVerifyDatabase(
  options: {
    username?: string;
    password?: string;
    host?: string;
    skipUserCreation?: boolean;
  } = {}
): Promise<{
  databaseResult: DatabaseCreationResult;
  userResult?: UserCreationResult;
  verificationResult: CreationVerificationResult;
  overallSuccess: boolean;
  summary: string;
}> {
  const startTime = Date.now();

  try {
    creationLogger.logDatabaseCreation("start", "orchestration");

    // Step 1: Create database
    const databaseResult = await createDatabaseIfNotExists();

    // Step 2: Create user (if not skipped and database creation was successful)
    let userResult: UserCreationResult | undefined;
    if (!options.skipUserCreation && databaseResult.success) {
      userResult = await createDatabaseUserIfNeeded(
        options.username,
        options.password,
        options.host
      );
    }

    // Step 3: Verify everything
    const verificationResult = await verifyDatabaseCreation(
      options.username,
      options.host
    );

    // Step 4: Generate summary
    const overallSuccess =
      databaseResult.success &&
      (!userResult || userResult.success) &&
      verificationResult.overallSuccess;

    const summary = generateCreationSummary(
      databaseResult,
      userResult,
      verificationResult,
      overallSuccess
    );

    const totalTime = Date.now() - startTime;
    creationLogger.logDatabaseCreation("complete", "orchestration", {
      overallSuccess,
      totalTime,
      summary,
    });

    return {
      databaseResult,
      userResult,
      verificationResult,
      overallSuccess,
      summary,
    };
  } catch (error) {
    const creationError: CreationError = {
      type: "database",
      message: "Failed during orchestrated database creation",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };

    creationLogger.logError(creationError);
    throw error;
  }
}

/**
 * Generate creation summary
 */
function generateCreationSummary(
  databaseResult: DatabaseCreationResult,
  userResult?: UserCreationResult,
  verificationResult?: CreationVerificationResult,
  overallSuccess?: boolean
): string {
  const parts: string[] = [];

  // Database status
  if (databaseResult.success) {
    if (databaseResult.created) {
      parts.push(
        `✅ Database '${databaseResult.databaseName}' created successfully`
      );
    } else {
      parts.push(`✅ Database '${databaseResult.databaseName}' already exists`);
    }
  } else {
    parts.push(`❌ Database creation failed`);
  }

  // User status
  if (userResult) {
    if (userResult.success) {
      if (userResult.created) {
        parts.push(`✅ User '${userResult.username}' created successfully`);
      } else {
        parts.push(`✅ User '${userResult.username}' already exists`);
      }

      if (userResult.permissionsGranted) {
        parts.push(`✅ Permissions granted successfully`);
      }
    } else {
      parts.push(`❌ User creation failed`);
    }
  }

  // Verification status
  if (verificationResult) {
    if (verificationResult.overallSuccess) {
      parts.push(`✅ Verification passed - all components working correctly`);
    } else {
      parts.push(
        `⚠️ Verification found issues: ${verificationResult.verificationReport.details.issues.join(
          ", "
        )}`
      );
    }
  }

  // Overall status
  if (overallSuccess) {
    parts.push(`🎉 Database setup completed successfully`);
  } else {
    parts.push(`⚠️ Database setup completed with issues`);
  }

  return parts.join(" | ");
}
