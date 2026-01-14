import { AggregateRoot } from '@core/shared';
import { TenantSlug } from '../value-objects/tenant-slug';
import { TenantCreatedEvent } from '../events/tenant-created';

export type TenantId = string;

export type TenantTier = 'starter' | 'pro' | 'studio';

export type TenantStatus = 'active' | 'suspended' | 'cancelled';

interface TenantProps {
  id: TenantId;
  slug: TenantSlug;
  name: string;
  tier: TenantTier;
  status: TenantStatus;
  customDomain: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant Aggregate Root
 * Represents a photo studio/organization using the platform
 */
export class Tenant extends AggregateRoot<TenantId> {
  private _slug: TenantSlug;
  private _name: string;
  private _tier: TenantTier;
  private _status: TenantStatus;
  private _customDomain: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: TenantProps) {
    super(props.id);
    this._slug = props.slug;
    this._name = props.name;
    this._tier = props.tier;
    this._status = props.status;
    this._customDomain = props.customDomain;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get slug(): TenantSlug {
    return this._slug;
  }

  get name(): string {
    return this._name;
  }

  get tier(): TenantTier {
    return this._tier;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get customDomain(): string | null {
    return this._customDomain;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public static create(
    id: TenantId,
    slug: TenantSlug,
    name: string,
    tier: TenantTier = 'starter'
  ): Tenant {
    const now = new Date();
    const tenant = new Tenant({
      id,
      slug,
      name,
      tier,
      status: 'active',
      customDomain: null,
      createdAt: now,
      updatedAt: now,
    });

    tenant.addDomainEvent(new TenantCreatedEvent(id, slug.value, name, tier));

    return tenant;
  }

  public static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  public updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  public upgradeTier(tier: TenantTier): void {
    this._tier = tier;
    this._updatedAt = new Date();
  }

  public setCustomDomain(domain: string | null): void {
    this._customDomain = domain;
    this._updatedAt = new Date();
  }

  public suspend(): void {
    this._status = 'suspended';
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  public cancel(): void {
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }
}
