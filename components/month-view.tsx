"use client";

import { WEEKDAY_LABELS, buildMonthGrid, parseDateKey } from "@/lib/calendar";
import type { ShiftView } from "@/lib/view-model";

import { ShiftChip } from "./shift-visuals";

/** Chips shown before a cell collapses the rest into a "+N more" line. */
const MAX_CHIPS = 3;

export function MonthView({
  viewMonth,
  todayKey,
  viewsByDate,
  selectedDateKey,
  selectedShiftId,
  onSelectDay,
  onSelectShift,
}: {
  viewMonth: Date;
  todayKey: string;
  viewsByDate: Map<string, ShiftView[]>;
  selectedDateKey: string | null;
  selectedShiftId: string | null;
  onSelectDay: (dateKey: string) => void;
  onSelectShift: (shiftId: string) => void;
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
        <div className="grid h-full min-h-[560px] grid-cols-7 grid-rows-6">
          {cells.map((cell) => {
            const dayViews = viewsByDate.get(cell.key) ?? [];
            const visible = dayViews.slice(0, MAX_CHIPS);
            const overflow = dayViews.length - visible.length;
            const isSelected = cell.key === selectedDateKey;

            return (
              <div
                key={cell.key}
                role="gridcell"
                aria-current={cell.isToday ? "date" : undefined}
                aria-selected={isSelected}
                onClick={() => onSelectDay(cell.key)}
                className={[
                  "relative flex min-h-[104px] cursor-pointer flex-col gap-[2px] border-r border-b border-[var(--color-line)] px-1 pt-1 pb-1 transition-colors [&:nth-child(7n)]:border-r-0",
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

                <div className="flex flex-col gap-[2px] overflow-hidden">
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
