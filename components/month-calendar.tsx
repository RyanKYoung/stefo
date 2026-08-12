"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  monthLabel,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "@/lib/calendar";

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function MonthCalendar({ serverToday }: { serverToday: string }) {
  const [today, setToday] = useState(() => parseDateKey(serverToday));
  const [viewMonth, setViewMonth] = useState(() =>
    firstOfMonth(parseDateKey(serverToday)),
  );

  // The server renders its own date (UTC on Render); once mounted, trust the
  // browser's clock instead. Running only on mount keeps hydration clean.
  useEffect(() => {
    const clientToday = startOfDay(new Date());
    if (toDateKey(clientToday) !== serverToday) {
      setToday(clientToday);
      setViewMonth(firstOfMonth(clientToday));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cells = useMemo(
    () => buildMonthGrid(viewMonth, today),
    [viewMonth, today],
  );

  const showingCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setViewMonth(firstOfMonth(today))}
          disabled={showingCurrentMonth}
          className="rounded-md border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent"
        >
          Today
        </button>

        <div className="flex items-center">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth((month) => addMonths(month, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth((month) => addMonths(month, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <h2 className="ml-2 text-[22px] font-normal text-[var(--color-ink)]">
          {monthLabel(viewMonth)}
        </h2>
      </div>

      <div className="grid grid-cols-7 border-t border-[var(--color-line)]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-[var(--color-line)] py-2 text-center text-[11px] font-medium tracking-wide text-[var(--color-ink-muted)] last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 border-t border-[var(--color-line)]">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={[
              "min-h-[92px] border-r border-b border-[var(--color-line)] px-1.5 pt-1 transition-colors [&:nth-child(7n)]:border-r-0",
              cell.inMonth
                ? "bg-[var(--color-surface)]"
                : "bg-[var(--color-surface-muted)]",
              "hover:bg-[var(--color-accent-soft)]/40",
            ].join(" ")}
          >
            <div className="flex justify-center">
              <span
                className={[
                  "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs leading-none",
                  cell.isToday
                    ? "bg-[var(--color-accent)] font-medium text-white"
                    : cell.inMonth
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-faint)]",
                ].join(" ")}
              >
                <time dateTime={cell.key}>{cell.date.getDate()}</time>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
