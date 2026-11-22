import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Film, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export const ReelCollectionSection: React.FC = () => {
  const { reels } = useApp();
  const publishedReels = React.useMemo(
    () => [...reels]
      .filter(reel => (reel.published !== false && reel.isPublished !== false) && Boolean(reel.videoUrl))
      .sort((a, b) => a.order - b.order),
    [reels],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const currentRef = useRef<HTMLVideoElement>(null);
  const incomingRef = useRef<HTMLVideoElement>(null);
  const transitionToken = useRef(0);
  const transitionTimer = useRef<number | null>(null);
  const isMutedRef = useRef(isMuted);

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

    // Playback observer: 0.35 threshold ensures video plays when section enters view
    const playbackObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.35 }
    );
    playbackObserver.observe(target);

    return () => {
      preloadObserver.disconnect();
      playbackObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleOtherReelAudio = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== 'reels') {
        isMutedRef.current = true;
        setIsMuted(true);
        if (currentRef.current) currentRef.current.muted = true;
        if (incomingRef.current) incomingRef.current.muted = true;
      }
    };
    window.addEventListener('roa-reel-audio', handleOtherReelAudio);
    return () => window.removeEventListener('roa-reel-audio', handleOtherReelAudio);
  }, []);

  const availableReels = React.useMemo(
  () => publishedReels.filter(reel => !failedIds.has(reel.id)),
  [publishedReels, failedIds],
);

const safeCurrentIndex = availableReels.length > 0
  ? currentIndex % availableReels.length
  : 0;

const currentReel = availableReels[safeCurrentIndex];
const currentVideoUrl = currentReel?.videoUrl;
const incomingReel = incomingIndex === null ? null : availableReels[incomingIndex];

  const resetTransition = useCallback(() => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionToken.current += 1;
    setIncomingIndex(null);
    setIncomingVisible(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const beginTransition = useCallback((requestedIndex: number) => {
    if (availableReels.length === 0) return;
    userPausedRef.current = false;
    if (!isNearViewport) {
      setIsNearViewport(true);
    }
    if (availableReels.length === 1) {
      const video = currentRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => setIsPlaying(false));
      }
      return;
    }

    const nextIndex = (requestedIndex + availableReels.length) % availableReels.length;
    transitionToken.current += 1;
    setIncomingIndex(nextIndex);
    setIncomingVisible(false);
  }, [availableReels.length, isNearViewport]);

  useEffect(() => {
    if (incomingIndex === null || !incomingRef.current) return;
    const video = incomingRef.current;
    const token = transitionToken.current;
    video.currentTime = 0;
    video.muted = true;
    video.play().then(() => {
      if (token !== transitionToken.current) return;
      setIncomingVisible(true);
      transitionTimer.current = window.setTimeout(() => {
        if (token !== transitionToken.current) return;
        if (currentRef.current) {
          currentRef.current.pause();
          currentRef.current.muted = true;
        }
        video.muted = isMutedRef.current;
        setCurrentIndex(incomingIndex);
        setIncomingIndex(null);
        setIncomingVisible(false);
        setIsPlaying(true);
      }, 650);
    }).catch(() => {
      if (token !== transitionToken.current) return;
      const failed = availableReels[incomingIndex];
      if (failed) {
        setFailedIds(previous => new Set([...previous, failed.id]));
        resetTransition();
        if (availableReels.length > 2) beginTransition(incomingIndex + 1);
      }
    });
  }, [incomingIndex, availableReels, beginTransition, resetTransition]);

useEffect(() => {
  const video = currentRef.current;
  if (!video || !currentVideoUrl) return;

  if (isNearViewport && isInView && !userPausedRef.current) {
    video.muted = isMutedRef.current;
    const playPromise = video.play();

    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          isMutedRef.current = true;
          setIsMuted(true);

          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    }
  } else if (!isInView) {
    if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }
    if (incomingRef.current && !incomingRef.current.paused) {
      incomingRef.current.pause();
    }
  }
}, [currentIndex, currentVideoUrl, isNearViewport, isInView]);

  useEffect(() => () => resetTransition(), [resetTransition]);

  const markCurrentFailed = () => {
    if (!currentReel) return;
    setFailedIds(previous => new Set([...previous, currentReel.id]));
    resetTransition();
  };

  const togglePlayback = () => {
    if (!isNearViewport) {
      setIsNearViewport(true);
      userPausedRef.current = false;
      return;
    }
    const video = incomingVisible ? incomingRef.current : currentRef.current;
    if (!video) return;
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
  const nextMuted = !isMuted;
  isMutedRef.current = nextMuted;
  setIsMuted(nextMuted);

  if (currentRef.current) currentRef.current.muted = nextMuted;
  if (incomingRef.current) incomingRef.current.muted = true;
  if (!nextMuted) {
    window.dispatchEvent(new CustomEvent('roa-reel-audio', { detail: 'reels' }));
  }
};

  if (publishedReels.length === 0) return null;
  if (availableReels.length === 0) {
    return (
      <section className="rr-container pb-10">
        <div className="rr-empty">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
          <p className="font-semibold text-[color:var(--rr-ink)]">Reels unavailable</p>
          <p className="rr-body mt-1 text-sm">The published video files could not be loaded.</p>
        </div>
      </section>
    );
  }
  if (!currentReel) return null;

  return (
    <section ref={sectionRef} className="rr-container rr-section--tight">
      <div className="rr-section-head mb-8">
        <div className="rr-section-head__copy">
          <span className="rr-eyebrow">
            <Film className="h-3.5 w-3.5" aria-hidden="true" />
            Visual Chronicles
          </span>
          <h2 className="rr-title rr-title--compact mt-5 text-[color:var(--rr-ink)]">Reel collection</h2>
          <p className="mt-2 font-display text-xl italic text-[color:var(--rr-terracotta)]">Meetup moments.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rr-panel p-5 sm:p-8 lg:p-10">
        <div className="grid items-center gap-9 lg:grid-cols-12 lg:gap-12">
          <div className="flex justify-center lg:col-span-5">
            <div className="relative aspect-[9/16] w-full max-w-[330px] overflow-hidden border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]">
              <video
                ref={currentRef}
                key={currentReel.id}
                src={isNearViewport ? currentReel.videoUrl : undefined}
                poster={currentReel.posterUrl}
                muted={isMuted}
                playsInline
                preload={isNearViewport ? 'auto' : 'none'}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={event => {
                  const video = event.currentTarget;
                  if (video.duration) {
                    setProgress(video.currentTime / video.duration * 100);
                    setCurrentTime(video.currentTime);
                    setDuration(video.duration);
                  }
                }}
                onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
                onEnded={() => beginTransition(safeCurrentIndex + 1)}
                onError={markCurrentFailed}
                className="absolute inset-0 h-full w-full object-contain"
              />
              {incomingReel && (
                <video
                  ref={incomingRef}
                  key={incomingReel.id}
                  src={incomingReel.videoUrl}
                  poster={incomingReel.posterUrl}
                  muted
                  playsInline
                  preload="auto"
                  onError={() => {
                    setFailedIds(previous => new Set([...previous, incomingReel.id]));
                    resetTransition();
                  }}
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[650ms] ${incomingVisible ? 'opacity-100' : 'opacity-0'}`}
                />
              )}

              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                <span className="rr-meta border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/85 px-3 py-1.5 text-[color:var(--rr-on-dark)]">
                  Auto-play loop
                </span>
                <span className="rr-meta border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/85 px-2.5 py-1.5 text-[color:var(--rr-on-dark)]">
                  {currentIndex + 1} / {availableReels.length}
                </span>
              </div>

              <div className="absolute inset-x-3 bottom-3 border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/90 p-3 text-[color:var(--rr-on-dark)]">
                <div
                  className="mb-3 h-1 w-full overflow-hidden bg-[color:var(--rr-on-dark)]/25"
                  role="slider"
                  aria-label="Video progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div className="h-full bg-[color:var(--rr-brass)]" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{currentReel.title}</p>
                    <p className="rr-meta mt-1 text-[color:var(--rr-on-dark)]/60">
                      {Math.floor(currentTime)}s / {Number.isFinite(duration) ? Math.floor(duration) : 0}s
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => beginTransition(safeCurrentIndex - 1)} aria-label="Previous reel" className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)] cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause reel' : 'Play reel'} className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)] cursor-pointer">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                    <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute reel' : 'Mute reel'} className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)] cursor-pointer">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                    <button type="button" onClick={() => beginTransition(safeCurrentIndex + 1)} aria-label="Next reel" className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)] cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-7">
            <span className="rr-eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Community reel
            </span>
            <h3 className="rr-title rr-title--compact text-[color:var(--rr-ink)]">{currentReel.title}</h3>
            {currentReel.caption && <p className="rr-lede">{currentReel.caption}</p>}
            <div className="border-t border-[color:var(--rr-border)] pt-5">
              <p className="rr-meta text-[color:var(--rr-muted)]">
                {availableReels.length} published {availableReels.length === 1 ? 'film' : 'films'} · MH20 City Reading Collective
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
