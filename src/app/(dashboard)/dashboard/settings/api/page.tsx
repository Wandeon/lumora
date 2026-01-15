'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiKeyStatus {
  hasKey: boolean;
  hasAccess: boolean;
}

export default function ApiSettingsPage() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch('/api/dashboard/api-keys/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else if (response.status === 403) {
        setStatus({ hasKey: false, hasAccess: false });
      }
    } catch {
      setError('Greska pri ucitavanju statusa API kljuca');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateKey() {
    setIsGenerating(true);
    setError(null);
    setNewApiKey(null);

    try {
      const response = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greska pri generiranju kljuca');
      }

      const data = await response.json();
      setNewApiKey(data.apiKey);
      setStatus({ hasKey: true, hasAccess: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Greska pri generiranju kljuca'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (newApiKey) {
      await navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">API Postavke</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400">Ucitavanje...</p>
        </div>
      </div>
    );
  }

  // User does not have Studio tier
  if (status && !status.hasAccess) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">API Postavke</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            API pristup nije dostupan
          </h2>
          <p className="text-gray-400 mb-4">
            API pristup dostupan je samo za Studio paket. Nadogradite svoj paket
            za pristup javnom API-ju.
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Nadogradite na Studio
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">API Postavke</h1>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">API Kljuc</h2>
          <p className="text-gray-400 text-sm mb-6">
            Koristite API kljuc za pristup Lumora javnom API-ju. Kljuc ce biti
            prikazan samo jednom prilikom generiranja.
          </p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {/* Newly generated key display */}
          {newApiKey && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-400">
                  Novi API kljuc generiran
                </span>
                <button
                  onClick={copyToClipboard}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Kopirano
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Kopiraj
                    </>
                  )}
                </button>
              </div>
              <code className="block bg-gray-800 rounded px-3 py-2 text-sm font-mono text-white break-all">
                {newApiKey}
              </code>
              <div className="mt-3 flex items-start gap-2 text-amber-400">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm">
                  Spremite ovaj kljuc na sigurno mjesto. Nece biti prikazan
                  ponovo.
                </p>
              </div>
            </div>
          )}

          {/* Current key status */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Status kljuca</p>
              <p className="text-sm text-gray-400 mt-1">
                {status?.hasKey ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    API kljuc je aktivan (lum_****...****)
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Nema aktivnog API kljuca
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? 'Generiranje...'
                : status?.hasKey
                  ? 'Regeneriraj kljuc'
                  : 'Generiraj kljuc'}
            </button>
          </div>

          {status?.hasKey && !newApiKey && (
            <p className="mt-4 text-sm text-gray-500">
              Regeneriranje kljuca ce ponistiti postojeci kljuc. Sve aplikacije
              koje koriste stari kljuc ce prestati raditi.
            </p>
          )}
        </div>

        {/* API Documentation link */}
        <div className="border-t border-gray-800 p-6">
          <h3 className="text-sm font-medium text-white mb-2">
            API Dokumentacija
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Saznajte kako koristiti Lumora API za integraciju s vasim
            aplikacijama.
          </p>
          <div className="flex gap-4">
            <Link
              href="/docs/api"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Pogledaj dokumentaciju
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
