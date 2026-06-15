import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchUserAnalytics } from "@/lib/ai/analytics";
import { detectBurnout } from "@/lib/ai/burnout";

function getUserId(req: Request) {
  return req.headers.get("x-user-id");
}

/*
  GET:
  Return the most recently saved analysis.
  Does not call the AI.
*/
export async function GET(req: Request) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return Response.json(
        {
          error: "Missing user id",
        },
        {
          status: 401,
        }
      );
    }

    const savedInsight = await prisma.ai_insight.findFirst({
      where: {
        user_id: userId,
      },
      orderBy: {
        generated_at: "desc",
      },
    });

    if (!savedInsight) {
      return Response.json(null);
    }

    const rawPayload =
      savedInsight.raw_payload &&
      typeof savedInsight.raw_payload === "object" &&
      !Array.isArray(savedInsight.raw_payload)
        ? savedInsight.raw_payload
        : {};

    const reasons =
      "reasons" in rawPayload &&
      Array.isArray(rawPayload.reasons)
        ? rawPayload.reasons
        : [];

    return Response.json({
      burnoutRiskScore:
        savedInsight.burnout_risk_score ?? 0,

      riskLevel:
        savedInsight.burnout_risk_label ?? "UNKNOWN",

      reasons,

      recommendations:
        savedInsight.recommendations ?? [],

      generatedAt:
        savedInsight.generated_at,
    });
  } catch (error) {
    console.error(
      "Failed to load saved burnout analysis:",
      error
    );

    return Response.json(
      {
        error: "Failed to load burnout analysis",
        details: String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/*
  POST:
  Generate and save a new analysis.
  Call this only after a task changes.
*/

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return Response.json(
        {
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
      await detectBurnout(analytics);

    const savedInsight =
      await prisma.ai_insight.create({
        data: {
          user_id: userId,

          burnout_risk_score:
            result.burnoutRiskScore,

          burnout_risk_label:
            result.riskLevel,

          recommendations:
            result.recommendations ?? [],

          raw_payload:
            result as Prisma.InputJsonValue,
        },
      });

    return Response.json({
      ...result,
      generatedAt: savedInsight.generated_at,
    });
  } catch (error) {
    console.error(
      "Burnout analysis failed:",
      error
    );

    return Response.json(
      {
        error: "Burnout analysis failed",
        details: String(error),
      },
      {
        status: 500,
      }
    );
  }
}