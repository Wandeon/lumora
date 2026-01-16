import { notFound } from 'next/navigation';
import { getGalleryByCode } from '@/application/gallery/queries/get-gallery-by-code';
import { GalleryClient } from './gallery-client';

interface Props {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { tenant: _tenant } = await params;
  const { code } = await searchParams;

  if (!code) {
    notFound();
  }

  const gallery = await getGalleryByCode(code);

  if (!gallery) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {gallery.galleryCode}
              </h1>
              <p className="text-sm text-gray-400">
                OTKLJUČANO • {gallery.photoCount} fotografija
                {gallery.sessionPrice &&
                  ` • Cijena termina: €${(gallery.sessionPrice / 100).toFixed(0)}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                Sve
              </button>
              <button className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                Naruči
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Photo Grid */}
      <GalleryClient
        photos={gallery.photos}
        galleryCode={gallery.galleryCode}
      />
    </main>
  );
}
