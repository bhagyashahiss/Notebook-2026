import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isUserRole, SESSION_COOKIE } from "@/lib/auth-role";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublicPath =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/form-submit" ||
    pathname === "/api/import";

  if (isPublicPath) {
    return NextResponse.next();
  }

  const role = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isUserRole(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    const nextValue = pathname + search;
    loginUrl.searchParams.set("next", nextValue);
    return NextResponse.redirect(loginUrl);
  }

  const isMutatingApi = pathname.startsWith("/api/") && request.method !== "GET";
  if (isMutatingApi && role !== "admin") {
    return NextResponse.json({ error: "Viewer role is read-only" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
