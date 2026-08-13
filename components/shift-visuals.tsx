"use client";

import { HOUR_HEIGHT } from "@/lib/layout";
import { formatHour, formatShiftTime } from "@/lib/types";
import type { ShiftView } from "@/lib/view-model";

function ownershipMark(view: ShiftView) {
  if (view.isPending) return "•";
  if (view.isMine) return "★";
  return null;
}

/** Compact one-line entry used inside month cells. */
export function ShiftChip({
  view,
  selected,
  onSelect,
}: {
  view: ShiftView;
  selected: boolean;
  onSelect: () => void;
}) {
  const { shift, person, color, isOpen } = view;
  const mark = ownershipMark(view);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      title={`${formatShiftTime(shift)} · ${shift.discipline} · ${person?.name ?? "Open shift"} · ${shift.unit}`}
      className={[
        "flex w-full items-center gap-1 rounded-[3px] px-1 py-[2px] text-left text-[10.5px] leading-tight transition",
        isOpen ? "border border-dashed" : "border border-transparent",
        selected ? "ring-2 ring-[var(--color-cardinal)]" : "",
      ].join(" ")}
      style={{
        backgroundColor: color.fill,
        borderColor: isOpen ? color.bar : "transparent",
        color: color.text,
      }}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: color.bar }}
      />
      <span className="shrink-0 tabular-nums opacity-80">
        {formatHour(shift.startHour)}
      </span>
      <span className="truncate font-medium">
        {isOpen ? `Open · ${shift.discipline}` : person?.name}
      </span>
      {mark ? <span className="ml-auto shrink-0">{mark}</span> : null}
    </button>
  );
}

/** Absolutely positioned block used in the week and day hour grids. */
export function ShiftBlock({
  view,
  lane,
  laneCount,
  selected,
  onSelect,
}: {
  view: ShiftView;
  lane: number;
  laneCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { shift, person, color, isOpen } = view;
  const duration = shift.endHour - shift.startHour;
  const mark = ownershipMark(view);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      aria-label={`${isOpen ? "Open shift" : person?.name}, ${shift.discipline}, ${shift.unit}, ${formatShiftTime(shift)}`}
      className={[
        "pointer-events-auto absolute overflow-hidden rounded-[4px] px-1.5 py-1 text-left transition",
        isOpen ? "border border-dashed" : "border-l-[3px] border-y border-r",
        selected ? "z-20 ring-2 ring-[var(--color-cardinal)]" : "z-10",
      ].join(" ")}
      style={{
        top: shift.startHour * HOUR_HEIGHT + 1,
        height: duration * HOUR_HEIGHT - 2,
        left: `calc(${(lane / laneCount) * 100}% + 2px)`,
        width: `calc(${100 / laneCount}% - 4px)`,
        backgroundColor: color.fill,
        borderColor: color.bar,
        color: color.text,
      }}
    >
      <span className="block truncate text-[11px] font-semibold leading-tight">
        {isOpen ? "Open shift" : person?.name}
        {mark ? <span className="ml-1 font-normal">{mark}</span> : null}
      </span>
      <span className="block truncate text-[10px] leading-tight opacity-85">
        {shift.discipline} · {shift.unit}
      </span>
      {duration >= 3 ? (
        <span className="block truncate text-[10px] leading-tight tabular-nums opacity-75">
          {formatShiftTime(shift)}
        </span>
      ) : null}
    </button>
  );
}
