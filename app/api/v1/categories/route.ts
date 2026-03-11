import { NextResponse } from "next/server";

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *    responses:
 *      200:
 *       description: List of categories returned successfully
 *      content:
 *       application/json:
 *        schema:
 *       type: array
 *      items:
 *      type: object
 *     properties:
 *     id:
 *     type: string
 *    example: ctg123
 *   name:
 *    type: string
 *   example: Work
 *  description:
 *  type: string
 * example: Tasks related to work
 * color_hex:
 * type: string
 * example: #FF2F2F
 *      401:
 *      description: Unauthorized — missing or invalid JWT token
*/
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "ctg123",
        name: "Work",
        description: "Tasks related to work",
        color_hex: "#FF2F2F",
      },
    ],
    { status: 200 }
  );
}

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - color_hex
 *             properties:
 *               name:
 *                 type: string
 *                 example: Work
 *               description:
 *                 type: string
 *                 example: Tasks related to work
 *               color_hex:
 *                 type: string
 *                 example: #FF2F2F
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 id:
 *                   type: string
 *                   example: ctg123
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function POST() {
  return NextResponse.json(
    {
      message: "Category created successfully",
      id: "ctg123",
    },
    { status: 201 }
  );
}
