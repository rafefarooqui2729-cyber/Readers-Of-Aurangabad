import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  REELS_STORAGE_BUCKET,
  DEFAULT_REEL_SIGNED_URL_EXPIRY_SECONDS,
  isReelStoragePath,
  getSignedReelUrl,
  resolveReelMediaUrls,
  clearReelUrlCache,
  executeCreateReel,
  validateReelVideoFile,
  MAX_REEL_VIDEO_FILE_SIZE_BYTES,
} from '../src/utils/reelStorage.ts';

const readSource = (relativePath) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const appContextSource = readSource('src/context/AppContext.tsx');
const reelStorageSource = readSource('src/utils/reelStorage.ts');
const mp4Header = new Uint8Array([
  0x00, 0x00, 0x00, 0x18,
  0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d,
]);

const webmHeader = new Uint8Array([
  0x1a, 0x45, 0xdf, 0xa3,
  0x93, 0x42, 0x82, 0x88,
]);

function createMp4File(name = 'video.mp4', options = {}) {
  return new File(
    [options.content ?? mp4Header],
    name,
    { type: options.type ?? 'video/mp4' }
  );
}

function createWebmFile(name = 'video.webm') {
  return new File([webmHeader], name, { type: 'video/webm' });
}

function createMockStorageClient(options = {}) {
  const calls = {
    createSignedUrl: [],
    getPublicUrl: [],
  };

  const client = {
    storage: {
      from: (bucket) => ({
        createSignedUrl: async (objectPath, expiresIn) => {
          calls.createSignedUrl.push({ bucket, objectPath, expiresIn });
          if (options.shouldThrow) {
            throw new Error(options.errorMessage || 'Storage network failure');
          }
          if (options.shouldFail) {
            return {
              data: null,
              error: { message: options.errorMessage || 'Object not found in roa-reels' },
            };
          }
          if (options.customSignedUrl) {
            return {
              data: { signedUrl: options.customSignedUrl(bucket, objectPath, expiresIn) },
              error: null,
            };
          }
          return {
            data: { signedUrl: `https://mock-supabase.roa.org/storage/v1/object/sign/${bucket}/${objectPath}?token=mock-jwt-token` },
            error: null,
          };
        },
        getPublicUrl: (objectPath) => {
          calls.getPublicUrl.push({ bucket, objectPath });
          return {
            data: { publicUrl: `https://mock-supabase.roa.org/storage/v1/object/public/${bucket}/${objectPath}` },
          };
        },
      }),
    },
    _calls: calls,
  };

  return client;
}

function createMockReelPersistenceClient(options = {}) {
  const calls = {
    upload: [],
    remove: [],
    createSignedUrl: [],
    insert: [],
  };

  const client = {
    storage: {
      from: (bucket) => ({
        upload: async (objectPath, file, opts) => {
          calls.upload.push({ bucket, objectPath, file, opts });
          if (options.uploadThrows) {
            throw new Error(options.uploadErrorMsg || 'Storage network failure during upload');
          }
          if (options.uploadFails) {
            return {
              data: null,
              error: { message: options.uploadErrorMsg || 'Storage bucket upload rejected' },
            };
          }
          return { data: { path: objectPath }, error: null };
        },
        remove: async (paths) => {
          calls.remove.push({ bucket, paths });
          if (options.removeThrows) {
            throw new Error('Storage remove error');
          }
          return { data: paths, error: null };
        },
        createSignedUrl: async (objectPath, expiresIn) => {
          calls.createSignedUrl.push({ bucket, objectPath, expiresIn });
          return {
            data: { signedUrl: `https://signed.roa.org/${bucket}/${objectPath}?token=mock-token` },
            error: null,
          };
        },
      }),
    },
    from: (table) => ({
      insert: (record) => ({
        select: (cols) => ({
          single: async () => {
            calls.insert.push({ table, record, cols });
            if (options.dbThrows) {
              throw new Error(options.dbErrorMsg || 'Database connection timeout during insert');
            }
            if (options.dbFails) {
              return {
                data: null,
                error: { message: options.dbErrorMsg || 'Database unique constraint violation' },
              };
            }
            return {
              data: { id: options.insertedId || 'uuid-reel-persisted-123' },
              error: null,
            };
          },
        }),
      }),
    }),
    _calls: calls,
  };

  return client;
}

// ============================================================================
// 1. REEL STORAGE PATH CLASSIFICATION TESTS
// ============================================================================

test('isReelStoragePath correctly identifies valid private roa-reels storage paths', () => {
  // Typical reel storage paths
  assert.equal(isReelStoragePath('reels/meetup-01.mp4'), true);
  assert.equal(isReelStoragePath('reels/highlight-reel.webm'), true);
  assert.equal(isReelStoragePath('reels/pub_video.mp4'), true);
  assert.equal(isReelStoragePath('reels/pub_poster.webp'), true);
  assert.equal(isReelStoragePath('reels/poster.jpg'), true);
  assert.equal(isReelStoragePath('reels/poster.png'), true);
  assert.equal(isReelStoragePath('11111111-1111-4111-a111-111111111111/video.mp4'), true);
  assert.equal(isReelStoragePath('community_reel.quicktime'), true);
  assert.equal(isReelStoragePath('reels/subfolder/nested_video.mov'), true);
});

test('isReelStoragePath preserves local assets and external URLs as non-storage paths', () => {
  // Local static paths must not be classified as Supabase Storage paths
  assert.equal(isReelStoragePath('/media/reels/meetup01.mp4'), false);
  assert.equal(isReelStoragePath('/images/enhanced/thumbnails/roa-006-2026-11-05-thumb.webp'), false);
  assert.equal(isReelStoragePath('/placeholder.jpg'), false);

  // External URLs must not be classified as Supabase Storage paths
  assert.equal(isReelStoragePath('https://instagram.com/reel/12345'), false);
  assert.equal(isReelStoragePath('https://commondatastorage.googleapis.com/videos/sample.mp4'), false);
  assert.equal(isReelStoragePath('http://example.com/stream.mp4'), false);

  // Blob and data URLs
  assert.equal(isReelStoragePath('blob:http://localhost:5173/a1b2c3d4'), false);
  assert.equal(isReelStoragePath('data:image/webp;base64,AAAA'), false);
});

test('isReelStoragePath rejects invalid, empty, and traversal paths', () => {
  assert.equal(isReelStoragePath(''), false);
  assert.equal(isReelStoragePath('   '), false);
  assert.equal(isReelStoragePath(null), false);
  assert.equal(isReelStoragePath(undefined), false);
  assert.equal(isReelStoragePath('../secret.mp4'), false);
  assert.equal(isReelStoragePath('reels/../../etc/passwd'), false);
  assert.equal(isReelStoragePath('.hidden_file.mp4'), false);
  assert.equal(isReelStoragePath('reels/malicious.exe'), false);
});

// ============================================================================
// 2. SIGNED URL RESOLUTION AND BUCKET SECURITY TESTS
// ============================================================================

test('getSignedReelUrl signs stored video and poster using roa-reels with 86400s expiry', async () => {
  clearReelUrlCache();
  const mockClient = createMockStorageClient();

  const videoUrl = await getSignedReelUrl('reels/video-01.mp4', mockClient);
  const posterUrl = await getSignedReelUrl('reels/poster-01.webp', mockClient);

  assert.match(videoUrl, /^https:\/\/mock-supabase\.roa\.org\/storage\/v1\/object\/sign\/roa-reels\/reels\/video-01\.mp4\?token=/);
  assert.match(posterUrl, /^https:\/\/mock-supabase\.roa\.org\/storage\/v1\/object\/sign\/roa-reels\/reels\/poster-01\.webp\?token=/);

  // Verify createSignedUrl parameters
  assert.equal(mockClient._calls.createSignedUrl.length, 2);
  assert.equal(mockClient._calls.createSignedUrl[0].bucket, REELS_STORAGE_BUCKET);
  assert.equal(mockClient._calls.createSignedUrl[0].objectPath, 'reels/video-01.mp4');
  assert.equal(mockClient._calls.createSignedUrl[0].expiresIn, DEFAULT_REEL_SIGNED_URL_EXPIRY_SECONDS);

  assert.equal(mockClient._calls.createSignedUrl[1].bucket, REELS_STORAGE_BUCKET);
  assert.equal(mockClient._calls.createSignedUrl[1].objectPath, 'reels/poster-01.webp');

  // Verify getPublicUrl was NEVER called
  assert.equal(mockClient._calls.getPublicUrl.length, 0);
});

test('getSignedReelUrl preserves local application paths and external URLs without signing', async () => {
  clearReelUrlCache();
  const mockClient = createMockStorageClient();

  const localPath = '/media/reels/sample.mp4';
  const externalUrl = 'https://instagram.com/reel/abcdef';

  const resolvedLocal = await getSignedReelUrl(localPath, mockClient);
  const resolvedExternal = await getSignedReelUrl(externalUrl, mockClient);

  assert.equal(resolvedLocal, localPath);
  assert.equal(resolvedExternal, externalUrl);

  // Storage should not have been called at all for local/external assets
  assert.equal(mockClient._calls.createSignedUrl.length, 0);
  assert.equal(mockClient._calls.getPublicUrl.length, 0);
});

test('getSignedReelUrl returns empty string and never leaks raw path when signing fails', async () => {
  clearReelUrlCache();
  const failingClient = createMockStorageClient({ shouldFail: true, errorMessage: 'Bucket roa-reels permission denied' });

  const rawPath = 'reels/sensitive-video.mp4';
  const resolved = await getSignedReelUrl(rawPath, failingClient);

  // Must return empty string, NEVER the raw storage path
  assert.equal(resolved, '');
  assert.notEqual(resolved, rawPath);

  // Must NEVER fall back to getPublicUrl
  assert.equal(failingClient._calls.getPublicUrl.length, 0);
});

test('getSignedReelUrl returns empty string when storage client throws exception', async () => {
  clearReelUrlCache();
  const throwingClient = createMockStorageClient({ shouldThrow: true, errorMessage: 'Network disconnected' });

  const rawPath = 'reels/offline-video.mp4';
  const resolved = await getSignedReelUrl(rawPath, throwingClient);

  assert.equal(resolved, '');
  assert.notEqual(resolved, rawPath);
  assert.equal(throwingClient._calls.getPublicUrl.length, 0);
});

// ============================================================================
// 3. RESOLVE REEL MEDIA URLS TESTS
// ============================================================================

test('resolveReelMediaUrls resolves both video and poster, defaulting missing poster to undefined', async () => {
  clearReelUrlCache();
  const mockClient = createMockStorageClient();

  // Both video and poster
  const result1 = await resolveReelMediaUrls(
    { video_path: 'reels/reel-a.mp4', poster_path: 'reels/poster-a.webp' },
    mockClient
  );
  assert.match(result1.videoUrl, /reels\/reel-a\.mp4/);
  assert.match(result1.posterUrl, /reels\/poster-a\.webp/);

  // Video only (poster_path is null)
  const result2 = await resolveReelMediaUrls(
    { video_path: 'reels/reel-b.mp4', poster_path: null },
    mockClient
  );
  assert.match(result2.videoUrl, /reels\/reel-b\.mp4/);
  assert.equal(result2.posterUrl, undefined);

  // Failed poster signing produces undefined posterUrl
  const partialClient = createMockStorageClient({
    customSignedUrl: (bucket, objPath) => {
      if (objPath.includes('fail-poster')) return null;
      return `https://mock-supabase.roa.org/signed/${objPath}`;
    },
  });

  const result3 = await resolveReelMediaUrls(
    { video_path: 'reels/reel-c.mp4', poster_path: 'reels/fail-poster.webp' },
    partialClient
  );
  assert.match(result3.videoUrl, /reels\/reel-c\.mp4/);
  assert.equal(result3.posterUrl, undefined);
});

// ============================================================================
// 4. MULTI-REEL ISOLATION IN PROMISE.ALL
// ============================================================================

test('a signing failure on one reel does not cause the entire reel collection mapping to fail', async () => {
  clearReelUrlCache();

  const mockDbReels = [
    {
      id: 'reel-1',
      title: 'Published Reel 1',
      video_path: 'reels/video-1.mp4',
      poster_path: 'reels/poster-1.webp',
      display_order: 1,
      is_published: true,
      created_at: '2026-11-10T10:00:00Z',
    },
    {
      id: 'reel-2',
      title: 'Corrupted / Failing Reel 2',
      video_path: 'reels/broken-video-2.mp4',
      poster_path: 'reels/broken-poster-2.webp',
      display_order: 2,
      is_published: true,
      created_at: '2026-11-11T10:00:00Z',
    },
    {
      id: 'reel-3',
      title: 'External Stream Reel 3',
      video_path: 'https://example.com/videos/external-3.mp4',
      poster_path: '/images/thumbnails/poster-3.webp',
      display_order: 3,
      is_published: true,
      created_at: '2026-11-12T10:00:00Z',
    },
  ];

  const mockClient = {
    storage: {
      from: (bucket) => ({
        createSignedUrl: async (objectPath) => {
          if (objectPath.includes('broken')) {
            throw new Error(`Storage 500: Failed to sign ${objectPath}`);
          }
          return {
            data: { signedUrl: `https://signed.roa.org/${bucket}/${objectPath}` },
            error: null,
          };
        },
      }),
    },
  };

  // Simulate AppContext.tsx refreshData reel mapping logic
  const mappedReels = await Promise.all(
    mockDbReels.map(async (r) => {
      try {
        const { videoUrl, posterUrl } = await resolveReelMediaUrls(
          { video_path: r.video_path, poster_path: r.poster_path },
          mockClient
        );

        return {
          id: r.id,
          title: r.title,
          videoUrl,
          posterUrl,
          order: r.display_order,
          published: r.is_published,
          isPublished: r.is_published,
          createdAt: r.created_at,
          isCustomUpload: false,
        };
      } catch {
        return {
          id: r.id,
          title: r.title,
          videoUrl: '',
          posterUrl: undefined,
          order: r.display_order,
          published: r.is_published,
          isPublished: r.is_published,
          createdAt: r.created_at,
          isCustomUpload: false,
        };
      }
    })
  );

  // All 3 reels must be returned
  assert.equal(mappedReels.length, 3);

  // Reel 1: fully signed
  assert.equal(mappedReels[0].id, 'reel-1');
  assert.equal(mappedReels[0].videoUrl, 'https://signed.roa.org/roa-reels/reels/video-1.mp4');
  assert.equal(mappedReels[0].posterUrl, 'https://signed.roa.org/roa-reels/reels/poster-1.webp');

  // Reel 2: gracefully degraded without failing mapping
  assert.equal(mappedReels[1].id, 'reel-2');
  assert.equal(mappedReels[1].videoUrl, '');
  assert.equal(mappedReels[1].posterUrl, undefined);

  // Reel 3: external URL and local asset preserved
  assert.equal(mappedReels[2].id, 'reel-3');
  assert.equal(mappedReels[2].videoUrl, 'https://example.com/videos/external-3.mp4');
  assert.equal(mappedReels[2].posterUrl, '/images/thumbnails/poster-3.webp');
});

// ============================================================================
test('reel video validator accepts valid MP4, WebM, and compatible Blob inputs', async () => {
  const mp4Result = await validateReelVideoFile(createMp4File());
  assert.equal(mp4Result.valid, true);
  assert.equal(mp4Result.canonicalExtension, 'mp4');
  assert.equal(mp4Result.canonicalMimeType, 'video/mp4');

  const webmResult = await validateReelVideoFile(createWebmFile());
  assert.equal(webmResult.valid, true);
  assert.equal(webmResult.canonicalExtension, 'webm');
  assert.equal(webmResult.canonicalMimeType, 'video/webm');

  const namedFileWithoutMime = new File([mp4Header], 'no-mime.mp4');
  const noMimeResult = await validateReelVideoFile(namedFileWithoutMime);
  assert.equal(noMimeResult.valid, true);
  assert.equal(noMimeResult.canonicalMimeType, 'video/mp4');

  const unnamedBlob = new Blob([webmHeader], { type: 'video/webm' });
  const blobResult = await validateReelVideoFile(unnamedBlob);
  assert.equal(blobResult.valid, true);
  assert.equal(blobResult.canonicalExtension, 'webm');
});

test('reel video validator rejects empty, oversized, unsupported, mismatched, and invalid-signature files', async () => {
  const emptyFile = new File([], 'empty.mp4', { type: 'video/mp4' });
  const emptyResult = await validateReelVideoFile(emptyFile);
  assert.equal(emptyResult.valid, false);
  assert.match(emptyResult.error, /empty/i);

  const oversizedFile = {
    name: 'oversized.mp4',
    type: 'video/mp4',
    size: MAX_REEL_VIDEO_FILE_SIZE_BYTES + 1,
    slice() {
      throw new Error('Oversized file should be rejected before reading');
    },
  };
  const oversizedResult = await validateReelVideoFile(oversizedFile);
  assert.equal(oversizedResult.valid, false);
  assert.match(oversizedResult.error, /100 MB/i);

  const unsupportedResult = await validateReelVideoFile(
    new File([mp4Header], 'clip.mov', { type: 'video/mp4' })
  );
  assert.equal(unsupportedResult.valid, false);
  assert.match(unsupportedResult.error, /Unsupported video extension/i);

  const mismatchResult = await validateReelVideoFile(
    new File([mp4Header], 'clip.mp4', { type: 'video/webm' })
  );
  assert.equal(mismatchResult.valid, false);
  assert.match(mismatchResult.error, /do not match/i);

  const invalidSignatureResult = await validateReelVideoFile(
    new File(['not a video header'], 'fake.mp4', { type: 'video/mp4' })
  );
  assert.equal(invalidSignatureResult.valid, false);
  assert.match(invalidSignatureResult.error, /signature/i);

  const unnamedUnsupportedBlob = new Blob([mp4Header], { type: 'application/octet-stream' });
  const unnamedBlobResult = await validateReelVideoFile(unnamedUnsupportedBlob);
  assert.equal(unnamedBlobResult.valid, false);
  assert.match(unnamedBlobResult.error, /Unnamed video files/i);
});

test('invalid reel video is rejected before Storage upload or database insert', async () => {
  const client = createMockReelPersistenceClient();

  await assert.rejects(
    executeCreateReel({
      reelData: { title: 'Invalid Reel', videoUrl: '' },
      videoFile: new File(['not an MP4'], 'invalid.mp4', { type: 'video/mp4' }),
      existingReels: [],
      supabaseClient: client,
    }),
    /Invalid MP4 file signature/
  );

  assert.equal(client._calls.upload.length, 0);
  assert.equal(client._calls.insert.length, 0);
  assert.equal(client._calls.remove.length, 0);
});
// 5. TRANSACTIONAL REEL CREATION & PERSISTENCE TESTS
// ============================================================================

test('persistence 1: successful Storage upload followed by successful database insert', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({ insertedId: 'uuid-persisted-reel-1' });
  const savedBlobs = [];

  const videoFile = createMp4File('meetup-clip.mp4');
  const reelData = {
    title: 'Meetup 01 Highlights',
    caption: 'Great discussions on history and books',
    videoUrl: '',
    posterUrl: '/images/poster.webp',
    order: 1,
    published: true,
  };

  const result = await executeCreateReel({
    reelData,
    videoFile,
    existingReels: [],
    supabaseClient: client,
    saveBlob: async (id, file) => { savedBlobs.push({ id, file }); },
  });

  // Verify storage upload occurred with roa-reels bucket
  assert.equal(client._calls.upload.length, 1);
  assert.equal(client._calls.upload[0].bucket, REELS_STORAGE_BUCKET);
  assert.match(client._calls.upload[0].objectPath, /^reels\/reel-.*\.mp4$/);

  // Verify database insert occurred with the storage path (not a blob URL!)
  assert.equal(client._calls.insert.length, 1);
  assert.equal(client._calls.insert[0].table, 'reels');
  assert.equal(client._calls.insert[0].record.video_path, client._calls.upload[0].objectPath);
  assert.equal(client._calls.insert[0].record.title, 'Meetup 01 Highlights');
  assert.equal(client._calls.insert[0].record.poster_path, '/images/poster.webp');

  // Verify return value and state updates
  assert.equal(result.id, 'uuid-persisted-reel-1');
  assert.equal(result.newReel.id, 'uuid-persisted-reel-1');
  assert.equal(result.newReel.isCustomUpload, true);
  assert.match(result.newReel.videoUrl, /^https:\/\/signed\.roa\.org\/roa-reels\/reels\/reel-.*\.mp4\?token=mock-token$/);

  // Verify saveBlob was called with the actual inserted database UUID
  assert.equal(savedBlobs.length, 1);
  assert.equal(savedBlobs[0].id, 'uuid-persisted-reel-1');
});

test('persistence 2: storage upload returning an error halts operation without database insert or state update', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({
    uploadFails: true,
    uploadErrorMsg: 'Bucket quota exceeded on roa-reels',
  });
  const savedBlobs = [];

  const videoFile = createMp4File('failed-video.mp4');
  const reelData = {
    title: 'Failed Video Reel',
    videoUrl: '',
    order: 2,
  };

  await assert.rejects(
    async () => {
      await executeCreateReel({
        reelData,
        videoFile,
        existingReels: [],
        supabaseClient: client,
        saveBlob: async (id, file) => { savedBlobs.push({ id, file }); },
      });
    },
    /Failed to upload reel video to storage: Bucket quota exceeded on roa-reels/
  );

  // Zero database operations, zero IndexedDB saves, zero cleanup needed
  assert.equal(client._calls.insert.length, 0);
  assert.equal(client._calls.remove.length, 0);
  assert.equal(savedBlobs.length, 0);
});

test('persistence 3: storage upload throwing an exception halts operation without database insert', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({
    uploadThrows: true,
    uploadErrorMsg: 'Network socket closed unexpectedly',
  });
  const savedBlobs = [];

  await assert.rejects(
    async () => {
      await executeCreateReel({
        reelData: { title: 'Network Throw Reel', videoUrl: '' },
        videoFile: createMp4File('video.mp4'),
        existingReels: [],
        supabaseClient: client,
        saveBlob: async (id, file) => { savedBlobs.push({ id, file }); },
      });
    },
    /Network socket closed unexpectedly/
  );

  assert.equal(client._calls.insert.length, 0);
  assert.equal(client._calls.remove.length, 0);
  assert.equal(savedBlobs.length, 0);
});

test('persistence 4: database insert returning error triggers safe cleanup of uploaded Storage object', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({
    dbFails: true,
    dbErrorMsg: 'Database error: row-level security violation on reels table',
  });
  const savedBlobs = [];

  await assert.rejects(
    async () => {
      await executeCreateReel({
        reelData: { title: 'Reel With DB Failure', videoUrl: '' },
        videoFile: createMp4File('video.mp4'),
        existingReels: [],
        supabaseClient: client,
        saveBlob: async (id, file) => { savedBlobs.push({ id, file }); },
      });
    },
    /Failed to insert reel into database: Database error: row-level security violation on reels table/
  );

  // Upload succeeded
  assert.equal(client._calls.upload.length, 1);
  const uploadedPath = client._calls.upload[0].objectPath;

  // DB insert was attempted and failed
  assert.equal(client._calls.insert.length, 1);

  // Cleanup was performed on the exact uploaded storage path!
  assert.equal(client._calls.remove.length, 1);
  assert.equal(client._calls.remove[0].bucket, REELS_STORAGE_BUCKET);
  assert.deepEqual(client._calls.remove[0].paths, [uploadedPath]);

  // IndexedDB blob was NOT saved
  assert.equal(savedBlobs.length, 0);
});

test('persistence 5: database insert throwing an exception triggers safe cleanup of uploaded Storage object', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({
    dbThrows: true,
    dbErrorMsg: 'Database connection terminated',
  });
  const savedBlobs = [];

  await assert.rejects(
    async () => {
      await executeCreateReel({
        reelData: { title: 'Reel With DB Throw', videoUrl: '' },
        videoFile: createMp4File('video.mp4'),
        existingReels: [],
        supabaseClient: client,
        saveBlob: async (id, file) => { savedBlobs.push({ id, file }); },
      });
    },
    /Database connection terminated/
  );

  assert.equal(client._calls.upload.length, 1);
  const uploadedPath = client._calls.upload[0].objectPath;

  assert.equal(client._calls.insert.length, 1);
  assert.equal(client._calls.remove.length, 1);
  assert.deepEqual(client._calls.remove[0].paths, [uploadedPath]);
  assert.equal(savedBlobs.length, 0);
});

test('persistence 6: safe cleanup handles storage removal failures gracefully without masking DB error', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({
    dbFails: true,
    dbErrorMsg: 'Database failure message',
    removeThrows: true,
  });

  await assert.rejects(
    async () => {
      await executeCreateReel({
        reelData: { title: 'Cleanup Exception Reel', videoUrl: '' },
        videoFile: createMp4File('video.mp4'),
        existingReels: [],
        supabaseClient: client,
      });
    },
    /Failed to insert reel into database: Database failure message/
  );

  // Storage remove was attempted
  assert.equal(client._calls.remove.length, 1);
});

test('persistence 7: external video URL behavior remains fully supported without storage upload', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({ insertedId: 'uuid-external-reel-7' });

  const externalVideoUrl = 'https://commondatastorage.googleapis.com/videos/stream.mp4';
  const result = await executeCreateReel({
    reelData: {
      title: 'External Video Reel',
      caption: 'Streamed from CDN',
      videoUrl: externalVideoUrl,
      order: 5,
    },
    existingReels: [{ id: 'existing-1', order: 1 }],
    supabaseClient: client,
  });

  // Storage upload should NOT be invoked for external URLs
  assert.equal(client._calls.upload.length, 0);

  // Database insert called with external URL
  assert.equal(client._calls.insert.length, 1);
  assert.equal(client._calls.insert[0].record.video_path, externalVideoUrl);
  assert.equal(result.id, 'uuid-external-reel-7');
  assert.equal(result.newReel.videoUrl, externalVideoUrl);
  assert.equal(result.newReel.isCustomUpload, false);
});

test('persistence 8: local static poster paths and external poster URLs remain supported', async () => {
  clearReelUrlCache();
  const client = createMockReelPersistenceClient({ insertedId: 'uuid-poster-reel-8' });

  const localPoster = '/images/enhanced/thumbnails/roa-006-2026-11-05-thumb.webp';
  const result = await executeCreateReel({
    reelData: {
      title: 'Local Poster Reel',
      videoUrl: 'https://example.com/video.mp4',
      posterUrl: localPoster,
    },
    supabaseClient: client,
  });

  assert.equal(client._calls.insert[0].record.poster_path, localPoster);
  assert.equal(result.newReel.posterUrl, localPoster);
});

test('persistence 9: reel signed-URL cache is cleared during auth-state reset', async () => {
  clearReelUrlCache();
  const mockStorageClient = createMockStorageClient();

  // Populate cache
  const url1 = await getSignedReelUrl('reels/cache-item.mp4', mockStorageClient);
  assert.equal(mockStorageClient._calls.createSignedUrl.length, 1);

  // Second call within expiry buffer hits cache
  const url2 = await getSignedReelUrl('reels/cache-item.mp4', mockStorageClient);
  assert.equal(url2, url1);
  assert.equal(mockStorageClient._calls.createSignedUrl.length, 1);

  // Clear cache (simulating resetAuthState)
  clearReelUrlCache();

  // Third call must invoke createSignedUrl again
  const url3 = await getSignedReelUrl('reels/cache-item.mp4', mockStorageClient);
  assert.equal(url3, url1);
  assert.equal(mockStorageClient._calls.createSignedUrl.length, 2);
});

test('persistence 10: one failed reel operation does not corrupt existing reel state', async () => {
  const initialReels = [
    { id: 'reel-a', title: 'Reel A', order: 1, published: true, videoUrl: 'https://cdn.roa.org/a.mp4' },
    { id: 'reel-b', title: 'Reel B', order: 2, published: true, videoUrl: 'https://cdn.roa.org/b.mp4' },
  ];

  let currentReels = [...initialReels];

  const failingClient = createMockReelPersistenceClient({
    uploadFails: true,
    uploadErrorMsg: 'Simulated upload failure',
  });

  // Emulate AppContext.tsx addReel wrapper
  const simulateAddReel = async (reelData, videoFile) => {
    const { newReel } = await executeCreateReel({
      reelData,
      videoFile,
      existingReels: currentReels,
      supabaseClient: failingClient,
    });
    currentReels = [...currentReels, newReel];
  };

  await assert.rejects(
    async () => {
      await simulateAddReel(
        { title: 'Failing Reel C', videoUrl: '' },
        createMp4File('clip.mp4')
      );
    },
    /Simulated upload failure/
  );

  // Existing reels state is completely unmodified and intact
  assert.equal(currentReels.length, 2);
  assert.deepEqual(currentReels, initialReels);
});

// ============================================================================
// 6. SOURCE LEVEL CODE VERIFICATION
// ============================================================================

test('AppContext.tsx never calls getPublicUrl for roa-reels', () => {
  assert.doesNotMatch(
    appContextSource,
    /storage\.from\(['"]roa-reels['"]\)\.getPublicUrl/,
    'AppContext.tsx must never call getPublicUrl on the private roa-reels bucket'
  );
  assert.doesNotMatch(
    reelStorageSource,
    /getPublicUrl/,
    'reelStorage.ts must never call getPublicUrl'
  );
});

test('AppContext.tsx resolves both video_path and poster_path through resolveReelMediaUrls', () => {
  assert.match(
    appContextSource,
    /resolveReelMediaUrls\(\s*\{\s*video_path:\s*r\.video_path,\s*poster_path:\s*r\.poster_path\s*\},/
  );
});

test('AppContext.tsx calls clearReelUrlCache within resetAuthState', () => {
  assert.match(
    appContextSource,
    /const resetAuthState = useCallback\(\(\) => \{[\s\S]*clearReelUrlCache\(\);[\s\S]*\}, \[\]\);/,
    'resetAuthState must call clearReelUrlCache() to flush signed URL cache on auth transitions'
  );
});

test('AppContext.tsx delegates addReel to executeCreateReel', () => {
  assert.match(
    appContextSource,
    /executeCreateReel\(\s*\{\s*reelData,\s*videoFile,\s*existingReels:\s*reels,\s*supabaseClient:\s*supabase,\s*saveBlob:\s*saveVideoBlob,\s*\}\)/,
    'addReel must delegate transactional reel creation to executeCreateReel'
  );
});
