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
        <h1 className="text-2xl font-bold text-white mb-6">Proizvodi</h1>
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">
            Katalog proizvoda dostupan je samo za Pro i Studio pakete.
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Nadogradite svoj paket →
          </Link>
        </div>
      </div>
    );
  }

  const products = await getProducts(tenantId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Proizvodi</h1>
        <Link
          href="/dashboard/products/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          + Novi proizvod
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 mb-4">Nemate jos nijedan proizvod</p>
          <Link
            href="/dashboard/products/new"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Dodajte prvi proizvod →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Naziv
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Vrsta
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Cijena
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white">{product.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {getProductTypeLabel(product.type)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {(product.price / 100).toFixed(2)} EUR
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      Uredi
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
    digital_download: 'Digitalno',
    magnet: 'Magnet',
    canvas: 'Canvas',
    album: 'Album',
    other: 'Ostalo',
  };
  return labels[type] || type;
}
