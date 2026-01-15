import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/shared/ui/login-form';
import { getTenantFromHost } from '@/shared/lib/tenant-context';

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenantIdHeader = headersList.get('x-tenant-id');

  // Try to get tenant from header first (set by middleware), then from host
  let tenantId = tenantIdHeader;

  if (!tenantId) {
    const tenant = await getTenantFromHost(host);
    if (tenant) {
      tenantId = tenant.id;
    }
  }

  // If no tenant found and not in development, redirect to home
  if (!tenantId && process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  // For development without a tenant, use a placeholder
  // This allows testing the login page UI
  const effectiveTenantId = tenantId || 'development-tenant';

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Lumora</h1>
          <p className="text-gray-400 mt-1">Prijavite se u svoj studio</p>
        </div>

        <LoginForm tenantId={effectiveTenantId} />
      </div>
    </div>
  );
}
