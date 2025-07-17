# 3. Ngăn xếp công nghệ (Tech Stack)

### 3.1. Công nghệ chính

| Hạng mục         | Công nghệ    | Phiên bản (từ package.json) | Mục đích                                               |
| :--------------- | :----------- | :-------------------------- | :----------------------------------------------------- |
| **Framework**    | Next.js      | ^15.3.3                     | Xây dựng ứng dụng full-stack, SSR, API routes.         |
| **Ngôn ngữ**     | TypeScript   | ^5                          | Đảm bảo an toàn kiểu dữ liệu và tăng khả năng bảo trì. |
| **Giao diện**    | React        | ^19.0.0                     | Thư viện UI chính.                                     |
| **Styling**      | Tailwind CSS | ^3.4.1                      | Framework CSS Utility-first.                           |
| **Component UI** | shadcn/ui    | ^0.9.4                      | Bộ component UI có khả năng tùy biến cao.              |
| **Database**     | MySQL        | 8.0 (Docker)                | Lưu trữ dữ liệu quan hệ của ứng dụng.                  |
| **Xác thực**     | NextAuth.js  | ^4.24.11                    | Quản lý phiên đăng nhập và OAuth (Google).             |
| **Container**    | Docker       | 3.8 (Compose)               | Đóng gói và chạy ứng dụng, CSDL.                       |

### 3.2. Dịch vụ bên ngoài và API

| Hạng mục          | Công nghệ        | Phiên bản             | Mục đích                                 |
| :---------------- | :--------------- | :-------------------- | :--------------------------------------- |
| **Lưu trữ file**  | Google Drive API | ^144.0.0 (googleapis) | Lưu trữ ảnh bìa và avatar người dùng.    |
| **AI - Văn bản**  | Google Gemini    | ^0.22.0               | Tạo ý tưởng, hội thoại, nội dung truyện. |
| **AI - Hình ảnh** | Together AI      | ^0.13.0               | Tạo ảnh bìa và avatar.                   |
| **Thanh toán**    | VNPay            | ^1.6.1                | Tích hợp cổng thanh toán VNPay.          |
| **Email**         | Nodemailer       | ^6.10.0               | Gửi email (ví dụ: đặt lại mật khẩu).     |
| **Email Client**  | EmailJS          | ^4.4.1                | Gửi email từ client-side.                |

### 3.3. Thư viện hỗ trợ

| Hạng mục          | Công nghệ              | Phiên bản | Mục đích                     |
| :---------------- | :--------------------- | :-------- | :--------------------------- |
| **Tài liệu API**  | Swagger (JSDoc)        | ^6.2.8    | Tự động tạo tài liệu API.    |
| **Markdown**      | React Markdown         | ^10.0.0   | Render markdown content.     |
| **Animation**     | Framer Motion          | ^12.4.7   | Animations và transitions.   |
| **Animation**     | GSAP                   | ^3.12.7   | Advanced animations.         |
| **Icons**         | Lucide React           | ^0.475.0  | Icon library.                |
| **Icons**         | React Icons            | ^5.5.0    | Additional icon sets.        |
| **Date**          | date-fns               | ^4.1.0    | Date manipulation utilities. |
| **Notifications** | Sonner                 | ^2.0.1    | Toast notifications.         |
| **Loading**       | React Loading Skeleton | ^3.5.0    | Loading skeletons.           |
| **Security**      | bcryptjs               | ^3.0.2    | Password hashing.            |
