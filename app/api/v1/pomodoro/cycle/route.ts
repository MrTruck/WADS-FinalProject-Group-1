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
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - session_id
 * - task_id
 * - cycle_number
 * - start_time
 * - end_time
 * - type
 * - completed
 * properties:
 * session_id:
 * type: string
 * example: "sess789"
 * task_id: 
 * type: string
 * example:"tsk123"
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
 * example: [work, short_break, long_break]
 * completed: 
 * type: boolean
 * example: true
 * responses:
 * 201:
 * description: Pomodoro cycle logged successfully
 * content:
 * application/json:
 *  schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Pomodoro cycle logged successfully.
 * id:
 * type: string
 * example: "abc001"
 * next:
 * type: string
 * enum: [work, short_break, long_break]
 * example: short_break
 * 400:
 * description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function POST() {
  return NextResponse.json(
    {
      message: "Pomodoro cycle logged successfully",
      id: "abc001",
      next: "short_break",
    },
    { status: 201 }
  );
}