import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/infrastructure/payments/stripe-client';
import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const tenantId = session.metadata?.tenantId;

    if (orderId && tenantId) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          id: randomUUID(),
          tenantId,
          orderId,
          amount: session.amount_total!,
          currency: session.currency!.toUpperCase(),
          status: 'completed',
          provider: 'stripe',
          providerPaymentId: session.payment_intent as string,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
