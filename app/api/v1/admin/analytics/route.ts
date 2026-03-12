import { NextResponse } from "next/server";

/**
 * @swagger
 * /admin/analytics:
 *  get:
 *  summary: Get entire analytics of system
 *  tags:
 *  - Admin
 *  security:
 *  - cookieAuth: []
 *  responses:
 *  200:
 *    description: Entire system analytics returned successfully
 *    content:
 *  application/json:
 *   schema:
 *    type: object
 *    properties:
 *     total_users:
 *          type: number
 *          example: 120
 *     active_users:
 *          type: number
 *          example: 85
 *     total_tasks:
 *          type: number
 *          example: 1540
 *     total_sessions:
 *          type: number
 *          example: 3200
 *     avg_completion_rate:
 *          type: number
 *          example: 68
 *     burnout_alerts_triggered:
 *          type: number
 *          example: 34
 *     401:
 *        description: Unauthorized — missing or invalid JWT token
 *     403:
 *        description: Forbidden — admin access required
 */
export async function GET() {
  return NextResponse.json(
    {
      total_users: 120,
      active_users: 85,
      total_tasks: 1540,
      total_sessions: 3200,
      avg_completion_rate: 68,
      burnout_alerts_triggered: 34,
    },
    { status: 200 }
  );
}