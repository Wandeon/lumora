import Link from 'next/link';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { notFound, redirect } from 'next/navigation';
import { PhotoUploader } from '@/shared/ui/photo-uploader';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GalleryDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const gallery = await prisma.gallery.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      _count: { select: { photos: true } },
    },
  });

  if (!gallery) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{gallery.title}</h1>
          <p className="text-gray-400 mt-1">
            Code: {gallery.code} | {gallery._count.photos} photos
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/galleries/${gallery.id}/edit`}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Edit
          </Link>
          <Link
            href="/dashboard/galleries"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
          >
            Back to Galleries
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Upload Photos</h2>
        <PhotoUploader galleryId={gallery.id} />
      </section>
    </div>
  );
}
