import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/invite"];
const signedInRedirectRoutes = ["/", "/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Signed-in users skip the auth pages, but /invite stays reachable so they
  // can accept an invitation without being bounced to /dashboard.
  const isSignedInRedirectRoute = signedInRedirectRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (token && isSignedInRedirectRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)"],
};
