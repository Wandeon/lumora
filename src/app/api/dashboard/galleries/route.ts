import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { createGallery } from '@/application/gallery/commands/create-gallery';
import { authorizeApi } from '@/shared/lib/authorization';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();

  // Any authenticated user can view galleries
  const authResult = authorizeApi(session, 'viewer');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId: authResult.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json(galleries);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  // Owner, admin, or editor can create galleries
  const authResult = authorizeApi(session, 'editor');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  let body: {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private' | 'code_protected';
    sessionPrice?: number;
    expiresAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await createGallery({
    tenantId: authResult.tenantId!,
    title: body.title ?? '',
    description: body.description,
    visibility: body.visibility ?? 'code_protected',
    sessionPrice: body.sessionPrice,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.value, { status: 201 });
}
