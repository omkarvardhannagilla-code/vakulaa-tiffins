import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/menu', '/orders', '/track'];
// Routes only accessible when NOT logged in
const AUTH_ROUTES = ['/'];
// Admin route (has its own password gate)
const ADMIN_ROUTES = ['/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Admin routes: no middleware (has its own client-side password gate)
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // For protected routes, we rely on client-side auth checks in each page
  // (The Zustand store checks session and redirects to '/' if not logged in)
  // This middleware adds a lightweight check via cookies if needed in future.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
