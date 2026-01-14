import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient, Gallery, Photo } from '@/generated/prisma';
import { getGalleryByCode } from './get-gallery-by-code';

// Mock Prisma with typed mock
vi.mock('@/shared/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '@/shared/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Helper type for gallery with photos
type GalleryWithPhotos = Gallery & { photos: Photo[] };

describe('getGalleryByCode', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it('should return gallery with photos for valid code', async () => {
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-123',
      code: 'SCDY0028',
      tenantId: 'tenant-123',
      title: 'Summer Wedding',
      description: 'Beautiful summer wedding photos',
      status: 'published',
      visibility: 'code_protected',
      photoCount: 2,
      sessionPrice: 2500,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [
        {
          id: 'photo-1',
          galleryId: 'gallery-123',
          filename: 'IMG_001.jpg',
          originalKey: 'tenant-123/gallery-123/original/IMG_001.jpg',
          webKey: 'tenant-123/gallery-123/web/IMG_001.jpg',
          thumbnailKey: 'tenant-123/gallery-123/thumb/IMG_001.jpg',
          width: 1920,
          height: 1080,
          size: 1000000,
          hash: 'abc123',
          sortOrder: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'photo-2',
          galleryId: 'gallery-123',
          filename: 'IMG_002.jpg',
          originalKey: 'tenant-123/gallery-123/original/IMG_002.jpg',
          webKey: 'tenant-123/gallery-123/web/IMG_002.jpg',
          thumbnailKey: 'tenant-123/gallery-123/thumb/IMG_002.jpg',
          width: 1920,
          height: 1280,
          size: 1200000,
          hash: 'def456',
          sortOrder: 1,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('SCDY0028');

    expect(result).not.toBeNull();
    expect(result?.galleryId).toBe('gallery-123');
    expect(result?.galleryCode).toBe('SCDY0028');
    expect(result?.title).toBe('Summer Wedding');
    expect(result?.description).toBe('Beautiful summer wedding photos');
    expect(result?.status).toBe('published');
    expect(result?.photoCount).toBe(2);
    expect(result?.sessionPrice).toBe(2500);
    expect(result?.photos).toHaveLength(2);

    // Check photo URLs are constructed correctly
    expect(result?.photos[0].thumbnail).toBe(
      'https://cdn.test.com/tenant-123/gallery-123/thumb/IMG_001.jpg'
    );
    expect(result?.photos[0].fullsize).toBe(
      'https://cdn.test.com/tenant-123/gallery-123/web/IMG_001.jpg'
    );
  });

  it('should return null for non-existent gallery code', async () => {
    prismaMock.gallery.findUnique.mockResolvedValue(null);

    const result = await getGalleryByCode('INVALID');

    expect(result).toBeNull();
  });

  it('should return null for expired gallery', async () => {
    const pastDate = new Date('2020-01-01');
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-expired',
      code: 'EXPD1234',
      tenantId: 'tenant-123',
      title: 'Expired Gallery',
      description: null,
      status: 'published',
      visibility: 'code_protected',
      photoCount: 0,
      sessionPrice: null,
      expiresAt: pastDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('EXPD1234');

    expect(result).toBeNull();
  });

  it('should return gallery when expiresAt is in the future', async () => {
    const futureDate = new Date('2099-12-31');
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-future',
      code: 'FUTR1234',
      tenantId: 'tenant-123',
      title: 'Future Gallery',
      description: null,
      status: 'published',
      visibility: 'code_protected',
      photoCount: 0,
      sessionPrice: null,
      expiresAt: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('FUTR1234');

    expect(result).not.toBeNull();
    expect(result?.galleryCode).toBe('FUTR1234');
  });

  it('should query for published galleries only', async () => {
    prismaMock.gallery.findUnique.mockResolvedValue(null);

    await getGalleryByCode('TEST1234');

    expect(prismaMock.gallery.findUnique).toHaveBeenCalledWith({
      where: { code: 'TEST1234', status: 'published' },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  });

  it('should handle gallery with no photos', async () => {
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-empty',
      code: 'EMPT1234',
      tenantId: 'tenant-123',
      title: 'Empty Gallery',
      description: null,
      status: 'published',
      visibility: 'code_protected',
      photoCount: 0,
      sessionPrice: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('EMPT1234');

    expect(result).not.toBeNull();
    expect(result?.photos).toHaveLength(0);
    expect(result?.photoCount).toBe(0);
  });

  it('should handle gallery with null description', async () => {
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-nodesc',
      code: 'NODE1234',
      tenantId: 'tenant-123',
      title: 'No Description Gallery',
      description: null,
      status: 'published',
      visibility: 'code_protected',
      photoCount: 0,
      sessionPrice: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('NODE1234');

    expect(result).not.toBeNull();
    expect(result?.description).toBeNull();
  });

  it('should handle gallery with null sessionPrice', async () => {
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-noprice',
      code: 'NOPR1234',
      tenantId: 'tenant-123',
      title: 'No Price Gallery',
      description: 'Free gallery',
      status: 'published',
      visibility: 'code_protected',
      photoCount: 0,
      sessionPrice: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('NOPR1234');

    expect(result).not.toBeNull();
    expect(result?.sessionPrice).toBeNull();
  });

  it('should preserve photo ordering from sortOrder', async () => {
    const mockGallery: GalleryWithPhotos = {
      id: 'gallery-sorted',
      code: 'SORT1234',
      tenantId: 'tenant-123',
      title: 'Sorted Gallery',
      description: null,
      status: 'published',
      visibility: 'code_protected',
      photoCount: 3,
      sessionPrice: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [
        {
          id: 'photo-a',
          galleryId: 'gallery-sorted',
          filename: 'first.jpg',
          originalKey: 'original/first.jpg',
          webKey: 'web/first.jpg',
          thumbnailKey: 'thumb/first.jpg',
          width: 800,
          height: 600,
          size: 100000,
          hash: 'hash1',
          sortOrder: 0,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'photo-b',
          galleryId: 'gallery-sorted',
          filename: 'second.jpg',
          originalKey: 'original/second.jpg',
          webKey: 'web/second.jpg',
          thumbnailKey: 'thumb/second.jpg',
          width: 800,
          height: 600,
          size: 100000,
          hash: 'hash2',
          sortOrder: 1,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'photo-c',
          galleryId: 'gallery-sorted',
          filename: 'third.jpg',
          originalKey: 'original/third.jpg',
          webKey: 'web/third.jpg',
          thumbnailKey: 'thumb/third.jpg',
          width: 800,
          height: 600,
          size: 100000,
          hash: 'hash3',
          sortOrder: 2,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    prismaMock.gallery.findUnique.mockResolvedValue(mockGallery);

    const result = await getGalleryByCode('SORT1234');

    expect(result?.photos[0].filename).toBe('first.jpg');
    expect(result?.photos[1].filename).toBe('second.jpg');
    expect(result?.photos[2].filename).toBe('third.jpg');
  });
});
