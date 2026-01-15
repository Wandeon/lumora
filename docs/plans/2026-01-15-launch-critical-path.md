# Lumora Launch Critical Path Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close critical launch blockers: metadata fixes, marketing pages, and signup flow.

**Architecture:** Extend existing Next.js 16 app with new routes and API endpoints. Use existing Prisma schema and NextAuth setup.

**Tech Stack:** Next.js 16, NextAuth v5, Prisma 6, Resend, bcryptjs, zod

---

### Task 1: Fix App Metadata

**Files:**

- Modify: `src/app/layout.tsx`

**Step 1: Update metadata in layout.tsx**

Replace the default Next.js metadata with Lumora branding:

```typescript
// In src/app/layout.tsx, find and replace the metadata export

export const metadata: Metadata = {
  title: {
    default: 'Lumora - Professional Photo Galleries for Your Studio',
    template: '%s | Lumora',
  },
  description:
    'Create beautiful, branded photo galleries for your clients. Share, sell prints, and manage your photography business all in one place.',
  keywords: [
    'photo gallery',
    'photography',
    'studio',
    'prints',
    'client proofing',
  ],
  authors: [{ name: 'Lumora' }],
  openGraph: {
    title: 'Lumora - Professional Photo Galleries',
    description: 'Create beautiful photo galleries for your clients.',
    url: 'https://lumora.genai.hr',
    siteName: 'Lumora',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumora - Professional Photo Galleries',
    description: 'Create beautiful photo galleries for your clients.',
  },
};
```

**Step 2: Verify the change**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "fix: update app metadata from default to Lumora branding"
```

---

### Task 2: Fix Stripe API Version

**Files:**

- Modify: `src/infrastructure/payments/stripe-client.ts`

**Step 1: Read current Stripe client**

Check the current apiVersion setting.

**Step 2: Update to valid API version**

Change from future date to current stable version:

```typescript
// Change apiVersion from '2025-12-15.clover' to '2024-12-18.acacia'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

**Step 3: Verify build**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/infrastructure/payments/stripe-client.ts
git commit -m "fix: use valid Stripe API version instead of future date"
```

---

### Task 3: Create Pricing Page

**Files:**

- Create: `src/app/(marketing)/pricing/page.tsx`
- Create: `src/app/(marketing)/layout.tsx`

**Step 1: Create marketing layout**

```typescript
// src/app/(marketing)/layout.tsx
import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
            Lumora
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              About
            </Link>
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-zinc-500">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white">Privacy</Link>
          </div>
          &copy; {new Date().getFullYear()} Lumora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Create pricing page**

```typescript
// src/app/(marketing)/pricing/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for photo studios of all sizes.',
};

const tiers = [
  {
    name: 'Starter',
    price: '0',
    description: 'Perfect for trying out Lumora',
    features: [
      'Up to 3 galleries',
      '1 GB storage',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start Free',
    href: '/signup?tier=starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'For growing photography businesses',
    features: [
      'Unlimited galleries',
      '25 GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Access codes',
    ],
    cta: 'Start 14-Day Trial',
    href: '/signup?tier=pro',
    highlighted: true,
  },
  {
    name: 'Studio',
    price: '79',
    description: 'For established studios and teams',
    features: [
      'Everything in Pro',
      '100 GB storage',
      'Team members',
      'Custom domain',
      'White label',
      'API access',
      'Phone support',
    ],
    cta: 'Start 14-Day Trial',
    href: '/signup?tier=studio',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 ${
                tier.highlighted
                  ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <h2 className={`text-lg font-semibold ${tier.highlighted ? '' : 'text-zinc-900 dark:text-white'}`}>
                {tier.name}
              </h2>
              <p className={`mt-1 text-sm ${tier.highlighted ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>
                {tier.description}
              </p>
              <div className="mt-6">
                <span className={`text-4xl font-bold ${tier.highlighted ? '' : 'text-zinc-900 dark:text-white'}`}>
                  &euro;{tier.price}
                </span>
                <span className={`text-sm ${tier.highlighted ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>
                  /month
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-medium ${
                  tier.highlighted
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800'
                    : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Verify page renders**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/\(marketing\)/
git commit -m "feat: add pricing page with tier comparison"
```

---

### Task 4: Create Features Page

**Files:**

- Create: `src/app/(marketing)/features/page.tsx`

**Step 1: Create features page**

```typescript
// src/app/(marketing)/features/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need to run your photography business.',
};

const features = [
  {
    icon: '📷',
    title: 'Beautiful Galleries',
    description: 'Stunning, responsive photo galleries that showcase your work professionally. Support for thousands of photos per gallery.',
  },
  {
    icon: '🔐',
    title: 'Access Control',
    description: 'Protect galleries with access codes. Share unique links with each client for private viewing.',
  },
  {
    icon: '💳',
    title: 'Sell Prints',
    description: 'Integrated Stripe payments let clients purchase prints directly. You set the prices and keep the profits.',
  },
  {
    icon: '🎨',
    title: 'Custom Branding',
    description: 'Your logo, your colors, your domain. Make every gallery feel like your own website.',
  },
  {
    icon: '❤️',
    title: 'Client Favorites',
    description: 'Let clients mark their favorite photos. Review selections and prepare orders easily.',
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Track gallery views, popular photos, and sales. Understand what your clients love.',
  },
  {
    icon: '👥',
    title: 'Team Access',
    description: 'Invite team members with different roles. Collaborate on galleries and orders.',
  },
  {
    icon: '🔌',
    title: 'API Access',
    description: 'Integrate with your existing tools. Automate workflows with our REST API.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Everything You Need
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Powerful features to help you deliver stunning galleries and grow your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(marketing\)/features/page.tsx
git commit -m "feat: add features page"
```

---

### Task 5: Create About Page

**Files:**

- Create: `src/app/(marketing)/about/page.tsx`

**Step 1: Create about page**

```typescript
// src/app/(marketing)/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Lumora and our mission to help photographers succeed.',
};

export default function AboutPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
          About Lumora
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
            Lumora is a platform built for professional photographers who want to deliver
            beautiful client galleries without the technical hassle.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Our Mission
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            We believe photographers should spend their time creating, not managing technology.
            Lumora handles the galleries, payments, and client experience so you can focus on
            what you do best.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Built for Photographers
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Every feature in Lumora was designed with real photography workflows in mind.
            From bulk uploads to print fulfillment, we understand the unique needs of
            professional studios.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Contact Us
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Have questions? We would love to hear from you.
            <br />
            Email: <a href="mailto:hello@lumora.genai.hr" className="text-zinc-900 dark:text-white underline">hello@lumora.genai.hr</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(marketing\)/about/page.tsx
git commit -m "feat: add about page"
```

---

### Task 6: Create Legal Pages

**Files:**

- Create: `src/app/(marketing)/terms/page.tsx`
- Create: `src/app/(marketing)/privacy/page.tsx`

**Step 1: Create terms page**

```typescript
// src/app/(marketing)/terms/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Lumora.',
};

export default function TermsPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p className="mb-4">Last updated: January 15, 2026</p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using Lumora, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">
            Lumora provides a platform for photographers to create and share photo galleries,
            sell prints, and manage client relationships.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">3. User Responsibilities</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account and for
            all activities that occur under your account. You must not upload content that
            infringes on intellectual property rights or violates applicable laws.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">4. Payment Terms</h2>
          <p className="mb-4">
            Paid subscriptions are billed in advance on a monthly basis. You may cancel your
            subscription at any time, and it will remain active until the end of the billing period.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-4">
            Lumora is provided as is without warranties of any kind. We are not liable for any
            indirect, incidental, or consequential damages arising from your use of the service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">6. Contact</h2>
          <p className="mb-4">
            For questions about these terms, contact us at legal@lumora.genai.hr.
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create privacy page**

```typescript
// src/app/(marketing)/privacy/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Lumora.',
};

export default function PrivacyPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p className="mb-4">Last updated: January 15, 2026</p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly, such as your name, email address,
            and payment information. We also collect usage data to improve our service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use your information to provide and improve our service, process payments,
            send important updates, and respond to your requests.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">3. Data Storage</h2>
          <p className="mb-4">
            Your data is stored securely on servers in the European Union. Photos are stored
            on Cloudflare R2 with encryption at rest.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">4. Data Sharing</h2>
          <p className="mb-4">
            We do not sell your personal information. We share data only with service providers
            necessary to operate Lumora (payment processing, email delivery, storage).
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">5. Your Rights</h2>
          <p className="mb-4">
            You have the right to access, correct, or delete your personal data. You may also
            export your data at any time from your dashboard settings.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">6. Contact</h2>
          <p className="mb-4">
            For privacy-related questions, contact us at privacy@lumora.genai.hr.
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/\(marketing\)/terms/page.tsx src/app/\(marketing\)/privacy/page.tsx
git commit -m "feat: add terms and privacy pages"
```

---

### Task 7: Create Signup Page and API

**Files:**

- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/shared/ui/signup-form.tsx`

**Step 1: Create signup form component**

```typescript
// src/shared/ui/signup-form.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupFormContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'starter';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, studioName, tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Your Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label htmlFor="studioName" className="block text-sm font-medium text-gray-300 mb-1">
          Studio Name
        </label>
        <input
          id="studioName"
          type="text"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="Smith Photography"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <a href="/login" className="text-emerald-400 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-800 rounded-lg" />}>
      <SignupFormContent />
    </Suspense>
  );
}
```

**Step 2: Create signup page**

```typescript
// src/app/(auth)/signup/page.tsx
import { SignupForm } from '@/shared/ui/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Lumora account and start your free trial.',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Create Your Studio</h1>
          <p className="text-gray-400 mt-1">Start your 14-day free trial</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
```

**Step 3: Create signup API endpoint**

```typescript
// src/app/api/auth/signup/route.ts
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
        { error: parsed.error.issues[0].message },
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
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/shared/ui/signup-form.tsx src/app/\(auth\)/signup/page.tsx src/app/api/auth/signup/route.ts
git commit -m "feat: add signup page and API endpoint"
```

---

### Task 8: Update Landing Page CTAs

**Files:**

- Modify: `src/app/page.tsx`

**Step 1: Update landing page to link to signup**

Update the "View Demo" button to link to a demo gallery or the pricing page:

```typescript
// In src/app/page.tsx, update the CTA buttons section
<div className="mt-10 flex flex-col gap-4 sm:flex-row">
  <Link
    href="/signup"
    className="rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
  >
    Start Free Trial
  </Link>
  <Link
    href="/pricing"
    className="rounded-full border border-zinc-300 px-8 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
  >
    View Pricing
  </Link>
</div>
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update landing page CTAs to link to signup and pricing"
```

---

### Task 9: Add Gallery Edit Page

**Files:**

- Create: `src/app/(dashboard)/dashboard/galleries/[id]/edit/page.tsx`
- Create: `src/app/api/dashboard/galleries/[id]/route.ts`

**Step 1: Create gallery edit page**

```typescript
// src/app/(dashboard)/dashboard/galleries/[id]/edit/page.tsx
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { notFound, redirect } from 'next/navigation';
import { GalleryEditForm } from '@/shared/ui/gallery-edit-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GalleryEditPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const gallery = await prisma.gallery.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
  });

  if (!gallery) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Gallery</h1>
      <GalleryEditForm gallery={gallery} />
    </div>
  );
}
```

**Step 2: Create gallery edit form component**

```typescript
// src/shared/ui/gallery-edit-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gallery } from '@/generated/prisma';

interface Props {
  gallery: Gallery;
}

export function GalleryEditForm({ gallery }: Props) {
  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description || '');
  const [visibility, setVisibility] = useState(gallery.visibility);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/dashboard/galleries/${gallery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, visibility }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update gallery');
        return;
      }

      router.push('/dashboard/galleries');
      router.refresh();
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/dashboard/galleries/${gallery.id}/publish`, {
        method: 'POST',
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Gallery Code
        </label>
        <input
          type="text"
          value={gallery.code}
          disabled
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">Share this code with your clients</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-1">
          Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        >
          <option value="public">Public - Anyone with the link</option>
          <option value="code_protected">Code Protected - Requires access code</option>
          <option value="private">Private - Only you</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            gallery.status === 'published'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {gallery.status}
          </span>
        </div>
        {gallery.status === 'draft' && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Publish Gallery
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

**Step 3: Create gallery update API**

```typescript
// src/app/api/dashboard/galleries/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'code_protected', 'private']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gallery = await prisma.gallery.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { photos: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json(gallery);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const gallery = await prisma.gallery.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: parsed.data,
  });

  if (gallery.count === 0) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.gallery.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });

  return NextResponse.json({ success: true });
}
```

**Step 4: Create publish endpoint**

```typescript
// src/app/api/dashboard/galleries/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.gallery.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: { status: 'published' },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/galleries/\[id\]/ src/shared/ui/gallery-edit-form.tsx src/app/api/dashboard/galleries/\[id\]/
git commit -m "feat: add gallery edit page with publish functionality"
```

---

### Task 10: Add Orders Dashboard Page

**Files:**

- Create: `src/app/(dashboard)/dashboard/orders/page.tsx`
- Create: `src/app/api/dashboard/orders/route.ts`

**Step 1: Create orders page**

```typescript
// src/app/(dashboard)/dashboard/orders/page.tsx
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  refunded: 'bg-rose-500/20 text-rose-400',
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No orders yet.</p>
          <p className="text-sm mt-2">Orders will appear here when clients make purchases.</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {order.customerEmail || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    &euro;{(order.total / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create orders API**

```typescript
// src/app/api/dashboard/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      items: {
        include: { product: true, photo: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/orders/page.tsx src/app/api/dashboard/orders/route.ts
git commit -m "feat: add orders dashboard page"
```

---

## Summary

This plan covers 10 critical tasks:

1. Fix app metadata
2. Fix Stripe API version
3. Create pricing page
4. Create features page
5. Create about page
6. Create legal pages (terms + privacy)
7. Create signup page and API
8. Update landing page CTAs
9. Add gallery edit page
10. Add orders dashboard page

After completion, run full test suite and create PR for review.
