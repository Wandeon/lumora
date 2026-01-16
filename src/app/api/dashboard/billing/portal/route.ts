import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { authorizeApi } from '@/shared/lib/authorization';
import { stripe } from '@/infrastructure/payments/stripe-client';
import { env } from '@/shared/config/env';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();

  // Only owner or admin can manage billing
  const authResult = authorizeApi(session, 'admin');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const tenantId = authResult.tenantId;

  // Get tenant's subscription with Stripe customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: 'Pretplata nije pronadena' },
      { status: 404 }
    );
  }

  if (!subscription.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Stripe kupac nije konfiguriran' },
      { status: 400 }
    );
  }

  try {
    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Failed to create billing portal session:', error);
    return NextResponse.json(
      { error: 'Greska pri kreiranju sesije za naplatu' },
      { status: 500 }
    );
  }
}
