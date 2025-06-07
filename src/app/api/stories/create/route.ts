/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { GoogleDriveService } from "@/services/google-drive.service";

/**
 * @swagger
 * /api/stories/create:
 *   post:
 *     summary: Tạo truyện mới
 *     description: Tạo một truyện mới với thông tin cơ bản, ảnh bìa và tags
 *     tags:
 *       - Stories
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề truyện
 *               description:
 *                 type: string
 *                 description: Mô tả truyện
 *               mainCategoryId:
 *                 type: string
 *                 description: ID thể loại chính
 *               tagIds:
 *                 type: string
 *                 description: JSON array của tag IDs
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh bìa
 *             required:
 *               - title
 *               - description
 *               - mainCategoryId
 *               - tagIds
 *     responses:
 *       201:
 *         description: Tạo truyện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Thông báo thành công
 *                 storyId:
 *                   type: integer
 *                   description: ID truyện vừa tạo
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const mainCategoryId = formData.get("mainCategoryId") as string;
    const tagIds = JSON.parse(formData.get("tagIds") as string);
    const coverImage = formData.get("coverImage") as File;

    // Lấy user_id từ email
    const [users] = (await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [session.user.email]
    )) as any[];

    const userId = users[0].user_id;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Tạo truyện mới với main_category_id
      const [result] = (await connection.execute(
        `INSERT INTO stories (
          user_id, 
          title, 
          description,
          main_category_id,
          status
        ) VALUES (?, ?, ?, ?, 'draft')`,
        [userId, title, description, mainCategoryId]
      )) as any;

      const storyId = result.insertId;

      // Upload ảnh bìa nếu có
      if (coverImage && coverImage.size > 0) {
        const buffer = Buffer.from(await coverImage.arrayBuffer());
        const { directLink, fileId } = await GoogleDriveService.uploadFile(
          buffer,
          coverImage.type,
          userId,
          "cover",
          storyId
        );

        await connection.execute(
          `UPDATE stories SET 
            cover_image = ?,
            cover_file_id = ?
          WHERE story_id = ?`,
          [directLink, fileId, storyId]
        );
      }

      // Thêm các tag
      for (const tagId of tagIds) {
        await connection.execute(
          "INSERT INTO story_tag_relations (story_id, tag_id) VALUES (?, ?)",
          [storyId, tagId]
        );
      }

      await connection.commit();

      return NextResponse.json(
        { message: "Tạo truyện thành công", storyId },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Lỗi khi tạo truyện:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tạo truyện" },
      { status: 500 }
    );
  }
}
