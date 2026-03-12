import { NextResponse } from "next/server";

/**
 * @swagger
 * /analytics/completion:
 *   get:
 *     summary: Get task completion rates
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Start date (ISO 8601)
 *         example: "2026-03-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: End date (ISO 8601)
 *         example: "2026-03-10"
 *     responses:
 *       200:
 *         description: Task completion rates returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall_rate:
 *                   type: number
 *                   example: 70
 *                 by_priority:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: number
 *                       example: 85
 *                     medium:
 *                       type: number
 *                       example: 70
 *                     low:
 *                       type: number
 *                       example: 60
 *                 by_category:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: string
 *                         example: cat456
 *                       name:
 *                         type: string
 *                         example: Mathematics
 *                       rate:
 *                         type: number
 *                         example: 75
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    {
      overall_rate: 70,
      by_priority: { high: 85, medium: 70, low: 60 },
      by_category: [{ category_id: "cat456", name: "Mathematics", rate: 75 }],
    },
    { status: 200 }
  );
}