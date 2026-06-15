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
do not take "study sessions" into account because that feature is optional. 
do not take "pendingTasks" into account, but use "activePendingTasks" instead

Return ONLY valid JSON:

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