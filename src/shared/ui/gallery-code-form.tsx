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
      setError('Unesite ispravan kod galerije');
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
          Pristupite galeriji
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Unesite kod za pristup vašim fotografijama
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UNESITE KOD"
              className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest
                         border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={12}
              autoComplete="off"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending || code.length < 4}
            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold
                       rounded-lg hover:bg-emerald-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Učitavanje...' : 'Otvori galeriju'}
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Kod ste dobili od fotografa ili na kartici
        </p>
      </div>
    </form>
  );
}
