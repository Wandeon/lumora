import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { authorizeApi } from '@/shared/lib/authorization';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();

  // Any authenticated user can view subscription status
  const authResult = authorizeApi(session, 'viewer');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const tenantId = authResult.tenantId;

  // Get tenant's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: 'Pretplata nije pronadena' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    tier: subscription.tier,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    hasStripeCustomer: !!subscription.stripeCustomerId,
  });
}
