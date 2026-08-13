import { redirect } from "next/navigation";

import { MonthCalendar } from "@/components/month-calendar";
import { StefoMark } from "@/components/stefo-mark";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/calendar";
import { FACILITY } from "@/lib/facility";

import { signOut } from "../login/actions";

export default async function CalendarPage() {
  const user = await getCurrentUser();

  // The proxy already redirects signed-out visitors; this is the backstop that
  // guarantees `user` is non-null below.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="h-1 shrink-0 bg-[var(--color-cardinal)]" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-line)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <StefoMark className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-tight font-semibold tracking-tight text-[var(--color-ink)]">
              {FACILITY.program}
            </p>
            <p className="hidden truncate text-[12px] leading-tight text-[var(--color-ink-faint)] sm:block">
              {FACILITY.hospital} · {FACILITY.unit}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
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

      <MonthCalendar serverToday={toDateKey(new Date())} />
    </div>
  );
}
