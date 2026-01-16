import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/infrastructure/payments/stripe-client';
import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';
import { randomUUID } from 'crypto';
import {
  sendOrderStatusUpdate,
  sendPaymentFailure,
  sendRefundConfirmation,
  sendStudioNewOrder,
} from '@/infrastructure/email';
import Stripe from 'stripe';

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

      // Send studio new order notification (fire and forget)
      (async () => {
        try {
          // Get tenant with owner and order items count
          const [tenant, itemCount] = await Promise.all([
            prisma.tenant.findUnique({
              where: { id: tenantId },
              include: {
                users: {
                  where: { role: 'owner' },
                  take: 1,
                },
              },
            }),
            prisma.orderItem.count({
              where: { orderId },
            }),
          ]);

          const owner = tenant?.users[0];
          if (!owner) {
            console.warn(
              `[EMAIL] No owner found for tenant ${tenantId}, skipping studio notification`
            );
            return;
          }

          await sendStudioNewOrder({
            studioEmail: owner.email,
            studioName: tenant.name,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            itemCount,
            total: order.total,
            currency: order.currency,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
          });
        } catch (err) {
          console.error(
            '[EMAIL] Failed to send studio new order notification:',
            err
          );
        }
      })();
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (!orderId) {
      console.warn('Payment failed event without orderId metadata');
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tenant: true },
    });

    if (!order) {
      console.warn('Payment failed for unknown order:', orderId);
      return NextResponse.json({ received: true });
    }

    // Send failure email (fire and forget)
    sendPaymentFailure({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: order.currency,
      retryUrl: `${env.NEXT_PUBLIC_APP_URL}/order/${order.id}?token=${order.accessToken}`,
    }).catch((err) =>
      console.error('[EMAIL] Failed to send payment failure email:', err)
    );

    console.log('Payment failure handled for order:', order.orderNumber);
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      console.warn('Refund event without payment intent:', charge.id);
      return NextResponse.json({ received: true });
    }

    // Find payment and order
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
      include: { order: true },
    });

    if (!payment) {
      console.warn('Refund for unknown payment:', paymentIntentId);
      return NextResponse.json({ received: true });
    }

    if (payment.status === 'refunded') {
      console.log(`Refund already processed for payment ${paymentIntentId}`);
      return NextResponse.json({ received: true });
    }

    // Update payment and order status
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'refunded' },
      }),
    ]);

    // Send refund confirmation email (fire and forget)
    sendRefundConfirmation({
      customerEmail: payment.order.customerEmail,
      customerName: payment.order.customerName,
      orderNumber: payment.order.orderNumber,
      amount: charge.amount_refunded,
      currency: payment.order.currency,
    }).catch((err) =>
      console.error('[EMAIL] Failed to send refund confirmation:', err)
    );

    console.log('Refund processed for order:', payment.order.orderNumber);
  }

  return NextResponse.json({ received: true });
}
