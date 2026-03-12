import { NextResponse } from "next/server";
/**
 * @swagger
 * /pomodoro/cycle:
 *  post:
 *  summary: Log a new Pomodoro cycle
 * tags:
 *  - Pomodoro
 * security:
 * - cookieAuth: []
 * parameters:
 * - in: query
 * name: session_id
 * schema:
 * type: string
 * description: Filter cycles by session ID
 * example: "sess789"
 * - in: query
 * name: task_id
 * schema:
 * type: string
 * description: Filter cycles by task ID
 * example: "tsk123"
 * - in: query
 * name: type
 * schema:
 * type: string
 * description: Filter cycles by type (work, short_break, long_break)
 * - in: query
 * name: from
 * schema:
 * type: string
 * description: Filter cycles starting from chosen date
 * example: "2026-03-01"
 * - in: query
 * name: to
 * schema:
 * type: string
 * description: Filter cycles to chosen date
 * example: "2026-03-31"
 * responses:
 * 200:
 * description: List of Pomodoro cycles returned successfully
 * content:
 * application/json:
 *  schema:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "abc001"
 * user_id:
 * type: string
 * example: "usr123"
 * session_id:
 * type: string
 * example: "sess789"
 * task_id:
 * type: string
 * example: "tsk123"
 * cycle_number:
 * type: number
 * example: 4
 * start_time:
 * type: string
 * example: "2026-03-10T14:00:00Z"
 * end_time:
 * type: string
 * example: "2026-03-10T14:25:00Z"
 * type:
 * type: string
 * example: "work"
 * completed:
 * type: boolean
 * example: true
 * 401:
 *     description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "abc001",
        user_id: "usr123",
        session_id: "sess789",
        task_id: "tsk123",
        cycle_number: 4,
        start_time: "2026-03-10T14:00:00Z",
        end_time: "2026-03-10T14:45:00Z",
        type: "work",
        completed: true,
        created_at: "2026-03-10T14:45:01Z",
      },
    ],
    { status: 200 }
  );
}