import type { Shift } from "./types";

export type PlacedShift = { shift: Shift; lane: number };

/**
 * Packs a day's shifts into side-by-side lanes so overlapping blocks don't
 * cover each other. Greedy interval partitioning: each shift takes the first
 * lane that's free at its start hour.
 *
 * `laneCount` is the day's maximum, applied to every block, which keeps column
 * widths uniform down the day rather than jumping around mid-morning.
 */
export function assignLanes(shifts: Shift[]): {
  placed: PlacedShift[];
  laneCount: number;
} {
  const sorted = [...shifts].sort(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour,
  );

  const laneEnds: number[] = [];
  const placed = sorted.map((shift) => {
    let lane = laneEnds.findIndex((end) => end <= shift.startHour);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(shift.endHour);
    } else {
      laneEnds[lane] = shift.endHour;
    }
    return { shift, lane };
  });

  return { placed, laneCount: Math.max(1, laneEnds.length) };
}

export function groupByDate(shifts: Shift[]): Map<string, Shift[]> {
  const map = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const list = map.get(shift.date) ?? [];
    list.push(shift);
    map.set(shift.date, list);
  }
  return map;
}

/** Row height for the hour grid in week and day views, in pixels. */
export const HOUR_HEIGHT = 48;
