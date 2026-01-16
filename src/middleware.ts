import { auth } from '@/infrastructure/auth/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should skip middleware entirely
const skipRoutes = ['/api/webhooks', '/api/health', '/_next', '/favicon'];

// Reserved subdomains that are not tenant slugs
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'dashboard',
  'login',
  'signup',
  'auth',
  'static',
  'assets',
  'cdn',
  'mail',
  'support',
  'help',
  'docs',
  'blog',
  'status',
]);

// Main domain (requests here don't require tenant subdomain)
const MAIN_DOMAIN = 'lumora.genai.hr';

interface HostInfo {
  type: 'main' | 'subdomain' | 'custom';
  subdomain?: string;
}

/**
 * Analyze host header (Edge-safe, no Prisma)
 * Returns host type and subdomain if applicable
 */
function analyzeHost(host: string): HostInfo {
  // Remove port if present
  const hostname = host.split(':')[0];
  if (!hostname) return { type: 'main' };

  // Check if this is the main domain
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
    return { type: 'main' };
  }

  // Check if this is a subdomain of the main domain
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '');
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      return { type: 'subdomain', subdomain };
    }
    return { type: 'main' }; // Reserved subdomain, treat as main
  }

  // Not a subdomain of main domain - treat as custom domain
  // Custom domain validation happens at page/API level (requires Prisma)
  return { type: 'custom' };
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // Skip middleware for certain routes
  if (skipRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Analyze host (Edge-safe)
  const hostInfo = analyzeHost(host);

  // For protected routes, check authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!req.auth?.user) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', req.nextUrl);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If on a tenant subdomain, verify it matches the session's tenant
    if (hostInfo.type === 'subdomain' && hostInfo.subdomain) {
      const sessionSlug = req.auth.user.tenantSlug;
      if (sessionSlug && sessionSlug !== hostInfo.subdomain) {
        // User is logged into a different tenant than the subdomain
        // Redirect to their actual tenant's dashboard
        const correctUrl = new URL(req.nextUrl);
        correctUrl.hostname = `${sessionSlug}.${MAIN_DOMAIN}`;
        return NextResponse.redirect(correctUrl);
      }
    }

    // For custom domains, we can't validate in middleware (no Prisma)
    // The page/API level will validate tenant ownership

    // User is authenticated - attach tenant info from session to headers
    const response = NextResponse.next();
    if (req.auth.user.tenantId) {
      response.headers.set('x-tenant-id', req.auth.user.tenantId);
    }
    if (req.auth.user.tenantSlug) {
      response.headers.set('x-tenant-slug', req.auth.user.tenantSlug);
    }
    if (req.auth.user.tenantTier) {
      response.headers.set('x-tenant-tier', req.auth.user.tenantTier);
    }
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
