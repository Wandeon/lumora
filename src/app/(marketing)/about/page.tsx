import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Lumora and our mission to help photographers succeed.',
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
            Lumora is a platform built for professional photographers who want
            to deliver beautiful client galleries without the technical hassle.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Our Mission
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            We believe photographers should spend their time creating, not
            managing technology. Lumora handles the galleries, payments, and
            client experience so you can focus on what you do best.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Built for Photographers
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Every feature in Lumora was designed with real photography workflows
            in mind. From bulk uploads to print fulfillment, we understand the
            unique needs of professional studios.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">
            Contact Us
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Have questions? We would love to hear from you.
            <br />
            Email:{' '}
            <a
              href="mailto:hello@lumora.genai.hr"
              className="text-zinc-900 dark:text-white underline"
            >
              hello@lumora.genai.hr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
