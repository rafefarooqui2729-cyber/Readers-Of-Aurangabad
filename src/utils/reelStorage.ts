/**
 * Supabase Storage Reel Utility
 *
 * Provides signed URL resolution and validation for private `roa-reels` bucket:
 * - High-definition community video reels and poster images
 * - Resolves stored reel video paths and poster paths using temporary signed URLs
 * - Strictly private bucket access (never uses public URL resolution)
 * - If signing fails, never exposes the raw storage path as a playable URL
 * - Preserves legitimate external HTTP(S) URLs, data URLs, and local application paths untouched
 * - Defends against directory traversal and malformed paths
 * - In-memory cache with safety buffer to avoid excessive createSignedUrl calls
 * - Transactional reel creation with prerequisite Storage upload and orphan cleanup
 */

import { supabase } from '../lib/supabase.ts';
import type { MeetupReel } from '../types/index.ts';

export const REELS_STORAGE_BUCKET = 'roa-reels';
export const DEFAULT_REEL_SIGNED_URL_EXPIRY_SECONDS = 86400; // 24 hours

export interface SignedUrlCacheEntry {
  url: string;
  expiresAt: number;
}

const reelSignedUrlMemoryCache = new Map<string, SignedUrlCacheEntry>();

export function clearReelUrlCache(): void {
  reelSignedUrlMemoryCache.clear();
}

/**
 * Regular expression matching valid storage paths in roa-reels:
 * - Optional folder segments: `[a-zA-Z0-9_.-]+/` (e.g. `reels/` or `<user-uuid>/`)
 * - Filename: `[a-zA-Z0-9_.-]+`
 * - Valid media extension: .mp4, .webm, .mov, .quicktime, .m4v, .mkv, .avi, .jpg, .jpeg, .png, .webp
 */
export const REEL_STORAGE_PATH_PATTERN =
  /^(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(mp4|webm|mov|quicktime|m4v|mkv|avi|jpe?g|png|webp)$/i;

/**
 * Checks whether a path string represents a private Supabase Storage object in roa-reels.
 *
 * Classification:
 * - null, undefined, non-string, or empty -> false
 * - Leading slash paths (`/media/...`, `/images/...`) -> false (local application assets)
 * - HTTP/HTTPS/data/blob URLs (`http://...`, `https://...`, `blob:...`, `data:...`) -> false (external or object URLs)
 * - Directory traversal (`..` or starting with `.`) -> false
 * - Matches REEL_STORAGE_PATH_PATTERN -> true
 * - Any other pattern -> false
 */
export function isReelStoragePath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (trimmed === '') return false;

  // Preserve local static assets starting with /
  if (trimmed.startsWith('/')) return false;

  // Preserve external or embedded URLs
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return false;

  // Reject directory traversal attempts
  if (trimmed.includes('..') || trimmed.startsWith('.')) return false;

  // Validate storage path structure and allowed extensions
  return REEL_STORAGE_PATH_PATTERN.test(trimmed);
}

/**
 * Resolves a reel video or poster path to a playable URL.
 *
 * - If path is empty/undefined -> returns ''
 * - If path is local (/...) or external (http/https/blob) -> returns trimmed path
 * - If path is a private storage path:
 *     - Requests signed URL from Supabase Storage `roa-reels`
 *     - If signing succeeds -> returns signed URL
 *     - If signing fails or throws -> returns '' (never exposes raw private path, never falls back to public)
 */
export async function getSignedReelUrl(
  path: string | null | undefined,
  client?: any,
  expiresIn: number = DEFAULT_REEL_SIGNED_URL_EXPIRY_SECONDS
): Promise<string> {
  if (!path || typeof path !== 'string') {
    return '';
  }

  const trimmed = path.trim();
  if (trimmed === '') {
    return '';
  }

  // Preserve local paths (/...) and external/blob URLs unchanged
  if (!isReelStoragePath(trimmed)) {
    if (trimmed.startsWith('/') || /^(https?:|data:|blob:)/i.test(trimmed)) {
      return trimmed;
    }
    // Malformed or unrecognized path format: fail closed without exposing or attempting to play
    return '';
  }

  // Check in-memory cache first (with 60-second safety buffer before expiry)
  const cacheKey = `${REELS_STORAGE_BUCKET}:${trimmed}`;
  const cached = reelSignedUrlMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.url;
  }

  const activeClient = client || supabase;
  if (!activeClient || !activeClient.storage) {
    console.warn(`Cannot sign reel URL for '${trimmed}': Supabase client storage is not available.`);
    return '';
  }

  try {
    const { data, error } = await activeClient.storage
      .from(REELS_STORAGE_BUCKET)
      .createSignedUrl(trimmed, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn(`Failed to sign reel URL for '${trimmed}':`, error?.message || 'No signed URL returned');
      return '';
    }

    reelSignedUrlMemoryCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.warn(`Exception signing reel URL for '${trimmed}':`, err);
    return '';
  }
}

/**
 * Resolves both video and poster URLs for a reel record.
 * Handles signing failures safely and returns playable URLs.
 */
export async function resolveReelMediaUrls(
  reel: { video_path: string; poster_path?: string | null },
  client?: any,
  expiresIn: number = DEFAULT_REEL_SIGNED_URL_EXPIRY_SECONDS
): Promise<{ videoUrl: string; posterUrl?: string }> {
  const [videoUrl, posterUrl] = await Promise.all([
    getSignedReelUrl(reel.video_path, client, expiresIn),
    reel.poster_path ? getSignedReelUrl(reel.poster_path, client, expiresIn) : Promise.resolve('')
  ]);

  return {
    videoUrl,
    posterUrl: posterUrl ? posterUrl : undefined
  };
}

export const MAX_REEL_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export interface ReelVideoValidationResult {
  valid: boolean;
  error?: string;
  canonicalMimeType?: 'video/mp4' | 'video/webm';
  canonicalExtension?: 'mp4' | 'webm';
}

/**
 * Validates MP4/WebM uploads using file metadata and binary signatures.
 * Named files may omit MIME metadata; unnamed Blob objects must declare a supported MIME type.
 */
export async function validateReelVideoFile(
  file: File | Blob
): Promise<ReelVideoValidationResult> {
  if (!file || typeof file.size !== 'number' || typeof file.slice !== 'function') {
    return { valid: false, error: 'No valid video file was provided.' };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, error: 'The selected video file is empty or invalid.' };
  }

  if (file.size > MAX_REEL_VIDEO_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Video file exceeds the maximum allowed size of 100 MB.' };
  }

  const rawName = 'name' in file && typeof file.name === 'string'
    ? file.name.trim()
    : '';
  const rawMime = (file.type || '').trim().toLowerCase();

  let extension: 'mp4' | 'webm' | null = null;

  if (rawName) {
    const match = /\.([^.]+)$/.exec(rawName);
    const ext = match?.[1]?.toLowerCase() || '';

    if (ext !== 'mp4' && ext !== 'webm') {
      return {
        valid: false,
        error: 'Unsupported video extension. Only MP4 (.mp4) and WebM (.webm) files are permitted.'
      };
    }
    extension = ext;
  } else {
    if (rawMime === 'video/mp4') extension = 'mp4';
    else if (rawMime === 'video/webm') extension = 'webm';
    else {
      return {
        valid: false,
        error: 'Unnamed video files must declare MIME type video/mp4 or video/webm.'
      };
    }
  }

  const expectedMime = extension === 'mp4' ? 'video/mp4' : 'video/webm';

  if (rawMime && rawMime !== expectedMime) {
    return {
      valid: false,
      error: `File extension and MIME type do not match. Expected ${expectedMime} for .${extension} files.`
    };
  }

  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

    const isMp4 = header.length >= 8 &&
      header[4] === 0x66 &&
      header[5] === 0x74 &&
      header[6] === 0x79 &&
      header[7] === 0x70;

    const isWebm = header.length >= 4 &&
      header[0] === 0x1a &&
      header[1] === 0x45 &&
      header[2] === 0xdf &&
      header[3] === 0xa3;

    if (extension === 'mp4' && !isMp4) {
      return {
        valid: false,
        error: 'Invalid MP4 file signature. The file content is not recognized as an MP4 video.'
      };
    }

    if (extension === 'webm' && !isWebm) {
      return {
        valid: false,
        error: 'Invalid WebM file signature. The file content is not recognized as a WebM video.'
      };
    }
  } catch {
    return {
      valid: false,
      error: 'Unable to read the selected video file.'
    };
  }

  return {
    valid: true,
    canonicalMimeType: expectedMime,
    canonicalExtension: extension
  };
}
export interface ExecuteCreateReelParams {
  reelData: Omit<MeetupReel, 'id' | 'createdAt'>;
  videoFile?: File | Blob;
  existingReels?: MeetupReel[];
  supabaseClient?: any;
  saveBlob?: (id: string, file: File | Blob) => Promise<void>;
}

export interface ExecuteCreateReelResult {
  id: string;
  newReel: MeetupReel;
  storagePath: string | null;
}

/**
 * Creates a new reel record with strict transactional integrity:
 * 1. Requires valid video input (videoFile or external videoUrl).
 * 2. If videoFile is provided, uploads to private `roa-reels` bucket first.
 *    - Fails immediately if upload returns error or throws.
 *    - Does NOT fallback to local-only persistence.
 * 3. Inserts into Supabase `reels` table checking both error and data.
 *    - If DB insert fails (error returned or thrown), performs cleanup of the
 *      uploaded storage object from `roa-reels`.
 * 4. Resolves playable media URLs (signed URLs for storage paths, preserving external/local paths).
 * 5. Caches in IndexedDB only upon confirmed persistent creation.
 */
export async function executeCreateReel(
  params: ExecuteCreateReelParams
): Promise<ExecuteCreateReelResult> {
  const client = params.supabaseClient || supabase;
  if (!client || !client.storage || !client.from) {
    throw new Error('Supabase client is not available for reel persistence.');
  }

  const hasVideoFile = Boolean(params.videoFile);
  const rawExternalVideoUrl = params.reelData.videoUrl ? params.reelData.videoUrl.trim() : '';

  if (!hasVideoFile && !rawExternalVideoUrl) {
    throw new Error('A video file or external video URL is required.');
  }

  let storagePath: string | null = null;

  if (hasVideoFile) {
    const file = params.videoFile!;
    const validation = await validateReelVideoFile(file);

    if (!validation.valid || !validation.canonicalExtension || !validation.canonicalMimeType) {
      throw new Error(validation.error || 'Invalid reel video file.');
    }

    const randomSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    storagePath = `reels/reel-${randomSuffix}.${validation.canonicalExtension}`;

    const { error: uploadError } = await client.storage
      .from(REELS_STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: validation.canonicalMimeType,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload reel video to storage: ${uploadError.message}`);
    }
  }

  const existing = params.existingReels || [];
  const calculatedOrder = params.reelData.order ?? (existing.length > 0 ? Math.max(...existing.map(r => r.order)) + 1 : 1);
  const isPub = params.reelData.published ?? params.reelData.isPublished ?? true;
  const targetVideoPath = storagePath ?? rawExternalVideoUrl;
  const posterPath = params.reelData.posterUrl ? params.reelData.posterUrl.trim() : null;

  let insertedId: string;
  try {
    const { data: inserted, error: insertError } = await client
      .from('reels')
      .insert({
        title: params.reelData.title.trim(),
        caption: params.reelData.caption ? params.reelData.caption.trim() : null,
        video_path: targetVideoPath,
        poster_path: posterPath,
        display_order: calculatedOrder,
        is_published: isPub,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to insert reel into database: ${insertError.message}`);
    }
    if (!inserted?.id) {
      throw new Error('Database insert failed: No record ID returned from Supabase.');
    }
    insertedId = inserted.id;
  } catch (dbErr: any) {
    if (storagePath) {
      try {
        await client.storage.from(REELS_STORAGE_BUCKET).remove([storagePath]);
      } catch (cleanupErr) {
        console.warn(`Failed to clean up storage object '${storagePath}' after database insert failure:`, cleanupErr);
      }
    }
    throw dbErr instanceof Error ? dbErr : new Error(String(dbErr));
  }

  // Cache video blob in IndexedDB only after confirmed persistence
  if (hasVideoFile && params.saveBlob) {
    try {
      await params.saveBlob(insertedId, params.videoFile!);
    } catch (idbErr) {
      console.warn('Could not cache video blob in IndexedDB (non-fatal):', idbErr);
    }
  }

  // Resolve playable URLs for in-memory state
  let finalVideoUrl = targetVideoPath;
  if (storagePath) {
    const signedVideo = await getSignedReelUrl(storagePath, client);
    finalVideoUrl = signedVideo || (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && params.videoFile ? URL.createObjectURL(params.videoFile) : '');
  }
  let finalPosterUrl = posterPath || undefined;
  if (posterPath && isReelStoragePath(posterPath)) {
    const signedPoster = await getSignedReelUrl(posterPath, client);
    finalPosterUrl = signedPoster || undefined;
  }

  const newReel: MeetupReel = {
    ...params.reelData,
    id: insertedId,
    videoUrl: finalVideoUrl,
    posterUrl: finalPosterUrl,
    order: calculatedOrder,
    published: isPub,
    isPublished: isPub,
    isCustomUpload: hasVideoFile,
    createdAt: new Date().toISOString()
  };

  return { id: insertedId, newReel, storagePath };
}
