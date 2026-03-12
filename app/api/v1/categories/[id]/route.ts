import { NextResponse } from "next/server";

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *         example: cat456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Advanced Mathematics
 *               color_hex:
 *                 type: string
 *                 example: "#33FF57"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Category not found
 */
export async function PUT() {
  return NextResponse.json(
    { message: "Category updated successfully" },
    { status: 200 }
  );
}

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *         example: cat456
 *     responses:
 *       204:
 *         description: Category deleted successfully — tasks reassigned
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *       404:
 *         description: Category not found
 */
export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}