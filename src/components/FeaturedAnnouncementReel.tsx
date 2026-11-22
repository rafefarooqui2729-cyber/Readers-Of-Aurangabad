import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeaturedAnnouncementReelProps {
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const FeaturedAnnouncementReel: React.FC<FeaturedAnnouncementReelProps> = ({
  videoSrc = '/media/announcement/announcement.mp4',
  posterSrc,
  title = 'Community Announcement',
  subtitle = 'A message to our growing circle of readers.',
  description = 'Listen in as we share updates, upcoming gatherings, and our vision for reading spaces across Aurangabad, Chhatrapati Sambhajinagar.'
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Viewport-aware lazy loading & playback
  const [isNearViewport, setIsNearViewport] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !('IntersectionObserver' in window);
  });
  const [isInView, setIsInView] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !('IntersectionObserver' in window);
  });
  const userPausedRef = useRef<boolean>(false);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    // Preload observer: 450px rootMargin triggers video load before entering view
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: '450px 0px', threshold: 0 }
    );
    preloadObserver.observe(target);

    // Playback observer: 0.5 threshold ensures video plays when section is prominently in view
    const playbackObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.5 }
    );
    playbackObserver.observe(target);

    return () => {
      preloadObserver.disconnect();
      playbackObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isNearViewport) return;

    if (isInView) {
      if (!userPausedRef.current && !isEnded) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            });
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, [isInView, isNearViewport, isEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsEnded(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isNearViewport]);

  useEffect(() => {
    const handleOtherReelAudio = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== 'announcement' && videoRef.current) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    };
    window.addEventListener('roa-reel-audio', handleOtherReelAudio);
    return () => window.removeEventListener('roa-reel-audio', handleOtherReelAudio);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isNearViewport) {
      setIsNearViewport(true);
      userPausedRef.current = false;
      return;
    }

    if (isEnded) {
      video.currentTime = 0;
      setIsEnded(false);
    }

    if (video.paused) {
      userPausedRef.current = false;
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      userPausedRef.current = true;
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted) window.dispatchEvent(new CustomEvent('roa-reel-audio', { detail: 'announcement' }));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    video.currentTime = newProgress * video.duration;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section ref={sectionRef} className="rr-container rr-section--tight">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="rr-panel p-6 sm:p-9 lg:p-11"
      >
        <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-12 lg:gap-12">
          <div className="flex justify-center lg:col-span-5">
            <div className="relative aspect-[9/16] w-full max-w-[300px] select-none overflow-hidden border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]">
              <video
                ref={videoRef}
                src={isNearViewport ? videoSrc : undefined}
                poster={posterSrc}
                playsInline
                muted={isMuted}
                loop
                preload={isNearViewport ? 'metadata' : 'none'}
                className="h-full w-full object-contain bg-[color:var(--rr-dark)]"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setHasError(true)}
              />

              {!isNearViewport && !posterSrc && (
                <div
                  className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center bg-[color:var(--rr-dark)] p-6 text-center select-none"
                  onClick={togglePlay}
                  role="button"
                  tabIndex={0}
                  aria-label="Load and play community announcement"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePlay();
                    }
                  }}
                >
                  <span className="mb-5 flex h-14 w-14 items-center justify-center border border-[color:var(--rr-brass)] text-[color:var(--rr-on-dark)]">
                    <Play className="h-6 w-6 translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="rr-meta mb-2 text-[color:var(--rr-brass)]">
                    Readers of Aurangabad
                  </span>
                  <span className="font-display text-xl text-[color:var(--rr-on-dark)]/90">
                    Community Announcement
                  </span>
                  <span className="mt-2 text-xs text-[color:var(--rr-on-dark)]/60">
                    Click to watch announcement
                  </span>
                </div>
              )}

              {hasError && (
                <div className="absolute inset-0 z-[11] flex flex-col items-center justify-center bg-[color:var(--rr-dark)] px-6 text-center text-[color:var(--rr-on-dark)]">
                  <p className="font-semibold">Announcement reel unavailable</p>
                  <p className="mt-1 text-sm text-[color:var(--rr-on-dark)]/70">The announcement video file could not be loaded.</p>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-2">
                <span className="rr-meta flex items-center gap-2 border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/85 px-3 py-1.5 text-[color:var(--rr-on-dark)]">
                  <span className="h-1.5 w-1.5 bg-[color:var(--rr-brass)]" aria-hidden="true" />
                  Announcement
                </span>
                {duration > 0 && (
                  <span className="rr-meta border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/85 px-2.5 py-1 text-[color:var(--rr-on-dark)]/85">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>

              {(isNearViewport || posterSrc) && !isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-[color:var(--rr-dark)]/45 transition-opacity"
                >
                  <span className="flex h-14 w-14 items-center justify-center border border-[color:var(--rr-brass)] bg-[color:var(--rr-dark)]/70 text-[color:var(--rr-on-dark)]">
                    {isEnded ? <RotateCcw className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 bg-[color:var(--rr-dark)]/85 p-4">
                <div
                  className="mb-3 h-1 w-full cursor-pointer bg-[color:var(--rr-on-dark)]/25 hover:h-1.5"
                  onClick={handleSeek}
                  title="Seek"
                >
                  <div
                    className="h-full bg-[color:var(--rr-brass)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)] cursor-pointer"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="rr-touch flex h-11 items-center gap-2 border border-[color:var(--rr-border)] px-3 text-[color:var(--rr-on-dark)] cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="rr-meta">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <div>
              <span className="rr-eyebrow">The Announcement Reel</span>
              <h2 className="rr-title rr-title--compact mt-5 text-[color:var(--rr-ink)]">
                {title}
              </h2>
              <p className="mt-3 font-display text-xl italic text-[color:var(--rr-terracotta)]">
                {subtitle}
              </p>
            </div>

            <p className="rr-lede">{description}</p>

            <div className="rr-panel rr-panel--sage flex items-center gap-4 border-l border-[color:var(--rr-brass)] px-5 py-4">
              <span className="h-2 w-2 shrink-0 bg-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <div>
                <span className="rr-meta block text-[color:var(--rr-muted)]">Community Focus</span>
                <p className="mt-1 text-sm font-semibold text-[color:var(--rr-forest)]">
                  Monthly Gatherings &amp; Reader Circles
                </p>
              </div>
            </div>

            <div className="rr-event-actions pt-2">
              <button onClick={togglePlay} className="rr-btn cursor-pointer">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause Announcement' : 'Watch Announcement'}</span>
              </button>

              <button onClick={toggleMute} className="rr-btn rr-btn--outline cursor-pointer">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
