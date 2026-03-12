import { NextResponse } from "next/server";

/**
 * @swagger
 * /analytics/workload:
 *   get:
 *     summary: Get workload density per day
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
 *         description: Workload density data returned successfully
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
 *                   total_minutes:
 *                     type: number
 *                     example: 180
 *                   session_count:
 *                     type: number
 *                     example: 3
 *                   task_count:
 *                     type: number
 *                     example: 4
 *                   density_score:
 *                     type: number
 *                     example: 8.5
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        date: "2026-03-10",
        total_minutes: 180,
        session_count: 3,
        task_count: 4,
        density_score: 8.5,
      },
    ],
    { status: 200 }
  );
}