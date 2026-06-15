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
      difficulty: task.difficulty,
      due_date: task.due_date,
      minutes_until_due: minutesUntilDue,
      estimated_hours: task.estimated_hours,
      status: task.status,
    };
  });

  // Avoid calling Groq when there are no tasks.
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

Use minutes_until_due as the strongest urgency signal.

Scoring rules:
- Overdue or due within 15 minutes: 0.95 to 1.00
- Due within 1 hour: 0.85 to 0.94
- Due within 24 hours: 0.70 to 0.84
- Due within 3 days: 0.50 to 0.69
- Due within 7 days: 0.40 to 0.49
- Due later than 7 days: 0.10 to 0.39
- No due date: 0.10 to 0.30

Difficulty adjustments:
- EASY: decrease the score slightly
- MEDIUM: no adjustment
- HARD: increase the score slightly
- VERY_HARD: increase the score more

Never raise a task due later than 7 days above 0.39 unless it is already overdue.

Return one result for every supplied task.

Keep each reason short, with a maximum of 12 words.

Return only a valid JSON object in exactly this structure:

{
  "tasks": [
    {
      "task_id": "string",
      "score": 0.0,
      "reason": "short string"
    }
  ]
}

Do not use Markdown.
Do not use code fences.
Do not include any text before or after the JSON object.
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
      temperature: 0,
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
    .map((task) => ({
      task_id: task.task_id,
      score: Math.max(
        0,
        Math.min(1, task.score)
      ),
      reason: task.reason.trim(),
    }));

  return {
    tasks,
  };
}