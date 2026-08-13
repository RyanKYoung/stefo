import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarWorkspace, type CalendarView } from "@/components/calendar-workspace";
import { StefoMark } from "@/components/stefo-mark";
import { getCurrentUser } from "@/lib/auth";
import {
  buildMonthGrid,
  dayLabel,
  monthLabel,
  parseDateKey,
  toDateKey,
  weekDays,
  weekLabel,
} from "@/lib/calendar";
import { FACILITY } from "@/lib/facility";
import { resolveCurrentStaff } from "@/lib/roster";
import {
  getRoster,
  getShiftsForDates,
  pendingShiftIdsFor,
} from "@/lib/store";
import { shiftHours } from "@/lib/types";

import { signOut } from "../login/actions";

const VALID_VIEWS: CalendarView[] = ["month", "week", "day"];

function parseView(value: string | undefined): CalendarView {
  return VALID_VIEWS.includes(value as CalendarView)
    ? (value as CalendarView)
    : "month";
}

/** Guards against a hand-edited ?date= producing an Invalid Date downstream. */
function parseFocusDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = parseDateKey(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const serverToday = toDateKey(new Date());
  const view = parseView(params.view);
  const dateKey = parseFocusDate(params.date, serverToday);
  const focus = parseDateKey(dateKey);

  // The window of days this view needs — the month grid's full six weeks, the
  // seven days of the week, or the single day.
  const windowKeys =
    view === "month"
      ? buildMonthGrid(focus, focus).map((cell) => cell.key)
      : view === "week"
        ? weekDays(focus).map(toDateKey)
        : [dateKey];

  const roster = getRoster();
  const currentStaff = resolveCurrentStaff(roster, user.email);
  const shifts = getShiftsForDates(windowKeys);

  // Hours are counted over the period the label names, not the whole grid —
  // a month view loads six weeks, so counting the window would silently
  // include the tail of July and the start of September under "August".
  const focusMonth = focus.getMonth();
  const countedKeys =
    view === "month"
      ? windowKeys.filter((key) => parseDateKey(key).getMonth() === focusMonth)
      : windowKeys;
  const countedSet = new Set(countedKeys);

  const totalHours = shifts
    .filter(
      (shift) =>
        shift.staffId === currentStaff.id && countedSet.has(shift.date),
    )
    .reduce((sum, shift) => sum + shiftHours(shift), 0);

  const rangeLabel =
    view === "month"
      ? monthLabel(focus)
      : view === "week"
        ? weekLabel(focus)
        : dayLabel(focus);

  return (
    <div className="flex h-screen flex-col">
      <div className="h-1 shrink-0 bg-[var(--color-cardinal)]" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-line)] px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <StefoMark className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[14px] leading-tight font-semibold tracking-tight text-[var(--color-ink)]">
              {FACILITY.program}
            </p>
            <p className="hidden truncate text-[11.5px] leading-tight text-[var(--color-ink-faint)] sm:block">
              {FACILITY.hospital} · {FACILITY.unit}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user.isAdmin ? (
            <Link
              href="/admin"
              className="rounded-md border border-[var(--color-cardinal)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-cardinal)] transition hover:bg-[var(--color-cardinal-soft)]"
            >
              Admin
            </Link>
          ) : null}
          <span className="hidden text-[13px] text-[var(--color-ink-muted)] md:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-[var(--color-line-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <CalendarWorkspace
        view={view}
        dateKey={dateKey}
        serverToday={serverToday}
        shifts={shifts}
        roster={roster}
        currentStaff={currentStaff}
        pendingShiftIds={[...pendingShiftIdsFor(currentStaff.id)]}
        totalHours={totalHours}
        rangeLabel={rangeLabel}
      />
    </div>
  );
}
