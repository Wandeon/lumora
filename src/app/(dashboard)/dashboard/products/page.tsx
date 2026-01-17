import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/infrastructure/auth/auth';
import { getProducts } from '@/application/catalog/queries/get-products';
import { hasFeature } from '@/shared/lib/features';

export default async function ProductsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    redirect('/login');
  }

  // Check if tenant has access to products feature
  const canAccessProducts = await hasFeature(tenantId, 'print_orders');

  if (!canAccessProducts) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Products</h1>
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-stone-500 mb-4">
            Product catalog is only available for Pro and Studio plans.
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Upgrade your plan →
          </Link>
        </div>
      </div>
    );
  }

  const products = await getProducts(tenantId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
        >
          + New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-stone-200 shadow-sm">
          <p className="text-stone-500 mb-4">You don't have any products yet</p>
          <Link
            href="/dashboard/products/new"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 text-stone-900 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {getProductTypeLabel(product.type)}
                  </td>
                  <td className="px-4 py-3 text-stone-900">
                    {(product.price / 100).toFixed(2)} EUR
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    print: 'Print',
    digital_download: 'Digital',
    magnet: 'Magnet',
    canvas: 'Canvas',
    album: 'Album',
    other: 'Other',
  };
  return labels[type] || type;
}
