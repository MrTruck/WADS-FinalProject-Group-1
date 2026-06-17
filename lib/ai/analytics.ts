import {prisma} from "@/lib/prisma";

/**
 * The single analytics payload consumed by all AI features:
 * scheduling, burnout detection, weekly summaries, suggestions, etc.
 */
export type UserAnalytics = {
  // Task overview
  totalTasks: number;
  pendingTasks: number;
  activePendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number; // 0–100

  // Upcoming workload
  upcomingTasks: {
    task_id: string;
    title: string;
    description: string | null;
    priority: string;
    difficulty: string;
    due_date: Date | null;
    estimated_hours: number | null;
    status: string;
  }[];

  // Study trends (last 30 days)
  totalStudyMins: number;
  avgSessionMins: number;
  avgFocusScore: number | null;
  sessionCount: number;
  studyDaysCount: number; // distinct days with a session

  // Streak
  currentStreak: number;
  longestStreak: number;

  // Burnout signals
  recentOverloadScore: number | null; // latest burnout_metric overload_score
  recentBurnoutRisk: number | null;   // latest ai_insight burnout_risk_score

  // Available time (from user_preferences)
  availableStartTime: string | null;
  availableEndTime: string | null;
  maxDailyStudyHours: number;
  maxWeeklyStudyHours: number;
  preferredSessionLength: number;
  restDays: string[];

  // Weekly productivity trend (last 4 weeks)
  weeklyTrend: {
    weekStart: Date;
    totalStudyMins: number;
    tasksCompleted: number;
    avgFocusScore: number;
    burnoutRisk: number | null;
  }[];
};

/**
 * Fetches all analytics data for a user.
 * Call this once per AI request and pass the result to your LLM prompts.
 */
export async function fetchUserAnalytics(userId: string): Promise<UserAnalytics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const tasks = await prisma.task.findMany({
  where: { user_id: userId },
  select: {
    task_id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    difficulty: true,
    due_date: true,
    estimated_hours: true,
    completed_at: true,
  },
});
    type Task = (typeof tasks)[number];

  const [
    sessions,
    streak,
    latestBurnout,
    latestInsight,
    preferences,
    weeklySummaries,
  ] = await Promise.all([
    // Study sessions in last 30 days
    prisma.study_session.findMany({
      where: {
        user_id: userId,
        start_time: { gte: thirtyDaysAgo },
        end_time: { not: null },
      },
      select: {
        start_time: true,
        duration_mins: true,
        focus_score: true,
      },
    }),

    // Streak
    prisma.study_streak.findUnique({
      where: { user_id: userId },
      select: { current_streak: true, longest_streak: true },
    }),

    // Latest burnout metric
    prisma.burnout_metric.findFirst({
      where: { user_id: userId },
      orderBy: { date: "desc" },
      select: { overload_score: true },
    }),

    // Latest AI insight
    prisma.ai_insight.findFirst({
      where: { user_id: userId },
      orderBy: { generated_at: "desc" },
      select: { burnout_risk_score: true },
    }),

    // User preferences
    prisma.user_preferences.findUnique({
      where: { user_id: userId },
      select: {
        available_start_time: true,
        available_end_time: true,
        max_daily_study_hours: true,
        max_weekly_study_hours: true,
        preferred_session_length: true,
        rest_days: true,
      },
    }),

    // Last 4 weekly summaries
    prisma.weekly_summary.findMany({
      where: {
        user_id: userId,
        week_start: { gte: fourWeeksAgo },
      },
      orderBy: { week_start: "asc" },
      select: {
        week_start: true,
        total_study_mins: true,
        tasks_completed: true,
        avg_focus_score: true,
        burnout_risk: true,
      },
    }),
  ]);
    type Session = (typeof sessions)[number];
    type WeeklySummary = (typeof weeklySummaries[number]); 
  // Task breakdown
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t:Task) => t.status === "COMPLETED").length;
  const pendingTasks = tasks.filter((t:Task) => t.status === "PENDING").length;
  const inProgressTasks = tasks.filter((t:Task) => t.status === "IN_PROGRESS").length;
  const overdueTasks = tasks.filter(
    (t:Task) => t.status === "PENDING" && t.due_date && t.due_date < now
  ).length;
  const activePendingTasks =
  tasks.filter(
    (t:Task) =>
      t.status === "PENDING" &&
      (!t.due_date || t.due_date >= now)
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Upcoming tasks (pending/in-progress, due in next 14 days)
  // Pending/in-progress tasks due within the next 14 days.
// Overdue tasks are also included because they need urgent prioritization.
const fourteenDaysLater = new Date(now);
fourteenDaysLater.setDate(
  fourteenDaysLater.getDate() + 14
);

const upcomingTasks = tasks
  .filter((t: Task) => {
    const isActive =
      t.status === "PENDING" ||
      t.status === "IN_PROGRESS";

    if (!isActive) {
      return false;
    }

    // Keep tasks without due dates, but they will sort last.
    if (!t.due_date) {
      return true;
    }

    // Includes overdue tasks and tasks due within 14 days.
    return t.due_date <= fourteenDaysLater;
  })
  .sort((a: Task, b: Task) => {
    const aTime =
      a.due_date?.getTime() ??
      Number.POSITIVE_INFINITY;

    const bTime =
      b.due_date?.getTime() ??
      Number.POSITIVE_INFINITY;

    return aTime - bTime;
  })
  .slice(0, 20);

  // Study session stats
  const sessionCount = sessions.length;
  const totalStudyMins = sessions.reduce((sum: number, s: Session) => sum + (s.duration_mins ?? 0), 0);
  const avgSessionMins = sessionCount > 0 ? Math.round(totalStudyMins / sessionCount) : 0;
  const focusScores = sessions.map((s: Session) => s.focus_score).filter((s: number): s is number => s !== null);
  const avgFocusScore =
    focusScores.length > 0
      ? Math.round(focusScores.reduce((a: number, b: number) => a + b, 0) / focusScores.length)
      : null;

  // Distinct study days
  const studyDays = new Set(
    sessions.map((s: Session) => s.start_time.toISOString().split("T")[0])
  );

  return {
    totalTasks,
    pendingTasks,
    activePendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    upcomingTasks,
    totalStudyMins,
    avgSessionMins,
    avgFocusScore,
    sessionCount,
    studyDaysCount: studyDays.size,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    recentOverloadScore: latestBurnout?.overload_score ?? null,
    recentBurnoutRisk: latestInsight?.burnout_risk_score ?? null,
    availableStartTime: preferences?.available_start_time ?? null,
    availableEndTime: preferences?.available_end_time ?? null,
    maxDailyStudyHours: preferences?.max_daily_study_hours ?? 6,
    maxWeeklyStudyHours: preferences?.max_weekly_study_hours ?? 20,
    preferredSessionLength: preferences?.preferred_session_length ?? 25,
    restDays: preferences?.rest_days ?? [],
    weeklyTrend: weeklySummaries.map((w: WeeklySummary) => ({
      weekStart: w.week_start,
      totalStudyMins: w.total_study_mins,
      tasksCompleted: w.tasks_completed,
      avgFocusScore: w.avg_focus_score,
      burnoutRisk: w.burnout_risk,
    })),
  };
}
