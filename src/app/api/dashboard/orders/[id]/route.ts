import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { authorizeApi } from '@/shared/lib/authorization';

export const runtime = 'nodejs';

const updateSchema = z.object({
  status: z
    .enum([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  // Any authenticated user can view order details
  const authResult = authorizeApi(session, 'viewer');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, tenantId: authResult.tenantId },
    include: {
      items: {
        include: {
          product: true,
          photo: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  // Editor role or higher required to update order status
  const authResult = authorizeApi(session, 'editor');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error?.issues?.[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  // Update timestamp fields based on status change
  if (parsed.data.status === 'shipped') {
    updateData.shippedAt = new Date();
  } else if (parsed.data.status === 'delivered') {
    updateData.deliveredAt = new Date();
  }

  const result = await prisma.order.updateMany({
    where: { id, tenantId: authResult.tenantId },
    data: updateData,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
