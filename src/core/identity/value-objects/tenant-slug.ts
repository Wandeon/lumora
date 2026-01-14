import { ValueObject } from '@core/shared';
import { Result } from '@core/shared';

interface TenantSlugProps {
  value: string;
}

/**
 * Tenant Slug Value Object
 * URL-safe identifier for tenant subdomains
 */
export class TenantSlug extends ValueObject<TenantSlugProps> {
  private static readonly SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  private static readonly RESERVED_SLUGS = new Set([
    'www',
    'api',
    'app',
    'admin',
    'dashboard',
    'login',
    'signup',
    'auth',
    'static',
    'assets',
    'cdn',
    'mail',
    'email',
    'support',
    'help',
    'docs',
    'blog',
    'status',
  ]);

  private constructor(props: TenantSlugProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(slug: string): Result<TenantSlug, string> {
    const normalized = slug.trim().toLowerCase();

    if (!normalized) {
      return Result.fail('Tenant slug cannot be empty');
    }

    if (normalized.length < 3) {
      return Result.fail('Tenant slug must be at least 3 characters');
    }

    if (normalized.length > 63) {
      return Result.fail('Tenant slug cannot exceed 63 characters');
    }

    if (!this.SLUG_REGEX.test(normalized)) {
      return Result.fail(
        'Tenant slug must contain only lowercase letters, numbers, and hyphens'
      );
    }

    if (this.RESERVED_SLUGS.has(normalized)) {
      return Result.fail('This slug is reserved');
    }

    return Result.ok(new TenantSlug({ value: normalized }));
  }

  public static fromString(slug: string): Result<TenantSlug, string> {
    return this.create(slug);
  }
}
