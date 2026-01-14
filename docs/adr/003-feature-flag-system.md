# ADR 003: Feature Flag System for Modular SaaS

## Status

Accepted

## Date

2026-01-14

## Context

Lumora offers tiered pricing with different feature sets:

| Tier    | Features                                 |
| ------- | ---------------------------------------- |
| Starter | Galleries, downloads, code access        |
| Pro     | + Print orders, payments, coupons        |
| Studio  | + White-label, invoices, API, multi-user |

We need a system to:

1. Enable/disable features per tenant
2. Gate UI components and API endpoints
3. Allow custom feature configuration
4. Support A/B testing and gradual rollouts

## Decision

We will implement a **Database-Backed Feature Flag System** with tier-based defaults.

### Data Model

```prisma
model TenantFeatureFlag {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  feature   String   @db.VarChar(50)
  enabled   Boolean  @default(false)
  config    Json?    // Feature-specific configuration

  @@unique([tenantId, feature])
}
```

### Feature Registry

```typescript
// Centralized feature definitions
const FEATURES = {
  // Core (all tiers)
  galleries: { name: 'Galleries', tier: 'starter' },
  downloads: { name: 'Downloads', tier: 'starter' },
  code_access: { name: 'Code Access', tier: 'starter' },

  // Pro tier
  print_orders: { name: 'Print Orders', tier: 'pro' },
  payments: { name: 'Payments', tier: 'pro' },
  coupons: { name: 'Coupons', tier: 'pro' },

  // Studio tier
  white_label: { name: 'White Label', tier: 'studio' },
  invoices: { name: 'Invoices', tier: 'studio' },
  api_access: { name: 'API Access', tier: 'studio' },
  multi_user: { name: 'Multi-User', tier: 'studio' },
} as const;
```

### Usage Patterns

#### Server-Side Check

```typescript
async function hasFeature(
  tenantId: string,
  feature: keyof typeof FEATURES
): Promise<boolean> {
  // Check explicit flag first
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

  return tierIncludesFeature(tenant.tier, feature);
}
```

#### API Route Guard

```typescript
// Middleware for feature-gated routes
export function requireFeature(feature: string) {
  return async (req: Request, ctx: Context) => {
    const hasAccess = await hasFeature(ctx.tenantId, feature);
    if (!hasAccess) {
      return new Response('Feature not available', { status: 403 });
    }
    return next();
  };
}

// Usage
app.post('/api/orders', requireFeature('print_orders'), createOrder);
```

#### UI Component Guard

```typescript
// React component wrapper
function FeatureGate({
  feature,
  children,
  fallback
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature } = useTenantFeatures();

  if (!hasFeature(feature)) {
    return fallback ?? null;
  }

  return children;
}

// Usage
<FeatureGate feature="print_orders" fallback={<UpgradePrompt />}>
  <OrderButton />
</FeatureGate>
```

## Consequences

### Positive

- **Flexible**: Can override tier defaults per tenant
- **Configurable**: Features can have custom configuration
- **Testable**: Easy to enable features for testing
- **Upgradeable**: Smooth tier upgrades by enabling features
- **Rollout Control**: Gradual feature releases possible

### Negative

- **Database Queries**: Each check requires database lookup
- **Complexity**: More code paths to test
- **Consistency**: Must check both server and client

### Mitigations

1. **Caching**: Cache feature flags per tenant with short TTL
2. **Batch Loading**: Load all flags at request start
3. **Type Safety**: Use TypeScript to enforce valid feature names

## Alternatives Considered

### 1. Environment Variables

- **Rejected because**: Not tenant-specific, requires redeployment

### 2. Third-Party Service (LaunchDarkly, etc.)

- **Rejected because**: Additional cost, external dependency
- **May reconsider**: If A/B testing becomes important

### 3. Hardcoded Tier Checks

- **Rejected because**: Inflexible, no override capability

## Future Considerations

1. **Feature Usage Analytics**: Track which features are actually used
2. **A/B Testing**: Percentage-based rollouts
3. **Time-Based Flags**: Trial features with expiration
4. **Dependent Features**: Feature A requires Feature B

## References

- Martin Fowler, "Feature Toggles"
- Pete Hodgson, "Feature Toggles (Feature Flags)"
