import { BaseDomainEvent } from '@core/shared';
import type { TenantTier } from '../entities/tenant';

export class TenantCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'tenant.created';
  public readonly aggregateId: string;
  public readonly slug: string;
  public readonly name: string;
  public readonly tier: TenantTier;

  constructor(tenantId: string, slug: string, name: string, tier: TenantTier) {
    super();
    this.aggregateId = tenantId;
    this.slug = slug;
    this.name = name;
    this.tier = tier;
  }
}
