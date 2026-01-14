import type { Tenant, TenantId } from '../entities/tenant';
import type { TenantSlug } from '../value-objects/tenant-slug';

/**
 * Tenant Repository Interface
 * Defines the contract for tenant persistence
 * Implementation lives in infrastructure layer
 */
export interface ITenantRepository {
  findById(id: TenantId): Promise<Tenant | null>;
  findBySlug(slug: TenantSlug): Promise<Tenant | null>;
  findByCustomDomain(domain: string): Promise<Tenant | null>;
  exists(slug: TenantSlug): Promise<boolean>;
  save(tenant: Tenant): Promise<void>;
  delete(id: TenantId): Promise<void>;
}
