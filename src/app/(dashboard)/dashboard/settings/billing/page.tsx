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
        setError(data.error || 'Error loading subscription');
      }
    } catch {
      setError('Error loading subscription');
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
        throw new Error(data.error || 'Error opening portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error opening portal'
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
        throw new Error(data.error || 'Error downloading data');
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
        err instanceof Error ? err.message : 'Error downloading data'
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
    trialing: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };

  const statusColors: Record<string, string> = {
    trialing: 'bg-blue-500',
    active: 'bg-emerald-500',
    past_due: 'bg-amber-500',
    cancelled: 'bg-stone-400',
    expired: 'bg-rose-500',
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Billing</h1>
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Billing</h1>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Current Plan Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Current Plan
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-stone-600">Plan</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {tierLabels[subscription.tier] || subscription.tier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-stone-600">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[subscription.status] || 'bg-stone-400'}`}
                    ></span>
                    <span className="text-stone-700">
                      {statusLabels[subscription.status] || subscription.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Period Info */}
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-500">
                  {subscription.cancelAtPeriodEnd
                    ? 'Subscription ends'
                    : 'Next billing date'}
                </p>
                <p className="text-stone-900 font-medium mt-1">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-amber-600 text-sm mt-2">
                    Subscription will not renew
                  </p>
                )}
              </div>

              {/* Manage Subscription Button */}
              {subscription.hasStripeCustomer && (
                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting}
                  className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                      Opening portal...
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
                      Manage Subscription
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-lg text-center">
              <p className="text-stone-500">No active subscription</p>
            </div>
          )}
        </div>

        {/* Billing Portal Info */}
        <div className="border-t border-stone-100 p-6">
          <h3 className="text-sm font-medium text-stone-900 mb-2">
            Stripe Billing Portal
          </h3>
          <p className="text-sm text-stone-500">
            Manage your payment method, view invoices, and update billing
            information through the secure Stripe portal.
          </p>
        </div>
      </div>

      {/* GDPR Data Export Section */}
      <div className="mt-6 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">
            Download My Data
          </h2>
          <p className="text-sm text-stone-500 mb-4">
            In accordance with GDPR regulations, you have the right to download
            all your data stored by Lumora. The export includes your profile,
            organization, orders, galleries, and activity data.
          </p>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                Preparing data...
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
                Download Data (JSON)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
