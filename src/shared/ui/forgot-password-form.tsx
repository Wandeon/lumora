'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ForgotPasswordFormProps {
  tenantId: string;
}

export function ForgotPasswordForm({ tenantId }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setSuccess(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
          <p className="text-emerald-400">
            If an account exists with that email, you will receive a password
            reset link shortly.
          </p>
        </div>
        <Link href="/login" className="text-emerald-400 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-400 text-sm text-center mb-4">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

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
          placeholder="your@email.com"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg
                   hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-white">
          Back to login
        </Link>
      </div>
    </form>
  );
}
