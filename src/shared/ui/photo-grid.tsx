'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Lightbox, Product } from './lightbox';

interface Photo {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnail: string;
  fullsize: string;
}

interface PhotoGridProps {
  photos: Photo[];
  galleryCode: string;
  onFavoriteToggle?: (photoId: string) => void;
  favorites?: Set<string>;
  products?: Product[];
  onAddToCart?: (productId: string, photoId: string, quantity: number) => void;
}

export function PhotoGrid({
  photos,
  galleryCode: _galleryCode,
  onFavoriteToggle,
  favorites = new Set(),
  products,
  onAddToCart,
}: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {photos.map((photo, index) => {
          const isPortrait = photo.height > photo.width;
          const isFavorite = favorites.has(photo.id);

          return (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Open photo ${photo.filename}`}
              className={`relative overflow-hidden rounded-lg bg-gray-800
                         hover:ring-2 hover:ring-amber-500 transition-all
                         ${isPortrait ? 'row-span-2' : ''}`}
              style={{ aspectRatio: isPortrait ? '2/3' : '3/2' }}
            >
              <Image
                src={photo.thumbnail}
                alt={photo.filename}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />

              {/* Favorite indicator */}
              {isFavorite && (
                <div className="absolute top-2 right-2 text-rose-500">
                  <svg
                    className="w-6 h-6 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          favorites={favorites}
          {...(products ? { products } : {})}
          {...(onFavoriteToggle ? { onFavoriteToggle } : {})}
          {...(onAddToCart ? { onAddToCart } : {})}
        />
      )}
    </>
  );
}
