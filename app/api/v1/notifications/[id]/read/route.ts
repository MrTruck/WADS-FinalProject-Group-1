import { NextResponse } from "next/server";

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *         example: ntf001
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Notification not found
 */
export async function PUT() {
  return NextResponse.json(
    { message: "Notification marked as read" },
    { status: 200 }
  );
}