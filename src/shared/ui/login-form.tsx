'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LoginFormProps {
  tenantId: string;
}

function getSafeCallbackUrl(callbackUrl: string | null): string {
  if (!callbackUrl) {
    return '/dashboard';
  }
  // Only allow relative URLs starting with /
  // Reject absolute URLs (could be open redirect)
  if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl;
  }
  return '/dashboard';
}

function LoginFormContent({ tenantId }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        tenantId,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-lg p-3"
        >
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

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
          autoComplete="email"
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
          autoComplete="current-password"
          minLength={8}
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="********"
        />
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-amber-600 text-white font-semibold rounded-lg
                   hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors shadow-sm"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-stone-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-amber-600 hover:text-amber-700 hover:underline font-medium">
          Start free trial
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ tenantId }: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-stone-100 rounded-lg" />
          <div className="h-10 bg-stone-100 rounded-lg" />
          <div className="h-10 bg-amber-100 rounded-lg" />
        </div>
      }
    >
      <LoginFormContent tenantId={tenantId} />
    </Suspense>
  );
}
