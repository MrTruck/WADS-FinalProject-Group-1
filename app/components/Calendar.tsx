"use client";

import { useState } from "react";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const matrix: Date[] = [];
  // start from Sunday before first day
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  // end on Saturday after last day
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    matrix.push(new Date(d));
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < matrix.length; i += 7) {
    weeks.push(matrix.slice(i, i + 7));
  }

  return weeks;
}

export default function Calendar() {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const weeks = getMonthMatrix(view.year, view.month);

  function prev() {
    const m = view.month - 1;
    if (m < 0) setView({ year: view.year - 1, month: 11 });
    else setView({ ...view, month: m });
  }

  function next() {
    const m = view.month + 1;
    if (m > 11) setView({ year: view.year + 1, month: 0 });
    else setView({ ...view, month: m });
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(view.year, view.month, 1)
  );

  return (
    <div className="calendar w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-[#0b0b0b] dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
          ◀
        </button>
        <div className="text-center font-medium">{monthLabel}</div>
        <button onClick={next} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-sm text-gray-600 dark:text-gray-400">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
        {weeks.map((week, i) => (
          <div key={i} className="contents">
            {week.map((day) => {
              const inMonth = day.getMonth() === view.month;
              const isToday =
                day.getFullYear() === today.getFullYear() &&
                day.getMonth() === today.getMonth() &&
                day.getDate() === today.getDate();

              return (
                <div
                  key={day.toISOString()}
                  className={
                    "flex h-10 items-center justify-center rounded-md " +
                    (inMonth ? "" : "text-gray-400 dark:text-neutral-600")
                  }
                >
                  <div
                    className={
                      "w-8 h-8 grid place-items-center rounded-full " +
                      (isToday
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-neutral-800")
                    }
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}