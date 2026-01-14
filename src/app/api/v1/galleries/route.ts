// src/app/api/v1/galleries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/infrastructure/auth/api-key';
import { hasFeature } from '@/shared/lib/features';
import { prisma } from '@/shared/lib/db';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const { valid, tenantId } = await validateApiKey(apiKey);

  if (!valid || !tenantId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Check API access feature (Studio tier)
  const hasApiAccess = await hasFeature(tenantId, 'api_access');
  if (!hasApiAccess) {
    return NextResponse.json(
      { error: 'API access requires Studio tier' },
      { status: 403 }
    );
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId, status: 'published' },
    select: {
      id: true,
      code: true,
      title: true,
      photoCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: galleries });
}
