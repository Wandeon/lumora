import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Lumora photo gallery platform',
};

const faqs = [
  {
    question: 'How do I upload photos to a gallery?',
    answer:
      'Navigate to your gallery in the dashboard and use the drag-and-drop uploader at the top of the page. You can upload multiple JPEG, PNG, or WebP images up to 50MB each.',
  },
  {
    question: 'How do clients access their gallery?',
    answer:
      'Share the gallery link with your client. They will enter the gallery code to view and order photos.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'We accept all major credit and debit cards through Stripe secure payment processing.',
  },
  {
    question: 'How do I track my orders?',
    answer:
      'View all orders in your Dashboard under the Orders section. You can update order status and customers receive automatic email notifications.',
  },
  {
    question: 'Can I use my own domain?',
    answer:
      'Yes! Studio tier subscribers can configure custom domains. Contact support for setup assistance.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can manage your subscription in Dashboard → Settings → Billing. Cancellations take effect at the end of your billing period.',
  },
];

export default function SupportPage() {
  return (
    <div className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Support
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Need help? Check our FAQ below or contact us directly.
        </p>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Contact Us
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
            Email:{' '}
            <a
              href="mailto:support@lumora.genai.hr"
              className="text-zinc-900 dark:text-white underline"
            >
              support@lumora.genai.hr
            </a>
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            We typically respond within 24 hours on business days.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800 pb-6 last:border-0 last:pb-0"
              >
                <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
