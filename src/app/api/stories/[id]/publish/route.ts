import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/**
 * @swagger
 * /api/stories/{id}/publish:
 *   put:
 *     summary: Xuất bản truyện
 *     description: Chuyển trạng thái truyện từ draft sang published
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
 *         description: ID của truyện cần xuất bản
 *     responses:
 *       200:
 *         description: Xuất bản truyện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Thông báo thành công
 *       400:
 *         description: Cần có ít nhất một chương đã xuất bản
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  const { id } = resolvedParams;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 401 }
      );
    }

    // Kiểm tra điều kiện xuất bản
    const [chapters] = (await pool.execute(
      `SELECT chapter_id FROM story_chapters 
       WHERE story_id = ? AND status = 'published'`,
      [id]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as any[];

    if (!chapters.length) {
      return NextResponse.json(
        { error: "Cần có ít nhất một chương đã xuất bản" },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái truyện
    await pool.execute(
      `UPDATE stories SET status = 'published' WHERE story_id = ?`,
      [id]
    );

    return NextResponse.json({ message: "Xuất bản truyện thành công" });
  } catch (error) {
    console.error("Lỗi khi xuất bản truyện:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
