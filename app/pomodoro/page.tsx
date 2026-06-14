"use client";

import { useEffect, useState } from "react";

const POMODORO_MODES = {
  WORK: "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break",
};
type BurnoutAnalysis = {
  burnoutRiskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  recommendations: string[];
};

async function runBurnoutAnalysis(): Promise<BurnoutAnalysis> {
  const csrfToken = getCsrfToken();

  const response = await fetch("/api/ai/burnout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken
        ? { "x-csrf-token": csrfToken }
        : {}),
    },
    credentials: "include",
    body: JSON.stringify({}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Burnout analysis failed"
    );
  }

  return data;
}
function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf-token="))
    ?.split("=")[1];
}

async function apiFetch(path, options: any = {}) {
  const csrfToken = getCsrfToken();
  const res = await fetch(`/api/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    let message = "Something went wrong";
    try { const err = await res.json(); message = err.message || message; } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  async getPomodoroSettings() {
    const data = await apiFetch("/pomodoro/settings");
    return data.data?.settings ?? {};
  },
  async updatePomodoroSettings(settings) {
    const res = await apiFetch("/pomodoro/settings", { method: "PUT", body: JSON.stringify(settings) });
    return res.data?.settings ?? {};
  },
  async createPomodoroCycle(cycle) {
    const res = await apiFetch("/pomodoro/cycle", { method: "POST", body: JSON.stringify(cycle) });
    return res.data?.cycle ?? null;
  },
  async getPomodoroCycles() {
    const data = await apiFetch("/pomodoro/cycles");
    return data.data?.cycles ?? [];
  },
};

function PomodoroTimer() {
  const [settings, setSettings] = useState({
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    cycles_before_long_break: 4,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
  });
  const [timeLeft, setTimeLeft] = useState(settings.work_duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState(POMODORO_MODES.WORK);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPomodoroSettings()
      .then((s) => {
        if (s) {
          setSettings(s);
          setTimeLeft(s.work_duration * 60);
        }
      })
      .catch((e) => console.error("Failed to load pomodoro settings:", e));
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    api.getPomodoroCycles()
      .then((cycles) => {
        const todaysCycles = cycles.filter(
          (c) => new Date(c.start_time) >= today && new Date(c.start_time) < tomorrow
        );
        setSessionsToday(todaysCycles.length);
      })
      .catch((e) => console.error("Failed to load cycles:", e));
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          handleCycleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, settings]);

  async function handleCycleComplete() {
    try {
      const now = new Date();
      const durationMins = mode === POMODORO_MODES.WORK ? settings.work_duration :
                          mode === POMODORO_MODES.SHORT_BREAK ? settings.short_break :
                          settings.long_break;

      const cycleStart = new Date(now.getTime() - durationMins * 60 * 1000);

      await api.createPomodoroCycle({
        start_time: cycleStart.toISOString(),
        end_time: now.toISOString(),
        duration_mins: durationMins,
        is_completed: true,
        cycle_number: mode === POMODORO_MODES.WORK ? cycleCount + 1 : cycleCount,
      });

      if (mode === POMODORO_MODES.WORK) {
        const newCycleCount = cycleCount + 1;
        setCycleCount(newCycleCount);
        setSessionsToday((prev) => prev + 1);

        if (newCycleCount % settings.cycles_before_long_break === 0) {
          setMode(POMODORO_MODES.LONG_BREAK);
          setTimeLeft(settings.long_break * 60);
        } else {
          setMode(POMODORO_MODES.SHORT_BREAK);
          setTimeLeft(settings.short_break * 60);
        }

        if (settings.auto_start_breaks) setIsRunning(true);
      } else {
        setMode(POMODORO_MODES.WORK);
        setTimeLeft(settings.work_duration * 60);
        if (settings.auto_start_pomodoros) setIsRunning(true);
      }
    } catch (e) {
      console.error("Failed to save cycle:", e);
    }
  }

  function toggleTimer() {
    setIsRunning(!isRunning);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(
      mode === POMODORO_MODES.WORK ? settings.work_duration * 60 :
      mode === POMODORO_MODES.SHORT_BREAK ? settings.short_break * 60 :
      settings.long_break * 60
    );
  }

  function skipToNext() {
    if (mode === POMODORO_MODES.WORK) {
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);

      if (newCycleCount % settings.cycles_before_long_break === 0) {
        setMode(POMODORO_MODES.LONG_BREAK);
        setTimeLeft(settings.long_break * 60);
      } else {
        setMode(POMODORO_MODES.SHORT_BREAK);
        setTimeLeft(settings.short_break * 60);
      }
    } else {
      setMode(POMODORO_MODES.WORK);
      setTimeLeft(settings.work_duration * 60);
    }
    setIsRunning(false);
  }

  async function handleSettingsSave() {
    setLoading(true);
    try {
      const updated = await api.updatePomodoroSettings(settings);
      setSettings(updated);
      setTimeLeft(updated.work_duration * 60);
      setSettingsOpen(false);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const modeColor =
    mode === POMODORO_MODES.WORK
      ? "#EF4444"
      : mode === POMODORO_MODES.SHORT_BREAK
      ? "#3B82F6"
      : "#10B981";
  const modeName =
    mode === POMODORO_MODES.WORK
      ? "Work"
      : mode === POMODORO_MODES.SHORT_BREAK
      ? "Short Break"
      : "Long Break";

  return (
    <div style={pomStyles.pomodoroCard}>
      <div style={pomStyles.pomodoroHeader}>
        <div>
          <h3 style={pomStyles.pomodoroTitle}>Pomodoro Timer</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#a78bca" }}>
            {sessionsToday} session{sessionsToday !== 1 ? "s" : ""} today
          </p>
        </div>
        <button
          style={pomStyles.settingsBtn}
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {settingsOpen && (
        <div style={pomStyles.pomodoroSettings}>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingLabel}>Work (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.work_duration}
              onChange={(e) =>
                setSettings((s) => ({ ...s, work_duration: parseInt(e.target.value) || 25 }))
              }
              style={pomStyles.settingInput}
            />
          </div>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingLabel}>Short Break (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.short_break}
              onChange={(e) =>
                setSettings((s) => ({ ...s, short_break: parseInt(e.target.value) || 5 }))
              }
              style={pomStyles.settingInput}
            />
          </div>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingLabel}>Long Break (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.long_break}
              onChange={(e) =>
                setSettings((s) => ({ ...s, long_break: parseInt(e.target.value) || 15 }))
              }
              style={pomStyles.settingInput}
            />
          </div>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingLabel}>Cycles Before Long Break</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.cycles_before_long_break}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  cycles_before_long_break: parseInt(e.target.value) || 4,
                }))
              }
              style={pomStyles.settingInput}
            />
          </div>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingCheckboxLabel}>
              <input
                type="checkbox"
                checked={settings.auto_start_breaks}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, auto_start_breaks: e.target.checked }))
                }
              />
              Auto-start breaks
            </label>
          </div>
          <div style={pomStyles.settingRow}>
            <label style={pomStyles.settingCheckboxLabel}>
              <input
                type="checkbox"
                checked={settings.auto_start_pomodoros}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, auto_start_pomodoros: e.target.checked }))
                }
              />
              Auto-start pomodoros
            </label>
          </div>
          <button
            style={pomStyles.saveSettingsBtn}
            onClick={handleSettingsSave}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ ...pomStyles.pomodoroModeLabel, color: modeColor }}>
          {modeName}
        </div>
        <div style={pomStyles.pomodoroTimer}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div style={pomStyles.pomodoroProgress}>
          Cycle {cycleCount + 1}
        </div>
      </div>

      <div style={pomStyles.pomodoroControls}>
        <button
          style={{ ...pomStyles.pomodoroBtn, background: isRunning ? "#f59e0b" : "#A855F7" }}
          onClick={toggleTimer}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button style={{ ...pomStyles.pomodoroBtn, background: "#d1fae5", color: "#065f46" }} onClick={resetTimer}>
          Reset
        </button>
        <button style={{ ...pomStyles.pomodoroBtn, background: "#fee2e2", color: "#991b1b" }} onClick={skipToNext}>
          Skip
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <PomodoroTimer />
    </div>
  );
}

const pomStyles = {
  pomodoroCard: {
    background: "#f3e8ff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "none",
  },
  pomodoroHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pomodoroTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 4px",
    color: "#3b0764",
    letterSpacing: "-0.3px",
  },
  settingsBtn: {
    background: "#e9d5ff",
    border: "none",
    borderRadius: 8,
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  pomodoroSettings: {
    background: "#faf5ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    border: "1.5px solid #ddb6fc",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#581c87",
    flex: 1,
  },
  settingCheckboxLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#581c87",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
    cursor: "pointer",
  },
  settingInput: {
    width: 60,
    padding: "6px 8px",
    border: "1.5px solid #ddb6fc",
    borderRadius: 6,
    fontSize: 13,
    color: "#3b0764",
    background: "#faf5ff",
    boxSizing: "border-box",
  },
  saveSettingsBtn: {
    width: "100%",
    background: "#A855F7",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12,
  },
  pomodoroModeLabel: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  pomodoroTimer: {
    fontSize: 56,
    fontWeight: 700,
    color: "#3b0764",
    letterSpacing: "-1px",
    fontFamily: "'Courier New', monospace",
    marginBottom: 8,
  },
  pomodoroProgress: {
    fontSize: 13,
    color: "#a78bca",
    fontWeight: 600,
  },
  pomodoroControls: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  pomodoroBtn: {
    background: "#A855F7",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    flex: 1,
    transition: "opacity 0.15s",
  },
};
