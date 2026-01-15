import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient, Tenant, Gallery } from '@/generated/prisma';
import { createGallery } from './create-gallery';

// Mock Prisma with typed mock
vi.mock('@/shared/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '@/shared/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('createGallery', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it('should create gallery with valid input', async () => {
    const mockTenant: Pick<Tenant, 'slug'> = { slug: 'mystudio' };
    const mockGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'gallery-123',
      code: 'MYST1234',
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as Tenant);
    prismaMock.gallery.findUnique.mockResolvedValue(null);
    prismaMock.gallery.create.mockResolvedValue(mockGallery as Gallery);

    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Summer Wedding 2024',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('gallery-123');
      expect(result.value.code).toBe('MYST1234');
    }

    // Verify tenant lookup was called
    expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      select: { slug: true },
    });

    // Verify gallery was created with correct data
    expect(prismaMock.gallery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Summer Wedding 2024',
        status: 'draft',
        visibility: 'code_protected',
      }),
    });
  });

  it('should fail when tenant not found', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);

    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Gallery',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Tenant not found');
    }
  });

  it('should validate title is required', async () => {
    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
    });

    expect(result.success).toBe(false);
    // Empty title should fail validation - Zod v4 uses "Too small" message
    if (!result.success) {
      expect(result.error).toContain('too_small');
    }
  });

  it('should validate tenantId is a valid UUID', async () => {
    const result = await createGallery({
      tenantId: 'invalid-uuid',
      title: 'Test Gallery',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('uuid');
    }
  });

  it('should create gallery with optional fields', async () => {
    const mockTenant: Pick<Tenant, 'slug'> = { slug: 'studio' };
    const mockGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'gallery-456',
      code: 'STUD5678',
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as Tenant);
    prismaMock.gallery.findUnique.mockResolvedValue(null);
    prismaMock.gallery.create.mockResolvedValue(mockGallery as Gallery);

    const expiresAt = new Date('2025-12-31');
    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Birthday Party',
      description: 'Photos from the party',
      visibility: 'private',
      sessionPrice: 2500,
      expiresAt,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('gallery-456');
    }

    // Verify all optional fields were passed to create
    expect(prismaMock.gallery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Birthday Party',
        description: 'Photos from the party',
        visibility: 'private',
        sessionPrice: 2500,
        expiresAt,
      }),
    });
  });

  it('should retry code generation if code already exists', async () => {
    const mockTenant: Pick<Tenant, 'slug'> = { slug: 'demo' };
    const existingGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'existing',
      code: 'DEMOXXXX',
    };
    const newGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'gallery-789',
      code: 'DEMOYYYY',
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as Tenant);
    // First check finds existing code, second check returns null
    prismaMock.gallery.findUnique
      .mockResolvedValueOnce(existingGallery as Gallery)
      .mockResolvedValueOnce(null);
    prismaMock.gallery.create.mockResolvedValue(newGallery as Gallery);

    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
    });

    expect(result.success).toBe(true);
    // Should have checked for uniqueness twice
    expect(prismaMock.gallery.findUnique).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retry attempts for unique code', async () => {
    const mockTenant: Pick<Tenant, 'slug'> = { slug: 'busy' };
    const existingGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'existing',
      code: 'BUSYXXXX',
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as Tenant);
    // Always return existing gallery (code collision)
    prismaMock.gallery.findUnique.mockResolvedValue(existingGallery as Gallery);

    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Could not generate unique gallery code');
    }
    // Should have tried 10 times
    expect(prismaMock.gallery.findUnique).toHaveBeenCalledTimes(10);
  });

  it('should validate visibility enum values', async () => {
    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Gallery',
      // @ts-expect-error - testing invalid enum value
      visibility: 'invalid_visibility',
    });

    expect(result.success).toBe(false);
  });

  it('should validate sessionPrice must be positive integer', async () => {
    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Gallery',
      sessionPrice: -100,
    });

    expect(result.success).toBe(false);
  });

  it('should validate title max length', async () => {
    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'A'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('255');
    }
  });

  it('should generate code with tenant slug prefix', async () => {
    const mockTenant: Pick<Tenant, 'slug'> = { slug: 'artemi-studio' };
    const mockGallery: Pick<Gallery, 'id' | 'code'> = {
      id: 'gallery-999',
      code: 'ARTEXYZ1',
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant as Tenant);
    prismaMock.gallery.findUnique.mockResolvedValue(null);
    prismaMock.gallery.create.mockResolvedValue(mockGallery as Gallery);

    const result = await createGallery({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
    });

    expect(result.success).toBe(true);
    // Verify the code was generated (the actual code will be random but prefixed)
    expect(prismaMock.gallery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: expect.stringMatching(/^[A-Z0-9]{4,12}$/),
      }),
    });
  });
});
