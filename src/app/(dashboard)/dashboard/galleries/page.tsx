import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { GalleryTable } from '@/shared/ui/gallery-table';

export default async function GalleriesPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    redirect('/login');
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { photos: true } },
    },
  });

  const formattedGalleries = galleries.map((g) => ({
    id: g.id,
    code: g.code,
    title: g.title,
    status: g.status,
    photoCount: g._count.photos,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Galleries</h1>
        <Link
          href="/dashboard/galleries/new"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
        >
          + New Gallery
        </Link>
      </div>

      {formattedGalleries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-stone-500 mb-4">You don't have any galleries yet</p>
          <Link
            href="/dashboard/galleries/new"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Create your first gallery
          </Link>
        </div>
      ) : (
        <GalleryTable galleries={formattedGalleries} />
      )}
    </div>
  );
}
