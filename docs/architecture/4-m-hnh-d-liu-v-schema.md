# 4. Mô hình dữ liệu và Schema

### 4.1. Tổng quan Database

Cơ sở dữ liệu MySQL 8.0 được thiết kế để lưu trữ toàn bộ thông tin của ứng dụng với charset `utf8mb4` để hỗ trợ đầy đủ Unicode. Database được khởi tạo thông qua Docker với các file migration trong `docker/mysql/init/`.

### 4.2. Các bảng chính

#### 4.2.1. Quản lý người dùng và xác thực

- **`users`**: Lưu thông tin người dùng (user_id, username, email, user_password, avatar, drive_file_id, has_badge)
- **`api_keys`**: Quản lý API keys cho truy cập bên ngoài với permissions JSON và thời gian hết hạn
- **`reset_codes`**: Mã xác thực đặt lại mật khẩu với thời gian hết hạn

#### 4.2.2. Quản lý truyện và nội dung

- **`stories`**: Bảng trung tâm lưu thông tin truyện (story_id, user_id, title, description, cover_image, status, view_count)
- **`story_chapters`**: Các chương của truyện với `order_number` và `publish_order` riêng biệt
- **`story_characters`**: Thông tin chi tiết nhân vật (name, avatar_image, description, role, gender, personality, appearance, background)
- **`story_outlines`**: Đại cương và dàn ý cho truyện
- **`chapter_dialogues`**: Hội thoại và mô tả trong chương, liên kết với nhân vật
- **`main_categories`, `story_tags`, `story_tag_relations`**: Hệ thống phân loại và gắn thẻ

#### 4.2.3. Tương tác người dùng

- **`story_bookmarks`**: Đánh dấu truyện yêu thích
- **`story_favorites`**: Truyện được yêu thích
- **`view_history`**: Lịch sử xem truyện
- **`chapter_reads`**: Theo dõi chương đã đọc

#### 4.2.4. AI và Chat

- **`ai_chat_history`**: Lịch sử phiên chat với AI
- **`ai_chat_messages`**: Tin nhắn trong phiên chat (role: user/assistant, command_status)
- **`ai_chat_images`**: Hình ảnh được tạo trong chat
- **`ai_generated_dialogues`**: Hội thoại được AI tạo ra

### 4.3. Đánh giá thiết kế Database

**Điểm mạnh:**

- Thiết kế chuẩn với khóa ngoại đảm bảo tính toàn vẹn dữ liệu
- `ON DELETE CASCADE` được sử dụng hợp lý để dọn dẹp dữ liệu liên quan
- Tách `order_number` và `publish_order` trong `story_chapters` cho phép quản lý thứ tự viết và xuất bản độc lập
- Hỗ trợ JSON trong `api_keys.permissions` cho flexibility
- Index được thiết lập hợp lý cho performance

**Cần cải thiện:**

- Thiếu bảng `notifications` mặc dù có API endpoint
- Chưa có bảng `story_outlines` trong schema hiện tại
- Có thể cần thêm soft delete cho một số bảng quan trọng
