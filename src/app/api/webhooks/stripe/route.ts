import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/infrastructure/payments/stripe-client';
import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';
import { randomUUID } from 'crypto';
import { sendOrderStatusUpdate } from '@/infrastructure/email';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

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
      const paymentIntentId = session.payment_intent as string;

      // Idempotency check: don't process duplicate webhooks
      const existingPayment = await prisma.payment.findFirst({
        where: { providerPaymentId: paymentIntentId },
      });

      if (existingPayment) {
        console.log(`Webhook already processed for payment ${paymentIntentId}`);
        return NextResponse.json({ received: true });
      }

      // Validate order exists and belongs to the claimed tenant
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        console.error(
          `Order ${orderId} not found or tenant mismatch for tenant ${tenantId}`
        );
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Validate session ID matches the order's stored session
      if (order.stripeSessionId && order.stripeSessionId !== session.id) {
        console.error(
          `Session ID mismatch: expected ${order.stripeSessionId}, got ${session.id}`
        );
        return NextResponse.json(
          { error: 'Session mismatch' },
          { status: 400 }
        );
      }

      // Validate order is in pending status
      if (order.status !== 'pending') {
        console.error(
          `Order ${orderId} is not pending, current status: ${order.status}`
        );
        return NextResponse.json({ received: true }); // Already processed, not an error
      }

      // Validate payment amount matches order total (in cents)
      const paymentAmount = session.amount_total;
      if (paymentAmount !== order.total) {
        console.error(
          `Amount mismatch for order ${orderId}: expected ${order.total}, got ${paymentAmount}`
        );
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // Update order status and set paid timestamp
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'confirmed', paidAt: new Date() },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          id: randomUUID(),
          orderId,
          amount: session.amount_total!,
          currency: session.currency!.toUpperCase(),
          status: 'succeeded',
          provider: 'stripe',
          providerPaymentId: paymentIntentId,
        },
      });

      // Send order status update email (fire and forget)
      sendOrderStatusUpdate({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        status: 'confirmed',
      }).catch((err) =>
        console.error('[EMAIL] Failed to send order status update:', err)
      );
    }
  }

  return NextResponse.json({ received: true });
}
