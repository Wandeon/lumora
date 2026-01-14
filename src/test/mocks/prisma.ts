import { vi, beforeEach } from 'vitest';
import { PrismaClient } from '@/generated/prisma';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

vi.mock('@shared/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '@shared/lib/db';

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
