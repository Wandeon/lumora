'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryCodeFormProps {
  tenantSlug: string;
}

export function GalleryCodeForm({ tenantSlug }: GalleryCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 4) {
      setError('Please enter a valid gallery code');
      return;
    }

    startTransition(() => {
      router.push(`/${tenantSlug}/gallery?code=${normalizedCode}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Access Your Gallery
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter the code to view your photos
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="gallery-code" className="sr-only">
              Gallery code
            </label>
            <input
              id="gallery-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest
                         border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-amber-500 focus:border-amber-500"
              maxLength={12}
              autoComplete="off"
              autoFocus
              aria-describedby={error ? 'code-error' : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <p
                id="code-error"
                className="mt-2 text-sm text-rose-600"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || code.length < 4}
            className="w-full py-3 px-4 bg-amber-600 text-white font-semibold
                       rounded-lg hover:bg-amber-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Loading...' : 'Open Gallery'}
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          You received your code from your photographer
        </p>
      </div>
    </form>
  );
}
