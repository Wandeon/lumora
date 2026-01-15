import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.gallery.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: { status: 'published' },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
