'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnail: string;
  fullsize: string;
}

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onFavoriteToggle?: (photoId: string) => void;
  favorites?: Set<string>;
}

export function Lightbox({
  photos,
  initialIndex,
  onClose,
  onFavoriteToggle,
  favorites = new Set(),
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const photo = photos[currentIndex];
  const isFavorite = photo ? favorites.has(photo.id) : false;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Zatvori galeriju"
        className="absolute top-4 left-4 text-white/80 hover:text-white z-10"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Favorite button */}
      <button
        onClick={() => onFavoriteToggle?.(photo.id)}
        aria-label="Dodaj u favorite"
        className="absolute top-4 right-4 z-10"
      >
        <svg
          className={`w-8 h-8 ${isFavorite ? 'text-rose-500 fill-current' : 'text-white/80'}`}
          viewBox="0 0 24 24"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Navigation */}
      <button
        onClick={goPrev}
        aria-label="Prethodna fotografija"
        className="absolute left-4 text-white/80 hover:text-white"
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={goNext}
        aria-label="Sljedeća fotografija"
        className="absolute right-4 text-white/80 hover:text-white"
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Image */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto">
        <Image
          src={photo.fullsize}
          alt={photo.filename}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Counter */}
      <div
        role="status"
        aria-live="polite"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80"
      >
        {photo.filename} • {currentIndex + 1}/{photos.length}
      </div>
    </div>
  );
}
