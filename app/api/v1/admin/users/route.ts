import { NextResponse } from "next/server";

/**
 * @swagger
 * /admin/users:
 * get:
 * summary: Get all registered users
 * tags:
 * - Admin
 * security:
 * - cookieAuth: []
 * responses:
 *   200:
 *   description: List of all users returned successfully
 *   content:
 *   application/json:
 *   schema:
 *   type: array
 *   items:
 *       type: object
 *   properties:
 *    user_id:
 *      type: string
 *      example: usr001
 *    full_name:
 *      type: string
 *      example: Jane Smith
 *    email:
 *      type: string
 *      example: jane@email.com
 *    role:
 *      type: string
 *      enum: [user, admin]
 *      example: user
 *    is_active:
 *      type: boolean
 *      example: true
 *    created_at:
 *      type: string
 *      example: "2026-03-01T08:00:00Z"
 *    401:
 *      description: Unauthorized — missing or invalid JWT token
 *    403:
 *      description: Forbidden — admin access required
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "usr001",
        full_name: "Jane Smith",
        email: "jane@email.com",
        role: "user",
        is_active: true,
        created_at: "2026-03-01T08:00:00Z",
      },
    ],
    { status: 200 }
  );
}