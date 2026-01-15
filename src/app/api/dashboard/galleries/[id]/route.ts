import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'code_protected', 'private']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gallery = await prisma.gallery.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { photos: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json(gallery);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues?.[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  // Filter out undefined values for Prisma
  const updateData: Record<string, string> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.visibility !== undefined)
    updateData.visibility = parsed.data.visibility;

  const gallery = await prisma.gallery.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: updateData,
  });

  if (gallery.count === 0) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.gallery.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });

  return NextResponse.json({ success: true });
}
