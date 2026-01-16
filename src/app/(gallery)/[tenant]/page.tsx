import { notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { GalleryCodeForm } from '@/shared/ui/gallery-code-form';

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantLandingPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, status: 'active' },
    select: { id: true, name: true, logoUrl: true, brandColor: true },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800
                     flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {tenant.logoUrl && (
          <div className="mb-8 text-center">
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-16 mx-auto"
            />
          </div>
        )}

        <GalleryCodeForm tenantSlug={tenantSlug} />

        <p className="mt-8 text-center text-gray-400 text-sm">
          Sigurna privatna galerija • {tenant.name}
        </p>
      </div>
    </main>
  );
}
