"use client";

import { parseDateKey } from "@/lib/calendar";
import { staffColor } from "@/lib/palette";
import { DISCIPLINES, DISCIPLINE_LABELS, formatShiftTime, type Discipline, type Staff } from "@/lib/types";
import type { ShiftView } from "@/lib/view-model";

export function Sidebar({
  open,
  onClose,
  roster,
  currentStaff,
  openShifts,
  disciplineFilter,
  onDisciplineFilter,
  selectedShiftId,
  onSelectShift,
  totalHours,
  rangeLabel,
}: {
  /** Drawer state below `lg`; ignored once the sidebar is a static column. */
  open: boolean;
  onClose: () => void;
  roster: Staff[];
  currentStaff: Staff;
  openShifts: ShiftView[];
  disciplineFilter: Discipline | "all";
  onDisciplineFilter: (value: Discipline | "all") => void;
  selectedShiftId: string | null;
  onSelectShift: (shiftId: string) => void;
  totalHours: number;
  rangeLabel: string;
}) {
  const filtered =
    disciplineFilter === "all"
      ? openShifts
      : openShifts.filter((view) => view.shift.discipline === disciplineFilter);

  return (
    <aside
      aria-hidden={undefined}
      className={[
        // Below lg the roster is a slide-over: 240px of fixed column would be
        // two thirds of a phone screen, leaving the calendar unreadable.
        "fixed inset-y-0 left-0 z-40 flex w-[17rem] max-w-[85vw] flex-col border-r border-[var(--color-line)] bg-[var(--color-surface-muted)] shadow-xl transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full",
        // From lg it is the plain column it has always been.
        "lg:static lg:z-auto lg:w-60 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:transition-none",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-3 py-2 lg:hidden">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
          STAFF &amp; OPEN SHIFTS
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close staff panel"
          className="-mr-1 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink-muted)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="px-3 py-3">
          <h2 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
            STAFF
          </h2>
          <ul className="flex flex-col">
            {roster.map((person) => {
              const color = staffColor(person.colorIndex);
              const isMe = person.id === currentStaff.id;
              return (
                <li key={person.id}>
                  <div
                    className={[
                      "flex items-center gap-2 rounded px-1.5 py-1",
                      isMe ? "bg-[var(--color-surface)]" : "",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color.bar }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--color-ink)]">
                      {person.name}
                      {isMe ? (
                        <span className="ml-1 text-[var(--color-ink-faint)]">
                          (you)
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[10.5px] font-medium text-[var(--color-ink-faint)]">
                      {person.discipline}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-[var(--color-line)] px-3 py-3">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-[11px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
              OPEN SHIFTS
            </h2>
            <span className="text-[11px] tabular-nums text-[var(--color-ink-faint)]">
              {filtered.length}
            </span>
          </div>

          <label className="sr-only" htmlFor="discipline-filter">
            Filter open shifts by specialty
          </label>
          <select
            id="discipline-filter"
            value={disciplineFilter}
            onChange={(event) =>
              onDisciplineFilter(event.target.value as Discipline | "all")
            }
            className="mb-2 w-full rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-2 py-2.5 text-[16px] text-[var(--color-ink)] lg:py-1.5 lg:text-[12px] outline-none focus:border-[var(--color-cardinal)]"
          >
            <option value="all">All specialties</option>
            {DISCIPLINES.map((discipline) => (
              <option key={discipline} value={discipline}>
                {discipline} — {DISCIPLINE_LABELS[discipline]}
              </option>
            ))}
          </select>

          {filtered.length === 0 ? (
            <p className="px-1 py-2 text-[12px] leading-snug text-[var(--color-ink-faint)]">
              No open shifts in this view.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((view) => {
                const date = parseDateKey(view.shift.date);
                const selected = view.shift.id === selectedShiftId;
                return (
                  <li key={view.shift.id}>
                    <button
                      type="button"
                      onClick={() => onSelectShift(view.shift.id)}
                      className={[
                        "w-full rounded border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface)] px-2 py-1.5 text-left transition hover:border-[var(--color-cardinal)]",
                        selected
                          ? "border-solid ring-2 ring-[var(--color-cardinal)]"
                          : "",
                      ].join(" ")}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold text-[var(--color-ink)]">
                          {view.shift.discipline}
                        </span>
                        <span className="text-[10.5px] tabular-nums text-[var(--color-ink-muted)]">
                          {date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] tabular-nums text-[var(--color-ink-muted)]">
                        {formatShiftTime(view.shift)}
                      </span>
                      <span className="block truncate text-[10.5px] text-[var(--color-ink-faint)]">
                        {view.shift.unit}
                        {view.isPending ? " · requested" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Deliberately quiet: useful to glance at, not a headline number. */}
      <div className="shrink-0 border-t border-[var(--color-line)] px-4 py-2">
        <p className="text-[10.5px] leading-tight text-[var(--color-ink-faint)]">
          {rangeLabel} ·{" "}
          <span className="tabular-nums">{totalHours}h</span> scheduled
        </p>
      </div>
    </aside>
  );
}
