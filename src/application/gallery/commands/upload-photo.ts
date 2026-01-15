import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { processAndUploadImage } from '@/infrastructure/storage/image-service';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';

export const uploadPhotoSchema = z.object({
  galleryId: z.string().uuid(),
  filename: z.string(),
  buffer: z.instanceof(Buffer),
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;

export async function uploadPhoto(
  input: UploadPhotoInput
): Promise<Result<{ id: string }, string>> {
  const validated = uploadPhotoSchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(validated.error.message);
  }

  const { galleryId, filename, buffer } = validated.data;

  // Get gallery and verify it exists
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, code: true, photoCount: true },
  });

  if (!gallery) {
    return Result.fail('Gallery not found');
  }

  try {
    // Process and upload image variants
    const processed = await processAndUploadImage(
      gallery.code,
      filename,
      buffer
    );

    // Get next sort order
    const lastPhoto = await prisma.photo.findFirst({
      where: { galleryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (lastPhoto?.sortOrder ?? -1) + 1;

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        id: randomUUID(),
        galleryId,
        filename,
        originalKey: processed.variants.original.key,
        thumbnailKey: processed.variants.thumbnail.key,
        webKey: processed.variants.web.key,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        mimeType: processed.mimeType,
        sortOrder,
      },
    });

    // Update gallery photo count
    await prisma.gallery.update({
      where: { id: galleryId },
      data: { photoCount: { increment: 1 } },
    });

    return Result.ok({ id: photo.id });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Upload failed'
    );
  }
}
