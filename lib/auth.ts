/**
 * TEMPORARY STUB AUTH — accepts any email and password.
 *
 * This exists so the calendar can be built and demoed before the Supabase
 * project is provisioned. It is NOT authentication: the cookie is unsigned,
 * anyone can forge it, and no password is ever checked. It must be replaced
 * with the Supabase path in `lib/supabase/` before this app sees real staff
 * data. See "Switching on Supabase auth" in README.md.
 */
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "stefo_demo_user";

/** The one account with a fixed password in the stub. */
export const ADMIN_EMAIL = "admin@admin.com";
export const ADMIN_PASSWORD = "1234";

export function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export type StefoUser = { email: string; isAdmin: boolean };

/** Reads the stub session in server components, actions, and route handlers. */
export async function getCurrentUser(): Promise<StefoUser | null> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  return email ? { email, isAdmin: isAdminEmail(email) } : null;
}

/** Reads the stub session inside the proxy, which gets cookies off the request. */
export function getUserFromRequest(request: NextRequest): StefoUser | null {
  const email = request.cookies.get(SESSION_COOKIE)?.value;
  return email ? { email, isAdmin: isAdminEmail(email) } : null;
}

export async function startSession(email: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // one shift
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
