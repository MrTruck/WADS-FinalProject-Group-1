import { NextResponse } from "next/server";

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
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
 *       204:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Notification not found
 */
export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}