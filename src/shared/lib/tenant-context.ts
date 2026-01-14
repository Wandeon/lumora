import { cache } from 'react';
import { prisma } from './db';
import type { Tenant } from '@/generated/prisma';

export type TenantContext = {
  tenant: Tenant;
  tenantId: string;
};

// Reserved subdomains that should not resolve to tenants
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

// Cache tenant resolution per request
export const getTenantFromHost = cache(
  async (host: string): Promise<Tenant | null> => {
    // Check for custom domain first
    const byCustomDomain = await prisma.tenant.findUnique({
      where: { customDomain: host, status: 'active' },
    });
    if (byCustomDomain) return byCustomDomain;

    // Extract subdomain
    const parts = host.split('.');
    if (parts.length < 2) return null;

    const subdomain = parts[0];
    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;

    // Find by slug
    return prisma.tenant.findUnique({
      where: { slug: subdomain, status: 'active' },
    });
  }
);

export const getTenantFromHeader = cache(
  async (tenantId: string): Promise<Tenant | null> => {
    return prisma.tenant.findUnique({
      where: { id: tenantId, status: 'active' },
    });
  }
);
