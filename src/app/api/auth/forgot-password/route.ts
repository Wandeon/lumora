import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/shared/lib/db';
import { sendPasswordReset } from '@/infrastructure/email/email-service';
import { checkForgotPasswordLimit } from '@/infrastructure/rate-limit';
import { env } from '@/shared/config/env';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  tenantId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimit = await checkForgotPasswordLimit(ip);

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
    return NextResponse.json({ success: true }); // Don't reveal errors
  }

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
    try {
      await sendPasswordReset({
        email: user.email,
        resetUrl,
        expiresIn: '1 hour',
      });
    } catch (error) {
      console.error('[PASSWORD_RESET] Failed to send email:', error);
      // Don't reveal email send failures to the client
    }
  }

  // Always return success to prevent user enumeration
  return NextResponse.json({ success: true });
}
