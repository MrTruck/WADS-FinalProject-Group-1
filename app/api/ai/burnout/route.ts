import { fetchUserAnalytics } from "@/lib/ai/analytics";
import { detectBurnout } from "@/lib/ai/burnout";

export async function POST(req: Request) {

  try {

    const userId =
      req.headers.get("x-user-id");

    if (!userId) {
      return Response.json(
        {
          error: "Missing user id"
        },
        {
          status: 401
        }
      );
    }

    const analytics =
      await fetchUserAnalytics(userId);

    const result =
      await detectBurnout(analytics);

    return Response.json(result);

  } catch (error) {

    console.error(error);

    return Response.json(
      {
        error: "Burnout analysis failed",
        details: String(error)
      },
      {
        status: 500
      }
    );
  }
}