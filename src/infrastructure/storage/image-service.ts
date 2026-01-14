import sharp from 'sharp';
import { uploadToR2, deleteFromR2 } from './r2-client';

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SAFE_PATH_REGEX = /^[a-zA-Z0-9_-]+$/;

export interface ImageVariants {
  original: { key: string; url: string };
  web: { key: string; url: string }; // 2048px
  thumbnail: { key: string; url: string }; // 800px
}

export interface ProcessedImage {
  variants: ImageVariants;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

// Size variants matching xmas.artemi-media.hr CDN pattern
const VARIANTS = {
  thumbnail: { width: 800, quality: 80 },
  web: { width: 2048, quality: 85 },
} as const;

export async function processAndUploadImage(
  galleryCode: string,
  filename: string,
  buffer: Buffer
): Promise<ProcessedImage> {
  // Validate inputs
  if (!SAFE_PATH_REGEX.test(galleryCode)) {
    throw new Error('Invalid gallery code format');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  // Sanitize filename - keep only alphanumeric, dash, underscore, and extension
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.');

  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  // Base path following xmas pattern: galleries/{CODE}/web/{SIZE}/{FILENAME}.webp
  const basePath = `galleries/${galleryCode}`;
  const baseFilename = sanitizedFilename.replace(/\.[^.]+$/, '');

  // Process variants
  const variants: ImageVariants = {
    original: { key: '', url: '' },
    web: { key: '', url: '' },
    thumbnail: { key: '', url: '' },
  };

  // Original
  const originalKey = `${basePath}/original/${sanitizedFilename}`;
  const originalUrl = await uploadToR2(
    originalKey,
    buffer,
    `image/${metadata.format}`
  );
  variants.original = { key: originalKey, url: originalUrl };

  // Web (2048px)
  const webBuffer = await image
    .resize(VARIANTS.web.width, undefined, { withoutEnlargement: true })
    .webp({ quality: VARIANTS.web.quality })
    .toBuffer();
  const webKey = `${basePath}/web/2048/${baseFilename}.webp`;
  const webUrl = await uploadToR2(webKey, webBuffer, 'image/webp');
  variants.web = { key: webKey, url: webUrl };

  // Thumbnail (800px)
  const thumbBuffer = await image
    .resize(VARIANTS.thumbnail.width, undefined, { withoutEnlargement: true })
    .webp({ quality: VARIANTS.thumbnail.quality })
    .toBuffer();
  const thumbKey = `${basePath}/web/800/${baseFilename}.webp`;
  const thumbUrl = await uploadToR2(thumbKey, thumbBuffer, 'image/webp');
  variants.thumbnail = { key: thumbKey, url: thumbUrl };

  return {
    variants,
    width: metadata.width,
    height: metadata.height,
    sizeBytes: buffer.length,
    mimeType: `image/${metadata.format}`,
  };
}

export async function deleteImageVariants(
  variants: ImageVariants
): Promise<void> {
  await Promise.all([
    deleteFromR2(variants.original.key),
    deleteFromR2(variants.web.key),
    deleteFromR2(variants.thumbnail.key),
  ]);
}
