import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getAuthSecret,
  getSessionCookieName,
  isSecureCookieEnabled,
  SESSION_COOKIE_BASE,
} from "@/lib/auth-config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const cookieName = getSessionCookieName();
  const token =
    request.cookies.get(cookieName)?.value ??
    request.cookies.get(SESSION_COOKIE_BASE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, getAuthSecret());
    return NextResponse.next();
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[middleware] Session verify failed", e);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    const res = NextResponse.redirect(url);
    const secure = isSecureCookieEnabled();
    res.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure,
    });
    res.cookies.set(SESSION_COOKIE_BASE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure,
    });
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
