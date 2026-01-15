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

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing or using Lumora, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use
            our service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            2. Description of Service
          </h2>
          <p className="mb-4">
            Lumora provides a platform for photographers to create and share
            photo galleries, sell prints, and manage client relationships.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            3. User Responsibilities
          </h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your
            account and for all activities that occur under your account. You
            must not upload content that infringes on intellectual property
            rights or violates applicable laws.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            4. Payment Terms
          </h2>
          <p className="mb-4">
            Paid subscriptions are billed in advance on a monthly basis. You may
            cancel your subscription at any time, and it will remain active
            until the end of the billing period.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            5. Limitation of Liability
          </h2>
          <p className="mb-4">
            Lumora is provided as is without warranties of any kind. We are not
            liable for any indirect, incidental, or consequential damages
            arising from your use of the service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            6. Contact
          </h2>
          <p className="mb-4">
            For questions about these terms, contact us at
            legal@lumora.genai.hr.
          </p>
        </div>
      </div>
    </div>
  );
}
