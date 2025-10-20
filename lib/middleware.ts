import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { data: session } = await auth.api.getSession({
    headers: request.headers,
  });

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/admin", "/teacher"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Admin-only routes
  const adminOnlyPaths = ["/admin"];
  const isAdminOnlyPath = adminOnlyPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If trying to access protected routes without session, redirect to sign in
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // If trying to access admin routes without admin role, redirect to dashboard
  if (isAdminOnlyPath && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If authenticated user tries to access sign-in page, redirect to dashboard
  if (request.nextUrl.pathname.startsWith("/sign-in") && session) {
    const redirectUrl = session.user.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};