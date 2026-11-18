import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_ORIGINAL_FILE_SIZE_BYTES,
  MAX_THUMBNAIL_DIMENSION,
  validateGalleryImageFile,
  calculateThumbnailDimensions,
} from '../src/utils/galleryImageUtils.ts';

const jpegHeader = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0,
  0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01,
]);

const pngHeader = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d,
]);

const webpHeader = new Uint8Array([
  0x52, 0x49, 0x46, 0x46,
  0x24, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50,
]);

test('gallery validator accepts valid JPEG, JPG, PNG, and WebP files', async () => {
  const cases = [
    {
      file: new File([jpegHeader], 'photo.jpeg', { type: 'image/jpeg' }),
      format: 'jpeg',
      mime: 'image/jpeg',
      extension: 'jpg',
    },
    {
      file: new File([jpegHeader], 'photo.jpg', { type: 'image/pjpeg' }),
      format: 'jpeg',
      mime: 'image/jpeg',
      extension: 'jpg',
    },
    {
      file: new File([pngHeader], 'photo.png', { type: 'image/png' }),
      format: 'png',
      mime: 'image/png',
      extension: 'png',
    },
    {
      file: new File([webpHeader], 'photo.webp', { type: 'image/webp' }),
      format: 'webp',
      mime: 'image/webp',
      extension: 'webp',
    },
  ];

  for (const item of cases) {
    const result = await validateGalleryImageFile(item.file);
    assert.equal(result.valid, true);
    assert.equal(result.format, item.format);
    assert.equal(result.canonicalMimeType, item.mime);
    assert.equal(result.canonicalExtension, item.extension);
  }
});

test('gallery validator accepts a valid image with a missing MIME type', async () => {
  const file = new File([pngHeader], 'photo.png');
  const result = await validateGalleryImageFile(file);

  assert.equal(result.valid, true);
  assert.equal(result.format, 'png');
  assert.equal(result.canonicalMimeType, 'image/png');
});

test('gallery validator rejects empty and oversized files', async () => {
  const emptyResult = await validateGalleryImageFile(
    new File([], 'empty.jpg', { type: 'image/jpeg' })
  );

  assert.equal(emptyResult.valid, false);
  assert.match(emptyResult.error, /empty/i);

  const oversizedFile = {
    name: 'large.jpg',
    type: 'image/jpeg',
    size: MAX_ORIGINAL_FILE_SIZE_BYTES + 1,
    slice() {
      throw new Error('Oversized file should be rejected before reading');
    },
  };

  const oversizedResult = await validateGalleryImageFile(oversizedFile);
  assert.equal(oversizedResult.valid, false);
  assert.match(oversizedResult.error, /20 MB/i);
});

test('gallery validator rejects unsupported extensions and MIME types', async () => {
  const unsupportedExtension = await validateGalleryImageFile(
    new File([jpegHeader], 'photo.gif', { type: 'image/jpeg' })
  );

  assert.equal(unsupportedExtension.valid, false);
  assert.match(unsupportedExtension.error, /Unsupported file extension/i);

  const unsupportedMime = await validateGalleryImageFile(
    new File([jpegHeader], 'photo.jpg', { type: 'application/octet-stream' })
  );

  assert.equal(unsupportedMime.valid, false);
  assert.match(unsupportedMime.error, /Unsupported MIME type/i);
});

test('gallery validator rejects contradictory MIME types and extensions', async () => {
  const result = await validateGalleryImageFile(
    new File([pngHeader], 'photo.png', { type: 'image/jpeg' })
  );

  assert.equal(result.valid, false);
  assert.match(result.error, /Contradictory file attributes/i);
});

test('gallery validator rejects invalid and contradictory file signatures', async () => {
  const invalidSignature = await validateGalleryImageFile(
    new File(['not an image'], 'photo.jpg', { type: 'image/jpeg' })
  );

  assert.equal(invalidSignature.valid, false);
  assert.match(invalidSignature.error, /Unrecognized file signature/i);

  const contradictorySignature = await validateGalleryImageFile(
    new File([pngHeader], 'photo.jpg', { type: 'image/jpeg' })
  );

  assert.equal(contradictorySignature.valid, false);
  assert.match(contradictorySignature.error, /Contradictory file content/i);
});

test('thumbnail dimensions preserve landscape aspect ratio and maximum size', () => {
  const result = calculateThumbnailDimensions(1920, 1080);

  assert.deepEqual(result, {
    width: MAX_THUMBNAIL_DIMENSION,
    height: 360,
  });
});

test('thumbnail dimensions preserve portrait aspect ratio and maximum size', () => {
  const result = calculateThumbnailDimensions(1080, 1920);

  assert.deepEqual(result, {
    width: 360,
    height: MAX_THUMBNAIL_DIMENSION,
  });
});

test('thumbnail dimensions do not upscale small images', () => {
  const result = calculateThumbnailDimensions(320, 240);

  assert.deepEqual(result, {
    width: 320,
    height: 240,
  });
});

test('thumbnail dimensions handle invalid dimensions safely', () => {
  assert.deepEqual(
    calculateThumbnailDimensions(0, 100),
    { width: MAX_THUMBNAIL_DIMENSION, height: MAX_THUMBNAIL_DIMENSION }
  );

  assert.deepEqual(
    calculateThumbnailDimensions(-10, 100),
    { width: MAX_THUMBNAIL_DIMENSION, height: MAX_THUMBNAIL_DIMENSION }
  );
});