import { NextResponse } from "next/server";

/**
 * @swagger
 * /notifications/settings:
 *   get:
 *     summary: Get notification preferences
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email_notifications:
 *                   type: boolean
 *                   example: true
 *                 push_notifications:
 *                   type: boolean
 *                   example: true
 *                 remind_before_minutes:
 *                   type: number
 *                   example: 30
 *                 daily_digest:
 *                   type: boolean
 *                   example: false
 *                 weekly_report:
 *                   type: boolean
 *                   example: true
 *                 burnout_alerts:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    {
      email_notifications: true,
      push_notifications: true,
      remind_before_minutes: 30,
      daily_digest: false,
      weekly_report: true,
      burnout_alerts: true,
    },
    { status: 200 }
  );
}

/**
 * @swagger
 * /notifications/settings:
 *   put:
 *     summary: Update notification preferences
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
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *                 example: true
 *               push_notifications:
 *                 type: boolean
 *                 example: true
 *               remind_before_minutes:
 *                 type: number
 *                 example: 30
 *               daily_digest:
 *                 type: boolean
 *                 example: false
 *               weekly_report:
 *                 type: boolean
 *                 example: true
 *               burnout_alerts:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification preferences updated successfully
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function PUT() {
  return NextResponse.json(
    { message: "Notification preferences updated successfully" },
    { status: 200 }
  );
}