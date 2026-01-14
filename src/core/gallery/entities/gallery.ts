import { AggregateRoot } from '@core/shared';
import type { TenantId } from '@core/identity';
import { GalleryCode } from '../value-objects/gallery-code';
import { GalleryCreatedEvent } from '../events/gallery-created';

export type GalleryId = string;

export type GalleryStatus = 'draft' | 'published' | 'archived';

export type GalleryVisibility = 'public' | 'private' | 'code_protected';

interface GalleryProps {
  id: GalleryId;
  tenantId: TenantId;
  code: GalleryCode;
  title: string;
  description: string | null;
  status: GalleryStatus;
  visibility: GalleryVisibility;
  coverPhotoId: string | null;
  photoCount: number;
  sessionPrice: number | null; // in cents
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gallery Aggregate Root
 * Represents a photo gallery/album
 */
export class Gallery extends AggregateRoot<GalleryId> {
  private _tenantId: TenantId;
  private _code: GalleryCode;
  private _title: string;
  private _description: string | null;
  private _status: GalleryStatus;
  private _visibility: GalleryVisibility;
  private _coverPhotoId: string | null;
  private _photoCount: number;
  private _sessionPrice: number | null;
  private _expiresAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: GalleryProps) {
    super(props.id);
    this._tenantId = props.tenantId;
    this._code = props.code;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._visibility = props.visibility;
    this._coverPhotoId = props.coverPhotoId;
    this._photoCount = props.photoCount;
    this._sessionPrice = props.sessionPrice;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get tenantId(): TenantId {
    return this._tenantId;
  }

  get code(): GalleryCode {
    return this._code;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get status(): GalleryStatus {
    return this._status;
  }

  get visibility(): GalleryVisibility {
    return this._visibility;
  }

  get coverPhotoId(): string | null {
    return this._coverPhotoId;
  }

  get photoCount(): number {
    return this._photoCount;
  }

  get sessionPrice(): number | null {
    return this._sessionPrice;
  }

  get expiresAt(): Date | null {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isExpired(): boolean {
    if (!this._expiresAt) return false;
    return new Date() > this._expiresAt;
  }

  get isAccessible(): boolean {
    return this._status === 'published' && !this.isExpired;
  }

  // Factory methods
  public static create(
    id: GalleryId,
    tenantId: TenantId,
    title: string,
    codePrefix: string = ''
  ): Gallery {
    const now = new Date();
    const code = GalleryCode.generate(codePrefix);

    const gallery = new Gallery({
      id,
      tenantId,
      code,
      title,
      description: null,
      status: 'draft',
      visibility: 'code_protected',
      coverPhotoId: null,
      photoCount: 0,
      sessionPrice: null,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    });

    gallery.addDomainEvent(
      new GalleryCreatedEvent(id, tenantId, code.value, title)
    );

    return gallery;
  }

  public static reconstitute(props: GalleryProps): Gallery {
    return new Gallery(props);
  }

  // Business methods
  public updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  public setSessionPrice(priceInCents: number | null): void {
    this._sessionPrice = priceInCents;
    this._updatedAt = new Date();
  }

  public setCoverPhoto(photoId: string | null): void {
    this._coverPhotoId = photoId;
    this._updatedAt = new Date();
  }

  public setExpiration(expiresAt: Date | null): void {
    this._expiresAt = expiresAt;
    this._updatedAt = new Date();
  }

  public setVisibility(visibility: GalleryVisibility): void {
    this._visibility = visibility;
    this._updatedAt = new Date();
  }

  public publish(): void {
    this._status = 'published';
    this._updatedAt = new Date();
  }

  public archive(): void {
    this._status = 'archived';
    this._updatedAt = new Date();
  }

  public incrementPhotoCount(): void {
    this._photoCount += 1;
    this._updatedAt = new Date();
  }

  public decrementPhotoCount(): void {
    if (this._photoCount > 0) {
      this._photoCount -= 1;
      this._updatedAt = new Date();
    }
  }

  public setPhotoCount(count: number): void {
    this._photoCount = count;
    this._updatedAt = new Date();
  }
}
