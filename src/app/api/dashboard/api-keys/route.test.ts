// src/app/api/dashboard/api-keys/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import type { Tenant } from '@/generated/prisma';

// Mock auth
vi.mock('@/infrastructure/auth/auth', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/shared/lib/db', () => ({
  prisma: {
    tenant: {
      update: vi.fn(),
    },
  },
}));

// Mock features
vi.mock('@/shared/lib/features', () => ({
  hasFeature: vi.fn(),
}));

// Mock api-key functions
vi.mock('@/infrastructure/auth/api-key', () => ({
  generateApiKey: vi.fn(),
}));

// Import mocked modules after vi.mock declarations
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/shared/lib/db';
import { hasFeature } from '@/shared/lib/features';
import { generateApiKey } from '@/infrastructure/auth/api-key';

// Cast to mocked functions
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockHasFeature = hasFeature as unknown as ReturnType<typeof vi.fn>;
const mockGenerateApiKey = generateApiKey as unknown as ReturnType<
  typeof vi.fn
>;

describe('Dashboard API Keys Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/dashboard/api-keys', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/dashboard/api-keys',
        { method: 'POST' }
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Neovlasteni pristup');
    });

    it('should return 403 when tenant lacks api_access feature', async () => {
      mockAuth.mockResolvedValue({
        user: { tenantId: 'tenant-123' },
      });
      mockHasFeature.mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost/api/dashboard/api-keys',
        { method: 'POST' }
      );
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Studio');
    });

    it('should generate and return API key when authorized', async () => {
      mockAuth.mockResolvedValue({
        user: { tenantId: 'tenant-123' },
      });
      mockHasFeature.mockResolvedValue(true);
      mockGenerateApiKey.mockReturnValue({
        key: 'lum_test123456789',
        hash: 'hash123456',
      });
      vi.mocked(prisma.tenant.update).mockResolvedValue({
        id: 'tenant-123',
        apiKeyHash: 'hash123456',
      } as unknown as Tenant);

      const request = new NextRequest(
        'http://localhost/api/dashboard/api-keys',
        { method: 'POST' }
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.apiKey).toBe('lum_test123456789');

      // Verify tenant was updated with hash
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: { apiKeyHash: 'hash123456' },
      });
    });

    it('should call hasFeature with api_access', async () => {
      mockAuth.mockResolvedValue({
        user: { tenantId: 'tenant-123' },
      });
      mockHasFeature.mockResolvedValue(true);
      mockGenerateApiKey.mockReturnValue({
        key: 'lum_test123456789',
        hash: 'hash123456',
      });
      vi.mocked(prisma.tenant.update).mockResolvedValue(
        {} as unknown as Tenant
      );

      const request = new NextRequest(
        'http://localhost/api/dashboard/api-keys',
        { method: 'POST' }
      );
      await POST(request);

      expect(mockHasFeature).toHaveBeenCalledWith('tenant-123', 'api_access');
    });
  });
});
