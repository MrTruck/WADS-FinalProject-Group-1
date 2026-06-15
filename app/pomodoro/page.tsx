"use client";

import { useEffect, useState } from "react";

const POMODORO_MODES = {
  WORK: "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break",
};

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
  async getSessions() {
  const res = await apiFetch("/sessions");
  return res.data?.sessions ?? [];
  } ,
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
  const [tasks, setTasks] = useState([]);
  const [sessionSaveOpen, setSessionSaveOpen] = useState(false);
  const [sessionSaveLoading, setSessionSaveLoading] = useState(false);
  const [sessionSaveError, setSessionSaveError] = useState('');
  const [pendingSession, setPendingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    task_id: '',
    subject: '',
    comprehension: 70,
    session_type: 'FOCUS',
  });

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

  api.getSessions()
    .then((sessions) => {
      const todaysSessions = sessions.filter((session) => {
        const startTime = new Date(session.start_time);

        return (
          !Number.isNaN(startTime.getTime()) &&
          startTime >= today &&
          startTime < tomorrow
        );
      });

      setSessionsToday(todaysSessions.length);
    })
    .catch((error) => {
      console.error("Failed to load study sessions:", error);
    });
}, []);

  useEffect(() => {
    apiFetch('/tasks')
      .then((res) => {
        setTasks(res.data?.tasks || []);
      })
      .catch((e) => console.error('Failed to load tasks:', e));
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
        
        openStudySessionForm(durationMins);

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

  function openStudySessionForm(durationMins) {
    const now = new Date();
    const startTime = new Date(now.getTime() - durationMins * 60 * 1000);

    setPendingSession({
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      duration_mins: durationMins,
    });
    setSessionForm({
      task_id: '',
      subject: '',
      comprehension: 70,
      session_type: 'FOCUS',
    });
    setSessionSaveError('');
    setSessionSaveOpen(true);
  }

  async function saveStudySession() {
    if (!pendingSession) return;
    setSessionSaveLoading(true);
    setSessionSaveError('');
    try {
      const subject = sessionForm.subject?.trim();

      await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...pendingSession,
          task_id: sessionForm.task_id || undefined,
          subject: subject || undefined,
          comprehension: sessionForm.comprehension,
          session_type: sessionForm.session_type,
        }),
      });
      setSessionSaveOpen(false);
      setPendingSession(null);
    } catch (error: any) {
      setSessionSaveError(error.message || 'Failed to save study session');
    } finally {
      setSessionSaveLoading(false);
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

  function endWorkSession() {
    if (mode !== POMODORO_MODES.WORK) return;
    let durationMins = settings.work_duration - Math.ceil(timeLeft / 60);
    if (durationMins <= 0) durationMins = 1;
    setIsRunning(false);
    openStudySessionForm(durationMins);
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
  
  const selectedTask = tasks.find((task) => task.task_id === sessionForm.task_id);
  
  const now = new Date();
  const upcomingTasks = tasks.filter((task: any)=> {
    if (!task.due_date) return false;

    const dueDate = new Date(task.due_date); 

    return (
      dueDate >= now && 
      task.status !== "COMPLETED"
    )
  })
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
        <button style={{ ...pomStyles.pomodoroBtn, background: "#60a5fa", color: "#1d4ed8" }} onClick={endWorkSession}>
          End Session
        </button>
        <button style={{ ...pomStyles.pomodoroBtn, background: "#fee2e2", color: "#991b1b" }} onClick={skipToNext}>
          Skip
        </button>
      </div>

      {sessionSaveOpen && (
        <div style={pomStyles.modalOverlay}>
          <div style={pomStyles.modal}>
            <h4 style={pomStyles.modalTitle}>Save Study Session</h4>
            <div style={pomStyles.fieldRow}>
              <label style={pomStyles.fieldLabel}>Task</label>
              <select
                value={sessionForm.task_id}
                onChange={(e) => setSessionForm((s) => ({ ...s, task_id: e.target.value }))}
                style={pomStyles.fieldInput}
              >
                <option value="">No task</option>
                {upcomingTasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.title}
                  </option>
                ))}
                </select>
            </div>
            <div style={pomStyles.fieldRow}>
              <label style={pomStyles.fieldLabel}>Subject</label>
              <input
                type="text"
                value={sessionForm.subject}
                onChange={(e) => setSessionForm((s) => ({ ...s, subject: e.target.value }))}
                style={pomStyles.fieldInput}
                placeholder="What did you study?"
              />
            </div>
            <div style={pomStyles.fieldRow}>
              <label style={pomStyles.fieldLabel}>Comprehension</label>
              <input
                type="range"
                min={0}
                max={100}
                value={sessionForm.comprehension}
                onChange={(e) => setSessionForm((s) => ({ ...s, comprehension: parseInt(e.target.value, 10) }))}
                style={{ width: '100%' }}
              />
              <div style={pomStyles.rangeValue}>{sessionForm.comprehension}%</div>
            </div>
            <div style={pomStyles.fieldRow}>
              <label style={pomStyles.fieldLabel}>Duration (min)</label>
              <input
                type="number"
                value={pendingSession?.duration_mins ?? 0}
                disabled
                style={pomStyles.fieldInput}
              />
            </div>
            {selectedTask ? (
              <div style={pomStyles.fieldRow}>
                <label style={pomStyles.fieldLabel}>Selected Task</label>
                <div style={pomStyles.taskPreview}>{selectedTask.title}</div>
              </div>
            ) : null}
            <div style={pomStyles.fieldRow}>
              <label style={pomStyles.fieldLabel}>Session Type</label>
              <select
                value={sessionForm.session_type}
                onChange={(e) => setSessionForm((s) => ({ ...s, session_type: e.target.value }))}
                style={pomStyles.fieldInput}
              >
                <option value="FOCUS">Focus</option>
                <option value="REVIEW">Review</option>
                <option value="PRACTICE">Practice</option>
                <option value="READING">Reading</option>
              </select>
            </div>
            {sessionSaveError && (
              <div style={pomStyles.errorText}>{sessionSaveError}</div>
            )}
            <div style={pomStyles.modalActions}>
              <button
                style={{ ...pomStyles.pomodoroBtn, background: "#22c55e", color: "white", flex: 1 }}
                onClick={saveStudySession}
                disabled={sessionSaveLoading}
              >
                {sessionSaveLoading ? 'Saving…' : 'Save'}
              </button>
              <button
                style={{ ...pomStyles.pomodoroBtn, background: "#f3f4f6", color: "#1f2937", flex: 1 }}
                onClick={() => setSessionSaveOpen(false)}
                disabled={sessionSaveLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)",
  },
  modalTitle: {
    margin: 0,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },
  fieldRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  fieldInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    background: "#f9fafb",
  },
  rangeValue: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "right",
  },
  taskPreview: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: 14,
    lineHeight: 1.4,
  },
  modalActions: {
    display: "flex",
    gap: 12,
    marginTop: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 8,
  },
};
