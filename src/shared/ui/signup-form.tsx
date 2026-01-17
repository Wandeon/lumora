'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupFormContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ tenantSlug: string } | null>(null);
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

      setSuccess({ tenantSlug: data.tenantSlug });
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    const loginUrl = `/login?tenant=${success.tenantSlug}&registered=true`;
    return (
      <div className="text-center space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-emerald-700 mb-2">
            Account Created!
          </h2>
          <p className="text-stone-600 text-sm mb-4">
            Your studio <strong className="text-stone-800">{success.tenantSlug}</strong> is ready.
          </p>
          <Link
            href={loginUrl}
            className="block w-full py-3 px-4 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-center transition-colors shadow-sm"
          >
            Log in to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Your Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label
          htmlFor="studioName"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Studio Name
        </label>
        <input
          id="studioName"
          type="text"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="Smith Photography"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-amber-600 text-white font-semibold rounded-lg
                   hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors shadow-sm"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  return (
    <Suspense
      fallback={<div className="animate-pulse h-64 bg-stone-100 rounded-lg" />}
    >
      <SignupFormContent />
    </Suspense>
  );
}
