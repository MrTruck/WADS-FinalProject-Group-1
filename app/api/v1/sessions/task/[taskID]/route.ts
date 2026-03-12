import { NextResponse } from "next/server";

/**
 * @swagger
 * /sessions/task/{taskId}:
 *   get:
 *     summary: Get all sessions for a specific task
 *     tags:
 *       - Study Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *         example: tsk123
 *     responses:
 *       200:
 *         description: List of sessions for the task returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: sess789
 *                   task_id:
 *                     type: string
 *                     example: tsk123
 *                   start_time:
 *                     type: string
 *                     example: "2026-03-10T14:00:00Z"
 *                   end_time:
 *                     type: string
 *                     example: "2026-03-10T15:30:00Z"
 *                   actual_minutes:
 *                     type: number
 *                     example: 90
 *                   session_type:
 *                     type: string
 *                     example: pomodoro
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Task not found
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "sess789",
        task_id: "tsk123",
        start_time: "2026-03-10T14:00:00Z",
        end_time: "2026-03-10T15:30:00Z",
        actual_minutes: 90,
        session_type: "pomodoro",
      },
    ],
    { status: 200 }
  );
}