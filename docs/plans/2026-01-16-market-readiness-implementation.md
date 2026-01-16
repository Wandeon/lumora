# Market Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all critical blockers and operational gaps identified in the market readiness audit to achieve Private Beta readiness.

**Architecture:** Server-side multipart uploads through Next.js API routes to R2 storage, React Context for cart state, session-based favorites with localStorage persistence, webhook-driven payment lifecycle, and Docker-based backup automation.

**Tech Stack:** Next.js 15, TypeScript, Prisma, Sharp, Cloudflare R2, Stripe, Redis, Nodemailer, Sentry

---

## Phase 1: Core Feature Blockers (P0)

### Task 1: Photo Upload API Endpoint

**Files:**

- Create: `src/app/api/dashboard/galleries/[id]/photos/route.ts`
- Reference: `src/application/gallery/commands/upload-photo.ts`
- Reference: `src/infrastructure/storage/image-service.ts`

**Step 1: Create the upload API route with validation**

```typescript
// src/app/api/dashboard/galleries/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { authorizeApi } from '@/shared/lib/authorization';
import { prisma } from '@/shared/lib/db';
import { uploadPhoto } from '@/application/gallery/commands/upload-photo';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: galleryId } = await params;
  const session = await auth();

  const authResult = authorizeApi(session, 'editor');
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  // Verify gallery belongs to tenant
  const gallery = await prisma.gallery.findFirst({
    where: { id: galleryId, tenantId: authResult.tenantId },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadPhoto({
      galleryId,
      filename: file.name,
      buffer,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
```

**Step 2: Run the build to verify no syntax errors**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds (or only unrelated errors)

**Step 3: Commit the upload endpoint**

```bash
git add src/app/api/dashboard/galleries/\[id\]/photos/route.ts
git commit -m "feat(api): add photo upload endpoint for galleries

- POST /api/dashboard/galleries/[id]/photos
- Multipart form data with 'file' field
- Validates file type (JPEG, PNG, WebP) and size (50MB max)
- Uses existing uploadPhoto command for processing
- Editor role required

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Photo Upload UI Component

**Files:**

- Create: `src/shared/ui/photo-uploader.tsx`
- Modify: `src/app/(dashboard)/dashboard/galleries/[id]/page.tsx`

**Step 1: Create the drag-and-drop uploader component**

```typescript
// src/shared/ui/photo-uploader.tsx
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface PhotoUploaderProps {
  galleryId: string;
  onComplete?: () => void;
}

export function PhotoUploader({ galleryId, onComplete }: PhotoUploaderProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    setUploads((prev) => [
      ...prev,
      { filename: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      const response = await fetch(
        `/api/dashboard/galleries/${galleryId}/photos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.filename === file.name ? { ...u, progress: 100, status: 'complete' } : u
        )
      );
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.filename === file.name
            ? { ...u, status: 'error', error: (error as Error).message }
            : u
        )
      );
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      );

      if (validFiles.length === 0) return;

      setIsUploading(true);

      for (const file of validFiles) {
        await uploadFile(file);
      }

      setIsUploading(false);
      router.refresh();
      onComplete?.();
    },
    [galleryId, onComplete, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          id="photo-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          disabled={isUploading}
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-300">
            {isUploading ? 'Uploading...' : 'Drop photos here or click to browse'}
          </span>
          <span className="text-sm text-gray-500">
            JPEG, PNG, or WebP up to 50MB each
          </span>
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, i) => (
            <div
              key={`${upload.filename}-${i}`}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{upload.filename}</p>
                {upload.status === 'error' && (
                  <p className="text-xs text-rose-400">{upload.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
                {upload.status === 'complete' && (
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {upload.status === 'error' && (
                  <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run the build to verify component compiles**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 3: Commit the uploader component**

```bash
git add src/shared/ui/photo-uploader.tsx
git commit -m "feat(ui): add drag-and-drop photo uploader component

- Supports drag-and-drop and file picker
- Validates file types (JPEG, PNG, WebP)
- Shows upload progress with status indicators
- Sequential uploads to prevent overwhelming server

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Integrate Photo Uploader into Gallery Page

**Files:**

- Modify: `src/app/(dashboard)/dashboard/galleries/[id]/page.tsx`

**Step 1: Read the current gallery page**

Run: `cat src/app/(dashboard)/dashboard/galleries/[id]/page.tsx`

**Step 2: Add PhotoUploader import and integration**

After reading the file, add the PhotoUploader component to the gallery detail page. Import at top:

```typescript
import { PhotoUploader } from '@/shared/ui/photo-uploader';
```

Add below the gallery info section (before or after existing photo list):

```typescript
<div className="mt-6">
  <h2 className="text-lg font-medium text-white mb-4">Upload Photos</h2>
  <PhotoUploader galleryId={gallery.id} />
</div>
```

**Step 3: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 4: Commit the integration**

```bash
git add src/app/\(dashboard\)/dashboard/galleries/\[id\]/page.tsx
git commit -m "feat(dashboard): integrate photo uploader into gallery page

- Add PhotoUploader component to gallery detail view
- Users can now upload photos directly from dashboard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Favorites API - Add Favorite Endpoint

**Files:**

- Create: `src/app/api/galleries/[code]/favorites/route.ts`
- Reference: `prisma/schema.prisma` (Favorite model at lines 207-222)

**Step 1: Create the favorites API route**

```typescript
// src/app/api/galleries/[code]/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const SESSION_KEY_REGEX = /^[a-zA-Z0-9_-]{16,64}$/;

const favoriteSchema = z.object({
  photoId: z.string().uuid(),
  sessionKey: z.string().regex(SESSION_KEY_REGEX, 'Invalid session key format'),
  action: z.enum(['add', 'remove']),
});

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET - Fetch favorites for a session
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const sessionKey = request.nextUrl.searchParams.get('sessionKey');

  if (!sessionKey || !SESSION_KEY_REGEX.test(sessionKey)) {
    return NextResponse.json(
      { error: 'Valid session key required' },
      { status: 400 }
    );
  }

  // Find gallery by code
  const gallery = await prisma.gallery.findFirst({
    where: { code, status: 'published' },
    select: { id: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Get favorites for this session
  const favorites = await prisma.favorite.findMany({
    where: {
      galleryId: gallery.id,
      sessionKey,
    },
    select: { photoId: true },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => f.photoId),
  });
}

// POST - Add or remove favorite
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { photoId, sessionKey, action } = parsed.data;

  // Find gallery by code
  const gallery = await prisma.gallery.findFirst({
    where: { code, status: 'published' },
    select: { id: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Verify photo belongs to gallery
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, galleryId: gallery.id },
  });

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (action === 'add') {
    // Upsert to handle duplicates gracefully
    await prisma.favorite.upsert({
      where: {
        galleryId_photoId_sessionKey: {
          galleryId: gallery.id,
          photoId,
          sessionKey,
        },
      },
      create: {
        galleryId: gallery.id,
        photoId,
        sessionKey,
      },
      update: {}, // No-op if exists
    });
  } else {
    // Remove favorite
    await prisma.favorite.deleteMany({
      where: {
        galleryId: gallery.id,
        photoId,
        sessionKey,
      },
    });
  }

  // Return updated favorites list
  const favorites = await prisma.favorite.findMany({
    where: {
      galleryId: gallery.id,
      sessionKey,
    },
    select: { photoId: true },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => f.photoId),
  });
}
```

**Step 2: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 3: Commit the favorites API**

```bash
git add src/app/api/galleries/\[code\]/favorites/route.ts
git commit -m "feat(api): add favorites API for client galleries

- GET /api/galleries/[code]/favorites?sessionKey=...
- POST /api/galleries/[code]/favorites with add/remove actions
- Session-based favorites (no auth required)
- Validates photo belongs to gallery

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Favorites Client Hook

**Files:**

- Create: `src/shared/hooks/use-favorites.ts`

**Step 1: Create the favorites hook**

```typescript
// src/shared/hooks/use-favorites.ts
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
```

**Step 2: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 3: Commit the hook**

```bash
git add src/shared/hooks/use-favorites.ts
git commit -m "feat(hooks): add useFavorites hook for client galleries

- Generates persistent session key in localStorage
- Fetches favorites on mount
- Optimistic updates with rollback on error
- Exposes toggleFavorite and isFavorite helpers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Integrate Favorites into Gallery Page

**Files:**

- Modify: `src/app/(gallery)/[tenant]/gallery/page.tsx`

**Step 1: Read the current gallery page**

Read the file to understand current structure.

**Step 2: Create a client wrapper component for the gallery**

Since the page is a server component, we need a client wrapper:

```typescript
// src/app/(gallery)/[tenant]/gallery/gallery-client.tsx
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
```

**Step 3: Update the server page to use GalleryClient**

Replace direct PhotoGrid usage with GalleryClient wrapper.

**Step 4: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 5: Commit the integration**

```bash
git add src/app/\(gallery\)/\[tenant\]/gallery/gallery-client.tsx src/app/\(gallery\)/\[tenant\]/gallery/page.tsx
git commit -m "feat(gallery): integrate favorites into client gallery

- Add GalleryClient wrapper component with useFavorites hook
- Connect favorites state to PhotoGrid component
- Heart icons now toggle favorites via API

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Shopping Cart Context

**Files:**

- Create: `src/shared/contexts/cart-context.tsx`
- Create: `src/shared/hooks/use-cart.ts`

**Step 1: Create the cart context**

```typescript
// src/shared/contexts/cart-context.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  photoId?: string;
  photoThumbnail?: string;
  quantity: number;
  unitPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lumora_cart';

export function CartProvider({ children, galleryCode }: { children: ReactNode; galleryCode: string }) {
  const storageKey = `${CART_STORAGE_KEY}_${galleryCode}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to hydrate cart:', e);
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Persist to localStorage
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [items, isHydrated, storageKey]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Check if same product+photo combination exists
      const existing = prev.find(
        (i) => i.productId === item.productId && i.photoId === item.photoId
      );

      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, [removeItem]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

**Step 2: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 3: Commit the cart context**

```bash
git add src/shared/contexts/cart-context.tsx
git commit -m "feat(cart): add shopping cart context with localStorage persistence

- CartProvider component with gallery-scoped storage
- Add, remove, update quantity, clear operations
- Automatic persistence to localStorage
- Exposes total and itemCount

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Shopping Cart Sidebar UI

**Files:**

- Create: `src/shared/ui/cart-sidebar.tsx`

**Step 1: Create the cart sidebar component**

```typescript
// src/shared/ui/cart-sidebar.tsx
'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import { useCart, CartItem } from '@/shared/contexts/cart-context';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  currency?: string;
}

export function CartSidebar({ isOpen, onClose, onCheckout, currency = 'EUR' }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, total, itemCount, clear } = useCart();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty</p>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onQuantityChange={(q) => updateQuantity(item.id, q)}
                formatPrice={formatPrice}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-800 space-y-4">
            <div className="flex items-center justify-between text-white">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{formatPrice(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={clear}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  formatPrice: (cents: number) => string;
}

function CartItemRow({ item, onRemove, onQuantityChange, formatPrice }: CartItemRowProps) {
  return (
    <div className="flex gap-4 p-3 bg-gray-800 rounded-lg">
      {/* Thumbnail */}
      {item.photoThumbnail && (
        <div className="w-16 h-16 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
          <Image
            src={item.photoThumbnail}
            alt=""
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{item.productName}</p>
        <p className="text-sm text-gray-400">{formatPrice(item.unitPrice)}</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQuantityChange(item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            -
          </button>
          <span className="text-white text-sm w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-500 hover:text-rose-500 transition-colors"
        aria-label="Remove item"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 2: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 3: Commit the cart sidebar**

```bash
git add src/shared/ui/cart-sidebar.tsx
git commit -m "feat(ui): add shopping cart sidebar component

- Slide-out sidebar with cart items
- Quantity controls and remove buttons
- Photo thumbnails display
- Total calculation and checkout button
- Clear cart option

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Product Selection in Lightbox

**Files:**

- Modify: `src/shared/ui/lightbox.tsx`

**Step 1: Read current lightbox implementation**

Read the file to understand current structure.

**Step 2: Add product selection and add-to-cart functionality**

Extend the lightbox with a product picker that appears when clicking an "Order" button on a photo.

**Step 3: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 4: Commit the enhancement**

```bash
git add src/shared/ui/lightbox.tsx
git commit -m "feat(lightbox): add product selection for ordering photos

- Add 'Order' button in lightbox view
- Product picker modal with available products
- Integration with cart context

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Configure Sentry DSN [COMPLETED]

> **Implementation Notes (2026-01-16):**
>
> - Added `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to `.env.example` with documentation
> - Updated `.env` to include both variables (empty by default)
> - Also updated `.env.example` with SMTP and Redis config to match actual usage
> - Sentry is disabled when DSN is empty; only active in production mode
> - Users should obtain DSN from Sentry dashboard and set both values to enable error tracking

**Files:**

- Modify: `.env`
- Verify: `sentry.server.config.ts`, `sentry.client.config.ts`

**Step 1: Add production Sentry DSN to .env**

Update `.env` with actual Sentry DSN (user must provide actual value):

```bash
# Sentry (set actual DSN in production)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

**Step 2: Verify Sentry configs handle empty DSN gracefully**

The current configs should only initialize in production when DSN is set.

**Step 3: Commit the configuration update**

```bash
git add .env.example
git commit -m "docs: document Sentry DSN configuration

- Add SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN to .env.example
- Sentry only initializes in production when DSN is set

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Operational Stability (P1)

### Task 11: Database Backup Script

**Files:**

- Create: `scripts/backup.sh`
- Modify: `docker-compose.yml`

**Step 1: Create the backup script**

```bash
#!/bin/sh
# scripts/backup.sh
# Database backup script for Lumora

set -e

BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/lumora-${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup..."

# Create backup directory if needed
mkdir -p "${BACKUP_DIR}"

# Perform backup
pg_dump -h postgres -U lumora -d lumora | gzip > "${BACKUP_FILE}"

# Verify backup created
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] ERROR: Backup file not created!"
    exit 1
fi

# Cleanup old backups
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "lumora-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(ls -1 "${BACKUP_DIR}"/lumora-*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Backup complete. ${REMAINING} backups retained."
```

**Step 2: Make the script executable**

Run: `chmod +x scripts/backup.sh`

**Step 3: Add backup service to docker-compose.yml**

Add after the smtp service:

```yaml
backup:
  image: postgres:15-alpine
  container_name: lumora-backup
  restart: unless-stopped
  environment:
    - PGPASSWORD=${POSTGRES_PASSWORD}
  volumes:
    - ./scripts/backup.sh:/backup.sh:ro
    - ./backups:/backups
  entrypoint: ['/bin/sh', '-c']
  command: ['while true; do /backup.sh; sleep 86400; done']
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - lumora-network
```

**Step 4: Create backups directory**

Run: `mkdir -p backups && echo "*.sql.gz" > backups/.gitignore`

**Step 5: Commit the backup system**

```bash
git add scripts/backup.sh docker-compose.yml backups/.gitignore
git commit -m "ops: add automated daily database backup

- scripts/backup.sh performs pg_dump with gzip compression
- 30-day retention with automatic cleanup
- Backup service runs daily in Docker

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Payment Failure Webhook Handler

**Files:**

- Modify: `src/app/api/webhooks/stripe/route.ts`
- Create: `src/infrastructure/email/templates/payment-failure.ts`
- Modify: `src/infrastructure/email/email-service.ts`

**Step 1: Create payment failure email template**

```typescript
// src/infrastructure/email/templates/payment-failure.ts
import { baseTemplate } from './base';

interface PaymentFailureParams {
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  retryUrl: string;
}

export function paymentFailureTemplate(params: PaymentFailureParams) {
  const formattedAmount = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.currency,
  }).format(params.amount / 100);

  const html = baseTemplate({
    title: 'Payment Failed',
    content: `
      <p>Hi ${params.customerName},</p>
      <p>Unfortunately, we were unable to process your payment for order <strong>${params.orderNumber}</strong>.</p>
      <p>Amount: <strong>${formattedAmount}</strong></p>
      <p>This could be due to:</p>
      <ul>
        <li>Insufficient funds</li>
        <li>Card declined by issuer</li>
        <li>Expired card details</li>
      </ul>
      <p>Please try again with a different payment method:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${params.retryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
          Retry Payment
        </a>
      </p>
      <p>If you continue to experience issues, please contact us.</p>
    `,
  });

  const text = `
Hi ${params.customerName},

Unfortunately, we were unable to process your payment for order ${params.orderNumber}.

Amount: ${formattedAmount}

Please try again at: ${params.retryUrl}

If you continue to experience issues, please contact us.
  `.trim();

  return { html, text };
}
```

**Step 2: Add handler to Stripe webhook route**

Add after the `checkout.session.completed` handler:

```typescript
if (event.type === 'payment_intent.payment_failed') {
  const intent = event.data.object as Stripe.PaymentIntent;
  const orderId = intent.metadata?.orderId;

  if (!orderId) {
    console.warn('Payment failed event without orderId metadata');
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tenant: true },
  });

  if (!order) {
    console.warn('Payment failed for unknown order:', orderId);
    return NextResponse.json({ received: true });
  }

  // Update order status if still pending
  if (order.status === 'pending') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });
  }

  // Send failure email
  await sendPaymentFailure({
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: order.currency,
    retryUrl: `${env.NEXT_PUBLIC_APP_URL}/order/${order.id}?token=${order.accessToken}`,
  });

  console.log('Payment failure handled for order:', order.orderNumber);
}
```

**Step 3: Export from email service**

Add to `src/infrastructure/email/email-service.ts`:

```typescript
import { paymentFailureTemplate } from './templates/payment-failure';

export async function sendPaymentFailure(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  retryUrl: string;
}): Promise<void> {
  const { html, text } = paymentFailureTemplate(params);
  await sendEmail({
    to: params.customerEmail,
    subject: `Payment Failed - Order ${params.orderNumber}`,
    html,
    text,
  });
}
```

**Step 4: Build and verify**

Run: `cd /home/admin/lumora && npm run build`
Expected: Build succeeds

**Step 5: Commit the payment failure handler**

```bash
git add src/app/api/webhooks/stripe/route.ts src/infrastructure/email/templates/payment-failure.ts src/infrastructure/email/email-service.ts
git commit -m "feat(payments): handle payment failures with customer notification

- Add payment_intent.payment_failed webhook handler
- Send failure email with retry link
- Cancel order if payment fails while pending

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Studio New Order Notification

**Files:**

- Create: `src/infrastructure/email/templates/studio-new-order.ts`
- Modify: `src/infrastructure/email/email-service.ts`
- Modify: `src/app/api/webhooks/stripe/route.ts`

**Step 1: Create studio notification template**

```typescript
// src/infrastructure/email/templates/studio-new-order.ts
import { baseTemplate } from './base';

interface StudioNewOrderParams {
  studioName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  currency: string;
  dashboardUrl: string;
}

export function studioNewOrderTemplate(params: StudioNewOrderParams) {
  const formattedTotal = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.currency,
  }).format(params.total / 100);

  const html = baseTemplate({
    title: 'New Order Received',
    content: `
      <p>Hi ${params.studioName},</p>
      <p>You have received a new order!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Order Number</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Customer</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Email</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;"><strong>Items</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${params.itemCount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Total</strong></td>
          <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: bold;">${formattedTotal}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${params.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">
          View Order Details
        </a>
      </p>
    `,
  });

  const text = `
New Order Received!

Order: ${params.orderNumber}
Customer: ${params.customerName} (${params.customerEmail})
Items: ${params.itemCount}
Total: ${formattedTotal}

View order: ${params.dashboardUrl}
  `.trim();

  return { html, text };
}
```

**Step 2: Add service function and integrate into webhook**

Add to email service and call after order confirmation in webhook handler.

**Step 3: Commit the studio notification**

```bash
git add src/infrastructure/email/templates/studio-new-order.ts src/infrastructure/email/email-service.ts src/app/api/webhooks/stripe/route.ts
git commit -m "feat(email): notify studio owner on new paid orders

- Send email to tenant owner when order is confirmed
- Includes order summary and dashboard link

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Support Contact Info

**Files:**

- Modify: `src/app/(marketing)/layout.tsx` (footer)
- Create: `src/app/(marketing)/support/page.tsx`

**Step 1: Add support email to footer**

Add support contact information to the marketing layout footer.

**Step 2: Create support page with FAQ**

```typescript
// src/app/(marketing)/support/page.tsx
export const metadata = {
  title: 'Support - Lumora',
  description: 'Get help with Lumora photo gallery platform',
};

const faqs = [
  {
    question: 'How do I upload photos to a gallery?',
    answer: 'Navigate to your gallery in the dashboard and use the drag-and-drop uploader at the top of the page. You can upload multiple JPEG, PNG, or WebP images up to 50MB each.',
  },
  {
    question: 'How do clients access their gallery?',
    answer: 'Share the gallery link with your client. They will enter the gallery code to view and order photos.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We accept all major credit and debit cards through Stripe secure payment processing.',
  },
  {
    question: 'How do I track my orders?',
    answer: 'View all orders in your Dashboard under the Orders section. You can update order status and customers receive automatic email notifications.',
  },
  {
    question: 'Can I use my own domain?',
    answer: 'Yes! Studio tier subscribers can configure custom domains. Contact support for setup assistance.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can manage your subscription in Dashboard → Settings → Billing. Cancellations take effect at the end of your billing period.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support</h1>
        <p className="text-gray-600 mb-8">
          Need help? Check our FAQ below or contact us directly.
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-2">
            Email: <a href="mailto:support@lumora.genai.hr" className="text-emerald-600 hover:underline">support@lumora.genai.hr</a>
          </p>
          <p className="text-sm text-gray-500">
            We typically respond within 24 hours on business days.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit support page**

```bash
git add src/app/\(marketing\)/support/page.tsx src/app/\(marketing\)/layout.tsx
git commit -m "feat(marketing): add support page with FAQ

- Support page at /support
- Contact email and response time
- 6 initial FAQ items

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Beta Polish (P2)

### Task 15: Refund Webhook Handler

**Files:**

- Modify: `src/app/api/webhooks/stripe/route.ts`
- Create: `src/infrastructure/email/templates/refund-confirmation.ts`

**Step 1: Create refund email template**

**Step 2: Add charge.refunded handler**

```typescript
if (event.type === 'charge.refunded') {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return NextResponse.json({ received: true });
  }

  // Find payment and order
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntentId },
    include: { order: true },
  });

  if (!payment) {
    console.warn('Refund for unknown payment:', paymentIntentId);
    return NextResponse.json({ received: true });
  }

  // Update payment and order status
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'refunded' },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'refunded' },
    }),
  ]);

  // Send refund confirmation email
  await sendRefundConfirmation({
    customerEmail: payment.order.customerEmail,
    customerName: payment.order.customerName,
    orderNumber: payment.order.orderNumber,
    amount: charge.amount_refunded,
    currency: payment.order.currency,
  });

  console.log('Refund processed for order:', payment.order.orderNumber);
}
```

**Step 3: Commit refund handler**

```bash
git add src/app/api/webhooks/stripe/route.ts src/infrastructure/email/templates/refund-confirmation.ts src/infrastructure/email/email-service.ts
git commit -m "feat(payments): handle refunds with customer notification

- Add charge.refunded webhook handler
- Update payment and order status to refunded
- Send refund confirmation email

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Mobile-Responsive Dashboard

**Files:**

- Modify: `src/app/(dashboard)/dashboard/layout.tsx`
- Modify: `src/shared/ui/dashboard-sidebar.tsx`

**Step 1: Read current dashboard layout**

**Step 2: Add mobile menu toggle and responsive sidebar**

Convert fixed sidebar to collapsible on mobile with hamburger menu.

**Step 3: Commit mobile dashboard**

```bash
git add src/app/\(dashboard\)/dashboard/layout.tsx src/shared/ui/dashboard-sidebar.tsx
git commit -m "feat(dashboard): make sidebar responsive for mobile

- Collapsible sidebar on mobile
- Hamburger menu toggle
- Overlay when sidebar open on mobile

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 17: Uptime Monitoring Endpoint Enhancement

**Files:**

- Modify: `src/app/api/health/route.ts`

**Step 1: Add response time metrics to health endpoint**

```typescript
// Enhanced health check with timing
const startTime = Date.now();

const checks = await Promise.allSettled([
  checkDatabase(),
  checkRedis(),
  checkSmtp(),
]);

const responseTime = Date.now() - startTime;

return NextResponse.json({
  status: allHealthy ? 'healthy' : 'degraded',
  timestamp: new Date().toISOString(),
  responseTime,
  services: { database, redis, smtp },
});
```

**Step 2: Commit enhanced health check**

```bash
git add src/app/api/health/route.ts
git commit -m "feat(health): add response time to health endpoint

- Include responseTime in milliseconds
- Useful for uptime monitoring tools

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Feature Expansion (P3)

### Task 18: Team Invitation System

**Files:**

- Create: `src/app/api/dashboard/team/invitations/route.ts`
- Create: `src/infrastructure/email/templates/team-invitation.ts`
- Create: `src/app/(dashboard)/dashboard/team/page.tsx`

**Step 1: Create invitation API**

**Step 2: Create invitation email template**

**Step 3: Create team management page**

**Step 4: Commit team invitations**

```bash
git add src/app/api/dashboard/team/invitations/route.ts src/infrastructure/email/templates/team-invitation.ts src/app/\(dashboard\)/dashboard/team/page.tsx
git commit -m "feat(team): add team member invitation system

- POST /api/dashboard/team/invitations to send invites
- Email template with accept link
- Team management page in dashboard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 19: Billing Portal Integration

**Files:**

- Create: `src/app/api/dashboard/billing/portal/route.ts`
- Modify: `src/app/(dashboard)/dashboard/settings/billing/page.tsx`

**Step 1: Create billing portal endpoint**

```typescript
// POST /api/dashboard/billing/portal
// Creates Stripe billing portal session
```

**Step 2: Add portal button to billing page**

**Step 3: Commit billing portal**

```bash
git add src/app/api/dashboard/billing/portal/route.ts src/app/\(dashboard\)/dashboard/settings/billing/page.tsx
git commit -m "feat(billing): add Stripe billing portal integration

- Create billing portal session endpoint
- Button to manage subscription in billing settings

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Total Tasks:** 19
**Phases:**

- P0 (Critical): Tasks 1-10 - Photo upload, Favorites, Cart, Sentry
- P1 (Stabilize): Tasks 11-14 - Backups, Payment webhooks, Support
- P2 (Polish): Tasks 15-17 - Refunds, Mobile, Monitoring
- P3 (Expand): Tasks 18-19 - Team, Billing

**Estimated Timeline:**

- P0: 3-4 days focused work
- P1: 2-3 days
- P2: 2-3 days
- P3: 2-3 days

**After completion, market readiness should improve from 49% to ~85%.**

---

_Last Updated: 2026-01-16_
