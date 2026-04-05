import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ["/", "/login", "/signup", "/client-login"];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get("access_token")?.value;

  // If no token → redirect based on route type
  if (!token) {
    if (pathname.startsWith("/crm")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/client-dashboard")) {
      return NextResponse.redirect(new URL("/client-login", request.url));
    }
  }

  // Allow request if authenticated
  return NextResponse.next();
}

// Apply proxy only to protected routes
export const config = {
  matcher: ["/crm/:path*", "/client-dashboard/:path*"],
};
