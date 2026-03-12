import { NextResponse } from "next/server";

/**
 * @swagger
 * /analytics/progress:
 *   get:
 *     summary: Get progress stats for user
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Start date
 *         example: "2026-03-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: End date
 *         example: "2026-03-10"
 *     responses:
 *       200:
 *         description: Progress stats returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tasks:
 *                   type: number
 *                   example: 20
 *                 completed_tasks:
 *                   type: number
 *                   example: 14
 *                 completion_rate:
 *                   type: number
 *                   example: 70
 *                 total_study_minutes:
 *                   type: number
 *                   example: 840
 *                 total_sessions:
 *                   type: number
 *                   example: 12
 *                 avg_focus_score:
 *                   type: number
 *                   example: 7.5
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    {
      total_tasks: 20,
      completed_tasks: 14,
      completion_rate: 70,
      total_study_minutes: 840,
      total_sessions: 12,
      avg_focus_score: 7.5,
    },
    { status: 200 }
  );
}