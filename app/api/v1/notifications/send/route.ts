import { NextResponse } from "next/server";

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Trigger a notification (internal cron job only)
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - title
 *               - message
 *               - type
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: usr001
 *               title:
 *                 type: string
 *                 example: Deadline approaching
 *               message:
 *                 type: string
 *                 example: Task "Finish assignment 1" is due in 2 hours
 *               type:
 *                 type: string
 *                 enum: [deadline, burnout, reschedule]
 *                 example: deadline
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification sent successfully
 *                 id:
 *                   type: string
 *                   example: ntf001
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function POST() {
  return NextResponse.json(
    {
      message: "Notification sent successfully",
      id: "ntf001",
    },
    { status: 201 }
  );
}