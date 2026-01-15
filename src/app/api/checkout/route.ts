import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { createCheckoutSession } from '@/infrastructure/payments/stripe-client';
import { env } from '@/shared/config/env';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, tenant: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  const checkoutUrl = await createCheckoutSession({
    tenantId: order.tenantId,
    orderId: order.id,
    items: order.items.map((item) => ({
      name: item.product.name,
      amount: item.unitPrice,
      quantity: item.quantity,
    })),
    successUrl: `${baseUrl}/order/${order.id}/success`,
    cancelUrl: `${baseUrl}/order/${order.id}/cancel`,
  });

  return NextResponse.json({ url: checkoutUrl });
}
