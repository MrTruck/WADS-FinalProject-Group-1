import { callLLM } from "@/lib/ai/groq";
import { UserAnalytics } from "@/lib/ai/analytics";

export async function detectBurnout(
analytics: UserAnalytics
) {

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
        temperature: 0.3
    }
);

const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

return JSON.parse(cleaned);
}