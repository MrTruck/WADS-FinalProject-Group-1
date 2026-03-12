import { NextResponse } from "next/server";

/**
 * @swagger
 * /ai/suggestions:
 *   get:
 *     summary: Get active AI suggestions
 *     tags:
 *       - AI Modules
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active AI suggestions returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: sug001
 *                   type:
 *                     type: string
 *                     enum: [reschedule, break, reduce_load]
 *                     example: reschedule
 *                   message:
 *                     type: string
 *                     example: Move task "Finish assignment 1" to tomorrow morning
 *                   task_id:
 *                     type: string
 *                     example: tsk123
 *                   status:
 *                     type: string
 *                     enum: [pending, accepted, dismissed]
 *                     example: pending
 *                   created_at:
 *                     type: string
 *                     example: "2026-03-10T08:00:00Z"
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "sug001",
        type: "reschedule",
        message: "Move task \"Finish assignment 1\" to tomorrow morning",
        task_id: "tsk123",
        status: "pending",
        created_at: "2026-03-10T08:00:00Z",
      },
    ],
    { status: 200 }
  );
}