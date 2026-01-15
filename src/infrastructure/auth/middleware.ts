import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantFromHost,
  getTenantFromHeader,
} from '@/shared/lib/tenant-context';

export async function tenantMiddleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const tenantIdHeader = request.headers.get('x-tenant-id');

  // Try to resolve tenant
  const tenant = tenantIdHeader
    ? await getTenantFromHeader(tenantIdHeader)
    : await getTenantFromHost(host);

  // For main domain, allow marketing pages
  if (!tenant && isMarketingRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Tenant required for app routes
  if (!tenant && isAppRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Attach tenant to headers for downstream use
  const response = NextResponse.next();
  if (tenant) {
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-slug', tenant.slug);
    response.headers.set('x-tenant-tier', tenant.tier);
  }

  return response;
}

function isMarketingRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/about')
  );
}

function isAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/gallery') ||
    pathname.startsWith('/admin')
  );
}
