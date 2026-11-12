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

  const currentRef = useRef<HTMLVideoElement>(null);
  const incomingRef = useRef<HTMLVideoElement>(null);
  const transitionToken = useRef(0);
  const transitionTimer = useRef<number | null>(null);

  const availableReels = publishedReels.filter(reel => !failedIds.has(reel.id));
  const currentReel = availableReels[currentIndex % Math.max(availableReels.length, 1)];
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
  }, [availableReels.length]);

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
        video.muted = isMuted;
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
  }, [incomingIndex]);

  useEffect(() => {
    const video = currentRef.current;
    if (!video || !currentReel) return;
    video.muted = isMuted;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
    }
  }, [currentIndex, currentReel?.videoUrl]);

  useEffect(() => {
    if (currentIndex >= availableReels.length && availableReels.length > 0) {
      setCurrentIndex(0);
    }
  }, [availableReels.length, currentIndex]);

  useEffect(() => () => resetTransition(), [resetTransition]);

  const markCurrentFailed = () => {
    if (!currentReel) return;
    setFailedIds(previous => new Set([...previous, currentReel.id]));
    resetTransition();
  };

  const togglePlayback = () => {
    const video = incomingVisible ? incomingRef.current : currentRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (currentRef.current) currentRef.current.muted = nextMuted;
    if (incomingRef.current) incomingRef.current.muted = true;
  };

  if (publishedReels.length === 0) return null;
  if (availableReels.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E8E2D5] bg-[#211F1C] px-5 py-8 text-center text-[#E8E2D5]">
          <AlertCircle className="mx-auto mb-2 h-6 w-6" />
          <p className="font-semibold">Reels unavailable</p>
          <p className="mt-1 text-sm text-white/70">The published video files could not be loaded.</p>
        </div>
      </section>
    );
  }
  if (!currentReel) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#455240]/20 bg-[#455240]/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#455240] backdrop-blur-xl">
          <Film className="h-3.5 w-3.5" /> Visual Chronicles
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#1C1B1A] sm:text-4xl">Reel collection</h2>
        <p className="mt-1 font-serif text-xl italic text-[#455240]">Meetup moments.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-panel rounded-3xl p-4 sm:p-7 lg:p-9">
        <div className="grid items-center gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-white/20 bg-[#171615] shadow-2xl">
              <video
                ref={currentRef}
                key={currentReel.id}
                src={currentReel.videoUrl}
                poster={currentReel.posterUrl}
                muted={isMuted}
                autoPlay
                playsInline
                preload="auto"
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
                onEnded={() => beginTransition(currentIndex + 1)}
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

              <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xl">Auto-play loop</span>
                <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white backdrop-blur-xl">{currentIndex + 1} / {availableReels.length}</span>
              </div>

              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-black/45 p-2.5 text-white backdrop-blur-xl">
                <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20" role="slider" aria-label="Video progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                  <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{currentReel.title}</p>
                    <p className="text-[10px] text-white/70">{Math.floor(currentTime)}s / {Number.isFinite(duration) ? Math.floor(duration) : 0}s</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => beginTransition(currentIndex - 1)} aria-label="Previous reel" className="glass-dark-control flex h-9 w-9 items-center justify-center rounded-full text-white"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause reel' : 'Play reel'} className="glass-dark-control flex h-9 w-9 items-center justify-center rounded-full text-white">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                    <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute reel' : 'Mute reel'} className="glass-dark-control flex h-9 w-9 items-center justify-center rounded-full text-white">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                    <button type="button" onClick={() => beginTransition(currentIndex + 1)} aria-label="Next reel" className="glass-dark-control flex h-9 w-9 items-center justify-center rounded-full text-white"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#455240]/20 bg-[#455240]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#455240] backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Community reel</div>
            <h3 className="font-serif text-3xl font-bold text-[#1C1B1A] sm:text-4xl">{currentReel.title}</h3>
            {currentReel.caption && <p className="max-w-xl text-base leading-relaxed text-[#595550] sm:text-lg">{currentReel.caption}</p>}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
