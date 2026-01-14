# Lumora SaaS Platform - Complete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready multi-tenant photo studio SaaS platform by systematically extracting patterns from xmas.artemi-media.hr and foto.artemi-media.hr, combining the best of both into a modular, scalable solution.

**Architecture:** Domain-Driven Design with Clean Architecture. Multi-tenant shared database with application-level isolation. Feature flags control module access per tier (Starter/Pro/Studio). Next.js 15 App Router with React Server Components.

**Tech Stack:** Next.js 15, TypeScript (strict), PostgreSQL + Prisma, Tailwind CSS, Auth.js v5, Stripe, Cloudflare R2, Resend, Zod

---

## Extracted Assets from Existing Apps

### From xmas.artemi-media.hr

- CDN URL pattern: `cdn.artemi-media.hr/galleries/{CODE}/web/{SIZE}/{FILENAME}.webp`
- Size variants: 800 (thumb), 2048 (web)
- API response structure for photos
- Modal checkout with product categories
- Gift card/bonus system (€10, €30, €50, €75, €100)
- Coupon code input with validation
- Favorites with heart toggle + count
- PWA manifest with Christmas theme
- Session pricing model (€70)

### From foto.artemi-media.hr

- Dual auth: code-based + email/password
- Multi-gallery per account
- Dark theme UI (#111827 background)
- Navigation patterns (back links)
- Admin login flow
- Croatian localization

---

## Phase 1: Foundation & Core Infrastructure

**Duration Estimate:** Foundation layer
**Goal:** Database, authentication, tenant management, and middleware

### Task 1.1: Database Setup with Prisma

**Files:**

- Modify: `prisma/schema.prisma` (already created)
- Create: `src/infrastructure/persistence/prisma-client.ts`
- Create: `src/shared/lib/db.ts`

**Step 1: Create Prisma client singleton**

```typescript
// src/infrastructure/persistence/prisma-client.ts
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Step 2: Create database helper**

```typescript
// src/shared/lib/db.ts
export { prisma } from '@/infrastructure/persistence/prisma-client';
```

**Step 3: Generate Prisma client**

Run: `npm run db:generate`
Expected: Prisma client generated in `src/generated/prisma`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(db): add Prisma client singleton"
```

---

### Task 1.2: Environment Configuration

**Files:**

- Create: `src/shared/config/env.ts`
- Modify: `.env.example`

**Step 1: Create Zod environment schema**

```typescript
// src/shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Cloudflare R2
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url(),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().email(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Lumora'),

  // Optional
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

// Validate at startup
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(config): add Zod environment validation"
```

---

### Task 1.3: Tenant Context Middleware

**Files:**

- Create: `src/shared/lib/tenant-context.ts`
- Create: `src/infrastructure/auth/middleware.ts`

**Step 1: Create tenant context**

```typescript
// src/shared/lib/tenant-context.ts
import { cache } from 'react';
import { prisma } from './db';
import type { Tenant } from '@/generated/prisma';

export type TenantContext = {
  tenant: Tenant;
  tenantId: string;
};

// Reserved subdomains that should not resolve to tenants
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'dashboard',
  'login',
  'signup',
  'auth',
  'static',
  'assets',
  'cdn',
  'mail',
  'support',
  'help',
  'docs',
  'blog',
  'status',
]);

// Cache tenant resolution per request
export const getTenantFromHost = cache(
  async (host: string): Promise<Tenant | null> => {
    // Check for custom domain first
    const byCustomDomain = await prisma.tenant.findUnique({
      where: { customDomain: host, status: 'active' },
    });
    if (byCustomDomain) return byCustomDomain;

    // Extract subdomain
    const parts = host.split('.');
    if (parts.length < 2) return null;

    const subdomain = parts[0];
    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;

    // Find by slug
    return prisma.tenant.findUnique({
      where: { slug: subdomain, status: 'active' },
    });
  }
);

export const getTenantFromHeader = cache(
  async (tenantId: string): Promise<Tenant | null> => {
    return prisma.tenant.findUnique({
      where: { id: tenantId, status: 'active' },
    });
  }
);
```

**Step 2: Create middleware**

```typescript
// src/infrastructure/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantFromHost,
  getTenantFromHeader,
} from '@/shared/lib/tenant-context';

export async function tenantMiddleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const tenantIdHeader = request.headers.get('x-tenant-id');

  // Try to resolve tenant
  let tenant = tenantIdHeader
    ? await getTenantFromHeader(tenantIdHeader)
    : await getTenantFromHost(host);

  // For main domain, allow marketing pages
  if (!tenant && isMarketingRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Tenant required for app routes
  if (!tenant && isAppRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Attach tenant to headers for downstream use
  const response = NextResponse.next();
  if (tenant) {
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-slug', tenant.slug);
    response.headers.set('x-tenant-tier', tenant.tier);
  }

  return response;
}

function isMarketingRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/about')
  );
}

function isAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/gallery') ||
    pathname.startsWith('/admin')
  );
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(tenant): add multi-tenant context and middleware"
```

---

### Task 1.4: Auth.js Setup

**Files:**

- Create: `src/infrastructure/auth/auth.ts`
- Create: `src/infrastructure/auth/auth.config.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: Install Auth.js**

Run: `npm install next-auth@beta @auth/prisma-adapter bcryptjs`
Run: `npm install -D @types/bcryptjs`

**Step 2: Create auth configuration**

```typescript
// src/infrastructure/auth/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().uuid(),
});

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'Tenant', type: 'hidden' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, tenantId } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId, email } },
          include: { tenant: true },
        });

        if (!user || !user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantTier: user.tenant.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantTier = user.tenantTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
        session.user.tenantTier = token.tenantTier as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
```

**Step 3: Create auth instance**

```typescript
// src/infrastructure/auth/auth.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

**Step 4: Create API route**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/infrastructure/auth/auth';

export const { GET, POST } = handlers;
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(auth): add Auth.js with credentials provider"
```

---

### Task 1.5: Feature Flag Service

**Files:**

- Create: `src/shared/lib/features.ts`

**Step 1: Create feature flag service**

```typescript
// src/shared/lib/features.ts
import { cache } from 'react';
import { prisma } from './db';
import type { TenantTier } from '@/generated/prisma';

// Feature definitions with tier requirements
export const FEATURES = {
  // Starter tier (all)
  galleries: { tier: 'starter', name: 'Galleries' },
  code_access: { tier: 'starter', name: 'Code Access' },
  downloads: { tier: 'starter', name: 'Downloads' },
  favorites: { tier: 'starter', name: 'Favorites' },

  // Pro tier
  print_orders: { tier: 'pro', name: 'Print Orders' },
  payments: { tier: 'pro', name: 'Payments' },
  coupons: { tier: 'pro', name: 'Coupons' },
  gift_cards: { tier: 'pro', name: 'Gift Cards' },

  // Studio tier
  white_label: { tier: 'studio', name: 'White Label' },
  custom_domain: { tier: 'studio', name: 'Custom Domain' },
  invoices: { tier: 'studio', name: 'Invoices' },
  api_access: { tier: 'studio', name: 'API Access' },
  multi_user: { tier: 'studio', name: 'Multi-User' },
  analytics: { tier: 'studio', name: 'Analytics' },
} as const;

export type FeatureName = keyof typeof FEATURES;

const TIER_ORDER: Record<TenantTier, number> = {
  starter: 0,
  pro: 1,
  studio: 2,
};

function tierIncludesFeature(
  tenantTier: TenantTier,
  featureTier: string
): boolean {
  const tenantLevel = TIER_ORDER[tenantTier];
  const featureLevel = TIER_ORDER[featureTier as TenantTier] ?? 0;
  return tenantLevel >= featureLevel;
}

// Check if tenant has feature (cached per request)
export const hasFeature = cache(
  async (tenantId: string, feature: FeatureName): Promise<boolean> => {
    // Check explicit override first
    const flag = await prisma.tenantFeatureFlag.findUnique({
      where: { tenantId_feature: { tenantId, feature } },
    });

    if (flag !== null) {
      return flag.enabled;
    }

    // Fall back to tier-based default
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) return false;

    const featureDef = FEATURES[feature];
    return tierIncludesFeature(tenant.tier, featureDef.tier);
  }
);

// Get all features for tenant
export const getTenantFeatures = cache(
  async (tenantId: string): Promise<Record<FeatureName, boolean>> => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) {
      return Object.fromEntries(
        Object.keys(FEATURES).map((f) => [f, false])
      ) as Record<FeatureName, boolean>;
    }

    // Get explicit overrides
    const overrides = await prisma.tenantFeatureFlag.findMany({
      where: { tenantId },
    });

    const overrideMap = new Map(overrides.map((o) => [o.feature, o.enabled]));

    // Build feature map
    const features: Partial<Record<FeatureName, boolean>> = {};
    for (const [name, def] of Object.entries(FEATURES)) {
      const override = overrideMap.get(name);
      features[name as FeatureName] =
        override ?? tierIncludesFeature(tenant.tier, def.tier);
    }

    return features as Record<FeatureName, boolean>;
  }
);
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(features): add feature flag service with tier support"
```

---

## Phase 2: Gallery Core

**Goal:** Gallery CRUD, photo management, R2 storage integration

### Task 2.1: R2 Storage Adapter

**Files:**

- Create: `src/infrastructure/storage/r2-client.ts`
- Create: `src/infrastructure/storage/image-service.ts`

**Step 1: Install AWS SDK**

Run: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp`
Run: `npm install -D @types/sharp`

**Step 2: Create R2 client**

```typescript
// src/infrastructure/storage/r2-client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/shared/config/env';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    })
  );
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}
```

**Step 3: Create image processing service**

```typescript
// src/infrastructure/storage/image-service.ts
import sharp from 'sharp';
import { uploadToR2, deleteFromR2 } from './r2-client';
import { env } from '@/shared/config/env';

export interface ImageVariants {
  original: { key: string; url: string };
  web: { key: string; url: string }; // 2048px
  thumbnail: { key: string; url: string }; // 800px
}

export interface ProcessedImage {
  variants: ImageVariants;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

// Size variants matching xmas.artemi-media.hr CDN pattern
const VARIANTS = {
  thumbnail: { width: 800, quality: 80 },
  web: { width: 2048, quality: 85 },
} as const;

export async function processAndUploadImage(
  galleryCode: string,
  filename: string,
  buffer: Buffer
): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  // Base path following xmas pattern: galleries/{CODE}/web/{SIZE}/{FILENAME}.webp
  const basePath = `galleries/${galleryCode}`;
  const baseFilename = filename.replace(/\.[^.]+$/, '');

  // Process variants
  const variants: ImageVariants = {
    original: { key: '', url: '' },
    web: { key: '', url: '' },
    thumbnail: { key: '', url: '' },
  };

  // Original
  const originalKey = `${basePath}/original/${filename}`;
  const originalUrl = await uploadToR2(
    originalKey,
    buffer,
    `image/${metadata.format}`
  );
  variants.original = { key: originalKey, url: originalUrl };

  // Web (2048px)
  const webBuffer = await image
    .resize(VARIANTS.web.width, undefined, { withoutEnlargement: true })
    .webp({ quality: VARIANTS.web.quality })
    .toBuffer();
  const webKey = `${basePath}/web/2048/${baseFilename}.webp`;
  const webUrl = await uploadToR2(webKey, webBuffer, 'image/webp');
  variants.web = { key: webKey, url: webUrl };

  // Thumbnail (800px)
  const thumbBuffer = await image
    .resize(VARIANTS.thumbnail.width, undefined, { withoutEnlargement: true })
    .webp({ quality: VARIANTS.thumbnail.quality })
    .toBuffer();
  const thumbKey = `${basePath}/web/800/${baseFilename}.webp`;
  const thumbUrl = await uploadToR2(thumbKey, thumbBuffer, 'image/webp');
  variants.thumbnail = { key: thumbKey, url: thumbUrl };

  return {
    variants,
    width: metadata.width,
    height: metadata.height,
    sizeBytes: buffer.length,
    mimeType: `image/${metadata.format}`,
  };
}

export async function deleteImageVariants(
  variants: ImageVariants
): Promise<void> {
  await Promise.all([
    deleteFromR2(variants.original.key),
    deleteFromR2(variants.web.key),
    deleteFromR2(variants.thumbnail.key),
  ]);
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(storage): add R2 client and image processing service"
```

---

### Task 2.2: Gallery Application Service

**Files:**

- Create: `src/application/gallery/commands/create-gallery.ts`
- Create: `src/application/gallery/commands/upload-photo.ts`
- Create: `src/application/gallery/queries/get-gallery-by-code.ts`

**Step 1: Create gallery command**

```typescript
// src/application/gallery/commands/create-gallery.ts
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { GalleryCode } from '@/core/gallery';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';

export const createGallerySchema = z.object({
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  visibility: z
    .enum(['public', 'private', 'code_protected'])
    .default('code_protected'),
  sessionPrice: z.number().int().positive().optional(), // in cents
  expiresAt: z.date().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;

export async function createGallery(
  input: CreateGalleryInput
): Promise<Result<{ id: string; code: string }, string>> {
  const validated = createGallerySchema.safeParse(input);
  if (!validated.success) {
    return Result.fail(validated.error.message);
  }

  const { tenantId, title, description, visibility, sessionPrice, expiresAt } =
    validated.data;

  // Generate unique gallery code with tenant prefix
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });

  if (!tenant) {
    return Result.fail('Tenant not found');
  }

  // Generate code like "SCDY0028" (prefix from slug + random)
  const prefix = tenant.slug.slice(0, 4).toUpperCase();
  let code: string;
  let attempts = 0;

  do {
    code = GalleryCode.generate(prefix).value;
    const exists = await prisma.gallery.findUnique({ where: { code } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return Result.fail('Could not generate unique gallery code');
  }

  const gallery = await prisma.gallery.create({
    data: {
      id: randomUUID(),
      tenantId,
      code,
      title,
      description,
      status: 'draft',
      visibility,
      sessionPrice,
      expiresAt,
    },
  });

  return Result.ok({ id: gallery.id, code: gallery.code });
}
```

**Step 2: Create upload photo command**

```typescript
// src/application/gallery/commands/upload-photo.ts
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { processAndUploadImage } from '@/infrastructure/storage/image-service';
import { Result } from '@/core/shared';
import { randomUUID } from 'crypto';

export const uploadPhotoSchema = z.object({
  galleryId: z.string().uuid(),
  filename: z.string(),
  buffer: z.instanceof(Buffer),
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;

export async function uploadPhoto(
  input: UploadPhotoInput
): Promise<Result<{ id: string }, string>> {
  const { galleryId, filename, buffer } = input;

  // Get gallery and verify it exists
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, code: true, photoCount: true },
  });

  if (!gallery) {
    return Result.fail('Gallery not found');
  }

  try {
    // Process and upload image variants
    const processed = await processAndUploadImage(
      gallery.code,
      filename,
      buffer
    );

    // Get next sort order
    const lastPhoto = await prisma.photo.findFirst({
      where: { galleryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (lastPhoto?.sortOrder ?? -1) + 1;

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        id: randomUUID(),
        galleryId,
        filename,
        originalKey: processed.variants.original.key,
        thumbnailKey: processed.variants.thumbnail.key,
        webKey: processed.variants.web.key,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        mimeType: processed.mimeType,
        sortOrder,
      },
    });

    // Update gallery photo count
    await prisma.gallery.update({
      where: { id: galleryId },
      data: { photoCount: { increment: 1 } },
    });

    return Result.ok({ id: photo.id });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error.message : 'Upload failed'
    );
  }
}
```

**Step 3: Create get gallery query**

```typescript
// src/application/gallery/queries/get-gallery-by-code.ts
import { prisma } from '@/shared/lib/db';
import { env } from '@/shared/config/env';

export interface GalleryWithPhotos {
  galleryId: string;
  galleryCode: string;
  title: string;
  description: string | null;
  status: string;
  photoCount: number;
  sessionPrice: number | null;
  photos: Array<{
    id: string;
    filename: string;
    width: number;
    height: number;
    thumbnail: string;
    fullsize: string;
  }>;
}

export async function getGalleryByCode(
  code: string
): Promise<GalleryWithPhotos | null> {
  const gallery = await prisma.gallery.findUnique({
    where: { code, status: 'published' },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!gallery) return null;

  // Check expiration
  if (gallery.expiresAt && new Date() > gallery.expiresAt) {
    return null;
  }

  // Transform to API response format (matching xmas.artemi-media.hr)
  return {
    galleryId: gallery.id,
    galleryCode: gallery.code,
    title: gallery.title,
    description: gallery.description,
    status: gallery.status,
    photoCount: gallery.photoCount,
    sessionPrice: gallery.sessionPrice,
    photos: gallery.photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      width: photo.width,
      height: photo.height,
      thumbnail: `${env.R2_PUBLIC_URL}/${photo.thumbnailKey}`,
      fullsize: `${env.R2_PUBLIC_URL}/${photo.webKey}`,
    })),
  };
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(gallery): add gallery commands and queries"
```

---

### Task 2.3: Gallery API Routes

**Files:**

- Create: `src/app/api/photos/route.ts`
- Create: `src/app/api/gallery/[id]/photos/route.ts`

**Step 1: Create photos API (public gallery access)**

```typescript
// src/app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGalleryByCode } from '@/application/gallery/queries/get-gallery-by-code';

// GET /api/photos?code=SCDY0028
// Matches xmas.artemi-media.hr API pattern
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Gallery code is required' },
      { status: 400 }
    );
  }

  const gallery = await getGalleryByCode(code.toUpperCase());

  if (!gallery) {
    return NextResponse.json(
      { error: 'Gallery not found or expired' },
      { status: 404 }
    );
  }

  return NextResponse.json(gallery);
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(api): add gallery photos API endpoint"
```

---

## Phase 3: Public Gallery Experience

**Goal:** Gallery viewer UI, lightbox, favorites, downloads

### Task 3.1: Gallery Code Entry Page

**Files:**

- Create: `src/app/(gallery)/[tenant]/page.tsx`
- Create: `src/app/(gallery)/[tenant]/gallery/page.tsx`
- Create: `src/shared/ui/gallery-code-form.tsx`

**Step 1: Create gallery code form component**

```tsx
// src/shared/ui/gallery-code-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryCodeFormProps {
  tenantSlug: string;
}

export function GalleryCodeForm({ tenantSlug }: GalleryCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 4) {
      setError('Unesite ispravan kod galerije');
      return;
    }

    startTransition(() => {
      router.push(`/${tenantSlug}/gallery?code=${normalizedCode}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Pristupite galeriji
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Unesite kod za pristup vašim fotografijama
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UNESITE KOD"
              className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest
                         border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={12}
              autoComplete="off"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending || code.length < 4}
            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold
                       rounded-lg hover:bg-emerald-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Učitavanje...' : 'Otvori galeriju'}
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Kod ste dobili od fotografa ili na kartici
        </p>
      </div>
    </form>
  );
}
```

**Step 2: Create tenant landing page**

```tsx
// src/app/(gallery)/[tenant]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { GalleryCodeForm } from '@/shared/ui/gallery-code-form';

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantLandingPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug, status: 'active' },
    select: { id: true, name: true, logoUrl: true, brandColor: true },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800
                     flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {tenant.logoUrl && (
          <div className="mb-8 text-center">
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-16 mx-auto"
            />
          </div>
        )}

        <GalleryCodeForm tenantSlug={tenantSlug} />

        <p className="mt-8 text-center text-gray-400 text-sm">
          Sigurna privatna galerija • {tenant.name}
        </p>
      </div>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(ui): add gallery code entry page"
```

---

### Task 3.2: Gallery Viewer Component

**Files:**

- Create: `src/app/(gallery)/[tenant]/gallery/page.tsx`
- Create: `src/shared/ui/photo-grid.tsx`
- Create: `src/shared/ui/lightbox.tsx`

**Step 1: Create photo grid component**

```tsx
// src/shared/ui/photo-grid.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Lightbox } from './lightbox';

interface Photo {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnail: string;
  fullsize: string;
}

interface PhotoGridProps {
  photos: Photo[];
  galleryCode: string;
  onFavoriteToggle?: (photoId: string) => void;
  favorites?: Set<string>;
}

export function PhotoGrid({
  photos,
  galleryCode,
  onFavoriteToggle,
  favorites = new Set(),
}: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {photos.map((photo, index) => {
          const isPortrait = photo.height > photo.width;
          const isFavorite = favorites.has(photo.id);

          return (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative overflow-hidden rounded-lg bg-gray-800
                         hover:ring-2 hover:ring-emerald-500 transition-all
                         ${isPortrait ? 'row-span-2' : ''}`}
              style={{ aspectRatio: isPortrait ? '2/3' : '3/2' }}
            >
              <Image
                src={photo.thumbnail}
                alt={photo.filename}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />

              {/* Favorite indicator */}
              {isFavorite && (
                <div className="absolute top-2 right-2 text-rose-500">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onFavoriteToggle={onFavoriteToggle}
          favorites={favorites}
        />
      )}
    </>
  );
}
```

**Step 2: Create lightbox component**

```tsx
// src/shared/ui/lightbox.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnail: string;
  fullsize: string;
}

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onFavoriteToggle?: (photoId: string) => void;
  favorites?: Set<string>;
}

export function Lightbox({
  photos,
  initialIndex,
  onClose,
  onFavoriteToggle,
  favorites = new Set(),
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const photo = photos[currentIndex];
  const isFavorite = photo ? favorites.has(photo.id) : false;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white/80 hover:text-white z-10"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Favorite button */}
      <button
        onClick={() => onFavoriteToggle?.(photo.id)}
        className="absolute top-4 right-4 z-10"
      >
        <svg
          className={`w-8 h-8 ${isFavorite ? 'text-rose-500 fill-current' : 'text-white/80'}`}
          viewBox="0 0 24 24"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Navigation */}
      <button
        onClick={goPrev}
        className="absolute left-4 text-white/80 hover:text-white"
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={goNext}
        className="absolute right-4 text-white/80 hover:text-white"
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Image */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto">
        <Image
          src={photo.fullsize}
          alt={photo.filename}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80">
        {photo.filename} • {currentIndex + 1}/{photos.length}
      </div>
    </div>
  );
}
```

**Step 3: Create gallery page**

```tsx
// src/app/(gallery)/[tenant]/gallery/page.tsx
import { notFound } from 'next/navigation';
import { getGalleryByCode } from '@/application/gallery/queries/get-gallery-by-code';
import { PhotoGrid } from '@/shared/ui/photo-grid';

interface Props {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { code } = await searchParams;

  if (!code) {
    notFound();
  }

  const gallery = await getGalleryByCode(code);

  if (!gallery) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                🎄 {gallery.galleryCode}
              </h1>
              <p className="text-sm text-gray-400">
                ✓ OTKLJUČANO • {gallery.photoCount} fotografija
                {gallery.sessionPrice &&
                  ` • Cijena termina: €${(gallery.sessionPrice / 100).toFixed(0)}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                Sve
              </button>
              <button className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                🛒 Naruči
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Photo Grid */}
      <PhotoGrid photos={gallery.photos} galleryCode={gallery.galleryCode} />
    </main>
  );
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(ui): add gallery viewer with photo grid and lightbox"
```

---

## Phase 4: Admin Dashboard

**Goal:** Studio management interface, gallery CRUD, user management

### Task 4.1: Dashboard Layout

**Files:**

- Create: `src/app/(dashboard)/dashboard/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/shared/ui/dashboard-nav.tsx`

_(Full implementation details for each step)_

---

## Phase 5: E-Commerce Module (Pro Tier)

**Goal:** Products, shopping cart, Stripe checkout, order management

### Task 5.1: Product Catalog

### Task 5.2: Shopping Cart (Client State)

### Task 5.3: Stripe Checkout Integration

### Task 5.4: Order Management

---

## Phase 6: Advanced Features (Studio Tier)

**Goal:** White-label, invoices, API access, analytics

### Task 6.1: White-Label Configuration

### Task 6.2: Invoice Generation (PDF)

### Task 6.3: Public API with API Keys

### Task 6.4: Analytics Dashboard

---

## Phase 7: Polish & Launch

**Goal:** PWA, email notifications, monitoring, final testing

### Task 7.1: PWA Configuration

### Task 7.2: Email Notification System

### Task 7.3: Error Monitoring (Sentry)

### Task 7.4: End-to-End Testing

---

## Implementation Summary

| Phase       | Tasks                                   | Priority |
| ----------- | --------------------------------------- | -------- |
| **Phase 1** | Foundation (DB, Auth, Tenant, Features) | Critical |
| **Phase 2** | Gallery Core (CRUD, R2, API)            | Critical |
| **Phase 3** | Public Gallery UI                       | Critical |
| **Phase 4** | Admin Dashboard                         | High     |
| **Phase 5** | E-Commerce (Pro)                        | High     |
| **Phase 6** | Advanced (Studio)                       | Medium   |
| **Phase 7** | Polish & Launch                         | Medium   |

## Key Patterns Extracted

### From xmas.artemi-media.hr

- CDN URL structure: `galleries/{CODE}/web/{SIZE}/{FILE}.webp`
- API response format for photos endpoint
- Product categories modal UI
- Gift card/bonus system
- Christmas theme colors

### From foto.artemi-media.hr

- Dual auth (code + account)
- Dark theme UI
- Multi-gallery navigation
- Admin login pattern

---

**Plan complete and saved to `docs/plans/2026-01-14-lumora-implementation.md`.**
