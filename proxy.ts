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

  if (!user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && pathname === "/login") {
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
