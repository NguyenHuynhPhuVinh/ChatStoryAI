# Integration Testing Guide

This document describes how to run integration tests for the ChatStoryAI database initialization system.

## Overview

Integration tests use real MySQL database instances running in Docker containers to test the actual behavior of database initialization functions. These tests complement unit tests by verifying that the system works correctly with real database connections.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm
- Available ports 3307 and 3308 (for test databases)

## Test Database Setup

### Automatic Setup (Recommended)

Use the npm scripts to automatically manage test databases:

```bash
# Run all integration tests with automatic setup/teardown
npm run test:integration:full

# Or manually control the lifecycle
npm run test:integration:setup    # Start test database
npm run test:integration          # Run integration tests
npm run test:integration:teardown # Stop test database
```

### Manual Setup

If you prefer manual control:

```bash
# Start test database container
docker-compose -f docker-compose.test.yml up -d mysql-test

# Run integration tests
npm run test:integration

# Stop test database container
docker-compose -f docker-compose.test.yml down
```

## Test Configuration

### Environment Variables

Integration tests use the following environment variables:

- `SKIP_INTEGRATION_TESTS=true` - Skip integration tests entirely
- `CI=true` - Automatically skip integration tests in CI environments

### Database Configuration

Test databases use these configurations:

- **Primary Test DB**: `localhost:3307`
  - Database: `chatstoryai_test`
  - User: `chatstory_test_user`
  - Password: `test_password`
  - Root Password: `test_root_password`

- **Version Testing DB**: `localhost:3308` (MySQL 8.1)
  - Same credentials as primary
  - Used for version compatibility testing

## Test Structure

### Test Files

- `db-health.real-integration.test.ts` - Database health check integration tests
- `db-creation.real-integration.test.ts` - Database creation integration tests
- `db-migration.real-integration.test.ts` - Migration system integration tests
- `startup-init.real-integration.test.ts` - Startup initialization integration tests

### Test Helpers

- `helpers/test-db-helper.ts` - Utilities for managing test database connections
- `helpers/test-migrations/` - Sample migration files for testing

## Test Scenarios

### Database Health Check Tests

- Connection to healthy MySQL database
- Connection failure handling
- Invalid credentials detection
- Version compatibility validation
- Permission checking
- Performance metrics collection

### Database Creation Tests

- Database creation with correct charset/collation
- Handling existing databases
- Connection failure scenarios
- Insufficient privilege handling
- Schema validation

### Migration System Tests

- Fresh database migration execution
- Skipping already executed migrations
- Migration failure handling
- Migration history tracking
- Dry run mode testing

### Startup Initialization Tests

- Successful application initialization
- Connection failure handling
- Middleware initialization
- Configuration validation
- Error recovery scenarios

## Running Specific Tests

```bash
# Run only health check integration tests
npm run test:integration -- --testPathPatterns=db-health.real-integration

# Run only migration integration tests
npm run test:integration -- --testPathPatterns=db-migration.real-integration

# Run with verbose output
npm run test:integration -- --verbose

# Run with coverage
npm run test:integration -- --coverage
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3307 and 3308 are available
2. **Docker not running**: Start Docker service
3. **Permission issues**: Ensure Docker can be run without sudo
4. **Database startup timeout**: Increase timeout in test helper

### Debugging

```bash
# Check if test database is running
docker ps | grep chatstoryai-mysql-test

# View database logs
docker logs chatstoryai-mysql-test

# Connect to test database manually
mysql -h localhost -P 3307 -u chatstory_test_user -p chatstoryai_test
```

### Cleanup

```bash
# Remove test containers and volumes
docker-compose -f docker-compose.test.yml down -v

# Remove test migration files
rm -rf src/lib/__tests__/test-migrations
```

## CI/CD Integration

Integration tests are automatically skipped in CI environments unless explicitly enabled. To run integration tests in CI:

1. Ensure Docker is available in CI environment
2. Set `SKIP_INTEGRATION_TESTS=false`
3. Add database startup time to CI timeout

Example GitHub Actions configuration:

```yaml
- name: Start test database
  run: npm run test:integration:setup

- name: Run integration tests
  run: npm run test:integration
  env:
    SKIP_INTEGRATION_TESTS: false

- name: Stop test database
  run: npm run test:integration:teardown
  if: always()
```

## Best Practices

1. **Isolation**: Each test should clean up after itself
2. **Timeouts**: Use appropriate timeouts for database operations
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Monitor test execution time
5. **Cleanup**: Always clean up test data and connections

## Contributing

When adding new integration tests:

1. Follow the existing naming convention (`*.real-integration.test.ts`)
2. Use the test helper utilities for database management
3. Include both positive and negative test cases
4. Add appropriate timeouts for database operations
5. Document any special setup requirements
