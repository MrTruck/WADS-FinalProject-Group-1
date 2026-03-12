import { NextResponse } from "next/server";

/**
 * @swagger
 * /ai/suggestions/{id}/accept:
 *   put:
 *     summary: Accept an AI suggestion
 *     tags:
 *       - AI Modules
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The suggestion ID
 *         example: sug001
 *     responses:
 *       200:
 *         description: Suggestion accepted and logged to calendar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Suggestion accepted and logged to calendar
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Suggestion not found
 */
export async function PUT() {
  return NextResponse.json(
    { message: "Suggestion accepted and logged to calendar" },
    { status: 200 }
  );
}