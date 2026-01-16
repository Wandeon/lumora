import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Cloudflare R2
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url(),

  // Email (SMTP)
  SMTP_HOST: z.string().default('smtp'),
  SMTP_PORT: z.coerce.number().default(25),
  EMAIL_FROM: z.string().email(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Sentry (empty string treated as undefined)
  SENTRY_DSN: z
    .string()
    .optional()
    .transform((val) => val || undefined)
    .pipe(z.string().url().optional()),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Lumora'),

  // Optional
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

// Validate at startup
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
