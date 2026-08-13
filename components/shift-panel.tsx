"use client";

import { useState, useTransition } from "react";

import { claimShift, openShiftForTaking } from "@/app/calendar/actions";
import { parseDateKey } from "@/lib/calendar";
import { DISCIPLINE_LABELS, formatShiftTime, shiftHours } from "@/lib/types";
import type { ShiftView } from "@/lib/view-model";

export function ShiftPanel({
  view,
  onClose,
}: {
  view: ShiftView;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const { shift, person, color, isMine, isOpen, isPending } = view;
  const date = parseDateKey(shift.date);

  const run = (action: () => Promise<{ ok: boolean; message: string }>) => {
    setResult(null);
    startTransition(async () => {
      setResult(await action());
    });
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
            SHIFT
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-[var(--color-ink)]">
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shift details"
          className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface-muted)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div
          className="rounded-md border-l-[3px] px-3 py-2.5"
          style={{ backgroundColor: color.fill, borderColor: color.bar }}
        >
          <p
            className="text-[14px] font-semibold"
            style={{ color: color.text }}
          >
            {isOpen ? "Open shift" : person?.name}
          </p>
          <p className="mt-0.5 text-[12px] tabular-nums" style={{ color: color.text }}>
            {formatShiftTime(shift)} · {shiftHours(shift)}h
          </p>
        </div>

        <dl className="mt-4 flex flex-col gap-2.5 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-muted)]">Specialty</dt>
            <dd className="text-right font-medium text-[var(--color-ink)]">
              {DISCIPLINE_LABELS[shift.discipline]}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-muted)]">Unit</dt>
            <dd className="text-right font-medium text-[var(--color-ink)]">
              {shift.unit}
            </dd>
          </div>
          {person ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-ink-muted)]">Employee no.</dt>
              <dd className="text-right font-medium tabular-nums text-[var(--color-ink)]">
                {person.employeeNumber}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5">
          {isPending ? (
            <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
              You&rsquo;ve asked for this shift. An administrator has to approve
              the trade before it moves.
            </p>
          ) : isMine ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => openShiftForTaking(shift.id))}
              className="w-full rounded-md border border-[var(--color-cardinal)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-cardinal)] transition hover:bg-[var(--color-cardinal-soft)] disabled:opacity-60"
            >
              {pending ? "Opening…" : "Open for taking"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => claimShift(shift.id))}
              className="w-full rounded-md bg-[var(--color-cardinal)] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-cardinal-hover)] disabled:opacity-60"
            >
              {pending ? "Sending…" : "I want it"}
            </button>
          )}

          {result ? (
            <p
              role="status"
              className={[
                "mt-3 rounded-md px-3 py-2 text-[12.5px] leading-snug",
                result.ok
                  ? "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)]"
                  : "bg-[var(--color-cardinal-soft)] text-[var(--color-danger)]",
              ].join(" ")}
            >
              {result.message}
            </p>
          ) : null}

          <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
            {isMine
              ? "Opening a shift releases it to everyone in your specialty. Requests still need approval."
              : "Requests go to the scheduling administrator for approval."}
          </p>
        </div>
      </div>
    </aside>
  );
}
