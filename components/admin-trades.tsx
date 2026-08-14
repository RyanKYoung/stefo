"use client";

import { useState, useTransition } from "react";

import { decideTrade } from "@/app/admin/actions";
import type { TradeStatus } from "@/lib/types";

export type TradeRow = {
  id: string;
  status: TradeStatus;
  requesterName: string;
  requesterDiscipline: string;
  fromName: string | null;
  shiftDate: string;
  shiftTime: string;
  shiftDiscipline: string;
  shiftUnit: string;
  /** Set when the underlying shift has since disappeared (e.g. a CSV replaced the day). */
  missing: boolean;
};

const STATUS_STYLES: Record<TradeStatus, string> = {
  pending: "bg-[#fef7e0] text-[#8a6116]",
  approved: "bg-[#e3f3e7] text-[#0f5c2c]",
  denied: "bg-[var(--color-cardinal-soft)] text-[var(--color-danger)]",
};

export function AdminTrades({ trades }: { trades: TradeRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const decide = (tradeId: string, approve: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const outcome = await decideTrade(tradeId, approve);
      setMessage({ ok: outcome.ok, text: outcome.message });
    });
  };

  if (trades.length === 0) {
    return (
      <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-6 text-center text-[13px] text-[var(--color-ink-muted)]">
        No shift requests yet. They appear here as staff ask for open shifts or
        hand their own back.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {message ? (
        <p
          role="status"
          className={[
            "rounded-md px-3 py-2 text-[13px]",
            message.ok
              ? "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)]"
              : "bg-[var(--color-cardinal-soft)] text-[var(--color-danger)]",
          ].join(" ")}
        >
          {message.text}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {trades.map((trade) => (
          <li
            key={trade.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3"
          >
            <div className="min-w-[190px] flex-1">
              <p className="text-[13.5px] font-semibold text-[var(--color-ink)]">
                {trade.requesterName}
                <span className="ml-1.5 font-normal text-[var(--color-ink-faint)]">
                  {trade.requesterDiscipline}
                </span>
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
                wants {trade.fromName ? `${trade.fromName}'s shift` : "an open shift"}
              </p>
            </div>

            <div className="min-w-[190px] flex-1">
              <p className="text-[12.5px] font-medium text-[var(--color-ink)]">
                {trade.shiftDate}
              </p>
              <p className="mt-0.5 text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                {trade.shiftTime} · {trade.shiftDiscipline} · {trade.shiftUnit}
              </p>
            </div>

            {trade.status === "pending" ? (
              /*
               * Approving a trade moves someone's shift, so it should not be a
               * 31px target sitting next to Deny. On a phone the pair takes its
               * own full-width row and splits it; from sm they sit inline on
               * the card as before.
               */
              <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                {trade.missing ? (
                  <span className="w-full text-[12px] text-[var(--color-danger)] sm:w-auto">
                    Shift no longer exists
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => decide(trade.id, false)}
                  className="min-h-11 flex-1 rounded-md border border-[var(--color-line-strong)] px-3 py-2.5 text-[12.5px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60 sm:min-h-0 sm:flex-none sm:py-1.5"
                >
                  Deny
                </button>
                <button
                  type="button"
                  disabled={pending || trade.missing}
                  onClick={() => decide(trade.id, true)}
                  className="min-h-11 flex-1 rounded-md bg-[var(--color-cardinal)] px-3 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[var(--color-cardinal-hover)] disabled:opacity-60 sm:min-h-0 sm:flex-none sm:py-1.5"
                >
                  Approve
                </button>
              </div>
            ) : (
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize",
                  STATUS_STYLES[trade.status],
                ].join(" ")}
              >
                {trade.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
