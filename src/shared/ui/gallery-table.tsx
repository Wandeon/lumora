'use client';

import Link from 'next/link';

interface Gallery {
  id: string;
  code: string;
  title: string;
  status: string;
  photoCount: number;
  createdAt: string;
}

interface GalleryTableProps {
  galleries: Gallery[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-700 text-gray-300',
    published: 'bg-emerald-600/20 text-emerald-400',
    archived: 'bg-amber-600/20 text-amber-400',
  };

  const labels: Record<string, string> = {
    draft: 'Skica',
    published: 'Objavljeno',
    archived: 'Arhivirano',
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function GalleryTable({ galleries }: GalleryTableProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Kod
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Naziv
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Fotografije
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
              Kreirano
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
              Akcije
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {galleries.map((gallery) => (
            <tr key={gallery.id} className="hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <code className="text-emerald-400 font-mono">
                  {gallery.code}
                </code>
              </td>
              <td className="px-4 py-3 text-white">{gallery.title}</td>
              <td className="px-4 py-3">
                <StatusBadge status={gallery.status} />
              </td>
              <td className="px-4 py-3 text-gray-300">{gallery.photoCount}</td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(gallery.createdAt).toLocaleDateString('hr-HR')}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/galleries/${gallery.id}/edit`}
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
  );
}
