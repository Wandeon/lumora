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
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-gray-400">
        <h1 className="text-2xl font-bold text-white mb-4">Pregled</h1>
        <p>Tenant not configured for this user.</p>
      </div>
    );
  }

  const stats = await getStats(tenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Pregled</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Galerije" value={stats.galleryCount} icon="📷" />
        <StatCard title="Fotografije" value={stats.photoCount} icon="🖼️" />
        <StatCard title="Narudzbe" value={stats.orderCount} icon="📦" />
        <StatCard
          title="Prihod"
          value={`€${(stats.revenue / 100).toFixed(2)}`}
          icon="💰"
        />
      </div>
    </div>
  );
}
