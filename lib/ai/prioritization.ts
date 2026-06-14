import { callLLM } from "@/lib/ai/groq";
import { UserAnalytics } from "@/lib/ai/analytics";
export async function prioritizeTasks(
  analytics: UserAnalytics
) {
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
- Due later than 3 days: 0.10 to 0.49

Increase the score for HARD and VERY_HARD tasks.
IN_PROGRESS tasks may receive a small increase.

Return only valid JSON:

{
  "tasks": [
    {
      "task_id": "string",
      "score": 0.0,
      "reason": "string"
    }
  ]
}
`,
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
      temperature: 0.1,
    }
  );

  const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}