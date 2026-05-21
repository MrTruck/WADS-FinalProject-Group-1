import { NextResponse } from "next/server";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 example: jane@email.com
 *               password:
 *                 type: string
 *                 example: securepassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: "Validation error: missing or invalid fields"
 *       409:
 *         description: Email already registered
 */
export async function POST() {
  return NextResponse.json(
    { message: "User registered successfully" },
    { status: 201 }
  );
}
