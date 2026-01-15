import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
          Lumora
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/features"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
          Professional Photo Galleries for Your Studio
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Create beautiful, branded photo galleries for your clients. Share,
          sell prints, and manage your photography business all in one place.
        </p>
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

        {/* Features */}
        <div className="mt-24 grid max-w-4xl gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 text-3xl">🖼️</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Beautiful Galleries
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Stunning, responsive galleries that showcase your work
              professionally.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 text-3xl">💳</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Sell Prints
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Integrated Stripe payments let clients purchase prints directly.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 text-3xl">🔗</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Custom Branding
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Your own subdomain and branding for a seamless client experience.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex justify-center gap-6 mb-4">
          <Link
            href="/terms"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/about"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            About
          </Link>
        </div>
        &copy; {new Date().getFullYear()} Lumora. All rights reserved.
      </footer>
    </div>
  );
}
