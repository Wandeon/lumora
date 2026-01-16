import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  name: z.string().min(2),
});

interface InvitationNewValue {
  invitedEmail: string;
  role: string;
  tokenHash: string;
  expiresAt: string;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { token, password, name } = parsed.data;

  // Hash the incoming token to compare with stored hash
  const tokenHash = createHash('sha256').update(token).digest('hex');

  // Find the audit log entry with matching token hash
  const auditEntries = await prisma.auditLog.findMany({
    where: {
      action: 'team_invitation_sent',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Find the entry with matching token hash
  let matchingEntry = null;
  let invitationData: InvitationNewValue | null = null;

  for (const entry of auditEntries) {
    const newValue = entry.newValue as InvitationNewValue | null;
    if (newValue && newValue.tokenHash === tokenHash) {
      matchingEntry = entry;
      invitationData = newValue;
      break;
    }
  }

  if (!matchingEntry || !invitationData) {
    return NextResponse.json(
      { error: 'Invalid or expired invitation token' },
      { status: 400 }
    );
  }

  // Check if token has expired
  const expiresAt = new Date(invitationData.expiresAt);
  if (expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This invitation has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  // Get the user from entityId
  const userId = matchingEntry.entityId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found. The invitation may have been revoked.' },
      { status: 400 }
    );
  }

  // Check if user has already accepted (has a password)
  if (user.passwordHash) {
    return NextResponse.json(
      { error: 'This invitation has already been accepted.' },
      { status: 400 }
    );
  }

  // Hash the password and update the user
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      name,
    },
  });

  // Create an audit log entry for the accepted invitation
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: userId,
      action: 'team_invitation_accepted',
      entityType: 'user',
      entityId: userId,
      newValue: {
        email: user.email,
        role: user.role,
      },
    },
  });

  return NextResponse.json({ success: true });
}
