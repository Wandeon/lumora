import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';

export interface GalleryWithPhotos {
  galleryId: string;
  galleryCode: string;
  title: string;
  description: string | null;
  status: string;
  photoCount: number;
  sessionPrice: number | null;
  photos: Array<{
    id: string;
    filename: string;
    width: number;
    height: number;
    thumbnail: string;
    fullsize: string;
  }>;
}

export async function getGalleryByCode(
  code: string
): Promise<GalleryWithPhotos | null> {
  const gallery = await prisma.gallery.findFirst({
    where: { code, status: 'published' },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!gallery) return null;

  // Check expiration
  if (gallery.expiresAt && new Date() > gallery.expiresAt) {
    return null;
  }

  // Transform to API response format (matching xmas.artemi-media.hr)
  return {
    galleryId: gallery.id,
    galleryCode: gallery.code,
    title: gallery.title,
    description: gallery.description,
    status: gallery.status,
    photoCount: gallery.photoCount,
    sessionPrice: gallery.sessionPrice,
    photos: gallery.photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      width: photo.width,
      height: photo.height,
      thumbnail: `${env.R2_PUBLIC_URL}/${photo.thumbnailKey}`,
      fullsize: `${env.R2_PUBLIC_URL}/${photo.webKey}`,
    })),
  };
}
