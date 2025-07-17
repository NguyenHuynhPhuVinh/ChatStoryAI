import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
  // Edge Runtime compatible middleware - không thể sử dụng Node.js modules
  // Database initialization sẽ được handle trong API routes và server components

  // Chỉ log request cho debugging - không thể chạy database initialization ở đây
  // vì Edge Runtime không support Node.js modules như mysql2

  // Continue with the request
  return NextResponse.next();
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
