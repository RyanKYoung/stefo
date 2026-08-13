import type { CsvIssue } from "./csv";

export type UploadState = {
  status: "idle" | "ok" | "error";
  message: string;
  issues: CsvIssue[];
  summary: { days: number; shifts: number; staff: number } | null;
};

/**
 * Initial state for the upload form. Kept out of `app/admin/actions.ts`
 * because a "use server" module may only export async functions — a plain
 * object exported from there reaches the client as a server reference.
 */
export const emptyUploadState: UploadState = {
  status: "idle",
  message: "",
  issues: [],
  summary: null,
};
