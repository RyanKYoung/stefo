"use client";

import { WEEKDAY_LABELS, buildMonthGrid, parseDateKey } from "@/lib/calendar";
import type { ShiftView } from "@/lib/view-model";

import { ShiftChip } from "./shift-visuals";

/** Chips shown before a cell collapses the rest into a "+N more" line. */
const MAX_CHIPS = 3;

/** Dots shown in a phone-width cell before the rest becomes a "+N". */
const MAX_DOTS = 6;

export function MonthView({
  viewMonth,
  todayKey,
  viewsByDate,
  selectedDateKey,
  selectedShiftId,
  onSelectDay,
  onSelectShift,
  onOpenDay,
}: {
  viewMonth: Date;
  todayKey: string;
  viewsByDate: Map<string, ShiftView[]>;
  selectedDateKey: string | null;
  selectedShiftId: string | null;
  onSelectDay: (dateKey: string) => void;
  onSelectShift: (shiftId: string) => void;
  /** Phone-width cells hand off to the day view instead of naming everyone. */
  onOpenDay: (dateKey: string) => void;
}) {
  const cells = buildMonthGrid(viewMonth, parseDateKey(todayKey));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)]">
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid h-full min-h-[420px] grid-cols-7 grid-rows-6 lg:min-h-[560px]">
          {cells.map((cell) => {
            const dayViews = viewsByDate.get(cell.key) ?? [];
            const visible = dayViews.slice(0, MAX_CHIPS);
            const overflow = dayViews.length - visible.length;
            const ordered = [...dayViews].sort(
              (a, b) => Number(b.isMine) - Number(a.isMine),
            );
            const dots = ordered.slice(0, MAX_DOTS);
            const dotOverflow = dayViews.length - dots.length;
            const isSelected = cell.key === selectedDateKey;

            return (
              <div
                key={cell.key}
                role="gridcell"
                aria-current={cell.isToday ? "date" : undefined}
                aria-selected={isSelected}
                onClick={() => onSelectDay(cell.key)}
                className={[
                  "relative flex min-h-[68px] cursor-pointer flex-col gap-[2px] border-r border-b border-[var(--color-line)] px-1 pt-1 pb-1 transition-colors lg:min-h-[104px] [&:nth-child(7n)]:border-r-0",
                  isSelected
                    ? "bg-[var(--color-cardinal-soft)] ring-1 ring-inset ring-[var(--color-cardinal)]"
                    : cell.isToday
                      ? "bg-[var(--color-cardinal-soft)]"
                      : !cell.inMonth
                        ? "bg-[var(--color-surface-sunken)]"
                        : cell.isWeekend
                          ? "bg-[var(--color-surface-muted)]"
                          : "bg-[var(--color-surface)]",
                ].join(" ")}
              >
                {cell.isToday && !isSelected ? (
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

                {/*
                  A phone gives each column about 53px, where a chip truncates
                  to nothing but its start time. Below lg the cell shows how
                  busy the day is and who is on it by colour, and hands off to
                  the day view for the detail.
                */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay(cell.key);
                  }}
                  aria-label={`${dayViews.length} ${dayViews.length === 1 ? "shift" : "shifts"} on ${cell.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} — open day view`}
                  className="flex flex-1 flex-wrap content-start items-start gap-[3px] px-0.5 pt-0.5 lg:hidden"
                >
                  {dots.map((view) => (
                    <span
                      key={view.shift.id}
                      aria-hidden="true"
                      className={[
                        "h-[6px] w-[6px] rounded-full",
                        view.isMine
                          ? "ring-[1.5px] ring-[var(--color-ink)] ring-offset-1"
                          : "",
                      ].join(" ")}
                      style={{
                        backgroundColor: view.isOpen
                          ? "transparent"
                          : view.color.bar,
                        boxShadow: view.isOpen
                          ? `inset 0 0 0 1.5px ${view.color.bar}`
                          : undefined,
                      }}
                    />
                  ))}
                  {dotOverflow > 0 ? (
                    <span className="text-[9px] leading-[6px] font-medium text-[var(--color-ink-muted)]">
                      +{dotOverflow}
                    </span>
                  ) : null}
                </button>

                <div className="hidden flex-col gap-[2px] overflow-hidden lg:flex">
                  {visible.map((view) => (
                    <ShiftChip
                      key={view.shift.id}
                      view={view}
                      selected={view.shift.id === selectedShiftId}
                      onSelect={() => onSelectShift(view.shift.id)}
                    />
                  ))}
                  {overflow > 0 ? (
                    <span className="px-1 text-[10px] font-medium text-[var(--color-ink-muted)]">
                      +{overflow} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
