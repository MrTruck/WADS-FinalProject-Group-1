import { callLLM } from "@/lib/ai/groq";
import { UserAnalytics } from "@/lib/ai/analytics";

export type BurnoutRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type BurnoutAnalysis = {
  burnoutRiskScore: number;
  riskLevel: BurnoutRiskLevel;
  reasons: string[];
  recommendations: string[];
};

function riskLevelFromScore(score: number): BurnoutRiskLevel {
  if (score > 65) return "HIGH";
  if (score > 30) return "MEDIUM";
  return "LOW";
}

function normalizeScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : [];
}

function validateBurnoutAnalysis(
  value: unknown
): BurnoutAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Burnout response must be a JSON object");
  }

  const response = value as Record<string, unknown>;
  const score = response.burnoutRiskScore;

  if (typeof score !== "number" || !Number.isFinite(score)) {
    throw new Error(
      "Burnout response must include a numeric burnoutRiskScore"
    );
  }

  const burnoutRiskScore = normalizeScore(score);
  const reasons = normalizeStringArray(response.reasons);
  const recommendations = normalizeStringArray(
    response.recommendations
  );

  return {
    burnoutRiskScore,
    riskLevel: riskLevelFromScore(burnoutRiskScore),
    reasons:
      reasons.length > 0
        ? reasons
        : ["Current workload was analyzed successfully."],
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Review your upcoming tasks and plan focused work blocks."],
  };
}

export function buildFallbackBurnoutAnalysis(
  analytics: UserAnalytics
): BurnoutAnalysis {
  const now = new Date();
  let score = Math.min(60, analytics.upcomingTasks.length * 8);

  score += Math.min(25, analytics.overdueTasks * 12);
  score += Math.min(15, analytics.inProgressTasks * 4);

  for (const task of analytics.upcomingTasks) {
    if (task.priority === "URGENT") score += 8;
    else if (task.priority === "HIGH") score += 5;

    if (task.difficulty === "VERY_HARD") score += 6;
    else if (task.difficulty === "HARD") score += 4;

    if (task.estimated_hours && task.estimated_hours >= 6) {
      score += 5;
    } else if (task.estimated_hours && task.estimated_hours >= 3) {
      score += 3;
    }

    if (task.due_date) {
      const hoursUntilDue =
        (new Date(task.due_date).getTime() - now.getTime()) /
        (1000 * 60 * 60);

      if (hoursUntilDue < 0 || hoursUntilDue <= 24) {
        score += 8;
      } else if (hoursUntilDue <= 72) {
        score += 5;
      }
    }
  }

  if (analytics.upcomingTasks.length <= 1 && analytics.overdueTasks === 0) {
    score = Math.min(score, 29);
  }

  const burnoutRiskScore = normalizeScore(score);
  const reasons = [
    `${analytics.activePendingTasks} active task(s) remain in your workload.`,
  ];

  if (analytics.overdueTasks > 0) {
    reasons.push(`${analytics.overdueTasks} task(s) are overdue.`);
  }

  if (analytics.inProgressTasks > 0) {
    reasons.push(
      `${analytics.inProgressTasks} task(s) are already in progress.`
    );
  }

  return {
    burnoutRiskScore,
    riskLevel: riskLevelFromScore(burnoutRiskScore),
    reasons,
    recommendations: [
      "Focus on the nearest deadline first.",
      "Break larger tasks into shorter study blocks.",
      "Leave recovery time between demanding tasks.",
    ],
  };
}

export async function detectBurnout(
  analytics: UserAnalytics
): Promise<BurnoutAnalysis> {

    const response = await callLLM(
    [
    {
        role: "system",
        content: `
You are an AI productivity assistant.

Analyze student workload and burnout risk.

Rules:
- Do NOT take study sessions into account.
- Do NOT take pendingTasks into account.
- Use activePendingTasks instead of pendingTasks.
- The main factor is upcomingTasks.
- If upcomingTasks is 0 or 1, burnoutRiskScore MUST be below 30 unless there are overdueTasks or urgent very hard tasks.
- If upcomingTasks is 2 to 4, burnoutRiskScore should usually be 30 to 60.
- If upcomingTasks is 5 or more, burnoutRiskScore may be above 65.
- Do not give HIGH risk unless burnoutRiskScore is greater than 65.

Risk levels:
- burnoutRiskScore 0 to 30 = LOW
- burnoutRiskScore 31 to 65 = MEDIUM
- burnoutRiskScore 66 to 100 = HIGH

Return ONLY valid JSON in this format:

{
    "burnoutRiskScore": number,
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "reasons": string[],
    "recommendations": string[]
}
`
    },
    {
        role: "user",
        content: JSON.stringify(analytics)
    }
    ],
    {
        temperature: 0.3,
        response_format: {
            type: "json_object"
        }
    }
);

const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

let parsed: unknown;

try {
    parsed = JSON.parse(cleaned);
} catch (error) {
    const message =
        error instanceof Error
            ? error.message
            : String(error);

    throw new Error(
        `Groq returned invalid burnout JSON: ${message}`
    );
}

return validateBurnoutAnalysis(parsed);
}
