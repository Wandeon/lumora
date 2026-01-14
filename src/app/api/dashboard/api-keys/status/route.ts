// src/app/api/dashboard/api-keys/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { hasFeature } from '@/shared/lib/features';

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Neovlasteni pristup' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  // Check if tenant has API access (Studio tier)
  const hasApiAccess = await hasFeature(tenantId, 'api_access');
  if (!hasApiAccess) {
    return NextResponse.json(
      { hasKey: false, hasAccess: false },
      { status: 200 }
    );
  }

  // Check if tenant has an API key
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { apiKeyHash: true },
  });

  return NextResponse.json({
    hasKey: !!tenant?.apiKeyHash,
    hasAccess: true,
  });
}
