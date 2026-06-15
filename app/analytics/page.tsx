"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type ProgressData = {
  tasks?: {
    total?: number;
    completion_rate_percent?: number;
    breakdown?: {
      PENDING?: number;
      IN_PROGRESS?: number;
      COMPLETED?: number;
      OVERDUE?: number;
    };
  };
  sessions?: {
    total_count?: number;
    total_duration_mins?: number;
  };
  streak?: {
    current?: number;
    longest?: number;
  };
};

type BurnoutData = {
  burnoutRiskScore?: number;
  riskLevel?: string;
  reasons?: string[];
  recommendations?: string[];
};

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf-token="))
    ?.split("=")[1];
}

async function getProgressAnalytics(): Promise<ProgressData> {
  const csrfToken = getCsrfToken();

  const response = await fetch("/api/v1/analytics/progress", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken
        ? {
            "x-csrf-token": decodeURIComponent(csrfToken),
          }
        : {}),
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Failed to load progress analytics"
    );
  }

  return data.data ?? data;
}
async function getBurnoutAnalytics(): Promise<BurnoutData | null> {
  const response = await fetch("/api/ai/burnout", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.message ||
      responseData.error ||
      "Failed to load saved burnout analysis"
    );
  }

  return responseData.data ?? responseData;
}
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getRiskColor(level?: string) {
  switch (level?.toUpperCase()) {
    case "LOW":
      return "#16a34a";

    case "MEDIUM":
      return "#d97706";

    case "HIGH":
      return "#dc2626";

    case "CRITICAL":
      return "#7f1d1d";

    default:
      return "#6b7280";
  }
}

export default function AnalyticsPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [burnout, setBurnout] = useState<BurnoutData | null>(null);

  const [progressError, setProgressError] = useState<string | null>(
    null
  );
  const [burnoutError, setBurnoutError] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let cancelled = false;

  async function loadAnalytics() {
    setLoading(true);

    const [progressResult, burnoutResult] =
      await Promise.allSettled([
        getProgressAnalytics(),
        getBurnoutAnalytics(),
      ]);

    if (cancelled) return;

    if (progressResult.status === "fulfilled") {
      setProgress(progressResult.value);
    } else {
      setProgressError(
        progressResult.reason?.message ||
        "Unable to load progress analytics"
      );
    }

    if (burnoutResult.status === "fulfilled") {
      setBurnout(burnoutResult.value);
    } else {
      setBurnoutError(
        burnoutResult.reason?.message ||
        "Unable to load burnout analysis"
      );
    }

    setLoading(false);
  }

  loadAnalytics();

  return () => {
    cancelled = true;
  };
}, []);

  const totalTasks = progress?.tasks?.total ?? 0;
  const completionRate =
    progress?.tasks?.completion_rate_percent ?? 0;

  const taskBreakdown = progress?.tasks?.breakdown ?? {};

  const completedTasks = taskBreakdown.COMPLETED ?? 0;
  const pendingTasks = taskBreakdown.PENDING ?? 0;
  const inProgressTasks = taskBreakdown.IN_PROGRESS ?? 0;
  const overdueTasks = taskBreakdown.OVERDUE ?? 0;

  const sessionCount = progress?.sessions?.total_count ?? 0;
  const sessionMinutes =
    progress?.sessions?.total_duration_mins ?? 0;

  const currentStreak = progress?.streak?.current ?? 0;
  const longestStreak = progress?.streak?.longest ?? 0;

  const burnoutScore = burnout?.burnoutRiskScore ?? 0;
  const riskLevel = burnout?.riskLevel ?? "UNKNOWN";
  const riskColor = getRiskColor(riskLevel);

  return (
    <div style={styles.pageWrapper}>
      <main style={styles.page}>
        <div style={styles.header}>
          <div>
            <Link href="/dashboard" style={styles.backLink}>
              ← Back to dashboard
            </Link>

            <h1 style={styles.title}>Progress Analytics</h1>

            <p style={styles.subtitle}>
              Detailed productivity and workload analysis
            </p>
          </div>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={() => window.location.reload()}
          >
            Refresh analysis
          </button>
        </div>

        {loading && (
          <div style={styles.statusCard}>
            Loading your analytics…
          </div>
        )}

        {!loading && progressError && burnoutError && (
          <div style={styles.errorCard}>
            <strong>Analytics could not be loaded.</strong>
            <p style={styles.errorText}>
              {progressError}
            </p>
            <p style={styles.errorText}>
              {burnoutError}
            </p>
          </div>
        )}

        {!loading && (
          <>
            <section style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.cardLabel}>Completion</span>

                <span style={styles.cardValue}>
                  {completionRate}%
                </span>

                <span style={styles.cardSubtext}>
                  {completedTasks} of {totalTasks} tasks completed
                </span>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min(
                        100,
                        Math.max(0, completionRate)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.cardLabel}>
                  Pomodoro Sessions
                </span>

                <span style={styles.cardValue}>
                  {sessionCount}
                </span>

                <span style={styles.cardSubtext}>
                  {formatDuration(sessionMinutes)} focused
                </span>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.cardLabel}>Burnout Risk</span>

                <span
                  style={{
                    ...styles.cardValue,
                    color: riskColor,
                  }}
                >
                  {burnoutError ? "—" : `${burnoutScore}%`}
                </span>

                <span
                  style={{
                    ...styles.riskBadge,
                    color: riskColor,
                    background: `${riskColor}18`,
                  }}
                >
                  {burnoutError
                    ? "Unavailable"
                    : `${riskLevel} risk`}
                </span>

                {!burnoutError && (
                  <div style={styles.burnoutTrack}>
                    <div
                      style={{
                        ...styles.burnoutFill,
                        width: `${Math.min(
                          100,
                          Math.max(0, burnoutScore)
                        )}%`,
                        background: riskColor,
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.cardLabel}>Current Streak</span>

                <span style={styles.cardValue}>
                  {currentStreak}
                </span>

                <span style={styles.cardSubtext}>
                  Longest streak: {longestStreak}
                </span>
              </div>
            </section>

            <section style={styles.contentGrid}>
              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>
                  Task Breakdown
                </h2>

                {progressError ? (
                  <p style={styles.errorMessage}>
                    {progressError}
                  </p>
                ) : (
                  <div style={styles.breakdownGrid}>
                    <TaskBreakdownItem
                      label="Completed"
                      value={completedTasks}
                      color="#16a34a"
                    />

                    <TaskBreakdownItem
                      label="Pending"
                      value={pendingTasks}
                      color="#d97706"
                    />

                    <TaskBreakdownItem
                      label="In Progress"
                      value={inProgressTasks}
                      color="#2563eb"
                    />

                    <TaskBreakdownItem
                      label="Overdue"
                      value={overdueTasks}
                      color="#dc2626"
                    />
                  </div>
                )}
              </div>

              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>
                  Focus Session Details
                </h2>

                {progressError ? (
                  <p style={styles.errorMessage}>
                    {progressError}
                  </p>
                ) : (
                  <div style={styles.detailList}>
                    <div style={styles.detailRow}>
                      <span>Total sessions</span>
                      <strong>{sessionCount}</strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Total focus time</span>
                      <strong>
                        {formatDuration(sessionMinutes)}
                      </strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Average session duration</span>
                      <strong>
                        {sessionCount > 0
                          ? `${Math.round(
                              sessionMinutes / sessionCount
                            )} minutes`
                          : "0 minutes"}
                      </strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Current streak</span>
                      <strong>{currentStreak}</strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Longest streak</span>
                      <strong>{longestStreak}</strong>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section style={styles.aiCard}>
              <div style={styles.aiHeader}>
                <div>
                  <span style={styles.aiEyebrow}>
                    AI workload analysis
                  </span>

                  <h2 style={styles.aiTitle}>
                    Why your burnout risk is{" "}
                    <span style={{ color: riskColor }}>
                      {riskLevel.toLowerCase()}
                    </span>
                  </h2>
                </div>

                {!burnoutError && (
                  <div
                    style={{
                      ...styles.scoreCircle,
                      borderColor: riskColor,
                      color: riskColor,
                    }}
                  >
                    {burnoutScore}%
                  </div>
                )}
              </div>

              {totalTasks === 0 || !burnout ? (
                <div>
                  <h3 style={styles.listTitle}>
                    No burnout analysis yet
                  </h3>

                  <p style={styles.emptyText}>
                    Create a task to get started. Your burnout analysis
                    will appear here after you create or update a task.
                  </p>

                  <Link href="/dashboard" style={styles.backLink}>
                    Create your first task →
                  </Link>
                </div>
              ) : burnoutError ? (
                <p style={styles.errorMessage}>
                  {burnoutError}
                </p>
              ) : (
                <div style={styles.aiColumns}>
                  <div>
                    <h3 style={styles.listTitle}>
                      Reasons
                    </h3>

                    {burnout?.reasons?.length ? (
                      <div style={styles.list}>
                        {burnout.reasons.map((reason, index) => (
                          <div
                            key={`${reason}-${index}`}
                            style={styles.reasonItem}
                          >
                            <span style={styles.reasonIcon}>!</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={styles.emptyText}>
                        No burnout reasons were returned.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 style={styles.listTitle}>
                      Recommendations
                    </h3>

                    {burnout?.recommendations?.length ? (
                      <div style={styles.list}>
                        {burnout.recommendations.map(
                          (recommendation, index) => (
                            <div
                              key={`${recommendation}-${index}`}
                              style={styles.recommendationItem}
                            >
                              <span style={styles.checkIcon}>✓</span>
                              <span>{recommendation}</span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p style={styles.emptyText}>
                        No recommendations were returned.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function TaskBreakdownItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={styles.breakdownItem}>
      <span
        style={{
          ...styles.breakdownDot,
          background: color,
        }}
      />

      <div>
        <div style={styles.breakdownValue}>{value}</div>
        <div style={styles.breakdownLabel}>{label}</div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #ffffff 0%, #ead7fe 100%)",
  },

  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 24px 60px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#3b0764",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    marginBottom: 30,
    flexWrap: "wrap",
  },

  backLink: {
    color: "#7e22ce",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  },

  title: {
    margin: "12px 0 4px",
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin: 0,
    color: "#9333ea",
    fontSize: 14,
  },

  refreshButton: {
    background: "#a855f7",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  statusCard: {
    padding: 24,
    borderRadius: 16,
    background: "#fdf4ff",
    border: "1.5px solid #ddb6fc",
  },

  errorCard: {
    padding: 20,
    borderRadius: 14,
    background: "#fee2e2",
    color: "#991b1b",
    marginBottom: 20,
  },

  errorText: {
    margin: "8px 0 0",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  summaryCard: {
    background: "#fdf4ff",
    border: "1.5px solid #ddb6fc",
    borderRadius: 18,
    padding: 22,
    minHeight: 150,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  cardValue: {
    fontSize: 36,
    fontWeight: 800,
    color: "#3b0764",
  },

  cardSubtext: {
    color: "#6d28d9",
    fontSize: 13,
  },

  progressTrack: {
    height: 8,
    background: "#e9d5ff",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: "auto",
  },

  progressFill: {
    height: "100%",
    background: "#a855f7",
    borderRadius: 999,
  },

  burnoutTrack: {
    height: 8,
    background: "#e9d5ff",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: "auto",
  },

  burnoutFill: {
    height: "100%",
    borderRadius: 999,
  },

  riskBadge: {
    width: "fit-content",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 24,
  },

  sectionCard: {
    background: "#fdf4ff",
    border: "1.5px solid #ddb6fc",
    borderRadius: 18,
    padding: 22,
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontSize: 19,
    color: "#3b0764",
  },

  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  breakdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    background: "#fff7fe",
    border: "1px solid #eed5ff",
  },

  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    flexShrink: 0,
  },

  breakdownValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#3b0764",
  },

  breakdownLabel: {
    fontSize: 12,
    color: "#7e22ce",
  },

  detailList: {
    display: "flex",
    flexDirection: "column",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    padding: "13px 0",
    borderBottom: "1px solid #ead7fe",
    color: "#6d28d9",
    fontSize: 14,
  },

  aiCard: {
    background: "#fdf4ff",
    border: "1.5px solid #ddb6fc",
    borderRadius: 20,
    padding: 26,
  },

  aiHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 24,
  },

  aiEyebrow: {
    color: "#9333ea",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  aiTitle: {
    fontSize: 24,
    margin: "7px 0 0",
    color: "#3b0764",
  },

  scoreCircle: {
    width: 82,
    height: 82,
    borderRadius: "50%",
    border: "7px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 900,
    flexShrink: 0,
  },

  aiColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 28,
  },

  listTitle: {
    margin: "0 0 12px",
    fontSize: 16,
    color: "#3b0764",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  reasonItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#fff1f2",
    color: "#9f1239",
    padding: 13,
    borderRadius: 12,
    lineHeight: 1.5,
    fontSize: 14,
  },

  recommendationItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#f0fdf4",
    color: "#166534",
    padding: 13,
    borderRadius: 12,
    lineHeight: 1.5,
    fontSize: 14,
  },

  reasonIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#fecdd3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },

  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },

  errorMessage: {
    color: "#991b1b",
    background: "#fee2e2",
    padding: 12,
    borderRadius: 10,
  },

  emptyText: {
    color: "#7e22ce",
    fontSize: 14,
  },
};