import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { authorizeApi } from '@/shared/lib/authorization';
import { sendTeamInvitation } from '@/infrastructure/email';
import { env } from '@/shared/config/env';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  // Only owner or admin can invite team members
  const authResult = authorizeApi(session, 'admin');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parseResult = invitationSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error?.issues?.[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { email, role } = parseResult.data;

  // Get tenant information
  const tenant = await prisma.tenant.findUnique({
    where: { id: authResult.tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Check if user already exists in this tenant
  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: authResult.tenantId,
        email: email.toLowerCase(),
      },
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: 'A user with this email already exists in your team' },
      { status: 409 }
    );
  }

  // Get inviter details
  const inviter = await prisma.user.findUnique({
    where: { id: authResult.userId },
  });

  if (!inviter) {
    return NextResponse.json({ error: 'Inviter not found' }, { status: 404 });
  }

  // Generate a secure invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(invitationToken)
    .digest('hex');

  // Create a pending user with the invitation token stored in metadata
  // The user will be in a "pending" state until they accept the invitation
  const pendingUser = await prisma.user.create({
    data: {
      tenantId: authResult.tenantId!,
      email: email.toLowerCase(),
      name: email.split('@')[0] ?? email, // Temporary name from email
      role: role,
      // Store invitation details - user has no password yet (invitation pending)
      passwordHash: null,
    },
  });

  // Store the invitation token in an audit log for tracking
  // This serves as our invitation record without needing a separate model
  await prisma.auditLog.create({
    data: {
      tenantId: authResult.tenantId,
      userId: authResult.userId,
      action: 'team_invitation_sent',
      entityType: 'user',
      entityId: pendingUser.id,
      newValue: {
        invitedEmail: email.toLowerCase(),
        role: role,
        tokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
    },
  });

  // Build accept URL with the invitation token
  const acceptUrl = `${env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&email=${encodeURIComponent(email.toLowerCase())}`;

  // Send invitation email
  try {
    await sendTeamInvitation({
      email: email.toLowerCase(),
      inviterName: inviter.name,
      tenantName: tenant.name,
      role: role,
      acceptUrl: acceptUrl,
    });
  } catch (error) {
    // If email fails, delete the pending user and log entry
    await prisma.user.delete({ where: { id: pendingUser.id } });
    console.error('Failed to send invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: 'Invitation sent successfully',
      invitation: {
        email: email.toLowerCase(),
        role: role,
        status: 'pending',
      },
    },
    { status: 201 }
  );
}

export async function GET() {
  const session = await auth();

  // Only owner or admin can view pending invitations
  const authResult = authorizeApi(session, 'admin');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  // Get all users in the tenant, including pending invitations (those without passwordHash)
  const members = await prisma.user.findMany({
    where: { tenantId: authResult.tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Format response with invitation status
  const formattedMembers = members.map((member) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    status: member.passwordHash ? 'active' : 'pending',
    createdAt: member.createdAt.toISOString(),
    lastLoginAt: member.lastLoginAt?.toISOString() || null,
  }));

  return NextResponse.json(formattedMembers);
}
