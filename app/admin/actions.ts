"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { parseScheduleCsv } from "@/lib/csv";
import { applyUploadedSchedule, resolveTrade, type TradeOutcome } from "@/lib/store";

/** Every admin action re-checks the session — the page guard isn't enough on its own. */
async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export async function decideTrade(
  tradeId: string,
  approve: boolean,
): Promise<TradeOutcome> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Administrator sign-in required." };
  }

  const outcome = resolveTrade(tradeId, approve);
  if (outcome.ok) {
    revalidatePath("/admin");
    revalidatePath("/calendar");
  }
  return outcome;
}

/*
 * Only async functions may be exported from a "use server" module. The initial
 * state object lives in lib/upload-state.ts for that reason — exporting it from
 * here compiles, but the client receives a server reference instead of the
 * object, and the form crashes on `state.issues`.
 */
export type { UploadState } from "@/lib/upload-state";

import { emptyUploadState, type UploadState } from "@/lib/upload-state";

export async function uploadSchedule(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  if (!(await requireAdmin())) {
    return { ...emptyUploadState, status: "error", message: "Administrator sign-in required." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ...emptyUploadState, status: "error", message: "Choose a CSV file to upload." };
  }

  const text = await file.text();
  const { shifts, staff, issues } = parseScheduleCsv(text);

  if (shifts.length === 0) {
    return {
      status: "error",
      message: "Nothing could be imported from that file.",
      issues,
      summary: null,
    };
  }

  const summary = applyUploadedSchedule(shifts, staff);
  revalidatePath("/admin");
  revalidatePath("/calendar");

  const skipped = issues.filter((issue) => issue.kind === "error").length;
  const adjusted = issues.filter((issue) => issue.kind === "warning").length;

  const notes: string[] = [];
  if (skipped > 0) notes.push(`${skipped} row${skipped === 1 ? "" : "s"} skipped`);
  if (adjusted > 0)
    notes.push(`${adjusted} row${adjusted === 1 ? "" : "s"} adjusted`);

  return {
    status: "ok",
    message:
      notes.length > 0
        ? `Imported ${summary.shifts} shifts across ${summary.days} day${summary.days === 1 ? "" : "s"} — ${notes.join(", ")}.`
        : `Imported ${summary.shifts} shifts across ${summary.days} day${summary.days === 1 ? "" : "s"}.`,
    issues,
    summary,
  };
}
