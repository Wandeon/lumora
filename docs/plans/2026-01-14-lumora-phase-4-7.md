# Lumora Phase 4-7 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Lumora SaaS platform with Admin Dashboard, E-Commerce, Advanced Features, and production-ready polish including comprehensive test coverage.

**Architecture:** Continue DDD patterns established in Phase 1-3. Add testing pyramid (unit → integration → E2E). Feature-flag gated modules for tier-based access. Repository implementations for all domains.

**Tech Stack:** Vitest (unit/integration tests), Playwright (E2E), React Testing Library, MSW (API mocking), GitHub Actions (CI/CD)

---

## Phase 4.0: Testing Infrastructure (Pre-requisite)

**Goal:** Establish testing foundation before implementing features

### Task 4.0.1: Vitest Setup for Unit/Integration Tests

**Files:**

- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/mocks/prisma.ts`
- Modify: `package.json`

**Step 1: Install testing dependencies**

Run: `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/dom jsdom`

**Step 2: Create Vitest configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/application': path.resolve(__dirname, './src/application'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/generated': path.resolve(__dirname, './src/generated'),
    },
  },
});
```

**Step 3: Create test setup file**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables for tests
vi.mock('@/shared/config/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    AUTH_SECRET: 'test-secret-at-least-32-characters-long',
    R2_PUBLIC_URL: 'https://cdn.test.com',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'Lumora Test',
    NODE_ENV: 'test',
  },
}));
```

**Step 4: Create Prisma mock**

```typescript
// src/test/mocks/prisma.ts
import { vi } from 'vitest';
import { PrismaClient } from '@/generated/prisma';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

vi.mock('@/shared/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '@/shared/lib/db';

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
```

**Step 5: Update package.json scripts**

Add to package.json scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "test: add Vitest configuration and test setup"
```

---

### Task 4.0.2: First Unit Tests - Value Objects

**Files:**

- Create: `src/core/gallery/value-objects/gallery-code.test.ts`
- Create: `src/core/identity/value-objects/tenant-slug.test.ts`

**Step 1: Write GalleryCode tests**

```typescript
// src/core/gallery/value-objects/gallery-code.test.ts
import { describe, it, expect } from 'vitest';
import { GalleryCode } from './gallery-code';

describe('GalleryCode', () => {
  describe('create', () => {
    it('should create valid gallery code', () => {
      const result = GalleryCode.create('SCDY0028');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('SCDY0028');
      }
    });

    it('should normalize to uppercase', () => {
      const result = GalleryCode.create('scdy0028');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('SCDY0028');
      }
    });

    it('should reject empty code', () => {
      const result = GalleryCode.create('');
      expect(result.success).toBe(false);
    });

    it('should reject code shorter than 4 characters', () => {
      const result = GalleryCode.create('ABC');
      expect(result.success).toBe(false);
    });

    it('should reject code longer than 12 characters', () => {
      const result = GalleryCode.create('ABCDEFGHIJKLM');
      expect(result.success).toBe(false);
    });

    it('should reject code with special characters', () => {
      const result = GalleryCode.create('ABC-123');
      expect(result.success).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate code with prefix', () => {
      const code = GalleryCode.generate('SCDY');
      expect(code.value).toMatch(/^SCDY[A-Z0-9]{4}$/);
    });

    it('should generate code without prefix', () => {
      const code = GalleryCode.generate();
      expect(code.value).toMatch(/^[A-Z0-9]{4}$/);
    });
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `npm run test:run src/core/gallery/value-objects/gallery-code.test.ts`
Expected: All tests PASS

**Step 3: Write TenantSlug tests**

```typescript
// src/core/identity/value-objects/tenant-slug.test.ts
import { describe, it, expect } from 'vitest';
import { TenantSlug } from './tenant-slug';

describe('TenantSlug', () => {
  describe('create', () => {
    it('should create valid slug', () => {
      const result = TenantSlug.create('my-studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should normalize to lowercase', () => {
      const result = TenantSlug.create('My-Studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should reject reserved slugs', () => {
      const reservedSlugs = ['www', 'api', 'admin', 'app', 'dashboard'];
      for (const slug of reservedSlugs) {
        const result = TenantSlug.create(slug);
        expect(result.success).toBe(false);
      }
    });

    it('should reject slug shorter than 3 characters', () => {
      const result = TenantSlug.create('ab');
      expect(result.success).toBe(false);
    });

    it('should reject slug with invalid characters', () => {
      const result = TenantSlug.create('my_studio');
      expect(result.success).toBe(false);
    });
  });
});
```

**Step 4: Run all tests**

Run: `npm run test:run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "test: add unit tests for GalleryCode and TenantSlug value objects"
```

---

### Task 4.0.3: GitHub Actions CI Pipeline

**Files:**

- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run db:generate
      - run: npx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run db:generate
      - run: npm run test:run
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run db:generate
      - run: npm run build
        env:
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
          AUTH_SECRET: 'test-secret-at-least-32-characters-long-here'
          AUTH_URL: 'http://localhost:3000'
          STRIPE_SECRET_KEY: 'sk_test_dummy'
          STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy'
          STRIPE_WEBHOOK_SECRET: 'whsec_dummy'
          R2_ACCESS_KEY_ID: 'test'
          R2_SECRET_ACCESS_KEY: 'test'
          R2_BUCKET: 'test'
          R2_ENDPOINT: 'https://test.r2.cloudflarestorage.com'
          R2_PUBLIC_URL: 'https://cdn.test.com'
          RESEND_API_KEY: 're_test'
          EMAIL_FROM: 'test@test.com'
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
          NEXT_PUBLIC_APP_NAME: 'Lumora'
```

**Step 2: Commit**

```bash
git add -A && git commit -m "ci: add GitHub Actions workflow for lint, typecheck, test, build"
```

---

### Task 4.0.4: Application Layer Tests

**Files:**

- Create: `src/application/gallery/commands/create-gallery.test.ts`
- Create: `src/application/gallery/queries/get-gallery-by-code.test.ts`

**Step 1: Write CreateGallery command tests**

```typescript
// src/application/gallery/commands/create-gallery.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGallery } from './create-gallery';

// Mock Prisma
vi.mock('@/shared/lib/db', () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
    gallery: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/shared/lib/db';

describe('createGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create gallery with valid input', async () => {
    const mockTenant = { slug: 'mystudio' };
    const mockGallery = { id: 'gallery-123', code: 'MYST1234' };

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenant as any);
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

    const result = await createGallery({
      tenantId: 'tenant-123',
      title: 'Summer Wedding 2024',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('gallery-123');
      expect(result.value.code).toMatch(/^MYST[A-Z0-9]+$/);
    }
  });

  it('should fail when tenant not found', async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

    const result = await createGallery({
      tenantId: 'invalid-tenant',
      title: 'Test Gallery',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Tenant not found');
    }
  });

  it('should validate title is required', async () => {
    const result = await createGallery({
      tenantId: 'tenant-123',
      title: '',
    });

    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run src/application/gallery/commands/create-gallery.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add -A && git commit -m "test: add unit tests for gallery commands and queries"
```

---

## Phase 4: Admin Dashboard

**Goal:** Studio management interface with gallery CRUD, user management

### Task 4.1: Dashboard Layout and Navigation

**Files:**

- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/shared/ui/dashboard-nav.tsx`
- Create: `src/shared/ui/dashboard-header.tsx`

**Step 1: Create dashboard navigation component**

```tsx
// src/shared/ui/dashboard-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Pregled',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/galleries',
    label: 'Galerije',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/orders',
    label: 'Narudžbe',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/products',
    label: 'Proizvodi',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Postavke',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Lumora</h1>
        <p className="text-sm text-gray-400">Studio Dashboard</p>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

**Step 2: Create dashboard header component**

```tsx
// src/shared/ui/dashboard-header.tsx
import { auth } from '@/infrastructure/auth/auth';

export async function DashboardHeader() {
  const session = await auth();

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400">{session.user.email}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
```

**Step 3: Create dashboard layout**

```tsx
// src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/infrastructure/auth/auth';
import { DashboardNav } from '@/shared/ui/dashboard-nav';
import { DashboardHeader } from '@/shared/ui/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Step 4: Create dashboard home page**

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

interface DashboardStats {
  galleryCount: number;
  photoCount: number;
  orderCount: number;
  revenue: number;
}

async function getStats(tenantId: string): Promise<DashboardStats> {
  const [galleryCount, photoCount, orderCount, revenue] = await Promise.all([
    prisma.gallery.count({ where: { tenantId } }),
    prisma.photo.count({
      where: { gallery: { tenantId } },
    }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: { tenantId, status: 'completed' },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    galleryCount,
    photoCount,
    orderCount,
    revenue: revenue._sum.totalAmount || 0,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return <div>Tenant not found</div>;
  }

  const stats = await getStats(tenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Pregled</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Galerije" value={stats.galleryCount} icon="📷" />
        <StatCard title="Fotografije" value={stats.photoCount} icon="🖼️" />
        <StatCard title="Narudžbe" value={stats.orderCount} icon="📦" />
        <StatCard
          title="Prihod"
          value={`€${(stats.revenue / 100).toFixed(2)}`}
          icon="💰"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add dashboard layout and navigation"
```

---

### Task 4.2: Gallery Management CRUD

**Files:**

- Create: `src/app/(dashboard)/dashboard/galleries/page.tsx`
- Create: `src/app/(dashboard)/dashboard/galleries/new/page.tsx`
- Create: `src/app/(dashboard)/dashboard/galleries/[id]/page.tsx`
- Create: `src/app/api/dashboard/galleries/route.ts`
- Create: `src/shared/ui/gallery-table.tsx`
- Test: `src/app/api/dashboard/galleries/route.test.ts`

**Step 1: Create gallery list API**

```typescript
// src/app/api/dashboard/galleries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { createGallery } from '@/application/gallery/commands/create-gallery';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json(galleries);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const result = await createGallery({
    tenantId: session.user.tenantId,
    title: body.title,
    description: body.description,
    visibility: body.visibility,
    sessionPrice: body.sessionPrice,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.value, { status: 201 });
}
```

**Step 2: Write API test**

```typescript
// src/app/api/dashboard/galleries/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/infrastructure/auth/auth', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/shared/lib/db', () => ({
  prisma: {
    gallery: {
      findMany: vi.fn(),
    },
  },
}));

// Mock createGallery
vi.mock('@/application/gallery/commands/create-gallery', () => ({
  createGallery: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { createGallery } from '@/application/gallery/commands/create-gallery';

describe('Dashboard Galleries API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard/galleries', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/dashboard/galleries'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return galleries for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { tenantId: 'tenant-123' },
      } as any);

      vi.mocked(prisma.gallery.findMany).mockResolvedValue([
        { id: 'g1', title: 'Gallery 1', code: 'TEST1234' },
      ] as any);

      const request = new NextRequest(
        'http://localhost/api/dashboard/galleries'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Gallery 1');
    });
  });

  describe('POST /api/dashboard/galleries', () => {
    it('should create gallery with valid input', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { tenantId: 'tenant-123' },
      } as any);

      vi.mocked(createGallery).mockResolvedValue({
        success: true,
        value: { id: 'new-gallery', code: 'NEW12345' },
      });

      const request = new NextRequest(
        'http://localhost/api/dashboard/galleries',
        {
          method: 'POST',
          body: JSON.stringify({ title: 'New Gallery' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-gallery');
    });
  });
});
```

**Step 3: Run tests**

Run: `npm run test:run src/app/api/dashboard/galleries/route.test.ts`
Expected: All tests PASS

**Step 4: Create gallery table component**

```tsx
// src/shared/ui/gallery-table.tsx
'use client';

import Link from 'next/link';

interface Gallery {
  id: string;
  code: string;
  title: string;
  status: string;
  photoCount: number;
  createdAt: string;
}

interface GalleryTableProps {
  galleries: Gallery[];
}

export function GalleryTable({ galleries }: GalleryTableProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Kod
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Naziv
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Fotografije
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Kreirano
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
              Akcije
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {galleries.map((gallery) => (
            <tr key={gallery.id} className="hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <code className="text-emerald-400 font-mono">
                  {gallery.code}
                </code>
              </td>
              <td className="px-4 py-3 text-white">{gallery.title}</td>
              <td className="px-4 py-3">
                <StatusBadge status={gallery.status} />
              </td>
              <td className="px-4 py-3 text-gray-300">{gallery.photoCount}</td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(gallery.createdAt).toLocaleDateString('hr-HR')}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/galleries/${gallery.id}`}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Uredi
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-300',
    published: 'bg-emerald-600/20 text-emerald-400',
    archived: 'bg-amber-600/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    draft: 'Skica',
    published: 'Objavljeno',
    archived: 'Arhivirano',
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}
```

**Step 5: Create galleries list page**

```tsx
// src/app/(dashboard)/dashboard/galleries/page.tsx
import Link from 'next/link';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { GalleryTable } from '@/shared/ui/gallery-table';

export default async function GalleriesPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return null;
  }

  const galleries = await prisma.gallery.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { photos: true } },
    },
  });

  const formattedGalleries = galleries.map((g) => ({
    id: g.id,
    code: g.code,
    title: g.title,
    status: g.status,
    photoCount: g._count.photos,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Galerije</h1>
        <Link
          href="/dashboard/galleries/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          + Nova galerija
        </Link>
      </div>

      {formattedGalleries.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">Nemate još nijednu galeriju</p>
          <Link
            href="/dashboard/galleries/new"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Kreirajte prvu galeriju →
          </Link>
        </div>
      ) : (
        <GalleryTable galleries={formattedGalleries} />
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add gallery CRUD with tests"
```

---

### Task 4.3: Login Page and Auth Flow

**Files:**

- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/shared/ui/login-form.tsx`
- Create: `src/app/api/auth/register/route.ts`

**Step 1: Create login form component**

```tsx
// src/shared/ui/login-form.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Neispravan email ili lozinka');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="vas@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Lozinka
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg
                   hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Prijava...' : 'Prijavi se'}
      </button>
    </form>
  );
}
```

**Step 2: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/shared/ui/login-form';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Lumora</h1>
            <p className="text-gray-400 mt-1">Prijavite se u svoj studio</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(auth): add login page and form"
```

---

## Phase 5: E-Commerce Module (Pro Tier)

### Task 5.1: Product Catalog

**Files:**

- Create: `src/application/catalog/commands/create-product.ts`
- Create: `src/application/catalog/queries/get-products.ts`
- Create: `src/app/api/dashboard/products/route.ts`
- Create: `src/app/(dashboard)/dashboard/products/page.tsx`
- Test: `src/application/catalog/commands/create-product.test.ts`

**Step 1: Create product command**

```typescript
// src/application/catalog/commands/create-product.ts
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';
import { hasFeature } from '@/shared/lib/features';

export const createProductSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['print', 'digital', 'magnet', 'canvas', 'album', 'other']),
  basePrice: z.number().int().positive(), // in cents
  options: z.record(z.any()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export async function createProduct(
  input: CreateProductInput
): Promise<Result<{ id: string }, string>> {
  const validated = createProductSchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(validated.error.message);
  }

  const { tenantId, name, description, type, basePrice, options } =
    validated.data;

  // Check feature access
  const hasAccess = await hasFeature(tenantId, 'print_orders');
  if (!hasAccess) {
    return Result.fail('Product catalog requires Pro tier or higher');
  }

  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      tenantId,
      name,
      description,
      type,
      basePrice,
      options: options || {},
    },
  });

  return Result.ok({ id: product.id });
}
```

**Step 2: Write product command test**

```typescript
// src/application/catalog/commands/create-product.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct } from './create-product';

vi.mock('@/shared/lib/db', () => ({
  prisma: {
    product: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/features', () => ({
  hasFeature: vi.fn(),
}));

import { prisma } from '@/shared/lib/db';
import { hasFeature } from '@/shared/lib/features';

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create product when tenant has feature access', async () => {
    vi.mocked(hasFeature).mockResolvedValue(true);
    vi.mocked(prisma.product.create).mockResolvedValue({
      id: 'product-123',
      name: 'Print 10x15',
    } as any);

    const result = await createProduct({
      tenantId: 'tenant-123',
      name: 'Print 10x15',
      type: 'print',
      basePrice: 500,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('product-123');
    }
  });

  it('should fail when tenant lacks feature access', async () => {
    vi.mocked(hasFeature).mockResolvedValue(false);

    const result = await createProduct({
      tenantId: 'starter-tenant',
      name: 'Print 10x15',
      type: 'print',
      basePrice: 500,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Pro tier');
    }
  });
});
```

**Step 3: Run tests**

Run: `npm run test:run src/application/catalog/commands/create-product.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(catalog): add product creation with tier check"
```

---

### Task 5.2: Stripe Checkout Integration

**Files:**

- Create: `src/infrastructure/payments/stripe-client.ts`
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`

**Step 1: Create Stripe client**

```typescript
// src/infrastructure/payments/stripe-client.ts
import Stripe from 'stripe';
import { env } from '@/shared/config/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function createCheckoutSession(params: {
  tenantId: string;
  orderId: string;
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: params.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      tenantId: params.tenantId,
      orderId: params.orderId,
    },
  });

  return session.url!;
}
```

**Step 2: Create checkout API**

```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { createCheckoutSession } from '@/infrastructure/payments/stripe-client';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, tenant: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const checkoutUrl = await createCheckoutSession({
    tenantId: order.tenantId,
    orderId: order.id,
    items: order.items.map((item) => ({
      name: item.productName,
      amount: item.unitPrice,
      quantity: item.quantity,
    })),
    successUrl: `${baseUrl}/order/${order.id}/success`,
    cancelUrl: `${baseUrl}/order/${order.id}/cancel`,
  });

  return NextResponse.json({ url: checkoutUrl });
}
```

**Step 3: Create Stripe webhook handler**

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/infrastructure/payments/stripe-client';
import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          id: randomUUID(),
          tenantId: session.metadata!.tenantId,
          orderId,
          amount: session.amount_total!,
          currency: session.currency!.toUpperCase(),
          status: 'completed',
          provider: 'stripe',
          providerPaymentId: session.payment_intent as string,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(payments): add Stripe checkout and webhook handling"
```

---

## Phase 6: Advanced Features (Studio Tier)

### Task 6.1: API Key Management

**Files:**

- Create: `src/app/api/v1/galleries/route.ts`
- Create: `src/infrastructure/auth/api-key.ts`
- Create: `src/app/(dashboard)/dashboard/settings/api/page.tsx`

**Step 1: Create API key utilities**

```typescript
// src/infrastructure/auth/api-key.ts
import { prisma } from '@/shared/lib/db';
import { randomBytes, createHash } from 'crypto';

export function generateApiKey(): { key: string; hash: string } {
  const key = `lum_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, hash };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  tenantId?: string;
}> {
  if (!key.startsWith('lum_')) {
    return { valid: false };
  }

  const hash = hashApiKey(key);

  const tenant = await prisma.tenant.findFirst({
    where: { apiKeyHash: hash, status: 'active' },
    select: { id: true },
  });

  if (!tenant) {
    return { valid: false };
  }

  return { valid: true, tenantId: tenant.id };
}
```

**Step 2: Create public API endpoint**

```typescript
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

  // Check API access feature
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
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(api): add public API with key authentication"
```

---

## Phase 7: Polish & Launch

### Task 7.1: E2E Tests with Playwright

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/gallery-access.spec.ts`
- Create: `e2e/dashboard.spec.ts`

**Step 1: Install Playwright**

Run: `npm install -D @playwright/test`
Run: `npx playwright install`

**Step 2: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Create gallery access E2E test**

```typescript
// e2e/gallery-access.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gallery Access', () => {
  test('should show error for invalid gallery code', async ({ page }) => {
    await page.goto('/mystudio');
    await page.fill('input[type="text"]', 'INVALID');
    await page.click('button[type="submit"]');

    // Should redirect to gallery page and show not found
    await expect(page).toHaveURL(/\/mystudio\/gallery\?code=INVALID/);
  });

  test('should navigate to gallery with valid code', async ({ page }) => {
    // This test requires a seeded database with a valid gallery
    await page.goto('/mystudio');
    await page.fill('input[type="text"]', 'TEST1234');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/mystudio\/gallery\?code=TEST1234/);
  });
});
```

**Step 4: Add E2E script to package.json**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Step 5: Commit**

```bash
git add -A && git commit -m "test: add Playwright E2E testing setup"
```

---

### Task 7.2: Update CI for E2E Tests

**Files:**

- Modify: `.github/workflows/ci.yml`

**Step 1: Add E2E job to CI**

Add to `.github/workflows/ci.yml`:

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run test:e2e
      env:
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
        # ... other env vars
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

**Step 2: Commit**

```bash
git add -A && git commit -m "ci: add E2E testing to GitHub Actions"
```

---

### Task 7.3: Documentation Update

**Files:**

- Modify: `README.md`
- Create: `docs/API.md`

**Step 1: Update README with testing info**

Add to README.md:

````markdown
## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```
````

## API Documentation

See [docs/API.md](docs/API.md) for public API documentation.

````

**Step 2: Create API documentation**

```markdown
# Lumora Public API

## Authentication

All API requests require an API key in the `X-API-Key` header.

API keys are available for Studio tier tenants in Dashboard > Settings > API.

## Endpoints

### GET /api/v1/galleries

List all published galleries for your studio.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "SCDY0028",
      "title": "Summer Wedding 2024",
      "photoCount": 150,
      "createdAt": "2024-06-15T10:00:00Z"
    }
  ]
}
````

### Rate Limits

- 100 requests per minute
- 10,000 requests per day

````

**Step 3: Commit**

```bash
git add -A && git commit -m "docs: add testing guide and API documentation"
````

---

## Summary

| Phase | Tasks       | Description                                |
| ----- | ----------- | ------------------------------------------ |
| 4.0   | 4.0.1-4.0.4 | Testing Infrastructure (Vitest, CI, Tests) |
| 4     | 4.1-4.3     | Admin Dashboard (Layout, CRUD, Auth)       |
| 5     | 5.1-5.2     | E-Commerce (Products, Stripe)              |
| 6     | 6.1         | Advanced Features (API Keys)               |
| 7     | 7.1-7.3     | Polish (E2E Tests, CI, Docs)               |

**Total Tasks:** 12 tasks with tests and documentation

---

**Plan complete and saved to `docs/plans/2026-01-14-lumora-phase-4-7.md`.**
