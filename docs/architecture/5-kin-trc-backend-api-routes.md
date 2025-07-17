# 5. Kiến trúc Backend (API Routes)

### 5.1. Tổng quan API Architecture

Backend được xây dựng hoàn toàn bằng API Routes của Next.js, đặt tại `src/app/api` với cấu trúc resource-based routing rất logic và có tổ chức.

### 5.2. Cấu trúc API Endpoints

#### 5.2.1. Authentication & User Management

```
/api/auth/
├── [...nextauth]/          # NextAuth.js endpoints
├── login/                  # Custom login
├── register/               # User registration
├── forgot-password/        # Password reset request
├── verify-reset-code/      # Verify reset code
└── reset-password/         # Reset password

/api/user/
├── api-keys/              # API key management
├── update-avatar/         # Update user avatar
├── update-username/       # Update username
├── update-password/       # Change password
├── update-badge/          # Update badge status
└── delete-account/        # Account deletion
```

#### 5.2.2. Story Management

```
/api/stories/
├── route.ts               # List stories
├── create/                # Create new story
├── featured/              # Featured stories
└── [id]/
    ├── route.ts           # Get/Update/Delete story
    ├── chapters/          # Chapter management
    ├── characters/        # Character management
    ├── outlines/          # Story outlines
    └── dialogues/         # Chapter dialogues
```

#### 5.2.3. Library & Content Discovery

```
/api/library/
├── [id]/                  # Get story details
├── new/                   # New stories
├── popular/               # Popular stories
└── search/                # Search functionality

/api/categories/           # Story categories
```

#### 5.2.4. AI Integration

```
/api/ai/
├── gemini/                # Google Gemini integration
└── chat-history/          # AI chat history

/api/together/
└── key/                   # Together AI key management
```

#### 5.2.5. Other Services

```
/api/account/
├── bookmarks/             # User bookmarks
└── view-history/          # Reading history

/api/notifications/        # Notification system
/api/vnpay/               # Payment integration
/api/subscribe/           # Newsletter subscription
/api/docs/                # API documentation
/api/revalidate/          # Cache revalidation
```

### 5.3. Kiến trúc và Patterns

- **Resource-based Routing:** API được tổ chức theo tài nguyên, dễ hiểu và maintain
- **Dual Authentication:** Hỗ trợ cả session-based (NextAuth) và API key-based authentication
- **Service Layer Pattern:** Logic nghiệp vụ được tách ra khỏi route handlers vào `src/services/`
- **Database Connection Pooling:** Sử dụng connection pool từ `src/lib/db.ts` cho hiệu suất tối ưu
- **Structured Error Handling:** Sử dụng try-catch với JSON response có cấu trúc nhất quán
