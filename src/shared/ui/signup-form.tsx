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
    const loginUrl = `https://${success.tenantSlug}.lumora.genai.hr/login`;
    return (
      <div className="text-center space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-emerald-400 mb-2">
            Account Created!
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Your studio is ready. Log in at your studio URL:
          </p>
          <a
            href={loginUrl}
            className="block w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 text-center"
          >
            Go to {success.tenantSlug}.lumora.genai.hr
          </a>
        </div>
        <p className="text-gray-500 text-xs">
          Bookmark your studio URL for easy access
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Your Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label
          htmlFor="studioName"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Studio Name
        </label>
        <input
          id="studioName"
          type="text"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="Smith Photography"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300 mb-1"
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
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-emerald-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  return (
    <Suspense
      fallback={<div className="animate-pulse h-64 bg-gray-800 rounded-lg" />}
    >
      <SignupFormContent />
    </Suspense>
  );
}
