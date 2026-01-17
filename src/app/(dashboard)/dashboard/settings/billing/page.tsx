'use client';

import { useState, useEffect, useCallback } from 'react';

interface SubscriptionStatus {
  tier: 'starter' | 'pro' | 'studio';
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
}

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const response = await fetch('/api/dashboard/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Greska pri ucitavanju pretplate');
      }
    } catch {
      setError('Greska pri ucitavanju pretplate');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManageSubscription() {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greska pri otvaranju portala');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Greska pri otvaranju portala'
      );
      setIsRedirecting(false);
    }
  }

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/account/export');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greska pri preuzimanju podataka');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const defaultFilename = `lumora-export-${new Date().toISOString().split('T')[0]}.json`;
      const filename =
        filenameMatch && filenameMatch[1] ? filenameMatch[1] : defaultFilename;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Greska pri preuzimanju podataka'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  const tierLabels: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    studio: 'Studio',
  };

  const statusLabels: Record<string, string> = {
    trialing: 'Probni period',
    active: 'Aktivna',
    past_due: 'Kasnjenje s placanjem',
    cancelled: 'Otkazana',
    expired: 'Istekla',
  };

  const statusColors: Record<string, string> = {
    trialing: 'bg-blue-500',
    active: 'bg-emerald-500',
    past_due: 'bg-amber-500',
    cancelled: 'bg-gray-500',
    expired: 'bg-rose-500',
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Naplata</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400">Ucitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Naplata</h1>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {/* Current Plan Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Trenutni paket
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Paket</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {tierLabels[subscription.tier] || subscription.tier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[subscription.status] || 'bg-gray-500'}`}
                    ></span>
                    <span className="text-gray-300">
                      {statusLabels[subscription.status] || subscription.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Period Info */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">
                  {subscription.cancelAtPeriodEnd
                    ? 'Pretplata istice'
                    : 'Sljedece naplacivanje'}
                </p>
                <p className="text-white font-medium mt-1">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    'hr-HR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-amber-400 text-sm mt-2">
                    Pretplata nece biti obnovljena
                  </p>
                )}
              </div>

              {/* Manage Subscription Button */}
              {subscription.hasStripeCustomer && (
                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Otvaranje portala...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Upravljaj pretplatom
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-gray-400">Nema aktivne pretplate</p>
            </div>
          )}
        </div>

        {/* Billing Portal Info */}
        <div className="border-t border-gray-800 p-6">
          <h3 className="text-sm font-medium text-white mb-2">
            Stripe portal za naplatu
          </h3>
          <p className="text-sm text-gray-400">
            Upravljajte svojim nacinom placanja, pregledajte racune i azurirajte
            podatke za naplatu putem sigurnog Stripe portala.
          </p>
        </div>
      </div>

      {/* GDPR Data Export Section */}
      <div className="mt-6 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Preuzmi moje podatke
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            U skladu s GDPR propisima, imate pravo preuzeti sve svoje podatke
            koje Lumora cuva. Izvoz ukljucuje podatke o vasem profilu,
            organizaciji, narudzbama, galerijama i aktivnosti.
          </p>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Priprema podataka...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Preuzmi podatke (JSON)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
