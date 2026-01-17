'use client';

import Link from 'next/link';
import { useCookieConsent } from '../contexts/cookie-consent-context';

export function CookieBanner() {
  const { consent, acceptCookies, rejectCookies } = useCookieConsent();

  // Don't render if consent has already been given
  if (consent !== 'pending') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-300">
            We use cookies to enhance your experience on our site. By continuing
            to browse, you agree to our use of cookies.{' '}
            <Link
              href="/privacy"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Learn more in our Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Reject
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
