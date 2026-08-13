/**
 * SERVER-ONLY in-memory store. Import from server components and server
 * actions only — never from a client component.
 *
 * Everything here lives in process memory, so it resets whenever the server
 * restarts (which on Render's free plan means after each idle spin-down). That
 * is fine for a demo and deliberately temporary: this whole module is what the
 * Supabase tables replace. See "Switching on Supabase auth" in README.md.
 */
import { eachDateKey, parseDateKey } from "./calendar";
import { ROSTER } from "./roster";
import { seedShiftsForDate } from "./seed";
import type { Shift, Staff, TradeRequest, TradeStatus } from "./types";

type Store = {
  /** Shift id -> who holds it now, when it differs from the seeded value. */
  assignments: Map<string, string | null>;
  /** Date key -> shifts from an uploaded CSV, replacing the demo day entirely. */
  uploaded: Map<string, Shift[]>;
  /** Staff introduced by a CSV upload, appended to the demo roster. */
  extraStaff: Staff[];
  trades: TradeRequest[];
  counter: number;
};

function createStore(): Store {
  return {
    assignments: new Map(),
    uploaded: new Map(),
    extraStaff: [],
    trades: [],
    counter: 0,
  };
}

// Stashed on globalThis so dev hot-reloads don't wipe state mid-session.
const globalRef = globalThis as typeof globalThis & { __stefoStore?: Store };
const store: Store = (globalRef.__stefoStore ??= createStore());

export function getRoster(): Staff[] {
  return [...ROSTER, ...store.extraStaff];
}

function shiftsForDate(dateKey: string): Shift[] {
  const base = store.uploaded.get(dateKey) ?? seedShiftsForDate(dateKey);
  return base.map((shift) =>
    store.assignments.has(shift.id)
      ? { ...shift, staffId: store.assignments.get(shift.id) ?? null }
      : shift,
  );
}

export function getShiftsForDates(dateKeys: string[]): Shift[] {
  return dateKeys.flatMap(shiftsForDate);
}

export function getShiftsInRange(start: Date, end: Date): Shift[] {
  return getShiftsForDates(eachDateKey(start, end));
}

export function getShift(shiftId: string): Shift | null {
  const dateKey = shiftId.split("#")[0];
  if (!dateKey) return null;
  return shiftsForDate(dateKey).find((shift) => shift.id === shiftId) ?? null;
}

/** Total scheduled hours for one person across a date range. */
export function totalHoursFor(staffId: string, start: Date, end: Date) {
  return getShiftsInRange(start, end)
    .filter((shift) => shift.staffId === staffId)
    .reduce((sum, shift) => sum + (shift.endHour - shift.startHour), 0);
}

/* ---------------------------------------------------------------- mutations */

export type TradeOutcome =
  | { ok: true; message: string }
  | { ok: false; message: string };

/** Hands a shift back to the open pool. Only the holder may do this. */
export function releaseShift(shiftId: string, staffId: string): TradeOutcome {
  const shift = getShift(shiftId);
  if (!shift) return { ok: false, message: "That shift no longer exists." };
  if (shift.staffId !== staffId) {
    return { ok: false, message: "You can only open up your own shifts." };
  }

  store.assignments.set(shiftId, null);
  // Any pending bids on this shift are moot once it's open to everyone.
  for (const trade of store.trades) {
    if (trade.shiftId === shiftId && trade.status === "pending") {
      trade.status = "denied";
    }
  }
  return { ok: true, message: "Shift opened for taking." };
}

/**
 * Raises a claim on a shift. Claims don't take effect immediately — an admin
 * approves them, which is what makes this a trade rather than a free-for-all.
 */
export function requestShift(shiftId: string, requesterId: string): TradeOutcome {
  const shift = getShift(shiftId);
  if (!shift) return { ok: false, message: "That shift no longer exists." };
  if (shift.staffId === requesterId) {
    return { ok: false, message: "That shift is already yours." };
  }

  const duplicate = store.trades.some(
    (trade) =>
      trade.shiftId === shiftId &&
      trade.requesterId === requesterId &&
      trade.status === "pending",
  );
  if (duplicate) {
    return { ok: false, message: "You've already asked for this shift." };
  }

  store.trades.push({
    id: `t${++store.counter}`,
    shiftId,
    requesterId,
    fromStaffId: shift.staffId,
    createdAt: new Date().toISOString(),
    status: "pending",
  });

  return {
    ok: true,
    message: shift.staffId
      ? "Request sent — an administrator will review the trade."
      : "Request sent — an administrator will confirm the open shift.",
  };
}

export function listTrades(status?: TradeStatus): TradeRequest[] {
  const trades = status
    ? store.trades.filter((trade) => trade.status === status)
    : store.trades;
  return [...trades].reverse();
}

export function pendingTradeCount() {
  return store.trades.filter((trade) => trade.status === "pending").length;
}

/** Pending claims by this person, so the UI can show "requested" rather than re-offering. */
export function pendingShiftIdsFor(staffId: string): Set<string> {
  return new Set(
    store.trades
      .filter((trade) => trade.status === "pending" && trade.requesterId === staffId)
      .map((trade) => trade.shiftId),
  );
}

export function resolveTrade(tradeId: string, approve: boolean): TradeOutcome {
  const trade = store.trades.find((item) => item.id === tradeId);
  if (!trade) return { ok: false, message: "That request no longer exists." };
  if (trade.status !== "pending") {
    return { ok: false, message: "That request was already decided." };
  }

  if (!approve) {
    trade.status = "denied";
    return { ok: true, message: "Request denied." };
  }

  const shift = getShift(trade.shiftId);
  if (!shift) return { ok: false, message: "That shift no longer exists." };

  store.assignments.set(trade.shiftId, trade.requesterId);
  trade.status = "approved";

  // Approving one claim settles the shift, so competing claims can't also win.
  for (const other of store.trades) {
    if (
      other.id !== trade.id &&
      other.shiftId === trade.shiftId &&
      other.status === "pending"
    ) {
      other.status = "denied";
    }
  }

  return { ok: true, message: "Trade approved and the schedule updated." };
}

/* -------------------------------------------------------------- csv uploads */

export function applyUploadedSchedule(shifts: Shift[], newStaff: Staff[]) {
  const existing = getRoster();

  /*
   * Reconcile against the people already on the roster by employee number.
   * Without this, uploading a schedule that includes existing staff appends a
   * second copy of each of them — and worse, their shifts get attached to the
   * duplicate, so the calendar stops recognising them as the signed-in user's
   * own and "Open for taking" disappears.
   */
  const idRemap = new Map<string, string>();
  const added: Staff[] = [];

  for (const person of newStaff) {
    const match = existing.find(
      (candidate) =>
        candidate.employeeNumber.toLowerCase() ===
        person.employeeNumber.toLowerCase(),
    );
    if (match) {
      idRemap.set(person.id, match.id);
    } else if (!existing.some((candidate) => candidate.id === person.id)) {
      store.extraStaff.push(person);
      added.push(person);
    }
  }

  const reconciled = shifts.map((shift) =>
    shift.staffId && idRemap.has(shift.staffId)
      ? { ...shift, staffId: idRemap.get(shift.staffId)! }
      : shift,
  );

  const byDate = new Map<string, Shift[]>();
  for (const shift of reconciled) {
    const list = byDate.get(shift.date) ?? [];
    list.push(shift);
    byDate.set(shift.date, list);
  }

  for (const [dateKey, list] of byDate) {
    store.uploaded.set(dateKey, list);
    // Uploaded days replace the demo day outright, so stale reassignments on
    // the shifts they displace must go too.
    for (const id of [...store.assignments.keys()]) {
      if (id.startsWith(`${dateKey}#`)) store.assignments.delete(id);
    }
  }

  return { days: byDate.size, shifts: reconciled.length, staff: added.length };
}

export function uploadedDayCount() {
  return store.uploaded.size;
}

/** Earliest and latest uploaded day, for the admin summary. */
export function uploadedRange(): { first: string; last: string } | null {
  const keys = [...store.uploaded.keys()].sort();
  if (keys.length === 0) return null;
  return { first: keys[0], last: keys[keys.length - 1] };
}

export function parseKey(dateKey: string) {
  return parseDateKey(dateKey);
}
