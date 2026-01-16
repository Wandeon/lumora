// src/infrastructure/auth/api-key.ts
import { prisma } from '@/shared/lib/db';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

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
  const keyBuffer = Buffer.from(hash, 'hex');

  // Fetch all active tenants with API keys for timing-safe comparison
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active', apiKeyHash: { not: null } },
    select: { id: true, apiKeyHash: true },
  });

  // Use timing-safe comparison to prevent timing attacks
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
