import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { announcementReel, reelPlaylist, type ReelPlaylistEntry } from '../data/mediaPlaylist';
import { InstagramIcon } from './Icons';

const VideoFallback = ({ compact = false }: { compact?: boolean }) => (
  <div className={`h-full w-full flex flex-col items-center justify-center text-center bg-[#211F1C] text-[#E8E2D5] ${compact ? 'p-4' : 'p-8'}`}>
    <AlertCircle className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} mb-2`} />
    <p className={`${compact ? 'text-xs' : 'text-base'} font-semibold`}>Reel unavailable</p>
    {!compact && <p className="text-xs text-white/60 mt-1">The video file could not be loaded.</p>}
  </div>
);

const AnnouncementFeature: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  const togglePlayback = () => {
    const video = videoRef.current;
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
    if (videoRef.current) videoRef.current.muted = nextMuted;
    if (!nextMuted) window.dispatchEvent(new CustomEvent('roa-reel-audio', { detail: 'announcement' }));
  };

  useEffect(() => {
    const muteAnnouncement = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail === 'announcement') return;
      if (videoRef.current) videoRef.current.muted = true;
      setIsMuted(true);
    };
    window.addEventListener('roa-reel-audio', muteAnnouncement);
    return () => window.removeEventListener('roa-reel-audio', muteAnnouncement);
  }, []);

  return (
    <section className="grid items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4 md:pr-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8D5B4C] shadow-sm backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-[#455240]" />
          Announcement
        </div>
        <h2 className="max-w-xl font-serif text-4xl font-bold leading-[1.05] text-[#1C1B1A] sm:text-5xl lg:text-6xl">
          A note from the reading circle.
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-[#595550] sm:text-lg">
          {announcementReel.caption}
        </p>
      </div>

      <div className="mx-auto w-full max-w-[360px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] border border-white/60 bg-[#171615] shadow-[0_24px_70px_rgba(28,27,26,.18)]">
          {failed ? <VideoFallback /> : (
            <video
              ref={videoRef}
              src={announcementReel.filename}
              poster="/images/enhanced/thumbnails/roa-009-2026-11-05-thumb.webp"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setFailed(true)}
              className="h-full w-full object-contain"
            />
          )}
          {!failed && (
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-white/25 bg-black/45 px-2 py-1.5 shadow-lg backdrop-blur-xl">
              <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Announcement reel</span>
              <div className="flex gap-1.5">
                <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause announcement' : 'Play announcement'} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]">
                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute announcement' : 'Mute announcement'} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const ReelPlaylist: React.FC<{ entries: ReelPlaylistEntry[] }> = ({ entries }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const currentRef = useRef<HTMLVideoElement>(null);
  const incomingRef = useRef<HTMLVideoElement>(null);
  const transitionToken = useRef(0);

  useEffect(() => {
    const mutePlaylist = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== 'announcement') return;
      if (currentRef.current) currentRef.current.muted = true;
      if (incomingRef.current) incomingRef.current.muted = true;
      setIsMuted(true);
    };
    window.addEventListener('roa-reel-audio', mutePlaylist);
    return () => window.removeEventListener('roa-reel-audio', mutePlaylist);
  }, []);

  const available = entries.filter(entry => !failedIds.has(entry.filename));
  if (available.length === 0) return <VideoFallback />;
  const current = available[currentIndex % available.length];

  const moveTo = (requestedIndex: number) => {
    if (available.length === 1) {
      const video = currentRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => setIsPlaying(false));
      }
      return;
    }
    const nextIndex = (requestedIndex + available.length) % available.length;
    const token = ++transitionToken.current;
    setIncomingIndex(nextIndex);
    setIncomingVisible(false);
    if (currentRef.current) currentRef.current.muted = true;
    window.setTimeout(() => {
      const prepare = incomingRef.current;
      if (!prepare || token !== transitionToken.current) return;
      prepare.muted = true;
      prepare.play().then(() => {
        if (token !== transitionToken.current) return;
        setIncomingVisible(true);
        window.setTimeout(() => {
          if (token !== transitionToken.current) return;
          currentRef.current?.pause();
          if (incomingRef.current) incomingRef.current.muted = isMuted;
          setCurrentIndex(nextIndex);
          setIncomingIndex(null);
          setIncomingVisible(false);
        }, 700);
      }).catch(() => markFailed(available[nextIndex].filename, token));
    }, 0);
  };

  const markFailed = (filename: string, token?: number) => {
    if (token !== undefined && token !== transitionToken.current) return;
    setFailedIds(previous => new Set([...previous, filename]));
    if (incomingIndex !== null) {
      setIncomingIndex(null);
      setIncomingVisible(false);
    }
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
    if (incomingRef.current) incomingRef.current.muted = nextMuted;
    if (currentRef.current) currentRef.current.muted = incomingIndex !== null ? true : nextMuted;
    if (!nextMuted) window.dispatchEvent(new CustomEvent('roa-reel-audio', { detail: 'reels' }));
  };

  const incoming = incomingIndex === null ? null : available[incomingIndex];

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] border border-[#E8E2D5] bg-[#171615] shadow-[0_20px_60px_rgba(28,27,26,.14)]">
        <video
          ref={currentRef}
          key={current.filename}
          src={current.filename}
          poster={current.poster}
          muted={incomingIndex !== null ? true : isMuted}
          autoPlay
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => moveTo(currentIndex + 1)}
          onError={() => markFailed(current.filename)}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {incoming && (
          <video
            ref={incomingRef}
            key={incoming.filename}
            src={incoming.filename}
            poster={incoming.poster}
            muted
            playsInline
            preload="auto"
            onError={() => markFailed(incoming.filename, transitionToken.current)}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${incomingVisible ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-2xl border border-white/20 bg-black/45 p-2.5 backdrop-blur-xl">
          <div className="min-w-0 text-white">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Reel {currentIndex + 1} of {available.length}</span>
            <span className="block truncate text-xs font-semibold">{incoming?.title || current.title}</span>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => moveTo(currentIndex - 1)} aria-label="Previous reel" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause reels' : 'Play reels'} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]">{isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
            <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute reels' : 'Mute reels'} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} </button>
            <button type="button" onClick={() => moveTo(currentIndex + 1)} aria-label="Next reel" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1C1B1A]"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InstagramFeedSection: React.FC = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 space-y-10">
      <div className="border-b border-[#E8E2D5] pb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8D5B4C]"><InstagramIcon className="h-4 w-4" />@readers.of.aurangabad</div>
          <h2 className="font-serif text-3xl font-bold text-[#1C1B1A] sm:text-4xl">Community Media</h2>
        </div>
      </div>

      <AnnouncementFeature />
      <div>
        <div className="mb-5 flex items-end justify-between border-b border-[#E8E2D5] pb-3">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8D5B4C]">Reel collection</span><h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">Meetup moments</h3></div>
          <span className="text-xs text-[#8C857B]">{reelPlaylist.length} reels</span>
        </div>
        <ReelPlaylist entries={reelPlaylist} />
      </div>
    </section>
  );
};
