import { NextResponse } from "next/server";

/**
 * @swagger
 * /ai/insights:
 * get:
 * summary: Get latest AI analysis for user
 * tags:
 * - AI Modules
 * security:
 * - cookieAuth: []
 * responses:
 * 200:
 *   description: Latest AI insights returned successfully
 * content:
 * application/json:
 * schema:
 *   type: object
 * properties:
 *    burnout_risk:
 *                   type: string
 *                   enum: [low, moderate, high]
 *                   example: moderate
 *                 schedule_status:
 *                   type: string
 *                   enum: [on_track, behind, ahead]
 *                   example: on_track
 *                 summary:
 *                   type: string
 *                   example: You are on track but showing early signs of overwork
 *                 generated_at:
 *                   type: string
 *                   example: "2026-03-10T08:00:00Z"
 *                 cached:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    {
      burnout_risk: "moderate",
      schedule_status: "on_track",
      summary: "You are on track but showing early signs of overwork",
      generated_at: "2026-03-10T08:00:00Z",
      cached: true,
    },
    { status: 200 }
  );
}