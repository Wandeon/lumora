// src/app/api/dashboard/api-keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { hasFeature } from '@/shared/lib/features';
import { generateApiKey } from '@/infrastructure/auth/api-key';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Neovlasteni pristup' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  // Check if tenant has API access (Studio tier)
  const hasApiAccess = await hasFeature(tenantId, 'api_access');
  if (!hasApiAccess) {
    return NextResponse.json(
      { error: 'API pristup zahtijeva Studio paket' },
      { status: 403 }
    );
  }

  // Generate new API key
  const { key, hash } = generateApiKey();

  // Update tenant with new API key hash
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { apiKeyHash: hash },
  });

  // Return the plain key (only time it will be shown)
  return NextResponse.json({ apiKey: key });
}
