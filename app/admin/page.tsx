import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminTrades, type TradeRow } from "@/components/admin-trades";
import { CsvUpload } from "@/components/csv-upload";
import { StefoMark } from "@/components/stefo-mark";
import { getCurrentUser } from "@/lib/auth";
import { parseDateKey } from "@/lib/calendar";
import { FACILITY } from "@/lib/facility";
import { staffById } from "@/lib/roster";
import {
  getRoster,
  getShift,
  listTrades,
  pendingTradeCount,
  uploadedDayCount,
  uploadedRange,
} from "@/lib/store";
import { formatShiftTime } from "@/lib/types";

import { signOut } from "../login/actions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  // Signed in but not an administrator — send them to their own calendar
  // rather than revealing that this page exists.
  if (!user.isAdmin) {
    redirect("/calendar");
  }

  const roster = getRoster();
  const trades: TradeRow[] = listTrades().map((trade) => {
    const shift = getShift(trade.shiftId);
    const requester = staffById(roster, trade.requesterId);
    const from = staffById(roster, trade.fromStaffId);

    return {
      id: trade.id,
      status: trade.status,
      requesterName: requester?.name ?? "Unknown",
      requesterDiscipline: requester?.discipline ?? "",
      fromName: from?.name ?? null,
      shiftDate: shift
        ? parseDateKey(shift.date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      shiftTime: shift ? formatShiftTime(shift) : "—",
      shiftDiscipline: shift?.discipline ?? "—",
      shiftUnit: shift?.unit ?? "—",
      missing: shift === null,
    };
  });

  const pending = pendingTradeCount();
  const uploaded = uploadedRange();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--color-surface-muted)]">
      <div className="h-1 shrink-0 bg-[var(--color-cardinal)]" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <StefoMark className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[14px] leading-tight font-semibold tracking-tight text-[var(--color-ink)]">
              Scheduling administration
            </p>
            <p className="hidden truncate text-[11.5px] leading-tight text-[var(--color-ink-faint)] sm:block">
              {FACILITY.hospital} · {FACILITY.program}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/calendar"
            className="min-h-11 rounded-md border border-[var(--color-line-strong)] px-2.5 py-2.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)] sm:min-h-0 sm:px-3 sm:py-1.5"
          >
            Calendar
          </Link>
          <span className="hidden text-[13px] text-[var(--color-ink-muted)] md:inline">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-md border border-[var(--color-line-strong)] px-2.5 py-2.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-cardinal)] hover:text-[var(--color-cardinal)] sm:min-h-0 sm:px-3 sm:py-1.5"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <section className="mb-9">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
              Shift trade requests
            </h1>
            {pending > 0 ? (
              <span className="rounded-full bg-[#fef7e0] px-2.5 py-1 text-[11.5px] font-semibold text-[#8a6116]">
                {pending} awaiting decision
              </span>
            ) : null}
          </div>
          <AdminTrades trades={trades} />
        </section>

        <section>
          <h2 className="mb-1 text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
            Upload schedule
          </h2>
          <p className="mb-4 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            {uploaded
              ? `Currently showing an uploaded schedule for ${uploadedDayCount()} day${uploadedDayCount() === 1 ? "" : "s"}, ${uploaded.first} to ${uploaded.last}. Days outside that range still show demo data.`
              : "The calendar is showing generated demo data. Upload a CSV to replace it."}
          </p>
          <CsvUpload />
        </section>

        <p className="mt-10 border-t border-[var(--color-line)] pt-4 text-[11.5px] leading-relaxed text-[var(--color-ink-faint)]">
          Approvals and uploads are held in server memory while the demo runs
          and reset when the service restarts. They become Supabase tables once
          the database is connected.
        </p>
      </main>
    </div>
  );
}
