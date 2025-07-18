/**
 * Debug test for logging system
 */

import { DatabaseLogger } from "../db-logging";

describe("Debug Logging", () => {
  test("should debug sensitive data filtering", () => {
    const logger = new DatabaseLogger({
      format: "json",
      filterSensitiveData: true,
      level: "debug",
      maxContextDepth: 5,
    });

    const complexContext = {
      operation: "user-authentication",
      user: {
        id: 123,
        username: "testuser",
        credentials: {
          password: "secret123",
          apiKey: "key456",
        },
        profile: {
          email: "test@example.com",
          preferences: {
            theme: "dark",
            secretSetting: "hidden",
          },
        },
      },
      database: "test_db",
      connectionInfo: {
        host: "localhost",
        port: 3306,
        password: "dbpass",
      },
    };

    // Mock console.log to capture output
    const originalConsoleLog = console.log;
    let capturedOutput = "";
    console.log = (message: string) => {
      capturedOutput = message;
      originalConsoleLog(message);
    };

    logger.info("Test operation", complexContext);

    // Restore console.log
    console.log = originalConsoleLog;

    const logEntry = JSON.parse(capturedOutput);
    console.log("Captured log entry:", JSON.stringify(logEntry, null, 2));

    // Just check if the structure exists first
    expect(logEntry.context).toBeDefined();
    expect(logEntry.context.user).toBeDefined();

    // Log the actual structure to debug
    console.log("User object:", JSON.stringify(logEntry.context.user, null, 2));

    // Check if credentials exist
    if (logEntry.context.user.credentials) {
      expect(logEntry.context.user.credentials.password).toBe("[FILTERED]");
      expect(logEntry.context.user.credentials.apiKey).toBe("[FILTERED]");
    }

    if (
      logEntry.context.user.profile &&
      logEntry.context.user.profile.preferences
    ) {
      expect(logEntry.context.user.profile.preferences.secretSetting).toBe(
        "[FILTERED]"
      );
    }

    if (logEntry.context.connectionInfo) {
      expect(logEntry.context.connectionInfo.password).toBe("[FILTERED]");
    }

    expect(logEntry.context.user.username).toBe("testuser");
  });
});
