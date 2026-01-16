'use client';

import { PhotoGrid } from '@/shared/ui/photo-grid';
import { useFavorites } from '@/shared/hooks/use-favorites';

interface Photo {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnail: string;
  fullsize: string;
}

interface GalleryClientProps {
  galleryCode: string;
  photos: Photo[];
}

export function GalleryClient({ galleryCode, photos }: GalleryClientProps) {
  const { favorites, toggleFavorite } = useFavorites(galleryCode);

  return (
    <PhotoGrid
      photos={photos}
      galleryCode={galleryCode}
      favorites={favorites}
      onFavoriteToggle={toggleFavorite}
    />
  );
}
