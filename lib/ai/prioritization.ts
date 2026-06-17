import { callLLM } from "@/lib/ai/groq";
import { UserAnalytics } from "@/lib/ai/analytics";

type PrioritizedTask = {
  task_id: string;
  score: number;
  reason: string;
};

type PrioritizationResponse = {
  tasks: PrioritizedTask[];
};

type UpcomingTask = UserAnalytics["upcomingTasks"][number];

type ScoreBounds = {
  allowed_min_score: number;
  allowed_max_score: number;
};

function clampScore(score: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, score));
}

function roundScore(score: number): number {
  return Number(score.toFixed(2));
}

function normalizeModelScore(score: number): number {
  return score > 1 ? score / 100 : score;
}

function getDeadlineScoreBounds(
  minutesUntilDue: number | null
): ScoreBounds {
  if (minutesUntilDue === null) {
    return {
      allowed_min_score: 0.05,
      allowed_max_score: 0.35,
    };
  }

  if (minutesUntilDue < 0) {
    return {
      allowed_min_score: 0.85,
      allowed_max_score: 1,
    };
  }

  if (minutesUntilDue <= 24 * 60) {
    return {
      allowed_min_score: 0.7,
      allowed_max_score: 0.92,
    };
  }

  if (minutesUntilDue <= 48 * 60) {
    return {
      allowed_min_score: 0.57,
      allowed_max_score: 0.87,
    };
  }

  if (minutesUntilDue <= 72 * 60) {
    return {
      allowed_min_score: 0.45,
      allowed_max_score: 0.85,
    };
  }

  if (minutesUntilDue <= 7 * 24 * 60) {
    return {
      allowed_min_score: 0.3,
      allowed_max_score: 0.75,
    };
  }

  return {
    allowed_min_score: 0.15,
    allowed_max_score: 0.6,
  };
}

function getDifficultyAdjustment(difficulty: string): number {
  switch (difficulty) {
    case "VERY_HARD":
      return 0.1;
    case "HARD":
      return 0.08;
    case "MEDIUM":
      return 0.03;
    case "EASY":
      return -0.05;
    default:
      return 0;
  }
}

function getEstimatedHoursAdjustment(
  estimatedHours: number | null
): number {
  if (estimatedHours === null) return 0;
  if (estimatedHours >= 12) return 0.08;
  if (estimatedHours >= 6) return 0.05;
  if (estimatedHours >= 3) return 0.03;
  return 0;
}

export function getTaskScoreBounds(
  task: UpcomingTask,
  minutesUntilDue: number | null
): ScoreBounds {
  const deadlineBounds =
    getDeadlineScoreBounds(minutesUntilDue);

  const adjustment =
    getDifficultyAdjustment(task.difficulty) +
    getEstimatedHoursAdjustment(task.estimated_hours) +
    (task.status === "IN_PROGRESS" ? 0.05 : 0);

  const allowedMin = clampScore(
    deadlineBounds.allowed_min_score + adjustment
  );

  const allowedMax = clampScore(
    deadlineBounds.allowed_max_score + adjustment
  );

  return {
    allowed_min_score: roundScore(
      Math.min(allowedMin, allowedMax)
    ),
    allowed_max_score: roundScore(
      Math.max(allowedMin, allowedMax)
    ),
  };
}

export async function prioritizeTasks(
  analytics: UserAnalytics
): Promise<PrioritizationResponse> {
  const now = new Date();

  const tasksForAI = analytics.upcomingTasks.map((task) => {
    const minutesUntilDue = task.due_date
      ? Math.round(
          (new Date(task.due_date).getTime() - now.getTime()) /
            60000
        )
      : null;

    return {
      task_id: task.task_id,
      title: task.title,
      description: task.description,
      current_priority: task.priority,
      difficulty: task.difficulty,
      due_date: task.due_date,
      minutes_until_due: minutesUntilDue,
      estimated_hours: task.estimated_hours,
      status: task.status,
      ...getTaskScoreBounds(task, minutesUntilDue),
    };
  });

  const scoreBoundsByTaskId = new Map(
    tasksForAI.map((task) => [
      String(task.task_id),
      {
        allowed_min_score: task.allowed_min_score,
        allowed_max_score: task.allowed_max_score,
      },
    ])
  );

  if (tasksForAI.length === 0) {
    return {
      tasks: [],
    };
  }

  const response = await callLLM(
    [
      {
        role: "system",
        content: `
You prioritize student tasks.

Each task includes:

- allowed_min_score
- allowed_max_score

Scores are decimals from 0.00 to 1.00.
0.85 to 1.00 = URGENT
0.65 to 0.84 = HIGH
0.40 to 0.64 = MEDIUM
0.00 to 0.39 = LOW

You must choose a score inside each task's exact allowed range.

Calculate every task independently.
Never compare one task against another.
The number of supplied tasks must not affect the score.

Use these factors to choose where the score falls inside the range:

Title and description:
- If they imply exams, final projects, submissions, blockers, or large effort, prefer higher in the range
- If they imply small chores or low-impact work, prefer lower in the range

Difficulty:
- EASY: prefer the lower part of the range
- MEDIUM: prefer the middle of the range
- HARD: prefer the upper-middle part of the range
- VERY_HARD: prefer the upper part of the range

Estimated workload:
- More estimated hours should move the score higher within the range
- Fewer estimated hours should move the score lower within the range

Status:
- IN_PROGRESS may move slightly higher
- PENDING requires no adjustment

Strict requirements:
- score must be greater than or equal to allowed_min_score
- score must be less than or equal to allowed_max_score
- Never return a score outside the supplied range
- Round scores to two decimal places
- Return one result for every supplied task

The reason must explain the deadline, difficulty, or workload.
Keep each reason under 14 words.

Return only a valid JSON object in exactly this structure:

{
  "tasks": [
    {
      "task_id": "string",
      "score": 0.00,
      "reason": "short string"
    }
  ]
}

Do not use Markdown.
Do not use code fences.
Do not include text before or after the JSON object.
`.trim(),
      },
      {
        role: "user",
        content: JSON.stringify({
          current_time: now.toISOString(),
          tasks: tasksForAI,
        }),
      },
    ],
    {
      temperature: 0.2,
      max_tokens: 4096,
      response_format: {
        type: "json_object",
      },
    }
  );

  if (!response || !response.trim()) {
    throw new Error(
      "Groq returned an empty task-prioritization response"
    );
  }

  const cleaned = response
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Groq returned invalid prioritization JSON:",
      cleaned
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    throw new Error(
      `Groq returned invalid JSON: ${message}`
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as PrioritizationResponse).tasks)
  ) {
    console.error(
      "Unexpected prioritization response:",
      parsed
    );

    throw new Error(
      'Groq response must contain a "tasks" array'
    );
  }

  const validTaskIds = new Set(
    tasksForAI.map((task) => String(task.task_id))
  );

  const tasks = (
    parsed as PrioritizationResponse
  ).tasks
    .filter((task) => {
      return (
        task &&
        typeof task.task_id === "string" &&
        typeof task.score === "number" &&
        Number.isFinite(task.score) &&
        typeof task.reason === "string" &&
        validTaskIds.has(String(task.task_id))
      );
    })
    .map((task) => {
      const bounds =
        scoreBoundsByTaskId.get(String(task.task_id));

      return {
        task_id: task.task_id,
        score: roundScore(
          clampScore(
            normalizeModelScore(task.score),
            bounds?.allowed_min_score ?? 0,
            bounds?.allowed_max_score ?? 1
          )
        ),
        reason: task.reason.trim(),
      };
    });

  return {
    tasks,
  };
}
