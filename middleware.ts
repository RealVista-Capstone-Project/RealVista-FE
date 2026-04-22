import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from '@/shared/config/i18n/routing';

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root "/" to "/vi/buy" (default locale + buy page)
  if (pathname === '/' || pathname === '') {
    const defaultLocale = routing.defaultLocale;
    return Response.redirect(new URL(`/${defaultLocale}/buy`, request.url));
  }

  // Handle locale-prefixed root paths (/en, /vi) → redirect to /[locale]/buy
  if (pathname === '/en' || pathname === '/vi') {
    return Response.redirect(new URL(`${pathname}/buy`, request.url));
  }

  // Let next-intl handle all other routes
  return nextIntlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames, exclude static files
  matcher: ['/', '/en', '/vi', '/(en|vi)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};