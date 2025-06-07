# Docker Setup cho ChatStory AI

## Tổng quan

Dự án này sử dụng Docker Compose để chạy ứng dụng Next.js cùng với MySQL database. Cấu hình này giúp bạn dễ dàng khởi động toàn bộ stack mà không cần cài đặt MySQL riêng biệt.

## Cấu trúc

```
frontend/
├── docker-compose.yml          # Cấu hình Docker Compose
├── Dockerfile                  # Dockerfile cho Next.js app
├── .env                       # File cấu hình môi trường
├── .env.example               # File mẫu cấu hình
└── docker/
    └── mysql/
        └── init/
            └── 01-init.sql    # Script khởi tạo database
```

## Services

### 1. MySQL Database

- **Image**: mysql:8.0
- **Container name**: chatstory_mysql
- **Port**: 3306
- **Volume**: mysql_data (persistent storage)
- **Health check**: Kiểm tra kết nối MySQL

### 2. Next.js Application

- **Build**: Từ Dockerfile local
- **Container name**: chatstory_app
- **Port**: 3000
- **Depends on**: MySQL service (chờ MySQL healthy)

## Cách sử dụng

### 1. Chuẩn bị

```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa file .env theo nhu cầu (nếu cần)
# Các giá trị mặc định đã được cấu hình sẵn
```

### 2. Khởi động services

```bash
# Khởi động tất cả services
docker-compose up -d

# Hoặc khởi động và xem logs
docker-compose up
```

### 3. Kiểm tra trạng thái

```bash
# Xem trạng thái containers
docker-compose ps

# Xem logs
docker-compose logs app
docker-compose logs mysql
```

### 4. Truy cập ứng dụng

- **Web app**: http://localhost:3000
- **MySQL**: localhost:3306 (từ host machine)

### 5. Dừng services

```bash
# Dừng containers
docker-compose down

# Dừng và xóa volumes (mất dữ liệu)
docker-compose down -v
```

## Database

### Thông tin kết nối mặc định

- **Host**: mysql (trong Docker network) / localhost (từ host)
- **Port**: 3306
- **Database**: chatstoryai
- **User**: chatstory_user
- **Password**: chatstory_password
- **Root Password**: root_password

### Schema

Database sẽ được khởi tạo tự động với các bảng từ file `init.sql` có sẵn:

- `users` - Thông tin người dùng
- `stories` - Câu chuyện (với primary key `story_id`)
- `story_chapters` - Chương của câu chuyện
- `story_tags` - Tags của truyện
- `story_favorites` - Truyện yêu thích
- `main_categories` - Danh mục chính
- `ai_chat_history` - Lịch sử chat AI
- `ai_chat_messages` - Tin nhắn chat AI
- `ai_chat_images` - Hình ảnh chat AI
- Và nhiều bảng khác...
- `payments` - Thanh toán
- `user_subscriptions` - Gói đăng ký
- `ai_generations` - Lịch sử tạo nội dung AI

### Kết nối từ tools khác

```bash
# MySQL CLI
docker-compose exec mysql mysql -u chatstory_user -p chatstoryai

# Hoặc từ host machine
mysql -h localhost -P 3306 -u chatstory_user -p chatstoryai
```

## Troubleshooting

### 1. MySQL không khởi động được

```bash
# Xem logs MySQL
docker-compose logs mysql

# Xóa volume và khởi động lại
docker-compose down -v
docker-compose up -d
```

### 2. App không kết nối được MySQL

```bash
# Kiểm tra health check
docker-compose ps

# Kiểm tra network
docker network ls
docker network inspect frontend_chatstory_network
```

### 3. Port đã được sử dụng

```bash
# Thay đổi port trong docker-compose.yml
# Ví dụ: "3001:3000" cho app, "3307:3306" cho MySQL
```

## Development

### Rebuild app

```bash
# Rebuild app container
docker-compose build app
docker-compose up -d app
```

### Backup/Restore Database

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p chatstory_db > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -p chatstory_db < backup.sql
```

### Môi trường Production

Đối với production, hãy:

1. Thay đổi tất cả passwords mặc định
2. Sử dụng secrets management
3. Cấu hình SSL/TLS
4. Thiết lập backup tự động
5. Monitoring và logging
