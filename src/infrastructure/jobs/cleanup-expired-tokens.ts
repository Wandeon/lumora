import { prisma } from '@/shared/lib/db';

const TOKEN_RETENTION_DAYS = 7;

export async function cleanupExpiredTokens(): Promise<number> {
  const cutoff = new Date(
    Date.now() - TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { usedAt: { not: null }, createdAt: { lt: cutoff } },
      ],
    },
  });

  console.log(`[CRON] Deleted ${result.count} expired tokens`);
  return result.count;
}
