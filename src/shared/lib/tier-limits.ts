export const TIER_LIMITS = {
  starter: {
    maxGalleries: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    maxOrdersPerMonth: 100,
  },
  pro: {
    maxGalleries: 50,
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxOrdersPerMonth: 1000,
  },
  studio: {
    maxGalleries: Infinity,
    maxStorageBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    maxOrdersPerMonth: Infinity,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export const MAX_ORDER_ITEMS = 100;

export function getTierLimits(tier: TierName) {
  return TIER_LIMITS[tier];
}
