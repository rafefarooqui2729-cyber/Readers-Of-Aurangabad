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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

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
  }, []);

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

    if (isEnded) {
      video.currentTime = 0;
      setIsEnded(false);
    }

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
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
    <section className="relative py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Decorative glass glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-80 bg-[#455240]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Glass Card Frame */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Announcement reel player */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden glass-dark border border-white/20 shadow-2xl group select-none">

              {/* Native Video Element with object-contain to ensure the full frame is visible */}
              <video
                ref={videoRef}
                src={videoSrc}
                poster={posterSrc}
                playsInline
                muted={isMuted}
                autoPlay
                loop
                preload="metadata"
                className="w-full h-full object-contain bg-black/95 transition-transform duration-500"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setHasError(true)}
              />
              {hasError && (
                <div className="absolute inset-0 z-[11] flex flex-col items-center justify-center bg-[#211F1C] px-6 text-center text-[#E8E2D5]">
                  <p className="font-semibold">Announcement reel unavailable</p>
                  <p className="mt-1 text-sm text-white/70">The announcement video file could not be loaded.</p>
                </div>
              )}

              {/* Top Glass Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-medium tracking-widest text-[#FAF8F5] uppercase bg-black/40 border-white/20 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ANNOUNCEMENT
                </span>

                {/* Duration indicator */}
                {duration > 0 && (
                  <span className="glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-mono text-white/90 bg-black/40 border-white/10">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>

              {/* Big Center Play Overlay (visible when paused) */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity z-10"
                >
                  <div className="w-16 h-16 rounded-full glass-dark-control flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-transform">
                    {isEnded ? <RotateCcw className="w-7 h-7" /> : <Play className="w-7 h-7 translate-x-0.5" />}
                  </div>
                </div>
              )}

              {/* Bottom Glass Control Bar */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent backdrop-blur-[6px] z-10 transition-opacity">
                {/* Scrubbable Progress Line */}
                <div
                  className="w-full h-1.5 bg-white/20 hover:h-2 rounded-full mb-3 cursor-pointer transition-all overflow-hidden"
                  onClick={handleSeek}
                  title="Seek"
                >
                  <div
                    className="h-full bg-[#EBF0E9] rounded-full transition-all duration-100 relative"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    className="glass-dark-control w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      className="glass-dark-control px-3 h-9 rounded-full flex items-center gap-1.5 text-xs text-white cursor-pointer"
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-4 h-4 text-amber-300" />
                          <span className="font-sans font-medium text-[11px]">Unmute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-300" />
                          <span className="font-sans font-medium text-[11px]">Mute</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Glass Content Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial font-normal text-[#1C1B1A] leading-[1.15]">
                {title}
              </h2>
              <p className="text-lg sm:text-xl font-editorial italic text-[#455240]">
                {subtitle}
              </p>
            </div>

            <p className="text-[#595550] text-base sm:text-lg leading-relaxed font-sans max-w-xl">
              {description}
            </p>

            {/* Community Focus Callout */}
            <div className="inline-flex items-center gap-3.5 px-4 py-3 rounded-2xl glass-card border-white/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#777C60] shrink-0" />
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider text-[#777C60] block">
                  Community Focus
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[#20231F]">
                  Weekly Gatherings &amp; Reader Circles
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={togglePlay}
                className="glass-button px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Announcement' : 'Watch Announcement'}</span>
              </button>

              <button
                onClick={toggleMute}
                className="glass-button-secondary px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
