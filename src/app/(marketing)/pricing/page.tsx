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
              <h2
                className={`text-lg font-semibold ${tier.highlighted ? '' : 'text-zinc-900 dark:text-white'}`}
              >
                {tier.name}
              </h2>
              <p
                className={`mt-1 text-sm ${tier.highlighted ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}
              >
                {tier.description}
              </p>
              <div className="mt-6">
                <span
                  className={`text-4xl font-bold ${tier.highlighted ? '' : 'text-zinc-900 dark:text-white'}`}
                >
                  &euro;{tier.price}
                </span>
                <span
                  className={`text-sm ${tier.highlighted ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}
                >
                  /month
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
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
