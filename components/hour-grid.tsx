"use client";

import { useCallback, useRef, type CSSProperties } from "react";

import { HOUR_HEIGHT, assignLanes } from "@/lib/layout";
import { toDateKey } from "@/lib/calendar";
import { formatHour } from "@/lib/types";
import type { ShiftView } from "@/lib/view-model";

import { ShiftBlock } from "./shift-visuals";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/**
 * Touch-width floors, applied below lg only. A day view divides its column by
 * the day's lane count, so ten overlapping shifts on a phone left each block
 * about 40px — enough for one letter and an ellipsis. Rather than shrink
 * further, the grid scrolls sideways and every block stays readable.
 */
const MIN_LANE_WIDTH = 116;
/** A week shows shape rather than names, so its columns need less. */
const MIN_DAY_WIDTH = 108;

export type HourSelection = { dateKey: string; hour: number } | null;

/**
 * The scrollable 24-hour grid behind both the week view (seven columns) and the
 * day view (one). Shifts are absolutely positioned by hour and packed into
 * lanes so overlapping blocks stay readable.
 */
export function HourGrid({
  days,
  viewsByDate,
  todayKey,
  selectedDateKey,
  selectedHour,
  selectedShiftId,
  onSelectDay,
  onSelectHour,
  onSelectShift,
}: {
  days: Date[];
  viewsByDate: Map<string, ShiftView[]>;
  todayKey: string;
  selectedDateKey: string | null;
  selectedHour: HourSelection;
  selectedShiftId: string | null;
  onSelectDay: (dateKey: string) => void;
  onSelectHour: (dateKey: string, hour: number) => void;
  onSelectShift: (shiftId: string) => void;
}) {
  const scrolledOnce = useRef(false);

  /*
   * Open on the morning handover rather than at midnight — 24 hours of empty
   * night is not where anyone starts reading a hospital schedule.
   *
   * A callback ref rather than an effect: it runs the moment the node is
   * attached, and retries on the next frame in case the grid hasn't been laid
   * out yet (setting scrollTop before then is silently ignored). The guard
   * keeps it to first mount, so changing week doesn't yank the reader's
   * scroll position back to 6 AM.
   */
  const attachScroller = useCallback((node: HTMLDivElement | null) => {
    if (!node || scrolledOnce.current) return;

    const target = 6 * HOUR_HEIGHT;
    node.scrollTop = target;
    if (node.scrollTop === target) {
      scrolledOnce.current = true;
      return;
    }

    requestAnimationFrame(() => {
      node.scrollTop = target;
      scrolledOnce.current = true;
    });
  }, []);

  /*
   * Lanes are packed once and shared, because the header and the body have to
   * agree on how wide each column is or the two fall out of alignment as soon
   * as the grid scrolls sideways.
   */
  const isSingleDay = days.length === 1;
  const columns = days.map((day) => {
    const key = toDateKey(day);
    const dayViews = viewsByDate.get(key) ?? [];
    const { placed, laneCount } = assignLanes(dayViews.map((view) => view.shift));
    return {
      day,
      key,
      dayViews,
      placed,
      laneCount,
      style: {
        "--col-min": `${isSingleDay ? laneCount * MIN_LANE_WIDTH : MIN_DAY_WIDTH}px`,
      } as CSSProperties,
    };
  });

  const columnWidth = "min-w-[var(--col-min)] lg:min-w-0";

  return (
    /*
     * One scroller for both axes. Splitting them does not work: a child with
     * `overflow-y: auto` has its `overflow-x` computed to `auto` as well, which
     * makes it the nearest horizontal scrolling ancestor and leaves a
     * `sticky left-0` gutter anchored to a container that never scrolls — the
     * hour labels slide away with the content. With a single scroller the
     * header sticks to the top and the gutter to the left, against the same
     * box.
     */
    <div ref={attachScroller} className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-max lg:min-w-0">
        <div className="sticky top-0 z-30 flex border-b border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="sticky left-0 z-40 w-14 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-surface)]" />
          {columns.map(({ day, key, style }) => {
            const isToday = key === todayKey;
            const isSelected = key === selectedDateKey;
            return (
              <button
                key={key}
                type="button"
                style={style}
                onClick={() => onSelectDay(key)}
                aria-label={day.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={[
                  "flex flex-1 flex-col items-center gap-0.5 border-r border-[var(--color-line)] py-2 transition last:border-r-0",
                  columnWidth,
                  isSelected
                    ? "bg-[var(--color-cardinal-soft)]"
                    : "hover:bg-[var(--color-surface-muted)]",
                ].join(" ")}
              >
                <span className="text-[10.5px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
                  {day
                    .toLocaleDateString(undefined, { weekday: "short" })
                    .toUpperCase()}
                </span>
                <span
                  className={[
                    "flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[15px] tabular-nums",
                    isToday
                      ? "bg-[var(--color-cardinal)] font-bold text-white"
                      : "font-medium text-[var(--color-ink)]",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-surface)]">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-1.5 -translate-y-1/2 text-[10.5px] tabular-nums text-[var(--color-ink-faint)]"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                {hour === 0 ? "" : formatHour(hour)}
              </div>
            ))}
          </div>

          {columns.map(({ day, key, dayViews, placed, laneCount, style }) => {
            const viewById = new Map(
              dayViews.map((view) => [view.shift.id, view]),
            );

            return (
              <div
                key={key}
                style={style}
                className={[
                  "relative flex-1 border-r border-[var(--color-line)] last:border-r-0",
                  columnWidth,
                ].join(" ")}
              >
                {HOURS.map((hour) => {
                  const isSelected =
                    selectedHour?.dateKey === key && selectedHour.hour === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      aria-label={`${formatHour(hour)} on ${day.toLocaleDateString()}`}
                      aria-pressed={isSelected}
                      onClick={() => onSelectHour(key, hour)}
                      className={[
                        "absolute inset-x-0 border-b border-[var(--color-line)] transition-colors",
                        isSelected
                          ? "bg-[var(--color-cardinal-soft)] ring-1 ring-inset ring-[var(--color-cardinal)]"
                          : "hover:bg-[var(--color-surface-muted)]",
                      ].join(" ")}
                      style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    />
                  );
                })}

                {/*
                  Blocks live in a strip inset from the left, leaving a column
                  of bare grid that always takes a click. Without it a fully
                  staffed day covers every hour cell and picking an hour becomes
                  impossible. `pointer-events-none` on the strip keeps the gaps
                  between blocks clickable too. The strip is wider on touch,
                  where 12px is not a target a fingertip can find.
                */}
                <div className="pointer-events-none absolute inset-y-0 right-0 left-7 lg:left-3">
                  {placed.map(({ shift, lane }) => {
                    const view = viewById.get(shift.id);
                    if (!view) return null;
                    return (
                      <ShiftBlock
                        key={shift.id}
                        view={view}
                        lane={lane}
                        laneCount={laneCount}
                        selected={shift.id === selectedShiftId}
                        onSelect={() => onSelectShift(shift.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
