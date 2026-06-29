import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const start = Date.now();
    const response = NextResponse.next();
    
    // Add Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

    // Simple Request Logging (Edge compatible)
    const duration = Date.now() - start;
    const path = new URL(req.url).pathname;
    
    if (path.startsWith('/api')) {
      console.log(`[REQ] ${req.method} ${path} - (${duration}ms)`);
    }

    return response;
  },
  {
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - login (the login page itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - $ (the root path itself)
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|$).*)',
  ],
};
