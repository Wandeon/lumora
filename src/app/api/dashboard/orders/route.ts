import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  });

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    status: o.status,
    total: o.total,
    currency: o.currency,
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json(formattedOrders);
}
