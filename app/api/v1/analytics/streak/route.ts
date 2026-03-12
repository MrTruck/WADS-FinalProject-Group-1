import { NextResponse } from "next/server";

/**
 * @swagger
 * /analytics/streak:
 *   get:
 *     summary: Get current study streak
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Study streak data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current_streak:
 *                   type: number
 *                   example: 7
 *                 longest_streak:
 *                   type: number
 *                   example: 14
 *                 last_study_date:
 *                   type: string
 *                   example: "2026-03-10"
 *                 streak_at_risk:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    {
      current_streak: 7,
      longest_streak: 14,
      last_study_date: "2026-03-10",
      streak_at_risk: false,
    },
    { status: 200 }
  );
}