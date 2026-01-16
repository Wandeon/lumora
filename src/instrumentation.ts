export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const { cleanupStaleOrders } =
      await import('@/infrastructure/jobs/cleanup-stale-orders');
    const { cleanupExpiredTokens } =
      await import('@/infrastructure/jobs/cleanup-expired-tokens');

    // Every hour: cleanup stale orders
    cron.schedule('0 * * * *', () => {
      cleanupStaleOrders().catch(console.error);
    });

    // Daily at 3 AM: cleanup expired tokens
    cron.schedule('0 3 * * *', () => {
      cleanupExpiredTokens().catch(console.error);
    });

    console.log('[CRON] Scheduled jobs registered');
  }
}
