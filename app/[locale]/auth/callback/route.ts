import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/shared/lib/auth/config';
import { determineUserRole, getRedirectPathByRole } from '@/shared/lib/auth/rbac';

/**
 * OAuth Callback Route Handler
 *
 * Receives OAuth callback from backend with user credentials.
 * Backend redirects here after Google OAuth flow completes.
 *
 * URL Format: /[locale]/auth/callback?user_id=xxx&access_token=yyy&email=zzz&roles=OWNER,BUYER
 *
 * Process:
 * 1. Extract locale from URL pathname
 * 2. Extract OAuth parameters from query string
 * 3. Validate required parameters (user_id, access_token, email)
 * 4. Create NextAuth session using OAuth provider
 * 5. Redirect based on user role
 *
 * @param request - Next.js request object
 * @returns Redirect to appropriate page based on role, or login page with error
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract locale from URL pathname: /vi/auth/callback or /en/auth/callback
  const pathnameSegments = request.nextUrl.pathname.split('/');
  const authIndex = pathnameSegments.findIndex((seg) => seg === 'auth');
  const locale = authIndex > 0 ? pathnameSegments[authIndex - 1] : 'vi';

  // Extract BE parameters from URL
  const userId = searchParams.get('user_id');
  const accessToken = searchParams.get('access_token');
  const email = searchParams.get('email');
  const roles = searchParams.get('roles'); // Comma-separated roles from backend
  const error = searchParams.get('error');

  // Handle errors from BE
  if (error) {
    console.error('[OAuth Callback] Backend error:', error);
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!userId || !accessToken || !email) {
    console.error('[OAuth Callback] Missing parameters:', {
      userId,
      hasToken: !!accessToken,
      email,
    });
    return NextResponse.redirect(new URL(`/${locale}/login?error=missing_params`, request.url));
  }

  try {
    console.log('[OAuth Callback] Creating session for:', email);

    // Create NextAuth session using OAuth provider (pass roles if available)
    const result = await signIn('oauth', {
      userId: userId,
      email: email,
      accessToken: accessToken,
      roles: roles || '',
      redirect: false,
    });

    if (result?.error) {
      console.error('[OAuth Callback] NextAuth error:', result.error);
      return NextResponse.redirect(new URL(`/${locale}/login?error=session_failed`, request.url));
    }

    console.log('[OAuth Callback] Session created successfully for:', email);

    // Determine redirect path based on role
    const backendRoles = roles ? roles.split(',').map((r) => r.trim()) : undefined;
    const userRole = determineUserRole(backendRoles);
    const rolePath = getRedirectPathByRole(userRole);

    const rawRedirectTo = request.cookies.get('auth-redirect-to')?.value;
    const finalPath =
      rawRedirectTo && rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//')
        ? rawRedirectTo
        : rolePath;

    const response = NextResponse.redirect(new URL(`/${locale}${finalPath}`, request.url));
    response.cookies.delete('auth-redirect-to');
    return response;
  } catch (error) {
    console.error('[OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL(`/${locale}/login?error=callback_error`, request.url));
  }
}
