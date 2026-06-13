"use client";

import { useState, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_COLORS = {
  PENDING:     { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  COMPLETED:   { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  OVERDUE:     { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

const PRIORITY_COLORS = {
  LOW:    "#6b7280",
  MEDIUM: "#f59e0b",
  HIGH:   "#ef4444",
  URGENT: "#7c3aed",
};

const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard", VERY_HARD: "Very Hard" };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

// ─── API layer ────────────────────────────────────────────────────────────────

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
  async getTasks() {
    const data = await apiFetch("/tasks");
    return data.data?.tasks ?? [];
  },
  async createTask(data) {
    const res = await apiFetch("/tasks", { method: "POST", body: JSON.stringify(data) });
    return res.data.task;
  },
  async updateTask(id, data) {
    const res = await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return res.data.task;
  },
  async completeTask(id) {
    const res = await apiFetch(`/tasks/${id}/complete`, { method: "PUT" });
    return res.data.task;
  },
  async deleteTask(id) {
    return apiFetch(`/tasks/${id}`, { method: "DELETE" });
  },
};

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({ task, onClose, onSave, onDelete }) {
  const isNew = !task?.task_id;
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "PENDING",
    priority: task?.priority ?? "MEDIUM",
    difficulty: task?.difficulty ?? "MEDIUM",
    due_date: task?.due_date
      ? new Date(task.due_date).toISOString().slice(0, 16)
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      };
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkDone() {
    if (!task?.task_id) return;
    setSaving(true);
    try {
      await api.completeTask(task.task_id);
      onClose();
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{isNew ? "New Task" : "Task Details"}</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Title *</label>
          <input style={styles.input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="What needs to be done?" />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Description</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Add more details…" />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Status</label>
            <select style={styles.input} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {["PENDING","IN_PROGRESS","COMPLETED","OVERDUE"].map((s) => (
                <option key={s} value={s}>{s.replace("_"," ")}</option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Priority</label>
            <select style={styles.input} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {["LOW","MEDIUM","HIGH","URGENT"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Difficulty</label>
            <select style={styles.input} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              {["EASY","MEDIUM","HARD","VERY_HARD"].map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Due Date</label>
            <input type="datetime-local" style={styles.input} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
        </div>

        <div style={styles.modalActions}>
          {!isNew && (
            <>
              {form.status !== "COMPLETED" && (
                <button style={styles.doneBtn} onClick={handleMarkDone} disabled={saving}>✓ Mark Done</button>
              )}
              <button style={styles.deleteBtn} onClick={async () => { await onDelete(task.task_id); onClose(); }} disabled={saving}>Delete</button>
            </>
          )}
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create Task" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Daily View ───────────────────────────────────────────────────────────────

function DailyView({ tasks, year, month, selectedDay, setSelectedDay, onTaskClick, onAddTask }) {
  const today = new Date();

  // Use selectedDay or default to today
  const day = selectedDay ?? today.getDate();
  const displayDate = new Date(year, month, day);

  const dayTasks = (tasks ?? []).filter(
    (t) => t && t.due_date && isSameDay(t.due_date, displayDate)
  );

  function prevDay() {
    const prev = new Date(year, month, day - 1);
    setSelectedDay(prev.getDate());
  }

  function nextDay() {
    const next = new Date(year, month, day + 1);
    setSelectedDay(next.getDate());
  }

  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div>
      {/* Day navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button style={styles.navBtn} onClick={prevDay}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#3b0764" }}>
            {DAYS[displayDate.getDay()]}, {MONTHS[month]} {day}
          </div>
          {isToday && (
            <div style={{ fontSize: 11, color: "#A855F7", fontWeight: 600, marginTop: 2 }}>Today</div>
          )}
        </div>
        <button style={styles.navBtn} onClick={nextDay}>›</button>
      </div>

      {/* Task count + add button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#7e22ce", fontWeight: 600 }}>
          {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
        </span>
        <button style={styles.addSmallBtn} onClick={() => onAddTask(day)}>+ Add Task</button>
      </div>

      {/* Task list for the day */}
      {dayTasks.length === 0 ? (
        <div style={styles.emptyDay}>
          <span style={styles.emptyDayIcon}>📭</span>
          <p>No tasks for this day.</p>
        </div>
      ) : (
        <div style={styles.taskList}>
          {dayTasks
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .map((t) => {
              const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.PENDING;
              return (
                <div
                  key={t.task_id}
                  style={{
                    ...styles.taskCard,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                  onClick={() => onTaskClick(t)}
                >
                  {/* Time column */}
                  <div style={{ minWidth: 52, textAlign: "center", paddingTop: 2 }}>
                    {t.due_date ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#A855F7" }}>
                        {new Date(t.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#a78bca" }}>No time</span>
                    )}
                  </div>

                  {/* Vertical line */}
                  <div style={{ width: 3, borderRadius: 2, alignSelf: "stretch", background: sc.dot, flexShrink: 0 }} />

                  {/* Task info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.text }}>
                        <span style={{ ...styles.dot, background: sc.dot, marginRight: 4 }} />
                        {t.status.replace("_", " ")}
                      </span>
                      <span style={{ ...styles.priorityBadge, color: PRIORITY_COLORS[t.priority] }}>
                        {t.priority}
                      </span>
                    </div>
                    <p style={styles.taskTitle}>{t.title}</p>
                    {t.description && (
                      <p style={styles.taskDesc}>{t.description.slice(0, 80)}{t.description.length > 80 ? "…" : ""}</p>
                    )}
                    <span style={styles.taskMetaItem}>⚡ {DIFFICULTY_LABELS[t.difficulty]}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Weekly View ──────────────────────────────────────────────────────────────

function WeeklyView({ tasks, year, month, selectedDay, setSelectedDay, onTaskClick, onAddTask }) {
  const today = new Date();

  // Compute the start of the week (Sunday) containing selectedDay or today
  const anchorDay = selectedDay ?? today.getDate();
  const anchorDate = new Date(year, month, anchorDay);
  const startOfWeek = new Date(anchorDate);
  startOfWeek.setDate(anchorDate.getDate() - anchorDate.getDay()); // rewind to Sunday

  // Build 7 day objects for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  function prevWeek() {
    const prev = new Date(startOfWeek);
    prev.setDate(prev.getDate() - 7);
    setSelectedDay(prev.getDate());
  }

  function nextWeek() {
    const next = new Date(startOfWeek);
    next.setDate(next.getDate() + 7);
    setSelectedDay(next.getDate());
  }

  const endOfWeek = weekDays[6];
  const weekLabel =
    startOfWeek.getMonth() === endOfWeek.getMonth()
      ? `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`
      : `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button style={styles.navBtn} onClick={prevWeek}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#3b0764" }}>{weekLabel}</span>
        <button style={styles.navBtn} onClick={nextWeek}>›</button>
      </div>

      {/* 7 day columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {weekDays.map((date) => {
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay !== null &&
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === selectedDay;

          const dayTasks = (tasks ?? []).filter(
            (t) => t && t.due_date && isSameDay(t.due_date, date)
          );

          return (
            <div
              key={date.toISOString()}
              onClick={() => setSelectedDay(date.getDate())}
              style={{
                borderRadius: 12,
                padding: "8px 6px",
                minHeight: 120,
                cursor: "pointer",
                background: isSelected ? "#e9d5ff" : isToday ? "#f3e8ff" : "#faf5ff",
                border: isToday || isSelected ? "1.5px solid #A855F7" : "1.5px solid #ddb6fc",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                transition: "background 0.15s",
              }}
            >
              {/* Day header */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bca" }}>
                  {DAYS[date.getDay()]}
                </div>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: isToday ? "#A855F7" : "transparent",
                  color: isToday ? "#fff" : "#3b0764",
                  fontWeight: 700,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}>
                  {date.getDate()}
                </div>
              </div>

              {/* Task pills */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                {dayTasks.slice(0, 3).map((t) => {
                  const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.PENDING;
                  return (
                    <div
                      key={t.task_id}
                      onClick={(e) => { e.stopPropagation(); onTaskClick(t); }}
                      style={{
                        background: sc.bg,
                        color: sc.text,
                        borderRadius: 6,
                        padding: "2px 5px",
                        fontSize: 10,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                      }}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: 10, color: "#a78bca", textAlign: "center" }}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>

              {/* Add button on hover — always visible on mobile */}
              <button
                onClick={(e) => { e.stopPropagation(); onAddTask(date.getDate()); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#A855F7",
                  fontSize: 16,
                  cursor: "pointer",
                  textAlign: "center",
                  padding: 0,
                  marginTop: "auto",
                }}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected day task detail below the grid */}
      {selectedDay !== null && (() => {
        const selDate = new Date(year, month, selectedDay);
        const selTasks = (tasks ?? []).filter(
          (t) => t && t.due_date && isSameDay(t.due_date, selDate)
        );
        return selTasks.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#3b0764", marginBottom: 8 }}>
              {MONTHS[selDate.getMonth()]} {selectedDay} — {selTasks.length} task{selTasks.length !== 1 ? "s" : ""}
            </p>
            <div style={styles.taskList}>
              {selTasks.map((t) => (
                <TaskCard key={t.task_id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [modalTask, setModalTask] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calView, setCalView] = useState<"monthly" | "weekly" | "daily">("monthly");

  const now = new Date();
  const tasks = rawTasks.map((t) =>
    t.status === "PENDING" && t.due_date && new Date(t.due_date) < now
      ? { ...t, status: "OVERDUE" }
      : t
  );

  useEffect(() => {
    api.getTasks()
      .then((data) => setRawTasks(Array.isArray(data) ? data : []))
      .catch((e) => { console.error(e); setFetchError(e.message); setRawTasks([]); })
      .finally(() => setLoading(false));
  }, []);

  // Monthly grid helpers
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  function tasksForDay(day) {
    const d = new Date(year, month, day);
    return (tasks ?? []).filter((t) => t && t.due_date && isSameDay(t.due_date, d));
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function handleSave(payload) {
    if (modalTask?.task_id) {
      const updated = await api.updateTask(modalTask.task_id, payload);
      setRawTasks((ts) => ts.map((t) => t.task_id === updated.task_id ? updated : t));
    } else {
      const created = await api.createTask(payload);
      if (created) setRawTasks((ts) => [...ts, created]);
    }
  }

  async function handleDelete(id) {
    await api.deleteTask(id);
    setRawTasks((ts) => ts.filter((t) => t.task_id !== id));
  }

  function openNew(day) {
    const due = day ? new Date(year, month, day, 12, 0).toISOString() : null;
    setModalTask({ _prefillDueDate: due });
  }

  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.page}>
        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button style={styles.addBtn} onClick={() => openNew(null)}>
            <span style={styles.addBtnPlus}>+</span> New Task
          </button>
        </div>

        <div style={styles.layout}>
          {/* ── Calendar ── */}
          <div style={styles.calendarCard}>

            {/* View toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["daily", "weekly", "monthly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  style={{
                    ...styles.navBtn,
                    background: calView === v ? "#A855F7" : "#e9d5ff",
                    color: calView === v ? "#fff" : "#7e22ce",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "0 12px",
                    width: "auto",
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Month/period nav — shown for monthly and weekly, hidden for daily */}
            {calView !== "daily" && (
              <div style={styles.calendarNav}>
                <button style={styles.navBtn} onClick={prevMonth}>‹</button>
                <span style={styles.monthLabel}>{MONTHS[month]} {year}</span>
                <button style={styles.navBtn} onClick={nextMonth}>›</button>
              </div>
            )}

            {/* ── Monthly View ── */}
            {calView === "monthly" && (
              <>
                {/* Day names header */}
                <div style={styles.calGrid}>
                  {DAYS.map((d) => (
                    <div key={d} style={styles.dayName}>{d}</div>
                  ))}
                </div>

                {/* Date cells */}
                <div style={styles.calGrid}>
                  {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const dayTasks = tasksForDay(day);
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    const isSelected = selectedDay === day;
                    return (
                      <div
                        key={day}
                        style={{
                          ...styles.dayCell,
                          ...(isToday ? styles.dayCellToday : {}),
                          ...(isSelected ? styles.dayCellSelected : {}),
                        }}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                      >
                        <span style={{ ...styles.dayNum, ...(isToday ? styles.dayNumToday : {}) }}>
                          {day}
                        </span>
                        <div style={styles.taskDots}>
                          {dayTasks.slice(0, 3).map((t) => (
                            <span key={t.task_id} style={{ ...styles.dot, background: STATUS_COLORS[t.status]?.dot ?? "#9ca3af" }} />
                          ))}
                          {dayTasks.length > 3 && (
                            <span style={styles.dotMore}>+{dayTasks.length - 3}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={styles.legend}>
                  {Object.entries(STATUS_COLORS).map(([k, v]) => (
                    <div key={k} style={styles.legendItem}>
                      <span style={{ ...styles.dot, background: v.dot }} />
                      <span style={styles.legendLabel}>{k.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Weekly View ── */}
            {calView === "weekly" && (
              <WeeklyView
                tasks={tasks}
                year={year}
                month={month}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                onTaskClick={setModalTask}
                onAddTask={openNew}
              />
            )}

            {/* ── Daily View ── */}
            {calView === "daily" && (
              <DailyView
                tasks={tasks}
                year={year}
                month={month}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                onTaskClick={setModalTask}
                onAddTask={openNew}
              />
            )}

          </div>

          {/* ── Side Panel ── */}
          <div style={styles.sidePanel}>
            {selectedDay ? (
              <>
                <div style={styles.sidePanelHeader}>
                  <span style={styles.sidePanelTitle}>{MONTHS[month]} {selectedDay}</span>
                  <button style={styles.addSmallBtn} onClick={() => openNew(selectedDay)}>+ Add</button>
                </div>
                {selectedTasks.length === 0 ? (
                  <div style={styles.emptyDay}>
                    <span style={styles.emptyDayIcon}>📭</span>
                    <p>No tasks this day.</p>
                  </div>
                ) : (
                  <div style={styles.taskList}>
                    {selectedTasks.map((t) => (
                      <TaskCard key={t.task_id} task={t} onClick={() => setModalTask(t)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <UpcomingTasks tasks={tasks} onTaskClick={setModalTask} />
            )}
          </div>
        </div>

        {loading && <div style={styles.loadingBar}>Loading tasks…</div>}
        {fetchError && <div style={styles.errorBanner}>Failed to load tasks: {fetchError}</div>}

        {modalTask !== null && (
          <TaskModal
            task={modalTask?._prefillDueDate !== undefined
              ? { due_date: modalTask._prefillDueDate }
              : modalTask}
            onClose={() => setModalTask(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }) {
  const sc = STATUS_COLORS[task.status] ?? STATUS_COLORS.PENDING;
  return (
    <div style={styles.taskCard} onClick={onClick}>
      <div style={styles.taskCardTop}>
        <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.text }}>
          <span style={{ ...styles.dot, background: sc.dot, marginRight: 4 }} />
          {task.status.replace("_", " ")}
        </span>
        <span style={{ ...styles.priorityBadge, color: PRIORITY_COLORS[task.priority] }}>
          {task.priority}
        </span>
      </div>
      <p style={styles.taskTitle}>{task.title}</p>
      {task.description && (
        <p style={styles.taskDesc}>{task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}</p>
      )}
      <div style={styles.taskMeta}>
        <span style={styles.taskMetaItem}>⚡ {DIFFICULTY_LABELS[task.difficulty]}</span>
        {task.due_date && (
          <span style={styles.taskMetaItem}>
            🗓 {new Date(task.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming Tasks ───────────────────────────────────────────────────────────

function UpcomingTasks({ tasks, onTaskClick }) {
  const upcoming = [...tasks]
    .filter((t) => t && t.due_date && t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 8);

  return (
    <div>
      <p style={styles.sidePanelTitle}>Upcoming Tasks</p>
      {upcoming.length === 0 ? (
        <p style={{ color: "#9ca3af", marginTop: 16, fontSize: 14 }}>No upcoming tasks.</p>
      ) : (
        <div style={styles.taskList}>
          {upcoming.map((t) => (
            <TaskCard key={t.task_id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "32px 24px",
    color: "#1c1917",
    maxWidth: 1200,
    margin: "0 auto",
  },
  pageWrapper: {
    background: "linear-gradient(135deg, #ffffff 0%, #ead7fe 100%)",
    minHeight: "100vh",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.5px",
    color: "#3b0764",
  },
  pageSubtitle: {
    margin: "4px 0 0",
    color: "#9333ea",
    fontSize: 14,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 24,
    alignItems: "start",
  },
  calendarCard: {
    background: "#f3e8ff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "none",
  },
  calendarNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthLabel: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.3px",
  },
  navBtn: {
    background: "#e9d5ff",
    border: "none",
    borderRadius: 8,
    width: 36,
    height: 36,
    fontSize: 18,
    cursor: "pointer",
    color: "#7e22ce",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 4,
  },
  dayName: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#a78bca",
    padding: "4px 0 8px",
    letterSpacing: "0.05em",
  },
  dayCell: {
    borderRadius: 10,
    padding: "8px 4px 6px",
    minHeight: 64,
    cursor: "pointer",
    transition: "background 0.15s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: "1.5px solid transparent",
  },
  dayCellToday: {
    background: "#E9D5FF",
    border: "1.5px solid #A855F7",
  },
  dayCellSelected: {
    background: "#f3e8ff",
    border: "1.5px solid #A855F7",
  },
  dayNum: {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  dayNumToday: {
    background: "#A855F7",
    color: "#fff",
    fontWeight: 700,
  },
  taskDots: {
    display: "flex",
    gap: 3,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  dotMore: {
    fontSize: 9,
    color: "#a78bca",
    lineHeight: 1,
  },
  legend: {
    display: "flex",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: "#7e22ce",
    textTransform: "capitalize",
  },
  sidePanel: {
    background: "#f3e8ff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "none",
    minHeight: 400,
  },
  sidePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sidePanelTitle: {
    fontWeight: 700,
    fontSize: 16,
    margin: "0 0 16px",
    color: "#3b0764",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  taskCard: {
    border: "1.5px solid #ddb6fc",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    background: "#faf5ff",
  },
  taskCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    letterSpacing: "0.03em",
  },
  priorityBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  taskTitle: {
    fontWeight: 600,
    fontSize: 14,
    margin: "0 0 4px",
    color: "#3b0764",
    lineHeight: 1.4,
  },
  taskDesc: {
    fontSize: 12,
    color: "#7e22ce",
    margin: "0 0 8px",
    lineHeight: 1.5,
  },
  taskMeta: {
    display: "flex",
    gap: 12,
  },
  taskMetaItem: {
    fontSize: 11,
    color: "#a78bca",
  },
  emptyDay: {
    textAlign: "center",
    padding: "40px 0",
    color: "#a78bca",
    fontSize: 14,
  },
  emptyDayIcon: {
    fontSize: 32,
    display: "block",
    marginBottom: 8,
  },
  addBtn: {
    background: "#A855F7",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    letterSpacing: "-0.2px",
    transition: "background 0.15s",
  },
  addBtnPlus: {
    fontSize: 18,
    lineHeight: 1,
  },
  addSmallBtn: {
    background: "#d8b4fe",
    color: "#581c87",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(88,28,135,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
    padding: 16,
  },
  modal: {
    background: "#faf5ff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 20px 60px rgba(88,28,135,0.18)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.3px",
    color: "#3b0764",
  },
  closeBtn: {
    background: "#e9d5ff",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 14,
    color: "#7e22ce",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#581c87",
    marginBottom: 6,
    letterSpacing: "0.01em",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddb6fc",
    borderRadius: 10,
    fontSize: 14,
    color: "#3b0764",
    background: "#faf5ff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  row: {
    display: "flex",
    gap: 12,
    marginBottom: 0,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 24,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  saveBtn: {
    background: "#A855F7",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.2px",
  },
  doneBtn: {
    background: "#d1fae5",
    color: "#065f46",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: "auto",
  },
  errorBanner: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  loadingBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    background: "#A855F7",
    color: "#fff",
    textAlign: "center",
    padding: "6px",
    fontSize: 13,
    zIndex: 2000,
  },
};
