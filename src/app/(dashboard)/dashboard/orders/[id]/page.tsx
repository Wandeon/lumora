import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { OrderStatusForm } from '@/shared/ui/order-status-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect('/login');
  }

  const order = await prisma.order.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      items: {
        include: {
          product: true,
          photo: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-purple-500/20 text-purple-400',
    shipped: 'bg-cyan-500/20 text-cyan-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
    refunded: 'bg-rose-500/20 text-rose-400',
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Narudzba #{order.orderNumber}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Kreirana {new Date(order.createdAt).toLocaleDateString('hr-HR')}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || statusColors.pending}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Kupac</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-400">Ime</dt>
              <dd className="text-white">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">Email</dt>
              <dd className="text-white">{order.customerEmail}</dd>
            </div>
            {order.customerPhone && (
              <div>
                <dt className="text-sm text-gray-400">Telefon</dt>
                <dd className="text-white">{order.customerPhone}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Sazeci</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-400">Meduzbir</dt>
              <dd className="text-white">
                {(order.subtotal / 100).toFixed(2)} {order.currency}
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Popust</dt>
                <dd className="text-emerald-400">
                  -{(order.discount / 100).toFixed(2)} {order.currency}
                </dd>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Porez</dt>
                <dd className="text-white">
                  {(order.tax / 100).toFixed(2)} {order.currency}
                </dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <dt className="font-semibold text-white">Ukupno</dt>
              <dd className="font-semibold text-white">
                {(order.total / 100).toFixed(2)} {order.currency}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Order Items */}
      <div className="mt-6 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-6 border-b border-gray-800">
          Stavke
        </h2>
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Proizvod
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Kolicina
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                Cijena
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                Ukupno
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-white">{item.product.name}</td>
                <td className="px-4 py-3 text-gray-300">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {(item.unitPrice / 100).toFixed(2)} {order.currency}
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {(item.totalPrice / 100).toFixed(2)} {order.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Update */}
      <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">
          Azuriraj status
        </h2>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Napomene</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
