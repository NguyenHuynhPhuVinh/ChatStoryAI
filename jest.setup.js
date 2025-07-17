// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.MYSQL_HOST = "localhost";
process.env.MYSQL_PORT = "3306";
process.env.MYSQL_USER = "test_user";
process.env.MYSQL_PASSWORD = "test_password";
process.env.MYSQL_DATABASE = "test_database";
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
