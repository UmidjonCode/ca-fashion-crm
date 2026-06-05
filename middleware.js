import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Get the secret key from environment or use a default one for local dev
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-for-crm'
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/health'];

  // Check if current path is public
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the JWT token
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid token:', error);
    // Token is invalid or expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api/auth/login|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
