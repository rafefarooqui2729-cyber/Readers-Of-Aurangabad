import type { ExtractedFrame } from '../types';

export interface FrameExtractionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export function formatVideoTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms}s`;
}

/**
 * Extracts a single high-resolution frame from an HTML5 video element at its current time.
 */
export function captureFrameFromVideoElement(
  video: HTMLVideoElement,
  sourceId: string,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.95
): ExtractedFrame {
  const width = video.videoWidth || 1080;
  const height = video.videoHeight || 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context for frame extraction');

  ctx.drawImage(video, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(format, quality);

  return {
    id: `frame-${sourceId}-${Date.now()}-${Math.floor(video.currentTime * 100)}`,
    sourceVideoId: sourceId,
    timestampSeconds: video.currentTime,
    formattedTimestamp: formatVideoTime(video.currentTime),
    dataUrl,
    width,
    height,
    savedToLibrary: false,
    format
  };
}

/**
 * Automatically extracts 5 strategic frames:
 * Beginning (1s), 25%, 50%, 75%, and End (duration - 1s).
 */
export async function extractAutoFramesFromVideo(
  videoSourceUrl: string,
  sourceId: string,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  onProgress?: (progress: FrameExtractionProgress) => void
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';

    video.src = videoSourceUrl;

    video.onerror = () => {
      reject(new Error('Video could not be loaded for frame extraction. (If restricted by CORS, use the Manual Video Upload option).'));
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 10;
        
        // 5 key frame timestamps as mandated:
        // 1. Beginning
        // 2. 25% of duration
        // 3. 50% of duration
        // 4. 75% of duration
        // 5. Ending (duration - 1s)
        const targetTimestamps = [
          Math.min(1.0, duration * 0.05),
          duration * 0.25,
          duration * 0.50,
          duration * 0.75,
          Math.max(duration - 1.2, duration * 0.90)
        ];

        const frames: ExtractedFrame[] = [];

        for (let i = 0; i < targetTimestamps.length; i++) {
          const time = targetTimestamps[i];
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: targetTimestamps.length,
              percentage: Math.round(((i + 1) / targetTimestamps.length) * 100),
              status: `Extracting frame at ${formatVideoTime(time)}...`
            });
          }

          await new Promise<void>((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              try {
                const frame = captureFrameFromVideoElement(video, sourceId, format, 0.95);
                frames.push(frame);
              } catch (err) {
                console.warn('Frame capture error:', err);
              }
              resSeek();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = Math.max(0, Math.min(time, duration));
          });
        }

        resolve(frames);
      } catch (err) {
        reject(err);
      } finally {
        video.remove();
      }
    };
  });
}
