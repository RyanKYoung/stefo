import { NextResponse, type NextRequest } from "next/server";

import { getUserFromRequest } from "@/lib/auth";

/** Routes reachable without a session. Everything else requires a login. */
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const user = getUserFromRequest(request);
  const { pathname } = request.nextUrl;

  /*
   * Server actions POST to the page's own URL, so a sign-in lands here as
   * `POST /login` — carrying the session cookie the action just set. Steering
   * that request would race the action's own redirect and emit `Location`
   * twice, which folds into the literal path "/calendar, /calendar" and 404s.
   * Only real navigations get steered; actions and their auth checks are left
   * to the page components, which each verify the session themselves.
   */
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  if (isNavigation && !user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (isNavigation && user && pathname === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/calendar";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need a
     * session check and would only add latency.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
