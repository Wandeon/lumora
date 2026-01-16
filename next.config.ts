import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone',
};

// Only apply Sentry wrapper in production with valid config
const sentryEnabled =
  process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
    })
  : nextConfig;
