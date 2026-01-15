'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  orderId: string;
  currentStatus: string;
}

const statuses = [
  { value: 'pending', label: 'Na cekanju' },
  { value: 'confirmed', label: 'Potvrdeno' },
  { value: 'processing', label: 'U obradi' },
  { value: 'shipped', label: 'Poslano' },
  { value: 'delivered', label: 'Isporuceno' },
  { value: 'cancelled', label: 'Otkazano' },
  { value: 'refunded', label: 'Refundirano' },
];

export function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === currentStatus) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage({
          type: 'error',
          text: data.error || 'Failed to update status',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Status updated successfully' });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}
        >
          <p
            className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isLoading || status === currentStatus}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? 'Azuriranje...' : 'Azuriraj'}
        </button>
      </div>
    </form>
  );
}
