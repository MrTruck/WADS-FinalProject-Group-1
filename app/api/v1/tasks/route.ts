import { NextResponse } from "next/server";

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks for current user
 *     tags:
 *       - Tasks
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in_progress, overdue,completed]
 *         description: Filter tasks by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter tasks by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter tasks by category ID
 *     responses:
 *       200:
 *         description: List of tasks returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: tsk001
 *                   title:
 *                     type: string
 *                     example: Finish assignment 1
 *                   status:
 *                     type: string
 *                     example: not_started
 *                   priority:
 *                     type: string
 *                     example: high
 *                   due_date:
 *                     type: string
 *                     example: 2026-03-20
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function GET() {
  return NextResponse.json(
    [
      {
        id: "tsk001",
        title: "Finish assignment 1",
        status: "pending",
        priority: "high",
        due_date: "2026-03-20",
      },
    ],
    { status: 200 }
  );
}

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - due_date
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 example: Finish assignment 1
 *               description:
 *                 type: string
 *                 example: Complete all sections of the report
 *               due_date:
 *                 type: string
 *                 example: 2026-03-20
 *               due_time:
 *                 type: string
 *                 example: "23:59"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               category_id:
 *                 type: string
 *                 example: ctg123
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task created successfully
 *                 id:
 *                   type: string
 *                   example: tsk001
 *       400:
 *         description: Validation error — missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 */
export async function POST() {
  return NextResponse.json(
    {
      message: "Task created successfully",
      id: "tsk001",
    },
    { status: 201 }
  );
}
