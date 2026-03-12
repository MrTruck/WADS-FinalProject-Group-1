import { NextResponse } from "next/server";

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions for user
 *     tags:
 *       - Study Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Filter sessions from this date
 *         example: "2026-03-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Filter sessions to this date
 *         example: "2026-03-10"
 *       - in: query
 *         name: task_id
 *         schema:
 *           type: string
 *         description: Filter sessions by task ID
 *         example: tsk123
 *       - in: query
 *         name: session_type
 *         schema:
 *           type: string
 *           enum: [pomodoro, custom, continuous]
 *         description: Filter sessions by type
 *     responses:
 *       200:
 *         description: List of study sessions returned successfully
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
 *                   user_id:
 *                     type: string
 *                     example: usr001
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
 *                   break_minutes:
 *                     type: number
 *                     example: 10
 *                   session_type:
 *                     type: string
 *                     example: pomodoro
 *                   focus_score:
 *                     type: number
 *                     example: 8
 *                   notes:
 *                     type: string
 *                     example: Finished intro and methodology sections
 *                   created_at:
 *                     type: string
 *                     example: "2026-03-10T15:31:00Z"
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "sess789",
        user_id: "usr001",
        task_id: "tsk123",
        start_time: "2026-03-10T14:00:00Z",
        end_time: "2026-03-10T15:30:00Z",
        actual_minutes: 90,
        break_minutes: 10,
        session_type: "pomodoro",
        focus_score: 8,
        notes: "Finished intro and methodology sections",
        created_at: "2026-03-10T15:31:00Z",
      },
    ],
    { status: 200 }
  );
}

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Log a new study session
 *     tags:
 *       - Study Sessions
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_id
 *               - start_time
 *               - end_time
 *               - actual_minutes
 *               - session_type
 *             properties:
 *               task_id:
 *                 type: string
 *                 example: tsk123
 *               start_time:
 *                 type: string
 *                 example: "2026-03-10T14:00:00Z"
 *               end_time:
 *                 type: string
 *                 example: "2026-03-10T15:30:00Z"
 *               actual_minutes:
 *                 type: number
 *                 example: 90
 *               break_minutes:
 *                 type: number
 *                 example: 10
 *               session_type:
 *                 type: string
 *                 enum: [pomodoro, custom, continuous]
 *                 example: pomodoro
 *               focus_score:
 *                 type: number
 *                 example: 8
 *               notes:
 *                 type: string
 *                 example: Finished intro and methodology sections
 *     responses:
 *       201:
 *         description: Study session logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Study session logged successfully
 *                 id:
 *                   type: string
 *                   example: sess789
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function POST() {
  return NextResponse.json(
    {
      message: "Study session logged successfully",
      id: "sess789",
    },
    { status: 201 }
  );
}