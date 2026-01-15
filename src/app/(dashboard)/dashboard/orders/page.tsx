import { redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';
import { OrdersTable } from '@/shared/ui/orders-table';

export default async function OrdersPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  });

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    status: o.status,
    total: o.total,
    currency: o.currency,
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Narudzbe</h1>
      </div>

      {formattedOrders.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">Nemate jos nijednu narudzbu</p>
          <p className="text-gray-500 text-sm">
            Narudzbe ce se pojaviti kada kupci naruce proizvode iz vaših
            galerija.
          </p>
        </div>
      ) : (
        <OrdersTable orders={formattedOrders} />
      )}
    </div>
  );
}
