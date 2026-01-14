import { Entity } from '@core/shared';
import type { GalleryId } from './gallery';

export type PhotoId = string;

interface PhotoProps {
  id: PhotoId;
  galleryId: GalleryId;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  webUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  sortOrder: number;
  isFavorite: boolean;
  uploadedAt: Date;
}

/**
 * Photo Entity
 * Represents a single photo within a gallery
 */
export class Photo extends Entity<PhotoId> {
  private _galleryId: GalleryId;
  private _filename: string;
  private _originalUrl: string;
  private _thumbnailUrl: string;
  private _webUrl: string;
  private _width: number;
  private _height: number;
  private _sizeBytes: number;
  private _mimeType: string;
  private _sortOrder: number;
  private _isFavorite: boolean;
  private _uploadedAt: Date;

  private constructor(props: PhotoProps) {
    super(props.id);
    this._galleryId = props.galleryId;
    this._filename = props.filename;
    this._originalUrl = props.originalUrl;
    this._thumbnailUrl = props.thumbnailUrl;
    this._webUrl = props.webUrl;
    this._width = props.width;
    this._height = props.height;
    this._sizeBytes = props.sizeBytes;
    this._mimeType = props.mimeType;
    this._sortOrder = props.sortOrder;
    this._isFavorite = props.isFavorite;
    this._uploadedAt = props.uploadedAt;
  }

  // Getters
  get galleryId(): GalleryId {
    return this._galleryId;
  }

  get filename(): string {
    return this._filename;
  }

  get originalUrl(): string {
    return this._originalUrl;
  }

  get thumbnailUrl(): string {
    return this._thumbnailUrl;
  }

  get webUrl(): string {
    return this._webUrl;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get isFavorite(): boolean {
    return this._isFavorite;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  get aspectRatio(): number {
    return this._width / this._height;
  }

  get isPortrait(): boolean {
    return this._height > this._width;
  }

  get isLandscape(): boolean {
    return this._width > this._height;
  }

  // Factory methods
  public static create(props: PhotoProps): Photo {
    return new Photo(props);
  }

  public static reconstitute(props: PhotoProps): Photo {
    return new Photo(props);
  }

  // Business methods
  public toggleFavorite(): void {
    this._isFavorite = !this._isFavorite;
  }

  public setFavorite(isFavorite: boolean): void {
    this._isFavorite = isFavorite;
  }

  public updateSortOrder(order: number): void {
    this._sortOrder = order;
  }
}
