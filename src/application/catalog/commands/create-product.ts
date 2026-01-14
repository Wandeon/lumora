import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';
import { hasFeature } from '@/shared/lib/features';

export const createProductSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum([
    'print',
    'digital_download',
    'magnet',
    'canvas',
    'album',
    'other',
  ]),
  price: z.number().int().positive(), // in cents
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export async function createProduct(
  input: CreateProductInput
): Promise<Result<{ id: string }, string>> {
  const validated = createProductSchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(validated.error.message);
  }

  const { tenantId, name, description, type, price, metadata } = validated.data;

  // Check feature access - print_orders is Pro tier
  const hasAccess = await hasFeature(tenantId, 'print_orders');
  if (!hasAccess) {
    return Result.fail('Product catalog requires Pro tier or higher');
  }

  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      tenantId,
      name,
      description,
      type,
      price,
      metadata: metadata || {},
    },
  });

  return Result.ok({ id: product.id });
}
