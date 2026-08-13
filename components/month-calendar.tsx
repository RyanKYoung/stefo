"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

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

/** The clock never notifies us, so nothing to subscribe to. */
const noopSubscribe = () => () => {};

export function MonthCalendar({ serverToday }: { serverToday: string }) {
  // The server renders its own date (UTC on Render) and the browser renders the
  // staff member's local one. useSyncExternalStore is built for exactly this
  // split: React hydrates with the server snapshot, then swaps in the client's
  // without a cascading setState-in-effect.
  const todayKey = useSyncExternalStore(
    noopSubscribe,
    () => toDateKey(startOfDay(new Date())),
    () => serverToday,
  );
  const today = useMemo(() => parseDateKey(todayKey), [todayKey]);

  // Null means "follow today" — so the view lands on the right month even when
  // hydration corrects the date across a timezone boundary.
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const viewMonth = monthOverride
    ? parseDateKey(monthOverride)
    : firstOfMonth(today);

  const stepMonth = (delta: number) =>
    setMonthOverride(toDateKey(addMonths(viewMonth, delta)));

  const cells = useMemo(
    () => buildMonthGrid(viewMonth, today),
    [viewMonth, today],
  );

  const showingCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-6">
        <h2 className="text-[21px] leading-none font-semibold tracking-tight text-[var(--color-ink)] tabular-nums">
          {monthLabel(viewMonth)}
        </h2>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthOverride(null)}
            disabled={showingCurrentMonth}
            className="rounded-md border border-[var(--color-line-strong)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)] disabled:cursor-default disabled:border-[var(--color-line)] disabled:text-[var(--color-ink-faint)]"
          >
            Today
          </button>

          <div className="flex items-center rounded-md border border-[var(--color-line-strong)]">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => stepMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-l-md text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M15 5l-7 7 7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="h-4 w-px bg-[var(--color-line)]" aria-hidden="true" />
            <button
              type="button"
              aria-label="Next month"
              onClick={() => stepMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-r-md text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-y border-[var(--color-line)] bg-[var(--color-surface-muted)]">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={[
              "py-2 text-center text-[11px] font-semibold tracking-[0.06em]",
              index === 0 || index === 6
                ? "text-[var(--color-ink-faint)]"
                : "text-[var(--color-ink-muted)]",
            ].join(" ")}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {cells.map((cell) => (
          <div
            key={cell.key}
            aria-current={cell.isToday ? "date" : undefined}
            className={[
              "group relative min-h-[88px] border-r border-b border-[var(--color-line)] px-1.5 pt-1.5 transition-colors [&:nth-child(7n)]:border-r-0",
              cell.isToday
                ? "bg-[var(--color-cardinal-soft)]"
                : !cell.inMonth
                  ? "bg-[var(--color-surface-sunken)]"
                  : cell.isWeekend
                    ? "bg-[var(--color-surface-muted)]"
                    : "bg-[var(--color-surface)]",
            ].join(" ")}
          >
            {/* Cardinal edge marks today's column without tinting the whole cell twice. */}
            {cell.isToday ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px] bg-[var(--color-cardinal)]"
              />
            ) : null}

            <div className="flex justify-center">
              <span
                className={[
                  "flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[12px] leading-none tabular-nums",
                  cell.isToday
                    ? "bg-[var(--color-cardinal)] font-bold text-white"
                    : cell.inMonth
                      ? "font-medium text-[var(--color-ink)]"
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
