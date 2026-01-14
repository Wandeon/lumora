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
        <h1 className="text-2xl font-bold text-white">Galerije</h1>
        <Link
          href="/dashboard/galleries/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          + Nova galerija
        </Link>
      </div>

      {formattedGalleries.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">Nemate jos nijednu galeriju</p>
          <Link
            href="/dashboard/galleries/new"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Kreirajte prvu galeriju
          </Link>
        </div>
      ) : (
        <GalleryTable galleries={formattedGalleries} />
      )}
    </div>
  );
}
