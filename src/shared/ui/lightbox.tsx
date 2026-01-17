'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ProductPicker, Product } from './product-picker';

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
  products?: Product[];
  onAddToCart?: (productId: string, photoId: string, quantity: number) => void;
}

export type { Product };

export function Lightbox({
  photos,
  initialIndex,
  onClose,
  onFavoriteToggle,
  favorites = new Set(),
  products = [],
  onAddToCart,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const photo = photos[currentIndex];
  const isFavorite = photo ? favorites.has(photo.id) : false;

  const handleAddToCart = (productId: string, quantity: number) => {
    if (photo && onAddToCart) {
      onAddToCart(productId, photo.id, quantity);
    }
    setShowProductPicker(false);
  };

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
        aria-label="Close gallery"
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

      {/* Top right actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Order button */}
        {products.length > 0 && onAddToCart && (
          <button
            onClick={() => setShowProductPicker(!showProductPicker)}
            aria-label="Order product"
            className="p-2 text-white/80 hover:text-amber-400 transition-colors"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
        )}

        {/* Favorite button */}
        <button
          onClick={() => onFavoriteToggle?.(photo.id)}
          aria-label="Add to favorites"
          className="p-2"
        >
          <svg
            className={`w-7 h-7 ${isFavorite ? 'text-rose-500 fill-current' : 'text-white/80'}`}
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
      </div>

      {/* Product Picker */}
      {showProductPicker && (
        <ProductPicker
          products={products}
          onSelect={handleAddToCart}
          onClose={() => setShowProductPicker(false)}
        />
      )}

      {/* Navigation */}
      <button
        onClick={goPrev}
        aria-label="Previous photo"
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
        aria-label="Next photo"
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
