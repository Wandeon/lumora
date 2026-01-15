import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need to run your photography business.',
};

const features = [
  {
    icon: '📷',
    title: 'Beautiful Galleries',
    description:
      'Stunning, responsive photo galleries that showcase your work professionally. Support for thousands of photos per gallery.',
  },
  {
    icon: '🔐',
    title: 'Access Control',
    description:
      'Protect galleries with access codes. Share unique links with each client for private viewing.',
  },
  {
    icon: '💳',
    title: 'Sell Prints',
    description:
      'Integrated Stripe payments let clients purchase prints directly. You set the prices and keep the profits.',
  },
  {
    icon: '🎨',
    title: 'Custom Branding',
    description:
      'Your logo, your colors, your domain. Make every gallery feel like your own website.',
  },
  {
    icon: '❤️',
    title: 'Client Favorites',
    description:
      'Let clients mark their favorite photos. Review selections and prepare orders easily.',
  },
  {
    icon: '📊',
    title: 'Analytics',
    description:
      'Track gallery views, popular photos, and sales. Understand what your clients love.',
  },
  {
    icon: '👥',
    title: 'Team Access',
    description:
      'Invite team members with different roles. Collaborate on galleries and orders.',
  },
  {
    icon: '🔌',
    title: 'API Access',
    description:
      'Integrate with your existing tools. Automate workflows with our REST API.',
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
            Powerful features to help you deliver stunning galleries and grow
            your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
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
