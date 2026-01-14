import Stripe from 'stripe';
import { env } from '@/shared/config/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function createCheckoutSession(params: {
  tenantId: string;
  orderId: string;
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: params.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      tenantId: params.tenantId,
      orderId: params.orderId,
    },
  });

  return session.url!;
}
