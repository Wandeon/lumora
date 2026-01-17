import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { authorizeApi } from '@/shared/lib/authorization';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

/**
 * GDPR Data Export Endpoint
 * Returns all user data as JSON download for GDPR compliance
 */
export async function GET() {
  const session = await auth();

  // Any authenticated user can export their own data
  const authResult = authorizeApi(session, 'viewer');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { tenantId, userId } = authResult;

  // Fetch all user data in parallel for efficiency
  const [user, tenant, subscription, orders, galleries, auditLogs] =
    await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Tenant/organization info
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          slug: true,
          name: true,
          tier: true,
          status: true,
          customDomain: true,
          logoUrl: true,
          brandColor: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Subscription info
      prisma.subscription.findUnique({
        where: { tenantId },
        select: {
          tier: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Orders with items
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
          currency: true,
          customerEmail: true,
          customerName: true,
          customerPhone: true,
          shippingAddress: true,
          notes: true,
          paidAt: true,
          shippedAt: true,
          deliveredAt: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              metadata: true,
              product: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      }),

      // Galleries with photo counts
      prisma.gallery.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          status: true,
          visibility: true,
          photoCount: true,
          sessionPrice: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Audit logs for user's tenant
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to recent 1000 entries
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
    ]);

  // Build export data structure
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }
      : null,
    organization: tenant
      ? {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          tier: tenant.tier,
          status: tenant.status,
          customDomain: tenant.customDomain,
          logoUrl: tenant.logoUrl,
          brandColor: tenant.brandColor,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        }
      : null,
    subscription: subscription
      ? {
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
        }
      : null,
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      paidAt: order.paidAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        productType: item.product.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        metadata: item.metadata,
      })),
    })),
    galleries: galleries.map((gallery) => ({
      id: gallery.id,
      code: gallery.code,
      title: gallery.title,
      description: gallery.description,
      status: gallery.status,
      visibility: gallery.visibility,
      photoCount: gallery.photoCount,
      sessionPrice: gallery.sessionPrice,
      expiresAt: gallery.expiresAt?.toISOString() ?? null,
      createdAt: gallery.createdAt.toISOString(),
      updatedAt: gallery.updatedAt.toISOString(),
    })),
    activityLog: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  // Generate filename with current date
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `lumora-export-${dateStr}.json`;

  // Return JSON as downloadable attachment
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
