import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Check if user is trying to access admin routes without admin role
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check if user is trying to access manager routes without manager role
    if (pathname.startsWith('/manager') && token?.role !== 'manager') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check if user is trying to access employee routes without employee role
    if (pathname.startsWith('/employee') && token?.role !== 'employee') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check if user is trying to access client routes without client role
    if (pathname.startsWith('/client') && token?.role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without token
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        // For all other protected routes, require a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
    '/client/:path*',
    '/api/users/:path*',
    '/api/departments/:path*',
    '/api/complaints/:path*',
    '/api/nature-types/:path*',
    '/api/upload/:path*',
  ],
};
