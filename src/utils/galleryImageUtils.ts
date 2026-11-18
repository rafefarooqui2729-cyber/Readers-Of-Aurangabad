/**
 * Gallery Image Preparation Utility
 *
 * Provides client-side validation, dimension calculation, and thumbnail generation
 * for Readers of Aurangabad community gallery uploads.
 *
 * Validation Rules:
 * - Allowed formats: JPEG, PNG, WebP
 * - Maximum original file size: 20 MB (20,971,520 bytes)
 * - Contradictory MIME type and extension combinations are rejected
 * - Missing MIME types are resolved safely via extension and header signature; never assumed to be JPEG
 * - Magic-byte file signatures are inspected to verify format consistency (initial header check;
 *   full rendering validity is verified during canvas decoding)
 *
 * Thumbnail Constraints:
 * - Maximum thumbnail dimension: 640 px (aspect-ratio preserved, never upscaled)
 * - Format: image/webp (quality: 0.85)
 * - Rejects unsupported WebP conversion if canvas falls back to another MIME type
 * - Strict cleanup of temporary Object URLs and image element listeners
 * - Zero external dependencies
 */

export const MAX_ORIGINAL_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_THUMBNAIL_DIMENSION = 640; // 640 px
export const THUMBNAIL_QUALITY = 0.85;

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';

export const CANONICAL_MIME_TYPES: Record<SupportedImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

export const ALLOWED_EXTENSIONS: Record<SupportedImageFormat, readonly string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp']
};

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface PreparedGalleryImage {
  originalFile: File;
  thumbnailBlob: Blob;
  originalDimensions: ImageDimensions;
  thumbnailDimensions: ImageDimensions;
  mimeType: string;
  format: SupportedImageFormat;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  format?: SupportedImageFormat;
  canonicalMimeType?: string;
  canonicalExtension?: string;
}

/**
 * Resolves format from a file name extension.
 */
export function getFormatFromExtension(filename: string): SupportedImageFormat | null {
  if (!filename || typeof filename !== 'string') return null;
  const parts = filename.split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop()?.trim().toLowerCase() || '';

  if (ALLOWED_EXTENSIONS.jpeg.includes(ext)) return 'jpeg';
  if (ALLOWED_EXTENSIONS.png.includes(ext)) return 'png';
  if (ALLOWED_EXTENSIONS.webp.includes(ext)) return 'webp';

  return null;
}

/**
 * Resolves format from a declared MIME type.
 */
export function getFormatFromMimeType(mimeType: string): SupportedImageFormat | null {
  if (!mimeType || typeof mimeType !== 'string') return null;
  const normalized = mimeType.trim().toLowerCase();

  if (normalized === 'image/jpeg' || normalized === 'image/pjpeg') return 'jpeg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';

  return null;
}

/**
 * Inspects initial magic bytes to verify file signature.
 *
 * Note: Signature validation checks the file header format.
 * Comprehensive structural integrity is verified when the browser decodes the image.
 */
export async function detectFileSignature(file: File): Promise<SupportedImageFormat | null> {
  if (!file || file.size < 12) {
    return null;
  }

  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // JPEG signature: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'jpeg';
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'png';
    }

    // WebP signature: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    ) {
      return 'webp';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates file constraints, ensuring non-empty size within 20 MB,
 * matching extension and MIME type, and consistent magic-byte file signature.
 */
export async function validateGalleryImageFile(file: File): Promise<FileValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided for upload.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_ORIGINAL_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the maximum allowed limit of 20 MB.`
    };
  }

  // 1. Verify extension
  const filename = file.name || '';
  const extFormat = getFormatFromExtension(filename);
  if (!extFormat) {
    const ext = filename.includes('.') ? filename.split('.').pop() : '';
    return {
      valid: false,
      error: ext
        ? `Unsupported file extension ('.${ext}'). Only JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp) files are permitted.`
        : 'The file has no extension. Please provide an image with a valid .jpg, .jpeg, .png, or .webp extension.'
    };
  }

  // 2. Verify declared MIME type (if provided)
  const rawMime = (file.type || '').trim().toLowerCase();
  if (rawMime !== '') {
    const mimeFormat = getFormatFromMimeType(rawMime);
    if (!mimeFormat) {
      return {
        valid: false,
        error: `Unsupported MIME type ('${rawMime}'). Only image/jpeg, image/png, and image/webp are permitted.`
      };
    }

    // Reject contradictory combinations (e.g. .png named file with image/jpeg MIME)
    if (mimeFormat !== extFormat) {
      return {
        valid: false,
        error: `Contradictory file attributes: file extension indicates '${extFormat.toUpperCase()}' but declared MIME type is '${rawMime}'.`
      };
    }
  }

  // 3. Inspect header magic bytes
  const signatureFormat = await detectFileSignature(file);
  if (!signatureFormat) {
    return {
      valid: false,
      error: 'Unrecognized file signature. The file header does not match valid JPEG, PNG, or WebP binary specifications.'
    };
  }

  // Reject contradictory signature vs extension
  if (signatureFormat !== extFormat) {
    return {
      valid: false,
      error: `Contradictory file content: file signature is '${signatureFormat.toUpperCase()}', but the file extension is for '${extFormat.toUpperCase()}'.`
    };
  }

  const canonicalMime = CANONICAL_MIME_TYPES[signatureFormat];
  const canonicalExt = signatureFormat === 'jpeg' ? 'jpg' : signatureFormat;

  return {
    valid: true,
    format: signatureFormat,
    canonicalMimeType: canonicalMime,
    canonicalExtension: canonicalExt
  };
}

/**
 * Calculates thumbnail dimensions preserving aspect ratio without upscaling.
 */
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = MAX_THUMBNAIL_DIMENSION
): ImageDimensions {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: maxDimension, height: maxDimension };
  }

  // Never upscale images smaller than the maximum dimension
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  if (originalWidth >= originalHeight) {
    const targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
    return {
      width: maxDimension,
      height: Math.max(1, targetHeight)
    };
  } else {
    const targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
    return {
      width: Math.max(1, targetWidth),
      height: maxDimension
    };
  }
}

/**
 * Prepares a gallery image: validates constraints, extracts dimensions,
 * and generates a high-quality WebP thumbnail preserving original file unchanged.
 *
 * Verifies that the browser canvas export produces genuine WebP data.
 */
export async function prepareGalleryImage(file: File): Promise<PreparedGalleryImage> {
  const validation = await validateGalleryImageFile(file);
  if (!validation.valid || !validation.canonicalMimeType || !validation.format) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  const { canonicalMimeType, format } = validation;

  return new Promise<PreparedGalleryImage>((resolve, reject) => {
    let objectUrl: string | null = null;
    let img: HTMLImageElement | null = new Image();

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revocation errors
        }
        objectUrl = null;
      }
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = '';
        img = null;
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
    } catch (err: any) {
      cleanup();
      reject(new Error(`Failed to create object URL for image file: ${err?.message || err}`));
      return;
    }

    img.onload = () => {
      try {
        if (!img) {
          cleanup();
          reject(new Error('Image resource was unexpectedly released.'));
          return;
        }

        const originalDimensions: ImageDimensions = {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        };

        if (originalDimensions.width <= 0 || originalDimensions.height <= 0) {
          cleanup();
          reject(new Error('Unable to determine image dimensions: image is zero-sized or corrupt.'));
          return;
        }

        const thumbnailDimensions = calculateThumbnailDimensions(
          originalDimensions.width,
          originalDimensions.height,
          MAX_THUMBNAIL_DIMENSION
        );

        const canvas = document.createElement('canvas');
        canvas.width = thumbnailDimensions.width;
        canvas.height = thumbnailDimensions.height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D rendering context is not supported in this browser.'));
          return;
        }

        // High quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, thumbnailDimensions.width, thumbnailDimensions.height);

        canvas.toBlob(
          (blob) => {
            cleanup();

            if (!blob) {
              reject(new Error('Failed to generate thumbnail: canvas export produced no data.'));
              return;
            }

            // Reject unsupported WebP conversion instead of silently uploading another format as WebP
            if (blob.type !== 'image/webp') {
              reject(
                new Error(
                  `Browser does not support WebP canvas conversion (returned '${blob.type}' instead of 'image/webp').`
                )
              );
              return;
            }

            resolve({
              originalFile: file,
              thumbnailBlob: blob,
              originalDimensions,
              thumbnailDimensions,
              mimeType: canonicalMimeType,
              format
            });
          },
          'image/webp',
          THUMBNAIL_QUALITY
        );
      } catch (err: any) {
        cleanup();
        reject(new Error(`Failed to process image for thumbnail: ${err?.message || err}`));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to decode the selected image file. The image may be corrupted or malformed.'));
    };

    img.src = objectUrl;
  });
}
