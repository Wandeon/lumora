import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/shared/ui/login-form';
import { getTenantFromHost } from '@/shared/lib/tenant-context';
import { prisma } from '@/shared/lib/db';

interface Props {
  searchParams: Promise<{
    tenant?: string;
    registered?: string;
    invitation?: string;
  }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { tenant: tenantSlug, registered, invitation } = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenantIdHeader = headersList.get('x-tenant-id');

  // Try to get tenant from: 1) query param, 2) header, 3) host subdomain
  let tenantId = tenantIdHeader;
  let tenantName: string | null = null;

  // Check query param first (from signup redirect)
  if (!tenantId && tenantSlug) {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug, status: 'active' },
    });
    if (tenant) {
      tenantId = tenant.id;
      tenantName = tenant.name;
    }
  }

  // Then check host subdomain
  if (!tenantId) {
    const tenant = await getTenantFromHost(host);
    if (tenant) {
      tenantId = tenant.id;
      tenantName = tenant.name;
    }
  }

  // If no tenant found and not in development, redirect to home
  if (!tenantId && process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  // For development without a tenant, use a placeholder
  const effectiveTenantId = tenantId || 'development-tenant';

  return (
    <div className="w-full max-w-md relative">
      <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
            Lumora
          </h1>
          {tenantName ? (
            <p className="text-stone-500 mt-1">{tenantName}</p>
          ) : (
            <p className="text-stone-500 mt-1">Sign in to your studio</p>
          )}
        </div>

        {registered && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 text-center">
              Account created! Please sign in.
            </p>
          </div>
        )}

        {invitation === 'accepted' && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 text-center">
              Invitation accepted! Please sign in with your new password.
            </p>
          </div>
        )}

        <LoginForm tenantId={effectiveTenantId} />
      </div>
    </div>
  );
}
