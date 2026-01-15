import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { notFound, redirect } from 'next/navigation';
import { GalleryEditForm } from '@/shared/ui/gallery-edit-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GalleryEditPage({ params }: Props) {
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
  });

  if (!gallery) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Gallery</h1>
      <GalleryEditForm gallery={gallery} />
    </div>
  );
}
