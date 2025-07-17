# 6. Kiến trúc Frontend

### 6.1. Tổng quan Frontend Architecture

Frontend được xây dựng bằng React 19 và Next.js 15 App Router, sử dụng TypeScript để đảm bảo type safety và Tailwind CSS cho styling.

### 6.2. Cấu trúc thư mục và Components

#### 6.2.1. App Router Structure

```
src/app/
├── (pages)/
│   ├── about/             # Trang giới thiệu
│   ├── account/           # Tài khoản người dùng
│   ├── ai/                # AI Assistant
│   ├── contact/           # Liên hệ
│   ├── docs/              # API Documentation
│   ├── guide/             # Hướng dẫn sử dụng
│   ├── library/           # Thư viện truyện
│   ├── payment/           # Thanh toán
│   ├── products/          # Sản phẩm
│   ├── services/          # Dịch vụ
│   ├── settings/          # Cài đặt
│   └── stories/           # Quản lý truyện
├── api/                   # API Routes
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Homepage
```

#### 6.2.2. Component Architecture

```
src/components/
├── ui/                    # Primitive components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── ai-generator/          # AI-specific components
├── api-keys/              # API key management
├── login/                 # Authentication components
├── nav/                   # Navigation components
├── story/                 # Story-related components
├── chat-bot.tsx           # AI Chat interface
├── story-card.tsx         # Story display card
├── notification-bell.tsx  # Notifications
└── user-avatar.tsx        # User avatar display
```

### 6.3. State Management và Data Flow

- **Local State:** Chủ yếu sử dụng React hooks (`useState`, `useEffect`, `useReducer`)
- **Context API:** Sử dụng cho shared state như `LoadingProvider`, `SessionProvider`
- **Data Fetching:** Native `fetch` API với custom hooks như `use-debounce.ts`
- **Form Handling:** Controlled components với validation logic
- **Loading States:** Custom `LoadingProvider` để quản lý loading states toàn cục

### 6.4. UI/UX và Styling

- **Design System:** shadcn/ui components với Tailwind CSS
- **Responsive Design:** Mobile-first approach với Tailwind breakpoints
- **Animations:** Framer Motion cho complex animations, GSAP cho advanced effects
- **Icons:** Lucide React và React Icons
- **Typography:** Tailwind Typography plugin cho markdown content
- **Dark Mode:** Hỗ trợ theme switching (nếu có)

### 6.5. Performance Optimizations

- **Server Components:** Sử dụng Next.js Server Components khi có thể
- **Code Splitting:** Automatic với Next.js App Router
- **Image Optimization:** Next.js Image component với Google Drive integration
- **Loading Skeletons:** React Loading Skeleton cho better UX
- **Debouncing:** Custom hook cho search và input optimization
