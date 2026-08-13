export const DISCIPLINES = [
  "DPT",
  "RN",
  "OT",
  "SLP",
  "MD",
  "RT",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  DPT: "Physical Therapy",
  RN: "Nursing",
  OT: "Occupational Therapy",
  SLP: "Speech Therapy",
  MD: "Physician",
  RT: "Respiratory Therapy",
};

export type Staff = {
  id: string;
  name: string;
  employeeNumber: string;
  discipline: Discipline;
  email: string;
  /** Index into STAFF_COLORS — stable per person so the calendar reads consistently. */
  colorIndex: number;
};

export type Shift = {
  id: string;
  /** yyyy-mm-dd, local. */
  date: string;
  /** 0–23. Shifts never cross midnight in this model. */
  startHour: number;
  /** Exclusive, 1–24. */
  endHour: number;
  discipline: Discipline;
  unit: string;
  /** null means the shift is open and anyone in the discipline can claim it. */
  staffId: string | null;
};

export type TradeStatus = "pending" | "approved" | "denied";

export type TradeRequest = {
  id: string;
  shiftId: string;
  /** Who wants the shift. */
  requesterId: string;
  /** Who held it when the request was raised — null for an open shift. */
  fromStaffId: string | null;
  createdAt: string;
  status: TradeStatus;
};

export function shiftHours(shift: Shift) {
  return shift.endHour - shift.startHour;
}

/**
 * 7 -> "7 AM", 13 -> "1 PM", 15.5 -> "3:30 PM".
 *
 * Fractional hours matter because uploaded schedules carry real times like
 * 07:00–15:30, and rounding those to the hour would misstate paid time.
 */
export function formatHour(hour: number) {
  const totalMinutes = Math.round(hour * 60);
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const display = h24 % 12 === 0 ? 12 : h24 % 12;
  return minutes === 0
    ? `${display} ${suffix}`
    : `${display}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatShiftTime(shift: Shift) {
  return `${formatHour(shift.startHour)} – ${formatHour(shift.endHour)}`;
}
