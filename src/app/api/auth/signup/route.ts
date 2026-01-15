import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/db';

export const runtime = 'nodejs';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  studioName: z.string().min(1, 'Studio name is required'),
  tier: z.enum(['starter', 'pro', 'studio']).default('starter'),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error?.issues?.[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password, studioName, tier } = parsed.data;

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
