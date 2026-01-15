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

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p className="mb-4">
            We collect information you provide directly, such as your name,
            email address, and payment information. We also collect usage data
            to improve our service.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="mb-4">
            We use your information to provide and improve our service, process
            payments, send important updates, and respond to your requests.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            3. Data Storage
          </h2>
          <p className="mb-4">
            Your data is stored securely on servers in the European Union.
            Photos are stored on Cloudflare R2 with encryption at rest.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            4. Data Sharing
          </h2>
          <p className="mb-4">
            We do not sell your personal information. We share data only with
            service providers necessary to operate Lumora (payment processing,
            email delivery, storage).
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            5. Your Rights
          </h2>
          <p className="mb-4">
            You have the right to access, correct, or delete your personal data.
            You may also export your data at any time from your dashboard
            settings.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-8 mb-4">
            6. Contact
          </h2>
          <p className="mb-4">
            For privacy-related questions, contact us at
            privacy@lumora.genai.hr.
          </p>
        </div>
      </div>
    </div>
  );
}
