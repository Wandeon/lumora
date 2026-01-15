import { prisma } from '@/shared/lib/db';

export async function getProducts(tenantId: string) {
  return prisma.product.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}
