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
