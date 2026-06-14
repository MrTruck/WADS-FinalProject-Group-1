"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const POMODORO_MODES = {
  WORK: "work",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break",
};

export default function PomodoroWidget() {
  const [settings, setSettings] = useState({ work_duration: 25 });
  const [timeLeft, setTimeLeft] = useState(settings.work_duration * 60);
  const [mode] = useState(POMODORO_MODES.WORK);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/pomodoro/settings`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const s = data.data?.settings ?? {};
        if (s.work_duration) {
          setSettings(s);
          setTimeLeft(s.work_duration * 60);
        }
      } catch (e) {
        // ignore
      }
    }
    load();
  }, []);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <Link href="/pomodoro" style={widgetStyles.link}>
      <div style={widgetStyles.card}>
        <div style={widgetStyles.header}>Pomodoro</div>
        <div style={widgetStyles.timer}>{minutes}:{seconds}</div>
        <div style={widgetStyles.meta}>{mode === POMODORO_MODES.WORK ? "Work" : "Break"}</div>
      </div>
    </Link>
  );
}

const widgetStyles = {
  link: { textDecoration: "none", display: "inline-block" },
  card: {
    borderRadius: 12,
    padding: 12,
    background: "#faf5ff",
    border: "1.5px solid #ddb6fc",
    width: 160,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  header: { fontSize: 13, fontWeight: 700, color: "#3b0764" },
  timer: { fontSize: 20, fontWeight: 800, color: "#A855F7" },
  meta: { fontSize: 12, color: "#a78bca" },
};
