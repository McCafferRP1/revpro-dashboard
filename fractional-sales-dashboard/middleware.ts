import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/auth-middleware";

// Must match next.config basePath (e.g. /app when served at www.revpro.io/app)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";

function url(path: string, request: NextRequest) {
  return new URL(BASE_PATH + path, request.url);
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login") {
    if (hasSessionCookie(request.cookies.toString())) {
      return NextResponse.redirect(url("/dashboard", request));
    }
    return NextResponse.next();
  }
  if (path.startsWith("/dashboard") || path === "/") {
    if (!hasSessionCookie(request.cookies.toString())) {
      const login = url("/login", request);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    if (path === "/") return NextResponse.redirect(url("/dashboard", request));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/dashboard/:path*"],
};
