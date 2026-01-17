import { prisma } from '@/shared/lib/db';
import { auth } from '@/infrastructure/auth/auth';

interface DashboardStats {
  galleryCount: number;
  photoCount: number;
  orderCount: number;
  revenue: number;
}

async function getStats(tenantId: string): Promise<DashboardStats> {
  const [galleryCount, photoCount, orderCount, revenue] = await Promise.all([
    prisma.gallery.count({ where: { tenantId } }),
    prisma.photo.count({
      where: { gallery: { tenantId } },
    }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: { tenantId, status: 'delivered' },
      _sum: { total: true },
    }),
  ]);

  return {
    galleryCount,
    photoCount,
    orderCount,
    revenue: revenue._sum.total || 0,
  };
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-stone-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-stone-500">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Overview</h1>
        <p>Tenant not configured for this user.</p>
      </div>
    );
  }

  const stats = await getStats(tenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Galleries" value={stats.galleryCount} icon="📷" />
        <StatCard title="Photos" value={stats.photoCount} icon="🖼️" />
        <StatCard title="Orders" value={stats.orderCount} icon="📦" />
        <StatCard
          title="Revenue"
          value={`€${(stats.revenue / 100).toFixed(2)}`}
          icon="💰"
        />
      </div>
    </div>
  );
}
