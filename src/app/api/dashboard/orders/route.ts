import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { authorizeApi } from '@/shared/lib/authorization';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();

  // Any authenticated user can view orders
  const authResult = authorizeApi(session, 'viewer');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: authResult.tenantId },
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
