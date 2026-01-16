import { notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { OrderStatusTimeline } from '@/shared/ui/order-status-timeline';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id, accessToken: token },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Status Timeline */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Order Status
            </h2>
            <OrderStatusTimeline
              order={{
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                paidAt: order.paidAt?.toISOString() || null,
                shippedAt: order.shippedAt?.toISOString() || null,
                deliveredAt: order.deliveredAt?.toISOString() || null,
              }}
            />
          </div>

          {/* Order Items */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Items
            </h2>
            <ul className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {(item.totalPrice / 100).toFixed(2)} {order.currency}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Total */}
          <div className="px-6 py-5 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {(order.total / 100).toFixed(2)} {order.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Customer
          </h2>
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-gray-600">{order.customerEmail}</p>
          {order.customerPhone && (
            <p className="text-gray-600">{order.customerPhone}</p>
          )}
        </div>
      </div>
    </main>
  );
}
