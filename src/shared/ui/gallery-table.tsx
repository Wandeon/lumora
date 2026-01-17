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
    draft: 'bg-stone-100 text-stone-600',
    published: 'bg-emerald-50 text-emerald-700',
    archived: 'bg-amber-50 text-amber-700',
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function GalleryTable({ galleries }: GalleryTableProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Code
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Photos
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
              Created
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {galleries.map((gallery) => (
            <tr key={gallery.id} className="hover:bg-stone-50 transition-colors">
              <td className="px-4 py-3">
                <code className="text-amber-600 font-mono text-sm bg-amber-50 px-2 py-0.5 rounded">
                  {gallery.code}
                </code>
              </td>
              <td className="px-4 py-3 text-stone-900 font-medium">{gallery.title}</td>
              <td className="px-4 py-3">
                <StatusBadge status={gallery.status} />
              </td>
              <td className="px-4 py-3 text-stone-600">{gallery.photoCount}</td>
              <td className="px-4 py-3 text-stone-500">
                {new Date(gallery.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/galleries/${gallery.id}/edit`}
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
  );
}
