import { NextResponse } from "next/server";

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for user
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *         example: false
 *     responses:
 *       200:
 *         description: List of notifications returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: ntf001
 *                   user_id:
 *                     type: string
 *                     example: usr001
 *                   title:
 *                     type: string
 *                     example: Deadline approaching
 *                   message:
 *                     type: string
 *                     example: Task "Finish assignment 1" is due in 2 hours
 *                   type:
 *                     type: string
 *                     enum: [deadline, burnout, reschedule]
 *                     example: deadline
 *                   is_read:
 *                     type: boolean
 *                     example: false
 *                   created_at:
 *                     type: string
 *                     example: "2026-03-10T12:00:00Z"
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "ntf001",
        user_id: "usr001",
        title: "Deadline approaching",
        message: "Task \"Finish assignment 1\" is due in 2 hours",
        type: "deadline",
        is_read: false,
        created_at: "2026-03-10T12:00:00Z",
      },
    ],
    { status: 200 }
  );
}