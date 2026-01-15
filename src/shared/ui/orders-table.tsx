'use client';

import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

interface OrdersTableProps {
  orders: Order[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400',
    confirmed: 'bg-blue-600/20 text-blue-400',
    processing: 'bg-purple-600/20 text-purple-400',
    shipped: 'bg-cyan-600/20 text-cyan-400',
    delivered: 'bg-emerald-600/20 text-emerald-400',
    cancelled: 'bg-gray-600/20 text-gray-400',
    refunded: 'bg-rose-600/20 text-rose-400',
  };

  const labels: Record<string, string> = {
    pending: 'Na cekanju',
    confirmed: 'Potvrdeno',
    processing: 'U obradi',
    shipped: 'Poslano',
    delivered: 'Isporuceno',
    cancelled: 'Otkazano',
    refunded: 'Refundirano',
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Broj narudzbe
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Kupac
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Stavke
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Ukupno
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Datum
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
              Akcije
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <code className="text-emerald-400 font-mono">
                  {order.orderNumber}
                </code>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-white">{order.customerName}</p>
                  <p className="text-gray-500 text-sm">{order.customerEmail}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-gray-300">{order.itemCount}</td>
              <td className="px-4 py-3 text-white font-medium">
                {formatCurrency(order.total, order.currency)}
              </td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(order.createdAt).toLocaleDateString('hr-HR')}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Detalji
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
