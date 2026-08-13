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

  // Only meaningful below lg, where the roster is a slide-over.
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Picking an open shift out of the drawer should reveal the sheet it opens,
  // not leave it hidden behind the roster.
  const handleSelectShiftFromSidebar = (shiftId: string) => {
    handleSelectShift(shiftId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-1">
      {sidebarOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      ) : null}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roster={roster}
        currentStaff={currentStaff}
        openShifts={openShifts}
        disciplineFilter={disciplineFilter}
        onDisciplineFilter={setDisciplineFilter}
        selectedShiftId={selectedShiftId}
        onSelectShift={handleSelectShiftFromSidebar}
        totalHours={totalHours}
        rangeLabel={rangeLabel}
      />

      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        {/*
          The control cluster is 321px and cannot break internally, so on a
          phone it gave the row a 577px min-width and pushed the calendar off
          screen. Title and Today hold the first row; stepper and view switcher
          take a full-width second row until lg, where it is one row again.
        */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Show staff and open shifts"
            aria-expanded={sidebarOpen}
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-muted)] lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <h2 className="min-w-0 flex-1 truncate text-[17px] leading-tight font-semibold tracking-tight text-[var(--color-ink)] sm:text-[19px]">
            {title}
          </h2>

          <button
            type="button"
            onClick={() => go(view, todayKey)}
            disabled={showingToday}
            className="shrink-0 rounded-md border border-[var(--color-line-strong)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)] disabled:cursor-default disabled:border-[var(--color-line)] disabled:text-[var(--color-ink-faint)] lg:py-1.5"
          >
            Today
          </button>

          <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:justify-end">
            <div className="flex items-center rounded-md border border-[var(--color-line-strong)]">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => step(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-l-md lg:h-8 lg:w-8 text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
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
                className="flex h-11 w-11 items-center justify-center rounded-r-md lg:h-8 lg:w-8 text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-cardinal)]"
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
                    "px-3 py-2.5 text-[13px] font-medium transition lg:py-1.5",
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
            onOpenDay={(key) => go("day", key)}
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
        <>
          <div
            aria-hidden="true"
            onClick={() => setSelectedShiftId(null)}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />
          <ShiftPanel
            view={selectedShift}
            onClose={() => setSelectedShiftId(null)}
          />
        </>
      ) : null}
    </div>
  );
}
