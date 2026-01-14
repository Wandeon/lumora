# ADR 002: Multi-Tenancy Strategy

## Status

Accepted

## Date

2026-01-14

## Context

Lumora is a SaaS platform serving multiple photo studios. Each studio (tenant) needs:

1. Data isolation from other tenants
2. Custom subdomain (`studio.lumora.io`)
3. Optional custom domain (`gallery.mystudio.com`)
4. Tenant-specific feature flags and configuration

We need to choose a multi-tenancy strategy that balances:

- Data isolation and security
- Operational complexity
- Cost efficiency
- Performance

## Decision

We will use **Shared Database with Application-Level Isolation**.

### Implementation

1. **Single Database**: All tenants share one PostgreSQL database
2. **Tenant ID Column**: Every table includes `tenant_id` foreign key
3. **Application Enforcement**: All queries filter by current tenant
4. **Middleware Resolution**: Tenant determined from subdomain/domain

### Tenant Resolution Order

```typescript
1. Custom domain lookup (gallery.mystudio.com)
2. Subdomain extraction (studio.lumora.io)
3. API header (X-Tenant-ID for machine clients)
```

### Query Pattern

```typescript
// All repository methods include tenant context
interface IGalleryRepository {
  findByTenant(tenantId: string): Promise<Gallery[]>;
  findById(tenantId: string, id: string): Promise<Gallery | null>;
}

// Prisma queries always include tenant filter
const galleries = await prisma.gallery.findMany({
  where: {
    tenantId: context.tenantId,
    status: 'published',
  },
});
```

### Indexes

Every table with `tenant_id` has a composite index:

```sql
@@index([tenantId])
@@index([tenantId, status])  -- for common query patterns
```

## Consequences

### Positive

- **Simple Operations**: One database to manage, backup, monitor
- **Cost Effective**: No per-tenant database overhead
- **Easy Migrations**: Schema changes apply to all tenants
- **Cross-Tenant Queries**: Admin analytics possible when needed
- **Fast Onboarding**: No database provisioning for new tenants

### Negative

- **No Database-Level Isolation**: Relies on application correctness
- **Noisy Neighbor Risk**: One tenant can impact others' performance
- **Single Point of Failure**: Database issues affect all tenants

### Mitigations

1. **Code Review**: All queries must include tenant filter
2. **Middleware Guard**: Reject requests without valid tenant context
3. **Query Logging**: Monitor for cross-tenant access attempts
4. **Rate Limiting**: Per-tenant request limits
5. **Connection Pooling**: Prevent single tenant from exhausting connections

## Alternatives Considered

### 1. Database per Tenant

- **Rejected because**: Operational complexity, cost prohibitive at scale, migration challenges

### 2. Schema per Tenant

- **Rejected because**: PostgreSQL schema limitations, migration complexity

### 3. Row-Level Security (RLS)

- **Considered for future**: Could add as defense-in-depth layer
- **Not chosen initially**: Adds complexity, application-level sufficient for MVP

## Future Considerations

1. **Add RLS**: As defense-in-depth for high-security tenants
2. **Sharding**: If single database becomes bottleneck
3. **Read Replicas**: For analytics and reporting workloads
4. **Dedicated Databases**: Premium tier offering for enterprise tenants

## References

- Microsoft Azure, "Multi-tenant SaaS patterns"
- AWS, "SaaS Tenant Isolation Strategies"
