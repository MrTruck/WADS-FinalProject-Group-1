import { NextResponse } from "next/server";

/**
 * @swagger
 * /ai/burnout:
 * post:
 * summary: Run burnout detection analysis (AI Module 2)
 * tags:
 * - AI Modules
 * security:
 * - cookieAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 *   - from
 *   - to
 * properties:
 * from:
 *   type: string
 *   example: "2026-03-01"
 * to:
 *   type: string
 *   example: "2026-03-10"
 * responses:
 * 200:
 *   description: Burnout detection analysis returned successfully
 * content:
 * application/json:
 *    schema:
 *    type: object
 * properties:
 *      risk_level:
 *          type: string
 *          enum: [low, moderate, high]
 *          example: moderate
 *      risk_score:
 *          type: number
 *          example: 65
 *      indicators:
 *          type: array
 *      items:
 *          type: string
 *          example:
 *             - Consecutive study days without rest detected
 *             - Average session duration exceeds recommended limit
 *      recommendation:
 *          type: string
 *          example: Consider taking a full rest day and reducing session length
 *    401:
 *       description: Unauthorized — missing or invalid JWT token
 *    503:
 *       description: AI service unavailable
 *    504:
 *       description: AI service did not respond within 10 seconds
 */
export async function POST() {
  return NextResponse.json(
    {
      risk_level: "moderate",
      risk_score: 65,
      indicators: [
        "Consecutive study days without rest detected",
        "Average session duration exceeds recommended limit",
      ],
      recommendation:
        "Consider taking a full rest day and reducing session length",
    },
    { status: 200 }
  );
}