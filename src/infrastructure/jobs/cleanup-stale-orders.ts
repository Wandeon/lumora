import { prisma } from '@/shared/lib/db';

const STALE_ORDER_HOURS = 24;

export async function cleanupStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000);

  const result = await prisma.order.updateMany({
    where: {
      status: 'pending',
      createdAt: { lt: cutoff },
    },
    data: {
      status: 'cancelled',
    },
  });

  console.log(`[CRON] Cancelled ${result.count} stale orders`);
  return result.count;
}
