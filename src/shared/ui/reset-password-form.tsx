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
          className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3"
        >
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300 mb-1"
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
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="********"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-300 mb-1"
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
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-white">
          Back to login
        </Link>
      </div>
    </form>
  );
}
