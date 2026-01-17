import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { createCheckoutSession } from '@/infrastructure/payments/stripe-client';
import { checkCheckoutLimit } from '@/infrastructure/rate-limit';
import { env } from '@/shared/config/env';
import { hasFeature } from '@/shared/lib/features';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimit = await checkCheckoutLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((rateLimit.reset - Date.now()) / 1000)
          ),
        },
      }
    );
  }
  let body: { orderId?: string; accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId, accessToken } = body;

  if (!orderId || !accessToken) {
    return NextResponse.json(
      { error: 'Order ID and access token required' },
      { status: 400 }
    );
  }

  // Look up order by access token (unique, prevents enumeration attacks)
  const order = await prisma.order.findUnique({
    where: { accessToken },
    include: { items: { include: { product: true } }, tenant: true },
  });

  // Validate order exists and ID matches (prevents token reuse attacks)
  if (!order || order.id !== orderId) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Check if tenant has payments feature (requires pro tier or higher)
  const canProcessPayments = await hasFeature(order.tenantId, 'payments');
  if (!canProcessPayments) {
    return NextResponse.json(
      { error: 'Payment processing is not available for this studio' },
      { status: 403 }
    );
  }

  // Only allow checkout for pending orders
  if (order.status !== 'pending') {
    return NextResponse.json(
      {
        error: 'Order cannot be checked out',
        reason: `Order status is ${order.status}`,
      },
      { status: 400 }
    );
  }

  // Prevent checkout if already has a Stripe session
  if (order.stripeSessionId) {
    return NextResponse.json(
      { error: 'Order already has an active checkout session' },
      { status: 400 }
    );
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  const { sessionId, url } = await createCheckoutSession({
    tenantId: order.tenantId,
    orderId: order.id,
    items: order.items.map((item) => ({
      name: item.product.name,
      amount: item.unitPrice,
      quantity: item.quantity,
    })),
    successUrl: `${baseUrl}/order/${order.id}?token=${order.accessToken}&status=success`,
    cancelUrl: `${baseUrl}/order/${order.id}?token=${order.accessToken}&status=cancelled`,
  });

  // Store the session ID on the order to prevent duplicate checkouts
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: sessionId },
  });

  return NextResponse.json({ url });
}
