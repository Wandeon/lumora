import { BaseDomainEvent } from '@core/shared';
import type { TenantId } from '@core/identity';

export class GalleryCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'gallery.created';
  public readonly aggregateId: string;
  public readonly tenantId: TenantId;
  public readonly code: string;
  public readonly title: string;

  constructor(
    galleryId: string,
    tenantId: TenantId,
    code: string,
    title: string
  ) {
    super();
    this.aggregateId = galleryId;
    this.tenantId = tenantId;
    this.code = code;
    this.title = title;
  }
}
