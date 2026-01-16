import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'bn'];
const defaultLocale = 'bn';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if there is any supported locale in the pathname
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return;

    // If no locale is present, we handle it via cookie preference
    // without changing the URL (client-side implementation of next-intl)
    const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;

    // We set the cookie if it doesn't exist to ensure consistency
    const response = NextResponse.next();
    if (!request.cookies.has('NEXT_LOCALE')) {
        response.cookies.set('NEXT_LOCALE', locale);
    }

    return response;
}

export const config = {
    // Skip all paths that should not be internationalized
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
