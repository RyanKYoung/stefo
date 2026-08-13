/** 0 = Sunday, 1 = Monday. Google Calendar's US default is Sunday. */
export const WEEK_STARTS_ON = 0;

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type DayCell = {
  /** Local calendar date, normalised to midnight. */
  date: Date;
  /** ISO yyyy-mm-dd, safe to use as a React key or a database lookup. */
  key: string;
  /** False for the leading/trailing days borrowed from adjacent months. */
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

/** yyyy-mm-dd in local time — `toISOString()` would shift across the date line. */
export function toDateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parse yyyy-mm-dd as a *local* date — `new Date("2026-08-12")` parses as UTC. */
export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** The Sunday that starts the week containing `date`. */
export function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() - WEEK_STARTS_ON + 7) % 7));
}

/** The seven days of the week containing `date`. */
export function weekDays(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Inclusive list of yyyy-mm-dd keys between two dates. */
export function eachDateKey(start: Date, end: Date) {
  const keys: string[] = [];
  for (
    let cursor = startOfDay(start);
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    keys.push(toDateKey(cursor));
  }
  return keys;
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "Aug 9 – 15, 2026", widening to months or years only when the week spans
 * them. Built by hand rather than by dropping fields from
 * `toLocaleDateString` options — omitting the month there makes some locales
 * emit a bare day fallback like "2026 (day: 15)".
 */
export function weekLabel(date: Date) {
  const days = weekDays(date);
  const first = days[0];
  const last = days[6];
  const month = (value: Date) =>
    value.toLocaleDateString(undefined, { month: "short" });

  if (first.getFullYear() !== last.getFullYear()) {
    return `${month(first)} ${first.getDate()}, ${first.getFullYear()} – ${month(last)} ${last.getDate()}, ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${month(first)} ${first.getDate()} – ${month(last)} ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${month(first)} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/**
 * The six-week grid a month view renders, padded with adjacent-month days so
 * every month occupies the same height and the grid never reflows.
 */
export function buildMonthGrid(viewMonth: Date, today: Date): DayCell[] {
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const offset = (firstOfMonth.getDay() - WEEK_STARTS_ON + 7) % 7;

  const gridStart = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
    1 - offset,
  );

  const todayKey = toDateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    const weekday = date.getDay();

    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === viewMonth.getMonth(),
      isToday: toDateKey(date) === todayKey,
      isWeekend: weekday === 0 || weekday === 6,
    };
  });
}
