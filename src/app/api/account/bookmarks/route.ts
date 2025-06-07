/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/account/bookmarks:
 *   get:
 *     summary: Lấy danh sách truyện đã bookmark
 *     description: Lấy tất cả truyện mà người dùng đã lưu vào bookmark
 *     tags:
 *       - Account
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Danh sách truyện đã bookmark
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bookmark'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy người dùng
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
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    // Lấy user_id từ email
    const [users] = (await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [session.user.email]
    )) as any[];

    if (!users.length) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Lấy danh sách truyện đã lưu
    const [bookmarks] = (await pool.execute(
      `
      SELECT 
        s.story_id,
        s.title,
        s.cover_image,
        mc.name as main_category,
        sb.created_at as bookmarked_at
      FROM story_bookmarks sb
      JOIN stories s ON sb.story_id = s.story_id
      JOIN main_categories mc ON s.main_category_id = mc.category_id
      WHERE sb.user_id = ?
      ORDER BY sb.created_at DESC
    `,
      [users[0].user_id]
    )) as any[];

    return NextResponse.json({
      bookmarks: bookmarks.map((bookmark: any) => ({
        ...bookmark,
        bookmarked_at: bookmark.bookmarked_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách truyện đã lưu:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
