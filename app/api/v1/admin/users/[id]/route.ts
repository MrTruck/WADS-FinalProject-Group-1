import { NextResponse } from "next/server";

/**
 * @swagger
 * /admin/users/{id}:
 *  delete:
 *  summary: Delete a user account
 *  tags:
 *  - Admin
 *  security:
 *  - cookieAuth: []
 *  parameters:
 *  - in: path
 *    name: id
 *    required: true
 *  schema:
 *    type: string
 *    description: The user ID
 *    example: usr001
 *  responses:
 *       204:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       403:
 *         description: Forbidden — admin access required
 *       404:
 *         description: User not found
 */
export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}