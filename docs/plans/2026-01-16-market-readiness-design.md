# Market Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all market readiness gaps to prepare Lumora for production launch.

**Architecture:** Add Redis and SMTP containers to existing Docker stack. Implement email service with Nodemailer, rate limiting with @upstash/ratelimit, scheduled jobs with node-cron, and error tracking with Sentry. All changes follow existing DDD patterns in `/src/infrastructure/`.

**Tech Stack:** Node.js, Next.js 16, Prisma, PostgreSQL, Redis, Nodemailer, Sentry

---

## Infrastructure Changes

### Docker Compose Additions

```yaml
# Add to docker-compose.yml

redis:
  image: redis:7-alpine
  container_name: lumora-redis
  restart: unless-stopped
  command: redis-server --appendonly yes
  volumes:
    - redis-data:/data
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 5s
    timeout: 5s
    retries: 5
  networks:
    - lumora-network

smtp:
  image: namshi/smtp
  container_name: lumora-smtp
  restart: unless-stopped
  environment:
    - RELAY_NETWORKS=:172.16.0.0/12:10.0.0.0/8
  networks:
    - lumora-network

# Add to volumes:
redis-data:
  # Add to app environment:
  - REDIS_URL=redis://redis:6379
  - SMTP_HOST=smtp
  - SMTP_PORT=25
  - SENTRY_DSN=${SENTRY_DSN}
```

### New Environment Variables

```env
# .env additions
REDIS_URL=redis://redis:6379
SMTP_HOST=smtp
SMTP_PORT=25
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/xxx
```

---

## Task 1: Email Service

**Files:**

- Create: `src/infrastructure/email/email-client.ts`
- Create: `src/infrastructure/email/email-service.ts`
- Create: `src/infrastructure/email/templates/base.ts`
- Create: `src/infrastructure/email/templates/order-confirmation.ts`
- Create: `src/infrastructure/email/templates/order-status-update.ts`
- Create: `src/infrastructure/email/templates/password-reset.ts`
- Create: `src/infrastructure/email/templates/welcome.ts`
- Modify: `src/shared/config/env.ts` (add SMTP_HOST, SMTP_PORT)

### email-client.ts

```typescript
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/shared/config/env';

let transporter: Transporter | null = null;

export function getEmailTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

export async function verifyEmailTransport(): Promise<boolean> {
  try {
    await getEmailTransport().verify();
    return true;
  } catch {
    return false;
  }
}
```

### email-service.ts

```typescript
import { getEmailTransport } from './email-client';
import { env } from '@/shared/config/env';
import { orderConfirmationTemplate } from './templates/order-confirmation';
import { orderStatusUpdateTemplate } from './templates/order-status-update';
import { passwordResetTemplate } from './templates/password-reset';
import { welcomeTemplate } from './templates/welcome';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const transport = getEmailTransport();
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export async function sendOrderConfirmation(order: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}): Promise<void> {
  const { html, text } = orderConfirmationTemplate(order);
  await sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed: ${order.orderNumber}`,
    html,
    text,
  });
}

export async function sendOrderStatusUpdate(order: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  trackingUrl?: string;
}): Promise<void> {
  const { html, text } = orderStatusUpdateTemplate(order);
  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} - ${order.status}`,
    html,
    text,
  });
}

export async function sendPasswordReset(params: {
  email: string;
  resetUrl: string;
  expiresIn: string;
}): Promise<void> {
  const { html, text } = passwordResetTemplate(params);
  await sendEmail({
    to: params.email,
    subject: 'Reset Your Password',
    html,
    text,
  });
}

export async function sendWelcome(params: {
  email: string;
  userName: string;
  tenantName: string;
  loginUrl: string;
}): Promise<void> {
  const { html, text } = welcomeTemplate(params);
  await sendEmail({
    to: params.email,
    subject: `Welcome to ${params.tenantName}`,
    html,
    text,
  });
}
```

### templates/base.ts

```typescript
export function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; color: #71717a; font-size: 12px;">
        <p>This email was sent by Lumora Photo Studio</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
```

### templates/order-confirmation.ts

```typescript
import { baseTemplate } from './base';

interface OrderConfirmationParams {
  customerName: string;
  orderNumber: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export function orderConfirmationTemplate(params: OrderConfirmationParams): {
  html: string;
  text: string;
} {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${item.name}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">${(item.unitPrice / 100).toFixed(2)} ${params.currency}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Order Confirmed</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Thank you for your order! Your order <strong>${params.orderNumber}</strong> has been confirmed.</p>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr style="background-color: #f4f4f5;">
        <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Item</th>
        <th style="padding: 12px 8px; text-align: center; font-weight: 600;">Qty</th>
        <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Price</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: 600;">Total:</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">${(params.total / 100).toFixed(2)} ${params.currency}</td>
      </tr>
    </table>

    <p style="margin: 0; color: #71717a; font-size: 14px;">We'll notify you when your order ships.</p>
  `;

  const text = `
Order Confirmed

Hi ${params.customerName},

Thank you for your order! Your order ${params.orderNumber} has been confirmed.

Items:
${params.items.map((item) => `- ${item.name} x${item.quantity}: ${(item.unitPrice / 100).toFixed(2)} ${params.currency}`).join('\n')}

Total: ${(params.total / 100).toFixed(2)} ${params.currency}

We'll notify you when your order ships.
  `.trim();

  return { html: baseTemplate(content, 'Order Confirmed'), text };
}
```

### templates/password-reset.ts

```typescript
import { baseTemplate } from './base';

interface PasswordResetParams {
  email: string;
  resetUrl: string;
  expiresIn: string;
}

export function passwordResetTemplate(params: PasswordResetParams): {
  html: string;
  text: string;
} {
  const content = `
    <h1 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Reset Your Password</h1>
    <p style="margin: 0 0 16px; color: #3f3f46;">We received a request to reset your password.</p>
    <p style="margin: 0 0 24px; color: #3f3f46;">Click the button below to create a new password:</p>

    <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>

    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">This link expires in ${params.expiresIn}.</p>
    <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  `;

  const text = `
Reset Your Password

We received a request to reset your password.

Click this link to create a new password:
${params.resetUrl}

This link expires in ${params.expiresIn}.

If you didn't request this, you can safely ignore this email.
  `.trim();

  return { html: baseTemplate(content, 'Reset Your Password'), text };
}
```

---

## Task 2: Password Reset Flow

**Files:**

- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`
- Create: `src/shared/ui/forgot-password-form.tsx`
- Create: `src/shared/ui/reset-password-form.tsx`
- Modify: `prisma/schema.prisma` (add PasswordResetToken model)

### Prisma Schema Addition

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash") @db.VarChar(64)
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

### forgot-password/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/shared/lib/db';
import { sendPasswordReset } from '@/infrastructure/email/email-service';
import { env } from '@/shared/config/env';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  tenantId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: true }); // Don't reveal validation errors
  }

  const { email, tenantId } = parsed.data;

  // Find user (don't reveal if exists)
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });

  if (user) {
    // Generate token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send email
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendPasswordReset({
      email: user.email,
      resetUrl,
      expiresIn: '1 hour',
    });
  }

  // Always return success to prevent enumeration
  return NextResponse.json({ success: true });
}
```

### reset-password/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  token: z.string().length(64),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  // Find valid token
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: { user: true },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 }
    );
  }

  // Update password and mark token used
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
```

---

## Task 3: Rate Limiting

**Files:**

- Create: `src/infrastructure/rate-limit/redis-client.ts`
- Create: `src/infrastructure/rate-limit/rate-limiter.ts`
- Modify: `src/app/api/auth/signup/route.ts` (add rate limit)
- Modify: `src/app/api/auth/forgot-password/route.ts` (add rate limit)
- Modify: `src/app/api/orders/route.ts` (add rate limit)
- Modify: `src/app/api/checkout/route.ts` (add rate limit)
- Modify: `src/shared/config/env.ts` (add REDIS_URL)

### redis-client.ts

```typescript
import { Redis } from 'ioredis';
import { env } from '@/shared/config/env';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL);
  }
  return redis;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const result = await getRedis().ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
```

### rate-limiter.ts

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis-client';

// Create rate limiters for different endpoints
export const signupLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:signup',
});

export const forgotPasswordLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'ratelimit:forgot-password',
});

export const orderLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'ratelimit:order',
});

export const checkoutLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:checkout',
});

export const loginLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'ratelimit:login',
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; reset: number }> {
  const result = await limiter.limit(identifier);
  return { success: result.success, reset: result.reset };
}
```

### Usage in routes (example for signup):

```typescript
import {
  signupLimiter,
  checkRateLimit,
} from '@/infrastructure/rate-limit/rate-limiter';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, reset } = await checkRateLimit(signupLimiter, ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // ... rest of handler
}
```

---

## Task 4: Customer Order Page

**Files:**

- Create: `src/app/order/[id]/page.tsx`
- Create: `src/app/api/orders/[id]/status/route.ts`
- Create: `src/shared/ui/order-status-timeline.tsx`

### api/orders/[id]/status/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Access token required' },
      { status: 401 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id, accessToken: token },
    include: {
      items: {
        include: { product: true, photo: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    currency: order.currency,
    customerName: order.customerName,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  });
}
```

### order/[id]/page.tsx

```typescript
import { notFound } from 'next/navigation';
import { OrderStatusTimeline } from '@/shared/ui/order-status-timeline';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/${id}/status?token=${token}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    notFound();
  }

  const order = await response.json();

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-2">Order {order.orderNumber}</h1>
        <OrderStatusTimeline order={order} />
        {/* Order details display */}
      </div>
    </main>
  );
}
```

---

## Task 5: Scheduled Jobs

**Files:**

- Create: `src/infrastructure/jobs/cleanup-stale-orders.ts`
- Create: `src/infrastructure/jobs/cleanup-expired-tokens.ts`
- Create: `src/infrastructure/jobs/index.ts`
- Modify: `src/instrumentation.ts` (register cron jobs)

### cleanup-stale-orders.ts

```typescript
import { prisma } from '@/shared/lib/db';

const STALE_ORDER_HOURS = 24;

export async function cleanupStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000);

  const result = await prisma.order.updateMany({
    where: {
      status: 'pending',
      createdAt: { lt: cutoff },
    },
    data: {
      status: 'cancelled',
    },
  });

  console.log(`[CRON] Cancelled ${result.count} stale orders`);
  return result.count;
}
```

### cleanup-expired-tokens.ts

```typescript
import { prisma } from '@/shared/lib/db';

const TOKEN_RETENTION_DAYS = 7;

export async function cleanupExpiredTokens(): Promise<number> {
  const cutoff = new Date(
    Date.now() - TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { usedAt: { not: null }, createdAt: { lt: cutoff } },
      ],
    },
  });

  console.log(`[CRON] Deleted ${result.count} expired tokens`);
  return result.count;
}
```

### instrumentation.ts

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const { cleanupStaleOrders } =
      await import('@/infrastructure/jobs/cleanup-stale-orders');
    const { cleanupExpiredTokens } =
      await import('@/infrastructure/jobs/cleanup-expired-tokens');

    // Every hour: cleanup stale orders
    cron.schedule('0 * * * *', () => {
      cleanupStaleOrders().catch(console.error);
    });

    // Daily at 3 AM: cleanup expired tokens
    cron.schedule('0 3 * * *', () => {
      cleanupExpiredTokens().catch(console.error);
    });

    console.log('[CRON] Scheduled jobs registered');
  }
}
```

---

## Task 6: Health Check

**Files:**

- Create: `src/app/api/health/route.ts`

### health/route.ts

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { pingRedis } from '@/infrastructure/rate-limit/redis-client';
import { verifyEmailTransport } from '@/infrastructure/email/email-client';

export const runtime = 'nodejs';

export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis(),
    verifyEmailTransport(),
  ]);

  const [dbCheck, redisCheck, smtpCheck] = checks;

  const services = {
    database: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
    redis:
      redisCheck.status === 'fulfilled' && redisCheck.value ? 'ok' : 'error',
    smtp: smtpCheck.status === 'fulfilled' && smtpCheck.value ? 'ok' : 'error',
  };

  const allHealthy = Object.values(services).every((s) => s === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

---

## Task 7: Sentry Error Tracking

**Files:**

- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts` (wrap with Sentry)

### Setup Commands

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### sentry.server.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
});
```

---

## Task 8: Input Limits

**Files:**

- Modify: `src/app/api/orders/route.ts` (add max items)
- Create: `src/shared/lib/tier-limits.ts`
- Modify: `src/app/api/dashboard/galleries/route.ts` (add gallery limit check)

### tier-limits.ts

```typescript
export const TIER_LIMITS = {
  starter: {
    maxGalleries: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    maxOrdersPerMonth: 100,
  },
  pro: {
    maxGalleries: 50,
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxOrdersPerMonth: 1000,
  },
  studio: {
    maxGalleries: Infinity,
    maxStorageBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    maxOrdersPerMonth: Infinity,
  },
} as const;

export const MAX_ORDER_ITEMS = 100;
```

### Order items validation update:

```typescript
items: z.array(orderItemSchema).min(1).max(MAX_ORDER_ITEMS);
```

---

## Task 9: Audit Logging

**Files:**

- Create: `src/infrastructure/audit/audit-service.ts`
- Modify: Various routes to add audit logging

### audit-service.ts

```typescript
import { prisma } from '@/shared/lib/db';

interface AuditParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.metadata ?? {},
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
  }
}
```

### Usage example:

```typescript
await logAudit({
  tenantId: authResult.tenantId,
  userId: authResult.userId,
  action: 'apikey.rotate',
  entityType: 'Tenant',
  entityId: authResult.tenantId,
  ipAddress: request.headers.get('x-forwarded-for') || undefined,
});
```

---

## Task 10: API Key Timing-Safe Fix

**Files:**

- Modify: `src/infrastructure/auth/api-key.ts`

### Updated validateApiKey:

```typescript
import { timingSafeEqual, createHash } from 'crypto';
import { prisma } from '@/shared/lib/db';

export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; tenantId?: string }> {
  const hash = createHash('sha256').update(key).digest('hex');
  const keyBuffer = Buffer.from(hash, 'hex');

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active', apiKeyHash: { not: null } },
    select: { id: true, apiKeyHash: true },
  });

  for (const tenant of tenants) {
    const storedBuffer = Buffer.from(tenant.apiKeyHash!, 'hex');
    if (
      keyBuffer.length === storedBuffer.length &&
      timingSafeEqual(keyBuffer, storedBuffer)
    ) {
      return { valid: true, tenantId: tenant.id };
    }
  }

  return { valid: false };
}
```

---

## Task 11: Integration Points

**Email triggers to add:**

| Trigger Point              | Email Function        | File to Modify                             |
| -------------------------- | --------------------- | ------------------------------------------ |
| Order creation             | sendOrderConfirmation | src/app/api/orders/route.ts                |
| Stripe webhook (confirmed) | sendOrderStatusUpdate | src/app/api/webhooks/stripe/route.ts       |
| Order status update        | sendOrderStatusUpdate | src/app/api/dashboard/orders/[id]/route.ts |
| Signup success             | sendWelcome           | src/app/api/auth/signup/route.ts           |

---

## Migration

Create migration file: `prisma/migrations/20260116_market_readiness/migration.sql`

```sql
-- PasswordResetToken table
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Dependencies to Install

```bash
npm install nodemailer ioredis @upstash/ratelimit node-cron @sentry/nextjs
npm install -D @types/nodemailer @types/node-cron
```

---

## Summary

| Task                   | Priority | Estimated Effort |
| ---------------------- | -------- | ---------------- |
| 1. Email Service       | Critical | 2 hours          |
| 2. Password Reset      | Critical | 1.5 hours        |
| 3. Rate Limiting       | Critical | 1 hour           |
| 4. Customer Order Page | High     | 1 hour           |
| 5. Scheduled Jobs      | High     | 0.5 hours        |
| 6. Health Check        | Medium   | 0.5 hours        |
| 7. Sentry Setup        | Medium   | 0.5 hours        |
| 8. Input Limits        | Medium   | 0.5 hours        |
| 9. Audit Logging       | Medium   | 1 hour           |
| 10. API Key Fix        | Low      | 0.25 hours       |
| 11. Integration        | Medium   | 1 hour           |

**Total: ~10 hours of implementation**
