# ChatStoryAI Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source

- **IDE-based fresh analysis**: Đã phân tích codebase ChatStoryAI thông qua IDE và codebase retrieval

#### Current Project State

ChatStoryAI là một nền tảng sáng tạo truyện với sự hỗ trợ của AI, được phát triển theo kiến trúc **monorepo full-stack** sử dụng **Next.js** với App Router. Dự án hiện tại:

- **Mục đích chính**: Cho phép người dùng tạo và chia sẻ những câu chuyện độc đáo với sự hỗ trợ của AI (Google Gemini và Together AI)
- **Kiến trúc**: Tích hợp chặt chẽ frontend và backend trong cùng một codebase
- **Database**: MySQL 8.0 với charset utf8mb4
- **Deployment**: Docker-based với docker-compose.yml
- **Tính năng chính**: Sáng tạo với AI, thư viện truyện, quản lý nội dung, tích hợp thanh toán VNPay, API mở

### Available Documentation Analysis

#### Available Documentation

✅ Tech Stack Documentation  
✅ Source Tree/Architecture  
❌ Coding Standards  
✅ API Documentation  
✅ External API Documentation  
❌ UX/UI Guidelines  
✅ Technical Debt Documentation  
✅ Other: Docker configuration, Environment setup

**Trạng thái**: Dự án có documentation cơ bản tốt với architecture docs và technical setup rõ ràng.

### Enhancement Scope Definition

#### Enhancement Type

✅ **New Feature Addition** - Tự động khởi tạo CSDL khi khởi chạy dự án

#### Enhancement Description

Tạo hệ thống tự động kiểm tra và khởi tạo cơ sở dữ liệu MySQL khi khởi chạy dự án. Nếu database hoặc các bảng chưa tồn tại, hệ thống sẽ tự động chạy các script SQL để tạo schema và insert dữ liệu mẫu cần thiết.

#### Impact Assessment

✅ **Moderate Impact** (some existing code changes) - Cần thêm logic khởi tạo DB và có thể cần điều chỉnh connection handling

### Goals and Background Context

#### Goals

• Tự động hóa quá trình setup database cho developer mới
• Giảm thiểu lỗi do thiếu database hoặc schema không đúng
• Cải thiện developer experience khi clone và chạy dự án lần đầu
• Đảm bảo consistency của database schema across environments
• Hỗ trợ migration và versioning cho database schema

#### Background Context

Hiện tại, khi developer mới clone dự án ChatStoryAI, họ cần thực hiện nhiều bước thủ công để setup database bao gồm tạo database, chạy init scripts, và đảm bảo schema đúng. Điều này gây khó khăn và dễ dẫn đến lỗi. Dự án đã có sẵn Docker setup với MySQL và init scripts trong `docker/mysql/init/`, nhưng chưa có cơ chế tự động kiểm tra và khởi tạo khi chạy ứng dụng Next.js.

Tính năng này sẽ tích hợp vào quá trình startup của Next.js application để tự động đảm bảo database sẵn sàng trước khi ứng dụng hoạt động.

#### Change Log

| Change      | Date       | Version | Description                                        | Author    |
| ----------- | ---------- | ------- | -------------------------------------------------- | --------- |
| Initial PRD | 2025-01-17 | v1.0    | Tạo PRD cho tính năng auto database initialization | John (PM) |

## Requirements

### Functional

1. **FR1**: Hệ thống sẽ tự động kiểm tra sự tồn tại của database `chatstoryai` khi khởi chạy ứng dụng Next.js
2. **FR2**: Nếu database không tồn tại, hệ thống sẽ tự động tạo database với charset `utf8mb4_unicode_ci`
3. **FR3**: Hệ thống sẽ kiểm tra sự tồn tại của tất cả các bảng cần thiết (users, stories, api_keys, etc.) theo schema hiện tại
4. **FR4**: Nếu bảng nào đó thiếu, hệ thống sẽ tự động chạy script SQL tương ứng để tạo bảng với đúng cấu trúc
5. **FR5**: Hệ thống sẽ hỗ trợ chạy migration scripts theo thứ tự ưu tiên (00-create-user.sql trước init.sql)
6. **FR6**: Hệ thống sẽ ghi log chi tiết về quá trình khởi tạo database để debug
7. **FR7**: Hệ thống sẽ có cơ chế retry khi kết nối database thất bại trong quá trình khởi tạo
8. **FR8**: Hệ thống sẽ validate schema version và cảnh báo nếu có sự khác biệt
9. **FR9**: Hệ thống sẽ hỗ trợ environment-specific configuration cho database initialization

### Non Functional

1. **NFR1**: Quá trình khởi tạo database không được vượt quá 30 giây trong điều kiện bình thường
2. **NFR2**: Hệ thống phải duy trì hiệu suất khởi động hiện tại, không tăng thời gian startup quá 5 giây
3. **NFR3**: Tính năng phải hoạt động ổn định với MySQL 8.0 và tương thích với Docker environment
4. **NFR4**: Hệ thống phải handle gracefully khi không có quyền tạo database hoặc bảng
5. **NFR5**: Memory usage trong quá trình initialization không được vượt quá 50MB
6. **NFR6**: Hệ thống phải thread-safe để tránh race condition khi multiple instances khởi chạy đồng thời
7. **NFR7**: Logging phải tuân thủ format hiện tại của ứng dụng và không spam console

### Compatibility Requirements

1. **CR1**: Tính năng phải tương thích hoàn toàn với existing database connection pool trong `src/lib/db.ts`
2. **CR2**: Database schema được tạo phải identical với schema từ `docker/mysql/init/init.sql`
3. **CR3**: Tính năng phải hoạt động với cả Docker environment và local MySQL installation
4. **CR4**: Phải tương thích với existing environment variables configuration trong `.env`

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, JavaScript, SQL
**Frameworks**: Next.js 14 với App Router, React, TailwindCSS
**Database**: MySQL 8.0 với charset utf8mb4
**Infrastructure**: Docker, Docker Compose, Vercel (deployment)
**External Dependencies**: mysql2/promise, NextAuth.js, Google APIs, VNPay API

### Integration Approach

**Database Integration Strategy**: Tích hợp vào existing connection pool trong `src/lib/db.ts`, sử dụng mysql2/promise library hiện có. Tạo module riêng cho database initialization logic.

**API Integration Strategy**: Không ảnh hưởng đến existing API routes, chỉ chạy initialization trước khi API routes được activate.

**Frontend Integration Strategy**: Không có thay đổi frontend, chỉ có thể thêm loading indicator hoặc error handling cho database initialization failures.

**Testing Integration Strategy**: Tạo unit tests cho initialization logic, integration tests với Docker MySQL, và end-to-end tests cho startup process.

### Code Organization and Standards

**File Structure Approach**:

- Tạo `src/lib/db-init.ts` cho initialization logic
- Tạo `src/lib/migrations/` folder cho migration scripts
- Tích hợp vào `src/app/layout.tsx` hoặc middleware cho startup execution

**Naming Conventions**: Tuân thủ existing camelCase cho TypeScript, snake_case cho database objects

**Coding Standards**: Sử dụng TypeScript strict mode, ESLint configuration hiện có, error handling patterns của dự án

**Documentation Standards**: JSDoc comments cho public functions, README updates cho setup instructions

### Deployment and Operations

**Build Process Integration**: Không thay đổi build process, initialization chạy runtime

**Deployment Strategy**: Tương thích với Vercel deployment, Docker container startup, và local development

**Monitoring and Logging**: Sử dụng console.log với structured format, có thể tích hợp với existing logging system

**Configuration Management**: Sử dụng environment variables hiện có, thêm optional config cho initialization behavior

### Risk Assessment and Mitigation

**Technical Risks**:

- Database connection timeout during initialization
- Race conditions với multiple app instances
- Migration script failures
- Schema version conflicts

**Integration Risks**:

- Conflict với existing database connection logic
- Performance impact on application startup
- Docker environment compatibility issues

**Deployment Risks**:

- Vercel serverless environment limitations
- Database permissions in production
- Environment variable configuration errors

**Mitigation Strategies**:

- Implement comprehensive error handling và fallback mechanisms
- Add configuration flags để disable initialization nếu cần
- Extensive testing trong multiple environments
- Detailed logging và monitoring cho troubleshooting

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic với rationale - Tính năng database auto-initialization là một enhancement tập trung với các components liên quan chặt chẽ. Việc chia thành multiple epics sẽ tạo ra unnecessary complexity và dependencies. Single epic cho phép coordinated development và testing của toàn bộ tính năng.

## Epic 1: Database Auto-Initialization System

**Epic Goal**: Tạo hệ thống tự động kiểm tra và khởi tạo database MySQL khi khởi chạy ứng dụng ChatStoryAI, đảm bảo database sẵn sàng hoạt động mà không cần can thiệp thủ công từ developer.

**Integration Requirements**: Tích hợp seamlessly với existing Next.js application startup, MySQL connection pool, và Docker environment mà không ảnh hưởng đến existing functionality.

### Story 1.1: Database Connection và Health Check System

As a **developer**,
I want **the application to automatically check database connectivity and health on startup**,
so that **I can identify database issues early và ensure the application doesn't start with a broken database connection**.

#### Acceptance Criteria

1. **AC1**: Hệ thống kiểm tra database connection với retry mechanism (tối đa 5 lần, mỗi lần cách 2 giây)
2. **AC2**: Validate database server version compatibility (MySQL 8.0+)
3. **AC3**: Check database user permissions (CREATE, DROP, INSERT, SELECT, UPDATE, DELETE)
4. **AC4**: Log detailed connection status và error messages
5. **AC5**: Graceful failure handling khi không thể kết nối database sau max retries

#### Integration Verification

1. **IV1**: Existing database connection pool trong `src/lib/db.ts` vẫn hoạt động bình thường
2. **IV2**: Application startup time không tăng quá 3 giây trong trường hợp database healthy
3. **IV3**: Docker environment startup sequence không bị ảnh hưởng

### Story 1.2: Database và Schema Detection System

As a **developer**,
I want **the system to automatically detect missing database and tables**,
so that **I can identify what needs to be created without manual inspection**.

#### Acceptance Criteria

1. **AC1**: Kiểm tra sự tồn tại của database `chatstoryai`
2. **AC2**: Nếu database tồn tại, kiểm tra tất cả required tables theo schema definition
3. **AC3**: Generate detailed report về missing database/tables
4. **AC4**: Validate existing table structures match expected schema
5. **AC5**: Log findings với structured format cho easy debugging

#### Integration Verification

1. **IV1**: Existing queries trong application không bị ảnh hưởng bởi detection logic
2. **IV2**: Schema validation không conflict với existing database operations
3. **IV3**: Detection process không lock database tables

### Story 1.3: Automated Database Creation System

As a **developer**,
I want **the system to automatically create missing database with proper configuration**,
so that **I don't need to manually run database creation commands**.

#### Acceptance Criteria

1. **AC1**: Tự động tạo database `chatstoryai` nếu không tồn tại
2. **AC2**: Set correct charset (`utf8mb4`) và collation (`utf8mb4_unicode_ci`)
3. **AC3**: Create database user nếu cần thiết (based on environment config)
4. **AC4**: Grant appropriate permissions cho database user
5. **AC5**: Verify database creation success trước khi proceed

#### Integration Verification

1. **IV1**: Database creation không ảnh hưởng đến existing databases trên cùng MySQL server
2. **IV2**: User permissions được set correctly để existing application code hoạt động
3. **IV3**: Docker MySQL container configuration vẫn consistent

### Story 1.4: SQL Migration Script Execution Engine

As a **developer**,
I want **the system to automatically execute SQL migration scripts in correct order**,
so that **all required tables và data are created without manual intervention**.

#### Acceptance Criteria

1. **AC1**: Load và execute SQL scripts từ `docker/mysql/init/` directory
2. **AC2**: Execute scripts theo correct order (00-create-user.sql trước init.sql)
3. **AC3**: Handle SQL script errors gracefully với detailed error reporting
4. **AC4**: Skip scripts nếu corresponding tables đã tồn tại
5. **AC5**: Support for incremental migrations và version tracking
6. **AC6**: Validate script execution success trước khi marking complete

#### Integration Verification

1. **IV1**: Executed schema identical với schema tạo bởi Docker init process
2. **IV2**: Existing data trong database không bị ảnh hưởng nếu tables đã tồn tại
3. **IV3**: Migration execution không conflict với concurrent database operations

### Story 1.5: Configuration và Environment Management

As a **developer**,
I want **flexible configuration options for database initialization behavior**,
so that **I can control the initialization process based on different environments và requirements**.

#### Acceptance Criteria

1. **AC1**: Environment variable để enable/disable auto-initialization (`DB_AUTO_INIT=true/false`)
2. **AC2**: Configuration cho initialization timeout settings
3. **AC3**: Option để skip specific migration scripts
4. **AC4**: Development vs production mode configurations
5. **AC5**: Logging level configuration cho initialization process
6. **AC6**: Fallback behavior configuration khi initialization fails

#### Integration Verification

1. **IV1**: Existing environment variables trong `.env` không bị conflict
2. **IV2**: Configuration changes không require application rebuild
3. **IV3**: Default configuration values ensure backward compatibility

### Story 1.6: Comprehensive Logging và Error Handling

As a **developer**,
I want **detailed logging và robust error handling for database initialization**,
so that **I can easily troubleshoot issues và monitor the initialization process**.

#### Acceptance Criteria

1. **AC1**: Structured logging với timestamps, log levels, và context information
2. **AC2**: Detailed error messages với actionable troubleshooting hints
3. **AC3**: Progress indicators cho long-running initialization tasks
4. **AC4**: Summary report sau khi initialization complete
5. **AC5**: Error categorization (connection, permission, schema, script errors)
6. **AC6**: Integration với existing application logging system

#### Integration Verification

1. **IV1**: Log format consistent với existing application logs
2. **IV2**: Logging không spam console hoặc log files
3. **IV3**: Error handling không crash application startup process

### Story 1.7: Testing và Validation Framework

As a **developer**,
I want **comprehensive testing coverage for database initialization functionality**,
so that **I can ensure reliability và prevent regressions in the initialization system**.

#### Acceptance Criteria

1. **AC1**: Unit tests cho all initialization functions và error scenarios
2. **AC2**: Integration tests với real MySQL database
3. **AC3**: Docker environment testing với fresh containers
4. **AC4**: Performance tests để ensure startup time requirements
5. **AC5**: End-to-end tests cho complete initialization workflow
6. **AC6**: Test coverage minimum 90% cho initialization code

#### Integration Verification

1. **IV1**: Tests không interfere với existing test suite
2. **IV2**: Test database setup không affect development database
3. **IV3**: CI/CD pipeline integration cho automated testing
