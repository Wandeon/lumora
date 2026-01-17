'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      // Redirect to login with success message
      router.push('/login?reset=success');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.'
      );
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
          htmlFor="password"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="Min 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg
                     text-stone-900 placeholder:text-stone-400
                     focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                     transition-colors"
          placeholder="Re-enter password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-amber-600 text-white font-semibold rounded-lg
                   hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors shadow-sm"
      >
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-stone-500 hover:text-stone-700">
          Back to login
        </Link>
      </div>
    </form>
  );
}
