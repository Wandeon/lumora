// src/shared/lib/features.ts
import { cache } from 'react';
import { prisma } from './db';
import type { TenantTier } from '@/generated/prisma';

// Feature definitions with tier requirements
export const FEATURES = {
  // Starter tier (all)
  galleries: { tier: 'starter', name: 'Galleries' },
  code_access: { tier: 'starter', name: 'Code Access' },
  downloads: { tier: 'starter', name: 'Downloads' },
  favorites: { tier: 'starter', name: 'Favorites' },

  // Pro tier
  print_orders: { tier: 'pro', name: 'Print Orders' },
  payments: { tier: 'pro', name: 'Payments' },
  coupons: { tier: 'pro', name: 'Coupons' },
  gift_cards: { tier: 'pro', name: 'Gift Cards' },

  // Studio tier
  white_label: { tier: 'studio', name: 'White Label' },
  custom_domain: { tier: 'studio', name: 'Custom Domain' },
  invoices: { tier: 'studio', name: 'Invoices' },
  api_access: { tier: 'studio', name: 'API Access' },
  multi_user: { tier: 'studio', name: 'Multi-User' },
  analytics: { tier: 'studio', name: 'Analytics' },
} as const;

export type FeatureName = keyof typeof FEATURES;
export type FeatureTier = (typeof FEATURES)[FeatureName]['tier'];

const TIER_ORDER: Record<TenantTier, number> = {
  starter: 0,
  pro: 1,
  studio: 2,
};

function tierIncludesFeature(
  tenantTier: TenantTier,
  featureTier: FeatureTier
): boolean {
  return TIER_ORDER[tenantTier] >= TIER_ORDER[featureTier];
}

// Check if tenant has feature (cached per request)
export const hasFeature = cache(
  async (tenantId: string, feature: FeatureName): Promise<boolean> => {
    // Check explicit override first
    const flag = await prisma.tenantFeatureFlag.findUnique({
      where: { tenantId_feature: { tenantId, feature } },
    });

    if (flag !== null) {
      return flag.enabled;
    }

    // Fall back to tier-based default
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) return false;

    const featureDef = FEATURES[feature];
    return tierIncludesFeature(tenant.tier, featureDef.tier);
  }
);

// Get all features for tenant
export const getTenantFeatures = cache(
  async (tenantId: string): Promise<Record<FeatureName, boolean>> => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true },
    });

    if (!tenant) {
      return Object.fromEntries(
        Object.keys(FEATURES).map((f) => [f, false])
      ) as Record<FeatureName, boolean>;
    }

    // Get explicit overrides
    const overrides = await prisma.tenantFeatureFlag.findMany({
      where: { tenantId },
    });

    const overrideMap = new Map(overrides.map((o) => [o.feature, o.enabled]));

    // Build feature map
    const features: Partial<Record<FeatureName, boolean>> = {};
    for (const [name, def] of Object.entries(FEATURES)) {
      const override = overrideMap.get(name);
      features[name as FeatureName] =
        override ?? tierIncludesFeature(tenant.tier, def.tier);
    }

    return features as Record<FeatureName, boolean>;
  }
);
