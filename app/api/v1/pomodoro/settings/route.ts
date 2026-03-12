import { NextResponse } from "next/server";

/**
 * @swagger
 * /pomodoro/settings:
 * get:
 * summary: Get the user's pomodoro settings
 * tags:
 * - Pomodoro
 * security:
 * - cookieAuth: []
 * responses:
 * 200:
 * description: Pomodoro settings returned successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id:
 * type: string
 * example: abcd1234
 * user_id:
 * type: string
 * example: usr123
 * work_duration:
 * type: number
 * example: 45
 * short_break:
 * type: number
 * example: 5
 * long_break:
 * type: number
 * example: 15
 * cycles_before_long_break:
 * type: number
 * example: 2
 * auto_start_breaks:
 * type: boolean
 * example: true
 * auto_start_work:
 * type: boolean
 * example: true
 * updated_at:
 * type: string
 * example: 2024-06-01T12:00:00Z
 * 401:
 * description: Unauthorized— missing or invalid JWT token
*/
export async function GET() {
  return NextResponse.json(
    {
      id: "clxpom001",
      user_id: "clxusr001",
      work_duration: 45,
      short_break: 5,
      long_break: 15,
      cycles_before_long_break: 2,
      auto_start_breaks: true,
      auto_start_work: true,
      updated_at: "2026-03-10T10:00:00Z",
    },
    { status: 200 }
  );
}

/**
 * @swagger
 * /pomodoro/settings:
 * put:
 * summary: Update the user's pomodoro settings
 * tags:
 * - Pomodoro
 * security:
 * - cookieAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * work_duration:
 * type: number
 * example: 45
 * short_break:
 * type: number
 * example: 5
 *  long_break:
 * type: number
 * example: 15
 * cycles_before_long_break:
 * type: number
 * example: 2
 * auto_start_breaks:
 * type: boolean
 * example: true
 * auto_start_work:
 * type: boolean
 * example: true
 * responses:
 * 200:
 * description: Pomodoro settings updated successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Pomodoro settings updated successfully
 * 400:
 * description: Bad request— missing or invalid input data
*/
export async function PUT() {
    return NextResponse.json(
        { message: "Pomodoro settings updated successfully" },
        { status: 200 }
    );
}
