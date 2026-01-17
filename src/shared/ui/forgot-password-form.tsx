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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <p className="text-emerald-700">
            If an account exists with that email, you will receive a password
            reset link shortly.
          </p>
        </div>
        <Link href="/login" className="text-amber-600 hover:text-amber-700 hover:underline font-medium">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-stone-500 text-sm text-center mb-4">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-amber-600 text-white font-semibold rounded-lg
                   hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors shadow-sm"
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-stone-500 hover:text-stone-700">
          Back to login
        </Link>
      </div>
    </form>
  );
}
