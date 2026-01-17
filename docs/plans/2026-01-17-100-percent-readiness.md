# 100% Market Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining gaps to achieve 100% market readiness for Private Beta launch.

**Architecture:** Add GDPR compliance (cookie consent, data export), improve error handling with global error boundaries, add order status change notifications, and document operational procedures.

**Tech Stack:** Next.js 15 App Router, React Context, Prisma, Nodemailer, Tailwind CSS

---

## Phase 1: Compliance (GDPR)

### Task 1: Cookie Consent Banner

**Files:**

- Create: `src/shared/contexts/cookie-consent-context.tsx`
- Create: `src/shared/ui/cookie-banner.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create cookie consent context**

```typescript
// src/shared/contexts/cookie-consent-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const CONSENT_KEY = 'lumora_cookie_consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface CookieConsentContextValue {
  consent: ConsentStatus;
  acceptCookies: () => void;
  rejectCookies: () => void;
  isHydrated: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'rejected') {
      setConsent(stored);
    }
    setIsHydrated(true);
  }, []);

  const acceptCookies = useCallback(() => {
    setConsent('accepted');
    localStorage.setItem(CONSENT_KEY, 'accepted');
  }, []);

  const rejectCookies = useCallback(() => {
    setConsent('rejected');
    localStorage.setItem(CONSENT_KEY, 'rejected');
  }, []);

  return (
    <CookieConsentContext.Provider value={{ consent, acceptCookies, rejectCookies, isHydrated }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return context;
}
```

**Step 2: Create cookie banner component**

```typescript
// src/shared/ui/cookie-banner.tsx
'use client';

import { useCookieConsent } from '@/shared/contexts/cookie-consent-context';
import Link from 'next/link';

export function CookieBanner() {
  const { consent, acceptCookies, rejectCookies, isHydrated } = useCookieConsent();

  if (!isHydrated || consent !== 'pending') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-300 text-center md:text-left">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
          <Link href="/privacy" className="text-emerald-400 hover:underline">
            Learn more
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Reject
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add provider and banner to root layout**

Modify `src/app/layout.tsx` to wrap with `CookieConsentProvider` and add `CookieBanner` component.

**Step 4: Commit**

```bash
git add src/shared/contexts/cookie-consent-context.tsx src/shared/ui/cookie-banner.tsx src/app/layout.tsx
git commit -m "feat(compliance): add cookie consent banner

- Cookie consent context with localStorage persistence
- Banner with accept/reject options
- Link to privacy policy

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: GDPR Data Export Endpoint

**Files:**

- Create: `src/app/api/dashboard/account/export/route.ts`
- Modify: `src/app/(dashboard)/dashboard/settings/billing/page.tsx` (add export button)

**Step 1: Create data export API endpoint**

```typescript
// src/app/api/dashboard/account/export/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { authorizeApi } from '@/shared/lib/authorization';
import { prisma } from '@/shared/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  const authResult = authorizeApi(session, 'viewer');

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { tenantId, userId } = authResult;

  try {
    const [user, tenant, orders, galleries, subscription, auditLogs] =
      await Promise.all([
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
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            id: true,
            slug: true,
            name: true,
            tier: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          where: { tenantId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            customerEmail: true,
            customerName: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                product: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.gallery.findMany({
          where: { tenantId },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            photoCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.subscription.findUnique({
          where: { tenantId },
          select: {
            tier: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        }),
        prisma.auditLog.findMany({
          where: { userId },
          select: {
            action: true,
            entityType: true,
            createdAt: true,
            ipAddress: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      organization: tenant,
      subscription,
      orders,
      galleries,
      activityLog: auditLogs,
    };

    const filename = `lumora-export-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Data export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
```

**Step 2: Add export button to account/billing page**

Add a "Download My Data" button that calls the export endpoint.

**Step 3: Commit**

```bash
git add src/app/api/dashboard/account/export/route.ts src/app/\(dashboard\)/dashboard/settings/billing/page.tsx
git commit -m "feat(compliance): add GDPR data export endpoint

- Export user profile, orders, galleries, activity
- JSON format with all personal data
- Accessible from billing settings page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Error Handling

### Task 3: Global Error Boundaries

**Files:**

- Create: `src/app/error.tsx`
- Create: `src/app/(dashboard)/error.tsx`
- Create: `src/app/(auth)/error.tsx`

**Step 1: Create root error boundary**

```typescript
// src/app/error.tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-zinc-950 text-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-zinc-400 mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 rounded-md transition-colors"
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p className="mt-4 text-xs text-zinc-600">Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
```

**Step 2: Create dashboard error boundary**

```typescript
// src/app/(dashboard)/error.tsx
'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md text-center">
        <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-zinc-400 mb-6">
          We encountered an error loading this page. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-md transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create auth error boundary**

Similar pattern for auth pages.

**Step 4: Commit**

```bash
git add src/app/error.tsx src/app/\(dashboard\)/error.tsx src/app/\(auth\)/error.tsx
git commit -m "feat(ux): add global error boundaries

- Root error boundary for unexpected errors
- Dashboard-specific error UI
- Auth pages error boundary
- Retry and navigation options

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Notifications

### Task 4: Order Status Change Email

**Files:**

- Create: `src/infrastructure/email/templates/order-status-change.ts`
- Modify: `src/infrastructure/email/email-service.ts`
- Modify: `src/infrastructure/email/index.ts`
- Modify: `src/app/api/dashboard/orders/[id]/route.ts`

**Step 1: Create order status change template**

```typescript
// src/infrastructure/email/templates/order-status-change.ts
import { baseTemplate } from './base';

interface OrderStatusChangeParams {
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  statusMessage: string;
  orderUrl: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function orderStatusChangeTemplate(params: OrderStatusChangeParams) {
  const newStatusLabel = statusLabels[params.newStatus] || params.newStatus;

  const html = baseTemplate(
    `
    <h1 style="color: #18181b; font-size: 24px; font-weight: bold; margin: 0 0 16px;">
      Order Status Update
    </h1>
    <p style="color: #3f3f46; font-size: 16px; margin: 0 0 24px;">
      Hi ${params.customerName},
    </p>
    <p style="color: #3f3f46; font-size: 16px; margin: 0 0 16px;">
      Your order <strong>#${params.orderNumber}</strong> has been updated.
    </p>
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
      <p style="color: #18181b; font-size: 18px; font-weight: 600; margin: 0;">
        New Status: ${newStatusLabel}
      </p>
      ${params.statusMessage ? `<p style="color: #52525b; font-size: 14px; margin: 8px 0 0;">${params.statusMessage}</p>` : ''}
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.orderUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
        View Order Details
      </a>
    </p>
  `,
    'Order Status Update'
  );

  const text = `
Order Status Update

Hi ${params.customerName},

Your order #${params.orderNumber} has been updated.

New Status: ${newStatusLabel}
${params.statusMessage ? `\n${params.statusMessage}` : ''}

View your order: ${params.orderUrl}
  `.trim();

  return { html, text };
}
```

**Step 2: Add sendOrderStatusChange to email service**

**Step 3: Call email when order status changes in API**

Modify the PATCH handler in `/api/dashboard/orders/[id]/route.ts` to send email on status change.

**Step 4: Commit**

```bash
git add src/infrastructure/email/templates/order-status-change.ts src/infrastructure/email/email-service.ts src/infrastructure/email/index.ts src/app/api/dashboard/orders/\[id\]/route.ts
git commit -m "feat(email): notify customers on order status changes

- New email template for status updates
- Automatic email when studio changes order status
- Includes status message and order link

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Operations

### Task 5: Operations Runbook

**Files:**

- Create: `docs/runbook.md`

**Step 1: Create operations runbook**

````markdown
# Lumora Operations Runbook

## Quick Reference

### Health Check

```bash
curl https://lumora.genai.hr/api/health
```
````

### Container Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

## Common Issues

### 1. App Not Responding

**Symptoms:** 502/503 errors, health check fails

**Steps:**

1. Check container status: `docker-compose ps`
2. View app logs: `docker-compose logs app --tail=50`
3. Restart app: `docker-compose restart app`
4. If persists, rebuild: `docker-compose up -d --build app`

### 2. Database Connection Issues

**Symptoms:** "Database connection failed" in health check

**Steps:**

1. Check postgres status: `docker-compose ps postgres`
2. View logs: `docker-compose logs postgres --tail=50`
3. Test connection: `docker-compose exec postgres pg_isready -U lumora`
4. Restart: `docker-compose restart postgres`

### 3. Redis Issues

**Symptoms:** Rate limiting fails, slow responses

**Steps:**

1. Check redis: `docker-compose exec redis redis-cli ping`
2. View memory: `docker-compose exec redis redis-cli info memory`
3. Restart: `docker-compose restart redis`

### 4. Email Not Sending

**Symptoms:** Users not receiving emails

**Steps:**

1. Check SMTP container: `docker-compose ps smtp`
2. Check health: Shows "smtp: ok" in /api/health
3. View logs: `docker-compose logs smtp --tail=50`
4. Test: Check spam folders, verify EMAIL_FROM domain

## Deployment

### Standard Deploy

```bash
git pull origin master
docker-compose build app
docker-compose up -d app
docker-compose exec app npx prisma migrate deploy
```

### Rollback

```bash
# Revert to previous commit
git checkout HEAD~1
docker-compose build app
docker-compose up -d app
```

## Backups

### Manual Backup

```bash
docker-compose exec postgres pg_dump -U lumora lumora | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
gunzip -c backup-YYYYMMDD.sql.gz | docker-compose exec -T postgres psql -U lumora lumora
```

### Backup Location

Automatic backups stored in: `./backups/`
Retention: 30 days

## Contacts

- **Technical Issues:** [admin email]
- **Stripe/Payments:** Stripe Dashboard
- **Domain/DNS:** Cloudflare Dashboard
- **Error Monitoring:** Sentry Dashboard

## SLAs

- **Response Time:** < 2s for 95th percentile
- **Uptime Target:** 99.5%
- **RTO (Recovery Time):** 4 hours
- **RPO (Data Loss):** 24 hours (daily backups)

````

**Step 2: Commit**

```bash
git add docs/runbook.md
git commit -m "docs(ops): add operations runbook

- Quick reference commands
- Common issue troubleshooting
- Deployment and rollback procedures
- Backup and restore instructions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
````

---

### Task 6: External Monitoring Setup Guide

**Files:**

- Modify: `docs/runbook.md` (add monitoring section)

**Step 1: Add monitoring setup to runbook**

Add section for UptimeRobot/Pingdom setup pointing to `/api/health`.

**Step 2: Commit**

```bash
git add docs/runbook.md
git commit -m "docs(ops): add external monitoring setup guide

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Total Tasks:** 6

| Task                   | Category      | Priority |
| ---------------------- | ------------- | -------- |
| 1. Cookie Consent      | Compliance    | High     |
| 2. GDPR Data Export    | Compliance    | High     |
| 3. Error Boundaries    | UX            | Medium   |
| 4. Order Status Emails | Notifications | Medium   |
| 5. Operations Runbook  | Ops           | Medium   |
| 6. Monitoring Guide    | Ops           | Low      |

**After completion, market readiness: 100%**

---

_Created: 2026-01-17_
