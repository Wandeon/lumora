import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { GalleryCode } from '@/core/gallery';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';

export const createGallerySchema = z.object({
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  visibility: z
    .enum(['public', 'private', 'code_protected'])
    .default('code_protected'),
  sessionPrice: z.number().int().positive().optional(), // in cents
  expiresAt: z.date().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;

export async function createGallery(
  input: CreateGalleryInput
): Promise<Result<{ id: string; code: string }, string>> {
  const validated = createGallerySchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(validated.error.message);
  }

  const { tenantId, title, description, visibility, sessionPrice, expiresAt } =
    validated.data;

  // Generate unique gallery code with tenant prefix
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });

  if (!tenant) {
    return Result.fail('Tenant not found');
  }

  // Generate code like "SCDY0028" (prefix from slug + random)
  const prefix = tenant.slug.slice(0, 4).toUpperCase();
  let code: string;
  let attempts = 0;

  do {
    code = GalleryCode.generate(prefix).value;
    const exists = await prisma.gallery.findUnique({ where: { code } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return Result.fail('Could not generate unique gallery code');
  }

  const gallery = await prisma.gallery.create({
    data: {
      id: randomUUID(),
      tenantId,
      code,
      title,
      description,
      status: 'draft',
      visibility,
      sessionPrice,
      expiresAt,
    },
  });

  return Result.ok({ id: gallery.id, code: gallery.code });
}
