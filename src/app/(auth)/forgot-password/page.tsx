import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ForgotPasswordForm } from '@/shared/ui/forgot-password-form';
import { getTenantFromHost } from '@/shared/lib/tenant-context';
import { prisma } from '@/shared/lib/db';

interface Props {
  searchParams: Promise<{ tenant?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { tenant: tenantSlug } = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenantIdHeader = headersList.get('x-tenant-id');

  // Try to get tenant from: 1) query param, 2) header, 3) host subdomain
  let tenantId = tenantIdHeader;
  let tenantName: string | null = null;

  // Check query param first
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
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Lumora</h1>
          {tenantName ? (
            <p className="text-gray-400 mt-1">{tenantName}</p>
          ) : (
            <p className="text-gray-400 mt-1">Reset your password</p>
          )}
        </div>

        <ForgotPasswordForm tenantId={effectiveTenantId} />
      </div>
    </div>
  );
}
