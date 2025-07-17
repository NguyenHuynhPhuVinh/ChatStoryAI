# 1. Giới thiệu

Tài liệu này phác thảo kiến trúc kỹ thuật toàn diện cho ứng dụng **ChatStoryAI**. Mục đích của tài liệu này là cung cấp một cái nhìn tổng quan, thống nhất về tất cả các thành phần hệ thống, từ frontend, backend, cơ sở dữ liệu, đến các dịch vụ bên ngoài và quy trình triển khai. Tài liệu này đóng vai trò là nguồn tham khảo chính cho đội ngũ phát triển, đảm bảo tính nhất quán, khả năng bảo trì và mở rộng của dự án.

Đây là bản phân tích kiến trúc của một dự án hiện có (brownfield analysis) nhằm ghi lại cấu trúc hiện tại và đưa ra các đề xuất cải tiến.

### 1.1. Bối cảnh dự án

ChatStoryAI là một nền tảng sáng tạo truyện với sự hỗ trợ của AI, được phát triển bởi nhóm sinh viên DA22TTC - Trường Đại học Trà Vinh. Nền tảng cho phép người dùng tạo và chia sẻ những câu chuyện độc đáo với sự hỗ trợ của các mô hình ngôn ngữ lớn (AI) như Google Gemini và Together AI.

Hệ thống cung cấp các tính năng chính:

- **Sáng tạo với AI**: Tạo ý tưởng truyện, phát triển nhân vật, tạo hội thoại, quản lý chương và đại cương
- **Thư viện truyện**: Đọc truyện đa dạng thể loại với tính năng theo dõi tiến độ
- **Quản lý nội dung**: Tạo và quản lý truyện, nhân vật, chương và cốt truyện
- **Tích hợp thanh toán**: Hỗ trợ gói premium với VNPay
- **API mở**: Cung cấp API key cho các ứng dụng bên ngoài

### 1.2. Nhật ký thay đổi

| Ngày       | Phiên bản | Mô tả                                                    | Tác giả             |
| :--------- | :-------- | :------------------------------------------------------- | :------------------ |
| 25/06/2024 | 1.0       | Phân tích và tạo tài liệu kiến trúc ban đầu từ mã nguồn. | Winston (Architect) |
| 17/07/2025 | 2.0       | Cập nhật phân tích toàn diện dự án và cấu trúc hiện tại. | Winston (Architect) |
