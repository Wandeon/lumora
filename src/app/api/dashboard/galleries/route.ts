import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { createGallery } from '@/application/gallery/commands/create-gallery';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json(galleries);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const result = await createGallery({
    tenantId: session.user.tenantId,
    title: body.title,
    description: body.description,
    visibility: body.visibility,
    sessionPrice: body.sessionPrice,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.value, { status: 201 });
}
