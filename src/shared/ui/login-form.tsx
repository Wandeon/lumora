'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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
        setError('Neispravan email ili lozinka');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Doslo je do greske. Pokusajte ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3"
        >
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

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
          autoComplete="email"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="vas@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Lozinka
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          minLength={8}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="********"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg
                   hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Prijava...' : 'Prijavi se'}
      </button>
    </form>
  );
}

export function LoginForm({ tenantId }: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-800 rounded-lg" />
          <div className="h-10 bg-gray-800 rounded-lg" />
          <div className="h-10 bg-emerald-600/50 rounded-lg" />
        </div>
      }
    >
      <LoginFormContent tenantId={tenantId} />
    </Suspense>
  );
}
