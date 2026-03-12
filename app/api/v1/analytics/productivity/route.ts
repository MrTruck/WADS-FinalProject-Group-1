import { NextResponse } from "next/server";

/**
 * @swagger
 * /analytics/productivity:
 *   get:
 *     summary: Get productivity trends
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [daily, weekly]
 *         description: Data interval
 *         example: daily
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
 *         description: Productivity trends returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     example: "2026-03-10"
 *                   study_minutes:
 *                     type: number
 *                     example: 120
 *                   tasks_completed:
 *                     type: number
 *                     example: 3
 *                   avg_focus_score:
 *                     type: number
 *                     example: 8
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        date: "2026-03-10",
        study_minutes: 120,
        tasks_completed: 3,
        avg_focus_score: 8,
      },
    ],
    { status: 200 }
  );
}