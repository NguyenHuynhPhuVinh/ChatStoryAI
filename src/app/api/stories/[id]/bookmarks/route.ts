/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/stories/{id}/bookmarks:
 *   get:
 *     summary: Kiểm tra trạng thái bookmark
 *     description: Kiểm tra xem người dùng đã bookmark truyện này chưa
 *     tags:
 *       - Stories
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của truyện
 *     responses:
 *       200:
 *         description: Trạng thái bookmark
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isBookmarked:
 *                   type: boolean
 *                   description: Đã bookmark hay chưa
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
 *   post:
 *     summary: Toggle bookmark truyện
 *     description: Thêm hoặc xóa bookmark cho truyện
 *     tags:
 *       - Stories
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của truyện
 *     responses:
 *       200:
 *         description: Thao tác bookmark thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Thông báo kết quả
 *                 isBookmarked:
 *                   type: boolean
 *                   description: Trạng thái bookmark mới
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
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    const [users] = (await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [session.user.email]
    )) as any[];

    const [bookmarks] = (await pool.execute(
      "SELECT * FROM story_bookmarks WHERE user_id = ? AND story_id = ?",
      [users[0].user_id, id]
    )) as any[];

    return NextResponse.json({
      isBookmarked: bookmarks.length > 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    const [users] = (await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [session.user.email]
    )) as any[];

    const [bookmarks] = (await pool.execute(
      "SELECT * FROM story_bookmarks WHERE user_id = ? AND story_id = ?",
      [users[0].user_id, id]
    )) as any[];

    if (bookmarks.length > 0) {
      await pool.execute(
        "DELETE FROM story_bookmarks WHERE user_id = ? AND story_id = ?",
        [users[0].user_id, id]
      );
      return NextResponse.json({
        message: "Đã bỏ lưu truyện",
        isBookmarked: false,
      });
    }

    await pool.execute(
      "INSERT INTO story_bookmarks (user_id, story_id, created_at) VALUES (?, ?, NOW())",
      [users[0].user_id, id]
    );

    return NextResponse.json({
      message: "Đã lưu truyện",
      isBookmarked: true,
    });
  } catch (error) {
    console.error("Lỗi khi thao tác bookmark:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
