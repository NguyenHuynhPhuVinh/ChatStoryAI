/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from "mysql2/promise";
import {
  createDatabaseIfNotExists,
  createDatabaseUserIfNeeded,
  verifyDatabaseCreation,
  createAndVerifyDatabase,
  DB_CREATION_CONFIG,
  creationLogger,
  DatabaseCreationResult,
  UserCreationResult,
  CreationVerificationResult,
} from "../db-creation";

// Mock mysql2/promise
jest.mock("mysql2/promise");
const mockMysql = mysql as jest.Mocked<typeof mysql>;

// Mock console methods to avoid noise in tests
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;

describe("Database Creation Module", () => {
  let mockConnection: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock connection object
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn(),
    };

    // Mock createConnection to return our mock connection
    mockMysql.createConnection.mockResolvedValue(mockConnection);

    // Mock console methods
    console.info = jest.fn();
    console.error = jest.fn();

    // Set up environment variables
    process.env.MYSQL_HOST = "localhost";
    process.env.MYSQL_PORT = "3306";
    process.env.MYSQL_USER = "testuser";
    process.env.MYSQL_PASSWORD = "testpass";
    process.env.MYSQL_ROOT_USER = "root";
    process.env.MYSQL_ROOT_PASSWORD = "rootpass";
  });

  afterEach(() => {
    // Restore console methods
    console.info = originalConsoleInfo;
    console.error = originalConsoleError;
  });

  describe("createDatabaseIfNotExists", () => {
    it("should create database when it doesn't exist", async () => {
      // Mock database doesn't exist
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Database check returns empty
        .mockResolvedValueOnce(undefined); // Database creation succeeds

      const result = await createDatabaseIfNotExists();

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(result.databaseName).toBe(DB_CREATION_CONFIG.DATABASE_NAME);
      expect(result.charset).toBe(DB_CREATION_CONFIG.CHARSET);
      expect(result.collation).toBe(DB_CREATION_CONFIG.COLLATION);
      expect(result.errors).toHaveLength(0);

      // Verify database creation query
      expect(mockConnection.execute).toHaveBeenCalledWith(
        `CREATE DATABASE ${DB_CREATION_CONFIG.DATABASE_NAME} 
         CHARACTER SET = ? COLLATE = ?`,
        [DB_CREATION_CONFIG.CHARSET, DB_CREATION_CONFIG.COLLATION]
      );
    });

    it("should handle existing database with correct charset/collation", async () => {
      // Mock database exists with correct settings
      mockConnection.execute.mockResolvedValueOnce([
        [
          {
            SCHEMA_NAME: DB_CREATION_CONFIG.DATABASE_NAME,
            DEFAULT_CHARACTER_SET_NAME: DB_CREATION_CONFIG.CHARSET,
            DEFAULT_COLLATION_NAME: DB_CREATION_CONFIG.COLLATION,
          },
        ],
      ]);

      const result = await createDatabaseIfNotExists();

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(result.charset).toBe(DB_CREATION_CONFIG.CHARSET);
      expect(result.collation).toBe(DB_CREATION_CONFIG.COLLATION);
      expect(result.errors).toHaveLength(0);

      // Should not attempt to create or alter database
      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    });

    it("should update charset/collation for existing database", async () => {
      // Mock database exists with wrong settings
      mockConnection.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: DB_CREATION_CONFIG.DATABASE_NAME,
              DEFAULT_CHARACTER_SET_NAME: "latin1",
              DEFAULT_COLLATION_NAME: "latin1_swedish_ci",
            },
          ],
        ])
        .mockResolvedValueOnce(undefined); // ALTER DATABASE succeeds

      const result = await createDatabaseIfNotExists();

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(result.charset).toBe(DB_CREATION_CONFIG.CHARSET);
      expect(result.collation).toBe(DB_CREATION_CONFIG.COLLATION);

      // Verify ALTER DATABASE query
      expect(mockConnection.execute).toHaveBeenCalledWith(
        `ALTER DATABASE ${DB_CREATION_CONFIG.DATABASE_NAME} 
           CHARACTER SET = ? COLLATE = ?`,
        [DB_CREATION_CONFIG.CHARSET, DB_CREATION_CONFIG.COLLATION]
      );
    });

    it("should handle database creation errors", async () => {
      const errorMessage = "Access denied";
      mockConnection.execute.mockRejectedValueOnce(new Error(errorMessage));

      const result = await createDatabaseIfNotExists();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("database");
      expect(result.errors[0].message).toBe("Failed to create or verify database");
      expect(result.errors[0].details).toBe(errorMessage);
    });
  });

  describe("createDatabaseUserIfNeeded", () => {
    it("should create user when it doesn't exist", async () => {
      const username = "testuser";
      const password = "testpass";
      const host = "%";

      // Mock user doesn't exist
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // User check returns empty
        .mockResolvedValueOnce(undefined) // User creation succeeds
        .mockResolvedValueOnce(undefined) // Grant permissions succeeds
        .mockResolvedValueOnce(undefined); // Flush privileges succeeds

      const result = await createDatabaseUserIfNeeded(username, password, host);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(result.username).toBe(username);
      expect(result.permissionsGranted).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify user creation query
      expect(mockConnection.execute).toHaveBeenCalledWith(
        `CREATE USER ?@? IDENTIFIED BY ?`,
        [username, host, password]
      );

      // Verify permissions grant
      const permissionsString = DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.join(", ");
      expect(mockConnection.execute).toHaveBeenCalledWith(
        `GRANT ${permissionsString} ON ${DB_CREATION_CONFIG.DATABASE_NAME}.* TO ?@?`,
        [username, host]
      );
    });

    it("should handle existing user and grant permissions", async () => {
      const username = "existinguser";

      // Mock user exists
      mockConnection.execute
        .mockResolvedValueOnce([[{ User: username, Host: "%" }]]) // User exists
        .mockResolvedValueOnce(undefined) // Grant permissions succeeds
        .mockResolvedValueOnce(undefined); // Flush privileges succeeds

      const result = await createDatabaseUserIfNeeded(username);

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(result.permissionsGranted).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Should not attempt to create user
      expect(mockConnection.execute).not.toHaveBeenCalledWith(
        expect.stringContaining("CREATE USER"),
        expect.any(Array)
      );
    });

    it("should handle user creation errors", async () => {
      const errorMessage = "User creation failed";
      mockConnection.execute.mockRejectedValueOnce(new Error(errorMessage));

      const result = await createDatabaseUserIfNeeded();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("user");
      expect(result.errors[0].message).toBe("Failed to create or configure database user");
    });
  });

  describe("verifyDatabaseCreation", () => {
    it("should verify successful database and user creation", async () => {
      const username = "testuser";
      const host = "%";

      // Mock successful verification queries
      mockConnection.execute
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: DB_CREATION_CONFIG.DATABASE_NAME,
              DEFAULT_CHARACTER_SET_NAME: DB_CREATION_CONFIG.CHARSET,
              DEFAULT_COLLATION_NAME: DB_CREATION_CONFIG.COLLATION,
            },
          ],
        ]) // Database exists with correct settings
        .mockResolvedValueOnce([[{ User: username, Host: host }]]) // User exists
        .mockResolvedValueOnce([
          DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(perm => ({ PRIVILEGE_TYPE: perm }))
        ]) // Global permissions
        .mockResolvedValueOnce([
          DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(perm => ({ PRIVILEGE_TYPE: perm }))
        ]); // Database-specific permissions

      const result = await verifyDatabaseCreation(username, host);

      expect(result.overallSuccess).toBe(true);
      expect(result.databaseVerified).toBe(true);
      expect(result.userVerified).toBe(true);
      expect(result.permissionsVerified).toBe(true);
      expect(result.charsetCorrect).toBe(true);
      expect(result.collationCorrect).toBe(true);
      expect(result.verificationReport.summary.overallHealth).toBe("healthy");
    });

    it("should detect missing database", async () => {
      // Mock database doesn't exist
      mockConnection.execute.mockResolvedValueOnce([[]]);

      const result = await verifyDatabaseCreation();

      expect(result.overallSuccess).toBe(false);
      expect(result.databaseVerified).toBe(false);
      expect(result.verificationReport.details.issues).toContain("Database does not exist");
      expect(result.verificationReport.summary.overallHealth).toBe("failed");
    });

    it("should detect charset/collation issues", async () => {
      // Mock database exists with wrong settings
      mockConnection.execute.mockResolvedValueOnce([
        [
          {
            SCHEMA_NAME: DB_CREATION_CONFIG.DATABASE_NAME,
            DEFAULT_CHARACTER_SET_NAME: "latin1",
            DEFAULT_COLLATION_NAME: "latin1_swedish_ci",
          },
        ],
      ]);

      const result = await verifyDatabaseCreation();

      expect(result.databaseVerified).toBe(true);
      expect(result.charsetCorrect).toBe(false);
      expect(result.collationCorrect).toBe(false);
      expect(result.overallSuccess).toBe(false);
      expect(result.verificationReport.details.issues).toContain(
        "Database charset is 'latin1', expected 'utf8mb4'"
      );
    });
  });

  describe("createAndVerifyDatabase", () => {
    it("should orchestrate full database setup successfully", async () => {
      // Mock all operations succeed
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Database doesn't exist
        .mockResolvedValueOnce(undefined) // Database creation succeeds
        .mockResolvedValueOnce([[]]) // User doesn't exist
        .mockResolvedValueOnce(undefined) // User creation succeeds
        .mockResolvedValueOnce(undefined) // Grant permissions succeeds
        .mockResolvedValueOnce(undefined) // Flush privileges succeeds
        .mockResolvedValueOnce([
          [
            {
              SCHEMA_NAME: DB_CREATION_CONFIG.DATABASE_NAME,
              DEFAULT_CHARACTER_SET_NAME: DB_CREATION_CONFIG.CHARSET,
              DEFAULT_COLLATION_NAME: DB_CREATION_CONFIG.COLLATION,
            },
          ],
        ]) // Verification: database exists
        .mockResolvedValueOnce([[{ User: "testuser", Host: "%" }]]) // Verification: user exists
        .mockResolvedValueOnce([
          DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(perm => ({ PRIVILEGE_TYPE: perm }))
        ]) // Verification: global permissions
        .mockResolvedValueOnce([
          DB_CREATION_CONFIG.REQUIRED_PERMISSIONS.map(perm => ({ PRIVILEGE_TYPE: perm }))
        ]); // Verification: database permissions

      const result = await createAndVerifyDatabase();

      expect(result.overallSuccess).toBe(true);
      expect(result.databaseResult.success).toBe(true);
      expect(result.databaseResult.created).toBe(true);
      expect(result.userResult?.success).toBe(true);
      expect(result.userResult?.created).toBe(true);
      expect(result.verificationResult.overallSuccess).toBe(true);
      expect(result.summary).toContain("Database setup completed successfully");
    });

    it("should handle partial failures gracefully", async () => {
      // Mock database creation succeeds but user creation fails
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Database doesn't exist
        .mockResolvedValueOnce(undefined) // Database creation succeeds
        .mockRejectedValueOnce(new Error("User creation failed")); // User creation fails

      const result = await createAndVerifyDatabase();

      expect(result.overallSuccess).toBe(false);
      expect(result.databaseResult.success).toBe(true);
      expect(result.userResult?.success).toBe(false);
      expect(result.summary).toContain("Database setup completed with issues");
    });
  });

  describe("creationLogger", () => {
    it("should log database creation operations", () => {
      creationLogger.logDatabaseCreation("start", "testdb");

      expect(console.info).toHaveBeenCalledWith(
        "[DB-CREATION]",
        expect.stringContaining('"operation":"database_creation"')
      );
    });

    it("should log errors", () => {
      const error = {
        type: "database" as const,
        message: "Test error",
        timestamp: new Date(),
      };

      creationLogger.logError(error);

      expect(console.error).toHaveBeenCalledWith(
        "[DB-CREATION]",
        expect.stringContaining('"operation":"creation_error"')
      );
    });
  });
});
