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
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    processing: 'bg-purple-50 text-purple-700',
    shipped: 'bg-cyan-50 text-cyan-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-stone-100 text-stone-600',
    refunded: 'bg-rose-50 text-rose-700',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Order #
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Items
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Total
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Date
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-stone-50 transition-colors">
              <td className="px-4 py-3">
                <code className="text-amber-600 font-mono text-sm bg-amber-50 px-2 py-0.5 rounded">
                  {order.orderNumber}
                </code>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-stone-900 font-medium">{order.customerName}</p>
                  <p className="text-stone-500 text-sm">{order.customerEmail}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-stone-600">{order.itemCount}</td>
              <td className="px-4 py-3 text-stone-900 font-medium">
                {formatCurrency(order.total, order.currency)}
              </td>
              <td className="px-4 py-3 text-stone-500">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                >
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
