import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ChatStoryAI API",
      version: "1.0.0",
      description:
        "API documentation cho ứng dụng ChatStoryAI - Nền tảng tạo và chia sẻ truyện tương tác với AI",
      contact: {
        name: "ChatStoryAI Team",
        email: "support@chatstoryai.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://chatstoryai.vercel.app"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Thông báo lỗi",
            },
          },
          required: ["error"],
        },
        User: {
          type: "object",
          properties: {
            user_id: {
              type: "integer",
              description: "ID người dùng",
            },
            username: {
              type: "string",
              description: "Tên người dùng",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email người dùng",
            },
            avatar: {
              type: "string",
              description: "URL avatar",
            },
            has_badge: {
              type: "boolean",
              description: "Có huy hiệu hay không",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Thời gian tạo tài khoản",
            },
          },
        },
        Story: {
          type: "object",
          properties: {
            story_id: {
              type: "integer",
              description: "ID truyện",
            },
            title: {
              type: "string",
              description: "Tiêu đề truyện",
            },
            description: {
              type: "string",
              description: "Mô tả truyện",
            },
            cover_image: {
              type: "string",
              description: "URL ảnh bìa",
            },
            status: {
              type: "string",
              enum: ["draft", "published", "completed"],
              description: "Trạng thái truyện",
            },
            view_count: {
              type: "integer",
              description: "Số lượt xem",
            },
            favorite_count: {
              type: "integer",
              description: "Số lượt thích",
            },
            main_category: {
              type: "string",
              description: "Thể loại chính",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Danh sách tag",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Thời gian tạo",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Thời gian cập nhật",
            },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID thể loại",
            },
            name: {
              type: "string",
              description: "Tên thể loại",
            },
            description: {
              type: "string",
              description: "Mô tả thể loại",
            },
          },
        },
        Tag: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID tag",
            },
            name: {
              type: "string",
              description: "Tên tag",
            },
            description: {
              type: "string",
              description: "Mô tả tag",
            },
          },
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email đăng nhập",
            },
            password: {
              type: "string",
              description: "Mật khẩu",
            },
          },
          required: ["email", "password"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "Tên người dùng",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email",
            },
            password: {
              type: "string",
              description: "Mật khẩu",
            },
          },
          required: ["username", "email", "password"],
        },
        Chapter: {
          type: "object",
          properties: {
            chapter_id: {
              type: "integer",
              description: "ID chương",
            },
            title: {
              type: "string",
              description: "Tiêu đề chương",
            },
            status: {
              type: "string",
              enum: ["draft", "published"],
              description: "Trạng thái chương",
            },
            summary: {
              type: "string",
              description: "Tóm tắt chương",
            },
            dialogue_count: {
              type: "integer",
              description: "Số lượng hội thoại",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Thời gian tạo",
            },
          },
        },
        Comment: {
          type: "object",
          properties: {
            comment_id: {
              type: "integer",
              description: "ID bình luận",
            },
            content: {
              type: "string",
              description: "Nội dung bình luận",
            },
            username: {
              type: "string",
              description: "Tên người bình luận",
            },
            avatar: {
              type: "string",
              description: "Avatar người bình luận",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Thời gian tạo",
            },
          },
        },
        Character: {
          type: "object",
          properties: {
            character_id: {
              type: "integer",
              description: "ID nhân vật",
            },
            name: {
              type: "string",
              description: "Tên nhân vật",
            },
            description: {
              type: "string",
              description: "Mô tả nhân vật",
            },
            avatar_image: {
              type: "string",
              description: "URL ảnh đại diện",
            },
            role: {
              type: "string",
              enum: ["main", "supporting", "minor"],
              description: "Vai trò nhân vật",
            },
            gender: {
              type: "string",
              description: "Giới tính",
            },
            personality: {
              type: "string",
              description: "Tính cách",
            },
          },
        },
        PaymentRequest: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description: "Số tiền thanh toán (VND)",
            },
            orderInfo: {
              type: "string",
              description: "Thông tin đơn hàng",
            },
          },
          required: ["amount", "orderInfo"],
        },
        PaymentResponse: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL thanh toán VNPay",
            },
          },
        },
        ChatMessage: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["user", "assistant"],
              description: "Vai trò tin nhắn",
            },
            content: {
              type: "string",
              description: "Nội dung tin nhắn",
            },
          },
          required: ["role", "content"],
        },
        CreateStoryRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Tiêu đề truyện",
            },
            description: {
              type: "string",
              description: "Mô tả truyện",
            },
            mainCategoryId: {
              type: "string",
              description: "ID thể loại chính",
            },
            tagIds: {
              type: "string",
              description: "JSON array của tag IDs",
            },
          },
          required: ["title", "description", "mainCategoryId", "tagIds"],
        },
        CreateChapterRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Tiêu đề chương",
            },
            summary: {
              type: "string",
              description: "Tóm tắt chương",
            },
            status: {
              type: "string",
              enum: ["draft", "published"],
              description: "Trạng thái chương",
            },
          },
          required: ["title", "summary", "status"],
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: ["./src/app/api/**/*.ts", "./src/app/api/**/*.js"],
};

const specs = swaggerJSDoc(options);

export default specs;
