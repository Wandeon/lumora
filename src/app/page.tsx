import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFBF7]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="text-2xl font-bold text-dawn-gradient bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
          Lumora
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/features"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-amber-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 shadow-sm"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      {/* Hero Section with Dawn Gradient */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#FEF3C7_0%,_transparent_50%)] pointer-events-none" />

        <h1 className="relative max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
          Professional Photo Galleries{' '}
          <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
            for Your Studio
          </span>
        </h1>
        <p className="relative mt-6 max-w-2xl text-lg text-stone-600">
          Create beautiful, branded photo galleries for your clients. Share,
          sell prints, and manage your photography business all in one place.
        </p>
        <div className="relative mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-amber-600 px-8 py-3 text-base font-medium text-white transition-all hover:bg-amber-700 hover:shadow-lg shadow-md"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-stone-300 bg-white px-8 py-3 text-base font-medium text-stone-800 transition-colors hover:bg-stone-50 hover:border-stone-400"
          >
            View Pricing
          </Link>
        </div>

        {/* Features */}
        <div className="relative mt-24 grid max-w-4xl gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              🖼️
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              Beautiful Galleries
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Stunning, responsive galleries that showcase your work
              professionally.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              💳
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              Sell Prints
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Integrated Stripe payments let clients purchase prints directly.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              🔗
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              Custom Branding
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Your own subdomain and branding for a seamless client experience.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-stone-500 border-t border-stone-100 bg-white/50">
        <div className="flex justify-center gap-6 mb-4">
          <Link
            href="/terms"
            className="hover:text-amber-600 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="hover:text-amber-600 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/support"
            className="hover:text-amber-600 transition-colors"
          >
            Support
          </Link>
          <Link
            href="/about"
            className="hover:text-amber-600 transition-colors"
          >
            About
          </Link>
        </div>
        &copy; {new Date().getFullYear()} Lumora. All rights reserved.
      </footer>
    </div>
  );
}
