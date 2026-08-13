"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  addDays,
  addMonths,
  dayLabel,
  monthLabel,
  parseDateKey,
  startOfDay,
  toDateKey,
  weekDays,
  weekLabel,
} from "@/lib/calendar";
import type { Discipline, Shift, Staff } from "@/lib/types";
import { buildShiftViews, viewsByDate } from "@/lib/view-model";

import { HourGrid, type HourSelection } from "./hour-grid";
import { MonthView } from "./month-view";
import { ShiftPanel } from "./shift-panel";
import { Sidebar } from "./sidebar";

export type CalendarView = "month" | "week" | "day";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

/** The clock never notifies us, so nothing to subscribe to. */
const noopSubscribe = () => () => {};

export function CalendarWorkspace({
  view,
  dateKey,
  serverToday,
  shifts,
  roster,
  currentStaff,
  pendingShiftIds,
  totalHours,
  rangeLabel,
}: {
  view: CalendarView;
  dateKey: string;
  serverToday: string;
  shifts: Shift[];
  roster: Staff[];
  currentStaff: Staff;
  pendingShiftIds: string[];
  totalHours: number;
  rangeLabel: string;
}) {
  const router = useRouter();

  // The server renders a UTC date; the browser knows the staff member's local
  // one. Highlighting and the Today button follow the browser.
  const todayKey = useSyncExternalStore(
    noopSubscribe,
    () => toDateKey(startOfDay(new Date())),
    () => serverToday,
  );

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<HourSelection>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<Discipline | "all">(
    "all",
  );

  const focus = parseDateKey(dateKey);
  const pendingSet = useMemo(
    () => new Set(pendingShiftIds),
    [pendingShiftIds],
  );

  const views = useMemo(
    () => buildShiftViews(shifts, roster, currentStaff.id, pendingSet),
    [shifts, roster, currentStaff.id, pendingSet],
  );
  const byDate = useMemo(() => viewsByDate(views), [views]);
  const openShifts = useMemo(
    () =>
      views
        .filter((item) => item.isOpen)
        .sort(
          (a, b) =>
            a.shift.date.localeCompare(b.shift.date) ||
            a.shift.startHour - b.shift.startHour,
        ),
    [views],
  );

  const selectedShift =
    views.find((item) => item.shift.id === selectedShiftId) ?? null;

  const go = (nextView: CalendarView, nextDate: string) => {
    router.push(`/calendar?view=${nextView}&date=${nextDate}`);
  };

  const step = (delta: number) => {
    const next =
      view === "month"
        ? addMonths(focus, delta)
        : addDays(focus, delta * (view === "week" ? 7 : 1));
    go(view, toDateKey(next));
  };

  const title =
    view === "month"
      ? monthLabel(focus)
      : view === "week"
        ? weekLabel(focus)
        : dayLabel(focus);

  const showingToday =
    view === "month"
      ? focus.getFullYear() === parseDateKey(todayKey).getFullYear() &&
        focus.getMonth() === parseDateKey(todayKey).getMonth()
      : view === "week"
        ? weekDays(focus).some((day) => toDateKey(day) === todayKey)
        : dateKey === todayKey;

  const handleSelectShift = (shiftId: string) => {
    setSelectedShiftId((current) => (current === shiftId ? null : shiftId));
  };

  return (
    <div className="flex min-h-0 flex-1">
      <Sidebar
        roster={roster}
        currentStaff={currentStaff}
        openShifts={openShifts}
        disciplineFilter={disciplineFilter}
        onDisciplineFilter={setDisciplineFilter}
        selectedShiftId={selectedShiftId}
        onSelectShift={handleSelectShift}
        totalHours={totalHours}
        rangeLabel={rangeLabel}
      />

      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <h2 className="text-[19px] leading-none font-semibold tracking-tight text-[var(--color-ink)]">
            {title}
          </h2>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(view, todayKey)}
              disabled={showingToday}
              className="rounded-md border border-[var(--color-line-strong)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)] disabled:cursor-default disabled:border-[var(--color-line)] disabled:text-[var(--color-ink-faint)]"
            >
              Today
            </button>

            <div className="flex items-center rounded-md border border-[var(--color-line-strong)]">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => step(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-l-md text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="h-4 w-px bg-[var(--color-line)]" aria-hidden="true" />
              <button
                type="button"
                aria-label="Next"
                onClick={() => step(1)}
                className="flex h-8 w-8 items-center justify-center rounded-r-md text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div
              role="group"
              aria-label="Calendar view"
              className="flex items-center overflow-hidden rounded-md border border-[var(--color-line-strong)]"
            >
              {VIEWS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={view === option.id}
                  onClick={() => go(option.id, dateKey)}
                  className={[
                    "px-3 py-1.5 text-[13px] font-medium transition",
                    view === option.id
                      ? "bg-[var(--color-cardinal)] text-white"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "month" ? (
          <MonthView
            viewMonth={focus}
            todayKey={todayKey}
            viewsByDate={byDate}
            selectedDateKey={selectedDateKey}
            selectedShiftId={selectedShiftId}
            onSelectDay={(key) =>
              setSelectedDateKey((current) => (current === key ? null : key))
            }
            onSelectShift={handleSelectShift}
          />
        ) : (
          <HourGrid
            days={view === "week" ? weekDays(focus) : [focus]}
            viewsByDate={byDate}
            todayKey={todayKey}
            selectedDateKey={selectedDateKey}
            selectedHour={selectedHour}
            selectedShiftId={selectedShiftId}
            onSelectDay={(key) =>
              setSelectedDateKey((current) => (current === key ? null : key))
            }
            onSelectHour={(key, hour) =>
              setSelectedHour((current) =>
                current?.dateKey === key && current.hour === hour
                  ? null
                  : { dateKey: key, hour },
              )
            }
            onSelectShift={handleSelectShift}
          />
        )}
      </div>

      {selectedShift ? (
        <ShiftPanel
          view={selectedShift}
          onClose={() => setSelectedShiftId(null)}
        />
      ) : null}
    </div>
  );
}
