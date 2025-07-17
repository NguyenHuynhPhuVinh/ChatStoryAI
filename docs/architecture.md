# Tài liệu Kiến trúc Fullstack: ChatStoryAI

## 1. Giới thiệu

Tài liệu này phác thảo kiến trúc kỹ thuật toàn diện cho ứng dụng **ChatStoryAI**. Mục đích của tài liệu này là cung cấp một cái nhìn tổng quan, thống nhất về tất cả các thành phần hệ thống, từ frontend, backend, cơ sở dữ liệu, đến các dịch vụ bên ngoài và quy trình triển khai. Tài liệu này đóng vai trò là nguồn tham khảo chính cho đội ngũ phát triển, đảm bảo tính nhất quán, khả năng bảo trì và mở rộng của dự án.

Đây là bản phân tích kiến trúc của một dự án hiện có (brownfield analysis) nhằm ghi lại cấu trúc hiện tại và đưa ra các đề xuất cải tiến.

### 1.1. Bối cảnh dự án

ChatStoryAI là một nền tảng sáng tạo truyện, nơi người dùng có thể viết, quản lý và chia sẻ các câu chuyện của mình với sự hỗ trợ của các mô hình ngôn ngữ lớn (AI) như Google Gemini và Together AI. Hệ thống cung cấp các công cụ để quản lý truyện, chương, nhân vật, đại cương, đồng thời tích hợp các tính năng tương tác cộng đồng và thanh toán.

### 1.2. Nhật ký thay đổi

| Ngày       | Phiên bản | Mô tả                                                    | Tác giả             |
| :--------- | :-------- | :------------------------------------------------------- | :------------------ |
| 25/06/2024 | 1.0       | Phân tích và tạo tài liệu kiến trúc ban đầu từ mã nguồn. | Winston (Architect) |

## 2. Kiến trúc tổng quan

### 2.1. Tóm tắt kỹ thuật

ChatStoryAI được xây dựng theo kiến trúc **monorepo full-stack** sử dụng **Next.js** với App Router. Kiến trúc này tích hợp chặt chẽ cả frontend và backend trong cùng một codebase, giúp đơn giản hóa việc phát triển và triển khai. Hệ thống sử dụng **MySQL** làm cơ sở dữ liệu quan hệ, **Google Drive** để lưu trữ file, và tích hợp với các dịch vụ AI của **Google Gemini** và **Together AI** để hỗ trợ sáng tạo nội dung. Xác thực người dùng được quản lý bởi **NextAuth.js**.

### 2.2. Nền tảng và Hạ tầng

- **Môi trường Local:** Sử dụng **Docker** và **Docker Compose** để thiết lập một môi trường phát triển nhất quán, bao gồm dịch vụ ứng dụng Next.js và cơ sở dữ liệu MySQL.
- **Hạ tầng triển khai (Dự kiến):** Dựa trên cấu hình `next.config.ts` (`output: 'standalone'`) và các quy trình trong `.github/workflows`, nền tảng triển khai được đề xuất là **Vercel** hoặc một nền tảng Node.js tương tự. Vercel cung cấp khả năng tích hợp liền mạch với Next.js, CI/CD tự động và CDN toàn cầu.
- **Lưu trữ File:** **Google Drive API** được sử dụng để lưu trữ ảnh đại diện và ảnh bìa truyện.
- **Cơ sở dữ liệu:** **MySQL 8.0** được container hóa, đảm bảo tính di động giữa các môi trường.

### 2.3. Sơ đồ kiến trúc tổng quan

Đây là sơ đồ trực quan hóa các thành phần chính và luồng tương tác trong hệ thống ChatStoryAI.

```mermaid
graph TD
    subgraph "Người dùng"
        User[<i class='fa fa-user'></i> Người dùng]
    end

    subgraph "Hạ tầng Cloud (Vercel/Tương tự)"
        subgraph "Ứng dụng Next.js (Monorepo)"
            Frontend[🌐 Giao diện người dùng<br>(Next.js - React Components)]
            Backend[⚙️ API Routes<br>(Next.js Backend)]
        end
    end

    subgraph "Dịch vụ Backend & Lưu trữ"
        DB[(🗃️ MySQL Database)]
        GDRIVE[<i class='fab fa-google-drive'></i> Google Drive<br>(Lưu trữ ảnh)]
    end

    subgraph "Dịch vụ bên ngoài (APIs)"
        GEMINI[🤖 Google Gemini API<br>(Tạo sinh nội dung)]
        TOGETHER[🎨 Together AI API<br>(Tạo sinh hình ảnh)]
        VNPAY[💳 VNPay API<br>(Thanh toán)]
        GMAIL[📧 Gmail API<br>(Gửi email)]
    end

    User -->|Tương tác qua trình duyệt| Frontend
    Frontend -->|Gọi API nội bộ| Backend
    Backend -->|Truy vấn dữ liệu| DB
    Backend -->|Lưu/Tải file| GDRIVE
    Backend -->|Yêu cầu AI| GEMINI
    Backend -->|Yêu cầu AI| TOGETHER
    Backend -->|Tạo thanh toán| VNPAY
    Backend -->|Gửi email xác thực| GMAIL
```

### 2.4. Các mẫu kiến trúc và thiết kế

- **Monorepo Full-stack:** Toàn bộ mã nguồn frontend và backend được quản lý trong cùng một repository, giúp đơn giản hóa việc chia sẻ code (ví dụ: các `types`) và quy trình build.
- **Server Components & Client Components (Next.js App Router):** Tận dụng kiến trúc mới của Next.js để tối ưu hóa hiệu năng, giảm lượng JavaScript gửi về client.
- **API Routes:** Backend được xây dựng dưới dạng các API Route bên trong Next.js, cho phép tạo các endpoint RESTful một cách nhanh chóng.
- **Service Layer:** Logic nghiệp vụ được tách ra khỏi các API handler và đặt trong `src/services` (ví dụ: `AuthService`, `ApiKeyService`), giúp mã nguồn dễ đọc, dễ bảo trì và kiểm thử.
- **Repository Pattern (Implicit):** Việc sử dụng `pool` từ `src/lib/db.ts` trong các services để tương tác với CSDL là một dạng đơn giản của mẫu Repository, trừu tượng hóa việc truy cập dữ liệu.
- **Dual Authentication:** Hỗ trợ cả **Session-based** (cho người dùng web) và **API Key-based** (cho các ứng dụng bên ngoài), mang lại sự linh hoạt cao.

## 3. Ngăn xếp công nghệ (Tech Stack)

| Hạng mục          | Công nghệ        | Phiên bản (từ package.json) | Mục đích                                               |
| :---------------- | :--------------- | :-------------------------- | :----------------------------------------------------- |
| **Framework**     | Next.js          | ~15.3.3                     | Xây dựng ứng dụng full-stack, SSR, API routes.         |
| **Ngôn ngữ**      | TypeScript       | ~5                          | Đảm bảo an toàn kiểu dữ liệu và tăng khả năng bảo trì. |
| **Giao diện**     | React            | ~19.0.0                     | Thư viện UI chính.                                     |
| **Styling**       | Tailwind CSS     | ~3.4.1                      | Framework CSS Utility-first.                           |
| **Component UI**  | shadcn/ui        | ~0.9.4                      | Bộ component UI có khả năng tùy biến cao.              |
| **Database**      | MySQL            | 8.0 (Docker)                | Lưu trữ dữ liệu quan hệ của ứng dụng.                  |
| **Xác thực**      | NextAuth.js      | ~4.24.11                    | Quản lý phiên đăng nhập và OAuth (Google).             |
| **Lưu trữ file**  | Google Drive API | ^144.0.0                    | Lưu trữ ảnh bìa và avatar người dùng.                  |
| **AI - Văn bản**  | Google Gemini    | ^0.22.0                     | Tạo ý tưởng, hội thoại, nội dung truyện.               |
| **AI - Hình ảnh** | Together AI      | ^0.13.0                     | Tạo ảnh bìa và avatar.                                 |
| **Thanh toán**    | VNPay            | ^1.6.1                      | Tích hợp cổng thanh toán VNPay.                        |
| **Email**         | Nodemailer       | ^6.10.0                     | Gửi email (ví dụ: đặt lại mật khẩu).                   |
| **Tài liệu API**  | Swagger (JSDoc)  | ^6.2.8                      | Tự động tạo tài liệu API.                              |
| **Container**     | Docker           | 3.8 (Compose)               | Đóng gói và chạy ứng dụng, CSDL.                       |

## 4. Mô hình dữ liệu và Schema

Cơ sở dữ liệu MySQL được thiết kế để lưu trữ toàn bộ thông tin của ứng dụng. Các bảng chính bao gồm:

- **`users`**: Lưu thông tin người dùng, bao gồm cả thông tin đăng nhập và trạng thái `has_badge`.
- **`api_keys`**: Quản lý các API key cho phép truy cập từ bên ngoài.
- **`stories`**: Bảng trung tâm, lưu thông tin về các truyện do người dùng tạo.
- **`main_categories`, `story_tags`, `story_tag_relations`**: Quản lý việc phân loại và gắn thẻ cho truyện.
- **`story_chapters`**: Lưu các chương của một truyện, có `order_number` và `publish_order`.
- **`story_characters`**: Quản lý thông tin chi tiết về các nhân vật trong truyện.
- **`story_outlines`**: Lưu các đại cương, dàn ý cho truyện.
- **`chapter_dialogues`**: Lưu trữ các đoạn hội thoại hoặc mô tả (aside) trong một chương, liên kết với nhân vật.
- **`ai_chat_history`, `ai_chat_messages`**: Lưu lại toàn bộ lịch sử tương tác giữa người dùng và AI Assistant.
- **`story_bookmarks`, `story_favorites`, `view_history`, `chapter_reads`**: Các bảng theo dõi tương tác của người dùng với truyện.

**Đánh giá:**

- Thiết kế CSDL khá chuẩn, sử dụng khóa ngoại để đảm bảo tính toàn vẹn dữ liệu. `ON DELETE CASCADE` được sử dụng hợp lý để dọn dẹp dữ liệu liên quan khi một thực thể chính bị xóa (ví dụ: xóa truyện sẽ xóa các chương, nhân vật liên quan).
- Việc tách `order_number` và `publish_order` trong `story_chapters` là một thiết kế thông minh, cho phép duy trì thứ tự viết và thứ tự xuất bản một cách độc lập.

## 5. Kiến trúc Backend (API Routes)

Backend được xây dựng hoàn toàn bằng API Routes của Next.js, đặt tại `src/app/api`.

- **Tổ chức:** Các API được nhóm theo tài nguyên (resource-based routing) rất logic, ví dụ: `/api/stories/[id]/chapters`, `/api/user/api-keys`.
- **Xác thực:** Sử dụng middleware `requireAuth` để bảo vệ các endpoint quan trọng. Middleware này hỗ trợ cả session và API key, tăng tính linh hoạt.
- **Service Layer:** Logic xử lý nghiệp vụ được tách ra khỏi các route handler và đặt trong `src/services`. Ví dụ: `AuthService` xử lý logic đăng ký, đăng nhập; `ApiKeyService` quản lý vòng đời của API key.
- **Tương tác Database:** Các service tương tác trực tiếp với CSDL thông qua một `pool` kết nối chung (`src/lib/db.ts`), đảm bảo kết nối được tái sử dụng hiệu quả.
- **Xử lý lỗi:** Hầu hết các endpoint đều sử dụng khối `try...catch` để bắt lỗi và trả về phản hồi JSON có cấu trúc, tuy nhiên chưa có một bộ xử lý lỗi tập trung.

## 6. Kiến trúc Frontend

Frontend được xây dựng bằng React và Next.js App Router.

- **Cấu trúc Component:**
  - `src/components/ui`: Chứa các component nguyên thủy (primitive) từ `shadcn/ui` (Button, Card, Input, ...).
  - `src/components`: Chứa các component nghiệp vụ phức tạp hơn như `StoryCard`, `ChatBot`, `NotificationBell`.
  - `src/components/ai-generator`: Các component chuyên dụng để tương tác với AI, là một cách tổ chức tốt.
- **Quản lý Trạng thái (State Management):** Chủ yếu sử dụng state cục bộ của React (`useState`, `useEffect`). Chưa có một thư viện quản lý trạng thái toàn cục (global state management) như Redux, Zustand. Điều này có thể gây khó khăn khi ứng dụng phức tạp hơn.
- **Data Fetching:** Sử dụng `fetch` API gốc của trình duyệt để gọi đến các API route nội bộ.
- **Routing:** Sử dụng routing dựa trên file của Next.js App Router. Logic điều hướng được xử lý bởi `useRouter` từ `next/navigation`.
- **Quản lý Loading:** `LoadingProvider` và `useLoading` là một giải pháp tùy chỉnh để quản lý trạng thái loading khi chuyển trang, cải thiện trải nghiệm người dùng.

## 7. Quy trình CI/CD

Dự án có một hệ thống CI/CD mạnh mẽ và bài bản thông qua GitHub Actions.

- **`ci.yml`**: Đảm bảo chất lượng mã nguồn bằng cách tự động chạy linting, type checking, build và kiểm tra bảo mật cho mỗi lần commit.
- **`performance.yml`**: Tự động đánh giá hiệu năng ứng dụng bằng Lighthouse, giúp phát hiện sớm các vấn đề ảnh hưởng đến trải nghiệm người dùng.
- **`security.yml`**: Quét lỗ hổng bảo mật định kỳ và khi có thay đổi, bao gồm cả việc dò tìm các secret bị lộ trong code.
- **`deploy.yml`**: Tự động hóa quy trình triển khai lên môi trường production khi có thay đổi trên nhánh `main`.

## 8. Đánh giá và Đề xuất Kiến trúc

Với vai trò là Kiến trúc sư, tôi có những đánh giá và đề xuất sau để cải thiện hệ thống:

1.  **Lưu trữ File (Ưu tiên cao):**

    - **Vấn đề:** Sử dụng Google Drive API cho việc lưu trữ và phân phát tài sản tĩnh (ảnh) không phải là giải pháp tối ưu cho hiệu năng và khả năng mở rộng. Nó có thể gặp vấn đề về giới hạn request, tốc độ tải chậm và quản lý phức tạp.
    - **Đề xuất:** Chuyển sang sử dụng một dịch vụ lưu trữ đối tượng (Object Storage) chuyên dụng như **AWS S3**, **Cloudflare R2**, hoặc **Vercel Blob**. Các dịch vụ này được thiết kế để phân phát nội dung tĩnh với tốc độ cao qua CDN, quản lý quyền truy cập dễ dàng và có khả năng mở rộng tốt hơn.

2.  **Quản lý Trạng thái Frontend (Ưu tiên trung bình):**

    - **Vấn đề:** Hiện tại, trạng thái được quản lý chủ yếu bằng các hook React cục bộ. Khi ứng dụng phát triển, việc chia sẻ trạng thái giữa các component không liên quan trực tiếp (ví dụ: cập nhật danh sách truyện sau khi tạo mới) sẽ trở nên phức tạp.
    - **Đề xuất:** Tích hợp một thư viện quản lý trạng thái nhẹ nhàng như **Zustand** hoặc **Jotai**. Chúng cung cấp một store toàn cục nhưng vẫn giữ được sự đơn giản của React Hooks, giúp việc quản lý trạng thái ứng dụng trở nên gọn gàng hơn.

3.  **Kiểm thử Tự động (Ưu tiên cao):**

    - **Vấn đề:** Dự án hiện thiếu một bộ kiểm thử tự động. Điều này làm tăng rủi ro phát sinh lỗi hồi quy (regression bug) khi thêm tính năng mới hoặc tái cấu trúc code.
    - **Đề xuất:**
      - **Unit Tests:** Sử dụng **Vitest** hoặc **Jest** cùng với **React Testing Library** để viết unit test cho các component và hàm tiện ích quan trọng.
      - **Integration/API Tests:** Viết các bài kiểm tra cho các API route để đảm bảo logic backend hoạt động đúng.
      - Tích hợp việc chạy test vào quy trình CI (`ci.yml`) để đảm bảo mọi thay đổi đều được kiểm tra trước khi hợp nhất.

4.  **Xử lý Lỗi Tập trung (Ưu tiên trung bình):**
    - **Vấn đề:** Các API route đang xử lý lỗi một cách riêng lẻ. Điều này có thể dẫn đến sự không nhất quán trong các phản hồi lỗi.
    - **Đề xuất:** Tạo một hàm xử lý lỗi (error handler) tập trung. Hàm này sẽ nhận vào một đối tượng lỗi và trả về một `NextResponse` có cấu trúc JSON nhất quán (ví dụ: `{ "error": "message", "statusCode": 400 }`), giúp phía client dễ dàng xử lý.
