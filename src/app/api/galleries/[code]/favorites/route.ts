// src/app/api/galleries/[code]/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const SESSION_KEY_REGEX = /^[a-zA-Z0-9_-]{16,64}$/;

const favoriteSchema = z.object({
  photoId: z.string().uuid(),
  sessionKey: z.string().regex(SESSION_KEY_REGEX, 'Invalid session key format'),
  action: z.enum(['add', 'remove']),
});

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET - Fetch favorites for a session
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const sessionKey = request.nextUrl.searchParams.get('sessionKey');

  if (!sessionKey || !SESSION_KEY_REGEX.test(sessionKey)) {
    return NextResponse.json(
      { error: 'Valid session key required' },
      { status: 400 }
    );
  }

  // Find gallery by code
  const gallery = await prisma.gallery.findFirst({
    where: { code, status: 'published' },
    select: { id: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Get favorites for this session
  const favorites = await prisma.favorite.findMany({
    where: {
      galleryId: gallery.id,
      sessionKey,
    },
    select: { photoId: true },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => f.photoId),
  });
}

// POST - Add or remove favorite
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { photoId, sessionKey, action } = parsed.data;

  // Find gallery by code
  const gallery = await prisma.gallery.findFirst({
    where: { code, status: 'published' },
    select: { id: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Verify photo belongs to gallery
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, galleryId: gallery.id },
  });

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (action === 'add') {
    // Upsert to handle duplicates gracefully
    await prisma.favorite.upsert({
      where: {
        galleryId_photoId_sessionKey: {
          galleryId: gallery.id,
          photoId,
          sessionKey,
        },
      },
      create: {
        galleryId: gallery.id,
        photoId,
        sessionKey,
      },
      update: {}, // No-op if exists
    });
  } else {
    // Remove favorite
    await prisma.favorite.deleteMany({
      where: {
        galleryId: gallery.id,
        photoId,
        sessionKey,
      },
    });
  }

  // Return updated favorites list
  const favorites = await prisma.favorite.findMany({
    where: {
      galleryId: gallery.id,
      sessionKey,
    },
    select: { photoId: true },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => f.photoId),
  });
}
