import { describe, it, expect } from 'vitest';
import { prismaMock } from './prisma';

describe('Prisma Mock', () => {
  it('should create a mock prisma client', () => {
    expect(prismaMock).toBeDefined();
  });

  it('should be able to mock tenant findUnique', async () => {
    const mockTenant = {
      id: '1',
      slug: 'test-tenant',
      name: 'Test Tenant',
      tier: 'starter' as const,
      status: 'active' as const,
      customDomain: null,
      logoUrl: null,
      brandColor: null,
      apiKeyHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

    const result = await prismaMock.tenant.findUnique({
      where: { slug: 'test-tenant' },
    });

    expect(result).toEqual(mockTenant);
    expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test-tenant' },
    });
  });

  it('should reset mock between tests', () => {
    // This test should not see any calls from the previous test
    expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
  });
});
