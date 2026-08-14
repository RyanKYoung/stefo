"use client";

import { useActionState } from "react";

import { uploadSchedule } from "@/app/admin/actions";
import { emptyUploadState } from "@/lib/upload-state";

/** Rows listed before the issue log collapses to a count. */
const MAX_ISSUES = 12;

export function CsvUpload() {
  const [state, formAction, pending] = useActionState(
    uploadSchedule,
    emptyUploadState,
  );

  const shown = state.issues.slice(0, MAX_ISSUES);
  const hidden = state.issues.length - shown.length;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="w-full min-w-0 flex-1 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-2 text-[16px] text-[var(--color-ink)] sm:w-auto sm:text-[13px] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-surface-muted)] file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--color-cardinal)] px-4 py-3 text-[13.5px] font-semibold text-white transition hover:bg-[var(--color-cardinal-hover)] disabled:opacity-60 sm:w-auto sm:py-2"
        >
          {pending ? "Importing…" : "Upload schedule"}
        </button>
      </form>

      {state.status !== "idle" ? (
        <p
          role="status"
          className={[
            "rounded-md px-3 py-2 text-[13px]",
            state.status === "ok"
              ? "bg-[#e3f3e7] text-[#0f5c2c]"
              : "bg-[var(--color-cardinal-soft)] text-[var(--color-danger)]",
          ].join(" ")}
        >
          {state.message}
        </p>
      ) : null}

      {shown.length > 0 ? (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-[var(--color-ink-muted)]">
            ROWS NEEDING ATTENTION
          </p>
          <ul className="flex flex-col gap-1">
            {shown.map((issue, index) => (
              <li
                key={`${issue.row}-${index}`}
                className="text-[12px] leading-snug text-[var(--color-ink-muted)]"
              >
                <span
                  className={[
                    "mr-1.5 rounded px-1.5 py-[1px] text-[10px] font-semibold uppercase",
                    issue.kind === "error"
                      ? "bg-[var(--color-cardinal-soft)] text-[var(--color-danger)]"
                      : "bg-[#fef7e0] text-[#8a6116]",
                  ].join(" ")}
                >
                  {issue.kind === "error" ? "Skipped" : "Adjusted"}
                </span>
                <span className="font-medium tabular-nums text-[var(--color-ink)]">
                  Row {issue.row}
                </span>{" "}
                — {issue.message}
              </li>
            ))}
          </ul>
          {hidden > 0 ? (
            <p className="mt-1.5 text-[12px] text-[var(--color-ink-faint)]">
              …and {hidden} more.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-[var(--color-line)] px-3 py-2.5">
        <p className="text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
          Expected columns: <strong className="font-semibold">name</strong>,{" "}
          <strong className="font-semibold">employee number</strong>,{" "}
          <strong className="font-semibold">discipline</strong>,{" "}
          <strong className="font-semibold">date</strong>, and{" "}
          <strong className="font-semibold">shift hours</strong>. Common
          variations on those headings are accepted, dates may be YYYY-MM-DD or
          MM/DD/YYYY, and hours may be written 07:00-15:30, 0700-1530, or
          7am–3pm. An optional <strong className="font-semibold">unit</strong>{" "}
          column is used if present.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
          Uploading replaces the demo schedule for every date in the file.
        </p>
      </div>
    </div>
  );
}
