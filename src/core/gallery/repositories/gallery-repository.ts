import type { Gallery, GalleryId } from '../entities/gallery';
import type { GalleryCode } from '../value-objects/gallery-code';
import type { TenantId } from '@core/identity';

/**
 * Gallery Repository Interface
 */
export interface IGalleryRepository {
  findById(id: GalleryId): Promise<Gallery | null>;
  findByCode(code: GalleryCode): Promise<Gallery | null>;
  findByTenant(tenantId: TenantId): Promise<Gallery[]>;
  findPublishedByTenant(tenantId: TenantId): Promise<Gallery[]>;
  codeExists(code: GalleryCode): Promise<boolean>;
  save(gallery: Gallery): Promise<void>;
  delete(id: GalleryId): Promise<void>;
}
