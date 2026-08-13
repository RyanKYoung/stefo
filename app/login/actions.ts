"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  ADMIN_PASSWORD,
  endSession,
  isAdminEmail,
  startSession,
} from "@/lib/auth";

export type LoginState = { error: string | null };

/** Only allow same-origin paths through ?next= so the form can't be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/calendar";
}

/**
 * STUB: accepts any email with any non-empty password, except the admin
 * account, which checks its fixed demo password so the admin page isn't
 * reachable by simply typing the address. Swap the body for
 * `supabase.auth.signInWithPassword` once the Supabase project exists.
 */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (isAdminEmail(email) && password !== ADMIN_PASSWORD) {
    return { error: "That email and password don't match an account." };
  }

  await startSession(email);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/login");
}
