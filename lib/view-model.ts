import { OPEN_SHIFT_COLOR, staffColor, type StaffColor } from "./palette";
import type { Shift, Staff } from "./types";

export type ShiftView = {
  shift: Shift;
  person: Staff | null;
  color: StaffColor;
  /** Held by the signed-in user. */
  isMine: boolean;
  /** No one holds it. */
  isOpen: boolean;
  /** The signed-in user has a claim awaiting approval. */
  isPending: boolean;
};

export function buildShiftViews(
  shifts: Shift[],
  roster: Staff[],
  currentStaffId: string,
  pendingShiftIds: Set<string>,
): ShiftView[] {
  const byId = new Map(roster.map((person) => [person.id, person]));

  return shifts.map((shift) => {
    const person = shift.staffId ? (byId.get(shift.staffId) ?? null) : null;
    return {
      shift,
      person,
      color: person ? staffColor(person.colorIndex) : OPEN_SHIFT_COLOR,
      isMine: shift.staffId === currentStaffId,
      isOpen: shift.staffId === null,
      isPending: pendingShiftIds.has(shift.id),
    };
  });
}

export function viewsByDate(views: ShiftView[]): Map<string, ShiftView[]> {
  const map = new Map<string, ShiftView[]>();
  for (const view of views) {
    const list = map.get(view.shift.date) ?? [];
    list.push(view);
    map.set(view.shift.date, list);
  }
  return map;
}
