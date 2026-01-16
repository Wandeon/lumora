'use client';

import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY_STORAGE = 'lumora_session_key';

function generateSessionKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getOrCreateSessionKey(): string {
  if (typeof window === 'undefined') return '';

  let key = localStorage.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    key = generateSessionKey();
    localStorage.setItem(SESSION_KEY_STORAGE, key);
  }
  return key;
}

interface UseFavoritesResult {
  favorites: Set<string>;
  isLoading: boolean;
  toggleFavorite: (photoId: string) => Promise<void>;
  isFavorite: (photoId: string) => boolean;
}

export function useFavorites(galleryCode: string): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionKey, setSessionKey] = useState('');

  // Initialize session key on mount
  useEffect(() => {
    setSessionKey(getOrCreateSessionKey());
  }, []);

  // Fetch favorites when session key is ready
  useEffect(() => {
    if (!sessionKey || !galleryCode) return;

    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/galleries/${galleryCode}/favorites?sessionKey=${sessionKey}`
        );
        if (response.ok) {
          const data = await response.json();
          setFavorites(new Set(data.favorites));
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [galleryCode, sessionKey]);

  const toggleFavorite = useCallback(
    async (photoId: string) => {
      if (!sessionKey) return;

      const isFav = favorites.has(photoId);
      const action = isFav ? 'remove' : 'add';

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.delete(photoId);
        } else {
          next.add(photoId);
        }
        return next;
      });

      try {
        const response = await fetch(
          `/api/galleries/${galleryCode}/favorites`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, sessionKey, action }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFavorites(new Set(data.favorites));
        } else {
          // Revert on error
          setFavorites((prev) => {
            const next = new Set(prev);
            if (isFav) {
              next.add(photoId);
            } else {
              next.delete(photoId);
            }
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        // Revert on error
        setFavorites((prev) => {
          const next = new Set(prev);
          if (isFav) {
            next.add(photoId);
          } else {
            next.delete(photoId);
          }
          return next;
        });
      }
    },
    [favorites, galleryCode, sessionKey]
  );

  const isFavorite = useCallback(
    (photoId: string) => favorites.has(photoId),
    [favorites]
  );

  return { favorites, isLoading, toggleFavorite, isFavorite };
}
