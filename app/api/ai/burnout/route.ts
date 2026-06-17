import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  fetchUserAnalytics,
  type UserAnalytics,
} from "@/lib/ai/analytics";
import {
  buildFallbackBurnoutAnalysis,
  detectBurnout,
  type BurnoutAnalysis,
} from "@/lib/ai/burnout";

function getUserId(req: Request) {
  return req.headers.get("x-user-id");
}

function normalizeBurnoutScore(score: unknown) {
  const numericScore =
    typeof score === "number" && Number.isFinite(score)
      ? score
      : 0;

  return Math.max(0, Math.min(100, numericScore));
}

function riskLevelFromScore(score: number) {
  if (score > 65) return "HIGH";
  if (score > 30) return "MEDIUM";
  return "LOW";
}

type WorkloadSnapshot = {
  activePendingTasks: number;
  upcomingTaskCount: number;
  overdueTasks: number;
  inProgressTasks: number;
};

function getWorkloadSnapshot(
  analytics: UserAnalytics
): WorkloadSnapshot {
  return {
    activePendingTasks: analytics.activePendingTasks,
    upcomingTaskCount: analytics.upcomingTasks.length,
    overdueTasks: analytics.overdueTasks,
    inProgressTasks: analytics.inProgressTasks,
  };
}

function readWorkloadSnapshot(
  rawPayload: Prisma.JsonValue | null | undefined
): WorkloadSnapshot | null {
  if (
    !rawPayload ||
    typeof rawPayload !== "object" ||
    Array.isArray(rawPayload)
  ) {
    return null;
  }

  const snapshot = (
    rawPayload as Record<string, unknown>
  ).workloadSnapshot;

  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot)
  ) {
    return null;
  }

  const value = snapshot as Record<string, unknown>;

  if (
    typeof value.activePendingTasks !== "number" ||
    typeof value.upcomingTaskCount !== "number" ||
    typeof value.overdueTasks !== "number" ||
    typeof value.inProgressTasks !== "number"
  ) {
    return null;
  }

  return {
    activePendingTasks: value.activePendingTasks,
    upcomingTaskCount: value.upcomingTaskCount,
    overdueTasks: value.overdueTasks,
    inProgressTasks: value.inProgressTasks,
  };
}

function workloadDidNotIncrease(
  current: WorkloadSnapshot,
  previous: WorkloadSnapshot
) {
  return (
    current.activePendingTasks <= previous.activePendingTasks &&
    current.upcomingTaskCount <= previous.upcomingTaskCount &&
    current.overdueTasks <= previous.overdueTasks &&
    current.inProgressTasks <= previous.inProgressTasks
  );
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

    const burnoutRiskScore = normalizeBurnoutScore(
      savedInsight.burnout_risk_score
    );

    return Response.json({
      burnoutRiskScore,

      riskLevel: riskLevelFromScore(burnoutRiskScore),

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

    const body = await req.json().catch(() => ({}));
    const workloadDecreased =
      body &&
      typeof body === "object" &&
      "workloadDecreased" in body &&
      body.workloadDecreased === true;

    const analytics =
      await fetchUserAnalytics(userId);

    const previousInsight =
      await prisma.ai_insight.findFirst({
        where: {
          user_id: userId,
        },
        orderBy: {
          generated_at: "desc",
        },
        select: {
          burnout_risk_score: true,
          raw_payload: true,
        },
      });

    const currentSnapshot =
      getWorkloadSnapshot(analytics);

    if (
      analytics.upcomingTasks.length === 0 ||
      (analytics.activePendingTasks === 0 &&
        analytics.inProgressTasks === 0)
    ) {
      const normalizedResult = {
        burnoutRiskScore: 0,
        riskLevel: "LOW",
        reasons: ["No upcoming tasks to analyze."],
        recommendations: [
          "Keep your task list updated.",
        ],
        workloadSnapshot: currentSnapshot,
      };

      const savedInsight =
        await prisma.ai_insight.create({
          data: {
            user_id: userId,
            burnout_risk_score:
              normalizedResult.burnoutRiskScore,
            burnout_risk_label:
              normalizedResult.riskLevel,
            recommendations:
              normalizedResult.recommendations,
            raw_payload:
              normalizedResult as Prisma.InputJsonValue,
          },
        });

      return Response.json({
        ...normalizedResult,
        generatedAt: savedInsight.generated_at,
      });
    }

    let result: BurnoutAnalysis;

    try {
      result = await detectBurnout(analytics);
    } catch (error) {
      console.warn(
        "Burnout AI analysis failed; using fallback analysis:",
        error
      );

      result =
        buildFallbackBurnoutAnalysis(analytics);
    }

    const previousSnapshot = readWorkloadSnapshot(
      previousInsight?.raw_payload
    );

    let burnoutRiskScore = normalizeBurnoutScore(
      result.burnoutRiskScore
    );

    if (
      previousInsight &&
      ((previousSnapshot &&
        workloadDidNotIncrease(
          currentSnapshot,
          previousSnapshot
        )) ||
        workloadDecreased)
    ) {
      burnoutRiskScore = Math.min(
        burnoutRiskScore,
        normalizeBurnoutScore(
          previousInsight.burnout_risk_score
        )
      );
    }

    const riskLevel =
      riskLevelFromScore(burnoutRiskScore);

    const normalizedResult = {
      ...result,
      burnoutRiskScore,
      riskLevel,
      workloadSnapshot: currentSnapshot,
    };

    const savedInsight =
      await prisma.ai_insight.create({
        data: {
          user_id: userId,

          burnout_risk_score:
            burnoutRiskScore,

          burnout_risk_label:
            riskLevel,

          recommendations:
            normalizedResult.recommendations ?? [],

          raw_payload:
            normalizedResult as Prisma.InputJsonValue,
        },
      });

    return Response.json({
      ...normalizedResult,
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
