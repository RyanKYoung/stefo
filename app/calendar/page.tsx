import { redirect } from "next/navigation";

import { MonthCalendar } from "@/components/month-calendar";
import { StefoMark } from "@/components/stefo-mark";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/calendar";

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
      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <StefoMark className="h-7 w-7" />
          <span className="text-[21px] font-normal text-[var(--color-ink-muted)]">
            Stefo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[var(--color-ink-muted)] sm:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-muted)]"
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
