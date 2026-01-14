import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct } from './create-product';

vi.mock('@/shared/lib/db', () => ({
  prisma: {
    product: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/features', () => ({
  hasFeature: vi.fn(),
}));

import { prisma } from '@/shared/lib/db';
import { hasFeature } from '@/shared/lib/features';

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create product when tenant has feature access', async () => {
    vi.mocked(hasFeature).mockResolvedValue(true);
    vi.mocked(prisma.product.create).mockResolvedValue({
      id: 'product-123',
      name: 'Print 10x15',
    } as never);

    const result = await createProduct({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Print 10x15',
      type: 'print',
      price: 500,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('product-123');
    }
  });

  it('should fail when tenant lacks feature access', async () => {
    vi.mocked(hasFeature).mockResolvedValue(false);

    const result = await createProduct({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Print 10x15',
      type: 'print',
      price: 500,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Pro tier');
    }
  });

  it('should fail validation for invalid input', async () => {
    const result = await createProduct({
      tenantId: 'invalid-uuid',
      name: 'Print 10x15',
      type: 'print',
      price: 500,
    });

    expect(result.success).toBe(false);
  });

  it('should fail validation for negative price', async () => {
    const result = await createProduct({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Print 10x15',
      type: 'print',
      price: -100,
    });

    expect(result.success).toBe(false);
  });

  it('should fail validation for empty name', async () => {
    const result = await createProduct({
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      type: 'print',
      price: 500,
    });

    expect(result.success).toBe(false);
  });
});
