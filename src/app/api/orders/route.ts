import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { Prisma } from '@/generated/prisma';
import { randomBytes } from 'crypto';
import { checkOrderLimit } from '@/infrastructure/rate-limit';
import { MAX_ORDER_ITEMS } from '@/shared/lib/tier-limits';
import { sendOrderConfirmation } from '@/infrastructure/email';

export const runtime = 'nodejs';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  photoId: z.string().uuid().optional(),
  quantity: z.number().int().positive().default(1),
});

const createOrderSchema = z.object({
  galleryId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().max(50).optional(),
  shippingAddress: z
    .object({
      street: z.string().max(500),
      city: z.string().max(100),
      postalCode: z.string().max(20),
      country: z.string().max(100),
    })
    .optional(),
  items: z.array(orderItemSchema).min(1).max(MAX_ORDER_ITEMS),
  notes: z.string().max(1000).optional(),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimit = await checkOrderLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((rateLimit.reset - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Validate gallery exists and get tenant
  const gallery = await prisma.gallery.findUnique({
    where: { id: data.galleryId },
    select: { id: true, tenantId: true, status: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  if (gallery.status !== 'published') {
    return NextResponse.json(
      { error: 'Gallery is not available for orders' },
      { status: 400 }
    );
  }

  // Validate all products exist and belong to the tenant
  // Use Set to get unique product IDs (same product can appear multiple times in items)
  const uniqueProductIds = [
    ...new Set(data.items.map((item) => item.productId)),
  ];
  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueProductIds },
      tenantId: gallery.tenantId,
      isActive: true,
    },
  });

  if (products.length !== uniqueProductIds.length) {
    return NextResponse.json(
      { error: 'One or more products not found or inactive' },
      { status: 400 }
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all photoIds belong to the gallery
  const photoIds = data.items
    .map((item) => item.photoId)
    .filter((id): id is string => id !== undefined);

  if (photoIds.length > 0) {
    const uniquePhotoIds = [...new Set(photoIds)];
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: uniquePhotoIds },
        galleryId: data.galleryId,
      },
      select: { id: true },
    });

    if (photos.length !== uniquePhotoIds.length) {
      return NextResponse.json(
        { error: 'One or more photos not found in this gallery' },
        { status: 400 }
      );
    }
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const totalPrice = product.price * item.quantity;
    subtotal += totalPrice;

    return {
      product: { connect: { id: item.productId } },
      gallery: { connect: { id: data.galleryId } },
      ...(item.photoId && { photo: { connect: { id: item.photoId } } }),
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
    };
  });

  // Create order with items in a transaction
  const order = await prisma.order.create({
    data: {
      tenantId: gallery.tenantId,
      orderNumber: generateOrderNumber(),
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone ?? null,
      shippingAddress: data.shippingAddress ?? Prisma.JsonNull,
      notes: data.notes ?? null,
      subtotal,
      total: subtotal, // No tax/discount for now
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  // Send order confirmation email (fire and forget)
  sendOrderConfirmation({
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    total: order.total,
    currency: order.currency,
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }).catch((err) =>
    console.error('[EMAIL] Failed to send order confirmation:', err)
  );

  return NextResponse.json(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      checkoutUrl: `/api/checkout`, // Client should POST { orderId, accessToken } here
    },
    { status: 201 }
  );
}
