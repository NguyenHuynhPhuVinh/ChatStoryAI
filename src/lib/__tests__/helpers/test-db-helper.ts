/**
 * Test Database Helper
 * Provides utilities for integration testing with real MySQL database
 */

import mysql from "mysql2/promise";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface TestDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  rootPassword: string;
}

export const DEFAULT_TEST_CONFIG: TestDatabaseConfig = {
  host: "localhost",
  port: 3307,
  user: "chatstory_test_user",
  password: "test_password",
  database: "chatstoryai_test",
  rootPassword: "test_root_password",
};

export class TestDatabaseHelper {
  private config: TestDatabaseConfig;
  private connection: mysql.Connection | null = null;
  private rootConnection: mysql.Connection | null = null;

  constructor(config: TestDatabaseConfig = DEFAULT_TEST_CONFIG) {
    this.config = config;
  }

  /**
   * Start MySQL test container
   */
  async startTestDatabase(): Promise<void> {
    try {
      // Check if container is already running
      const { stdout } = await execAsync(
        'docker ps --filter name=chatstoryai-mysql-test --format "{{.Names}}"'
      );

      if (stdout.trim() === "chatstoryai-mysql-test") {
        console.log("Test database container already running");
        return;
      }

      console.log("Starting test database container...");
      await execAsync(
        "docker-compose -f docker-compose.test.yml up -d mysql-test"
      );

      // Wait for database to be ready
      await this.waitForDatabase();
      console.log("Test database is ready");
    } catch (error) {
      throw new Error(`Failed to start test database: ${error}`);
    }
  }

  /**
   * Stop MySQL test container
   */
  async stopTestDatabase(): Promise<void> {
    try {
      console.log("Stopping test database container...");
      await execAsync("docker-compose -f docker-compose.test.yml down");
      console.log("Test database stopped");
    } catch (error) {
      console.warn(`Warning: Failed to stop test database: ${error}`);
    }
  }

  /**
   * Wait for database to be ready
   */
  private async waitForDatabase(maxAttempts: number = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const connection = await mysql.createConnection({
          host: this.config.host,
          port: this.config.port,
          user: "root",
          password: this.config.rootPassword,
        });

        await connection.ping();
        await connection.end();
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(
            `Database not ready after ${maxAttempts} attempts: ${error}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Get database connection
   */
  async getConnection(): Promise<mysql.Connection> {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        ssl: undefined, // Disable SSL for test environment
        connectTimeout: 10000,
      });
    }
    return this.connection;
  }

  /**
   * Get root database connection
   */
  async getRootConnection(): Promise<mysql.Connection> {
    if (!this.rootConnection) {
      this.rootConnection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: "root",
        password: this.config.rootPassword,
        ssl: undefined, // Disable SSL for test environment
        connectTimeout: 10000,
      });
    }
    return this.rootConnection;
  }

  /**
   * Clean up test database
   */
  async cleanupDatabase(): Promise<void> {
    try {
      const rootConn = await this.getRootConnection();

      // Drop test database if exists
      await rootConn.execute(`DROP DATABASE IF EXISTS ${this.config.database}`);

      // Recreate test database
      await rootConn.execute(
        `CREATE DATABASE IF NOT EXISTS ${this.config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );

      // Create test user if not exists
      await rootConn.execute(
        `CREATE USER IF NOT EXISTS '${this.config.user}'@'%' IDENTIFIED BY '${this.config.password}'`
      );

      // Grant permissions to test user
      await rootConn.execute(
        `GRANT ALL PRIVILEGES ON ${this.config.database}.* TO '${this.config.user}'@'%'`
      );
      await rootConn.execute("FLUSH PRIVILEGES");
    } catch (error) {
      console.warn(`Warning: Failed to cleanup database: ${error}`);
      // Don't throw error to avoid breaking tests
    }
  }

  /**
   * Close all connections
   */
  async closeConnections(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
    if (this.rootConnection) {
      await this.rootConnection.end();
      this.rootConnection = null;
    }
  }

  /**
   * Check if database is available
   */
  async isDatabaseAvailable(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: "root",
        password: this.config.rootPassword,
        ssl: undefined, // Disable SSL for test environment
        connectTimeout: 5000,
      });

      await connection.ping();
      await connection.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database configuration for testing
   */
  getTestConfig(): TestDatabaseConfig {
    return { ...this.config };
  }
}

// Global test helper instance
export const testDbHelper = new TestDatabaseHelper();

/**
 * Jest setup helper for integration tests
 */
export const setupIntegrationTest = () => {
  beforeAll(async () => {
    await testDbHelper.startTestDatabase();
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    await testDbHelper.closeConnections();
    await testDbHelper.stopTestDatabase();
  }, 30000);

  beforeEach(async () => {
    await testDbHelper.cleanupDatabase();
  }, 10000);
};

/**
 * Skip integration tests if database is not available
 */
export const skipIfNoDatabaseAvailable = () => {
  beforeAll(async () => {
    const isAvailable = await testDbHelper.isDatabaseAvailable();
    if (!isAvailable) {
      console.warn("Skipping integration tests - test database not available");
      pending("Test database not available");
    }
  });
};
