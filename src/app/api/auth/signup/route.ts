import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/db';
import { checkSignupLimit } from '@/infrastructure/rate-limit';
import { sendWelcome } from '@/infrastructure/email';
import { env } from '@/shared/config/env';

export const runtime = 'nodejs';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  studioName: z.string().min(1, 'Studio name is required'),
  // tier is accepted but ignored - all new signups start on starter tier
  tier: z.enum(['starter', 'pro', 'studio']).optional(),
});

function generateSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Ensure non-empty slug with fallback
  if (!slug || slug.length === 0) {
    slug = 'studio';
  }

  // Trim to max 63 chars (subdomain limit)
  return slug.slice(0, 63);
}

const RESERVED_SLUGS = new Set([
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
  'demo',
  'test',
  'staging',
  'dev',
]);

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimit = await checkSignupLimit(ip);

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

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error?.issues?.[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password, studioName } = parsed.data;
    // Force starter tier for all new signups (upgrade via billing)
    const tier = 'starter' as const;

    // Generate and validate slug
    let slug = generateSlug(studioName);
    if (RESERVED_SLUGS.has(slug)) {
      slug = `${slug}-studio`;
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Ensure slug stays within 63 char limit after suffix
    slug = slug.slice(0, 63);

    // Check if email already exists for any tenant
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: studioName,
          tier,
          status: 'active',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          passwordHash,
          role: 'owner',
        },
      });

      return { tenant, user };
    });

    // Send welcome email (fire and forget)
    sendWelcome({
      email: result.user.email,
      userName: result.user.name,
      tenantName: result.tenant.name,
      loginUrl: `${env.NEXT_PUBLIC_APP_URL}/login?tenant=${result.tenant.slug}`,
    }).catch((err) =>
      console.error('[EMAIL] Failed to send welcome email:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      tenantSlug: result.tenant.slug,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
