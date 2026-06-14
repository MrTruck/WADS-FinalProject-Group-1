import { prisma } from "@/lib/prisma";
import { task_priority } from "@prisma/client";
import { fetchUserAnalytics } from "@/lib/ai/analytics";
import { prioritizeTasks } from "@/lib/ai/prioritization";

type RankedTask = {
  task_id: string;
  score: number;
  reason?: string;
};

function scoreToPriority(score: number): task_priority {
  // Supports scores such as 0.9 and scores such as 90
  const normalizedScore =
    score <= 1 ? score * 100 : score;

  if (normalizedScore >= 85) {
    return task_priority.URGENT;
  }

  if (normalizedScore >= 65) {
    return task_priority.HIGH;
  }

  if (normalizedScore >= 40) {
    return task_priority.MEDIUM;
  }

  return task_priority.LOW;
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "Missing user id",
        },
        {
          status: 401,
        }
      );
    }

    const analytics =
      await fetchUserAnalytics(userId);

    const result =
      await prioritizeTasks(analytics);

    const rankings: RankedTask[] =
      Array.isArray(result.tasks)
        ? result.tasks
        : [];

    await prisma.$transaction(
      rankings.map((ranking) =>
        prisma.task.updateMany({
          where: {
            task_id: ranking.task_id,
            user_id: userId,
          },
          data: {
            priority: scoreToPriority(
              Number(ranking.score)
            ),
          },
        })
      )
    );

    const updatedTasks =
      await prisma.task.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          due_date: "asc",
        },
      });

    return Response.json({
      success: true,
      tasks: updatedTasks,
      rankings: rankings.map((ranking) => ({
        ...ranking,
        assignedPriority: scoreToPriority(
          Number(ranking.score)
        ),
      })),
    });
  } catch (error) {
    console.error(
      "AI prioritization failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Task prioritization failed",
        details:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}