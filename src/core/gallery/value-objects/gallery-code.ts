import { ValueObject } from '@core/shared';
import { Result } from '@core/shared';

interface GalleryCodeProps {
  value: string;
}

/**
 * Gallery Code Value Object
 * Unique access code for gallery entry (e.g., SCDY0028)
 */
export class GalleryCode extends ValueObject<GalleryCodeProps> {
  private static readonly CODE_REGEX = /^[A-Z0-9]{4,12}$/;

  private constructor(props: GalleryCodeProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(code: string): Result<GalleryCode, string> {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      return Result.fail('Gallery code cannot be empty');
    }

    if (!this.CODE_REGEX.test(normalized)) {
      return Result.fail('Gallery code must be 4-12 alphanumeric characters');
    }

    return Result.ok(new GalleryCode({ value: normalized }));
  }

  public static generate(prefix: string = ''): GalleryCode {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomPart = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    const code = `${prefix.toUpperCase()}${randomPart}`.slice(0, 12);
    return new GalleryCode({ value: code });
  }
}
