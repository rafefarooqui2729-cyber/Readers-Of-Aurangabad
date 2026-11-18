import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { Announcement, Meetup } from '../types';
import { announcementTargetDomId } from '../utils/announcementNavigation';

interface UpcomingEventSpotlightProps {
  meetup: Meetup | null;
  announcement: Announcement | null;
  onViewEvent: (meetup: Meetup) => void;
  onViewAnnouncement: () => void;
  onViewGatherings: () => void;
}

interface TimeLeft {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeLeft = (targetIso?: string): TimeLeft => {
  const target = targetIso ? new Date(targetIso).getTime() : NaN;
  const totalMs = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalMs, days, hours, minutes, seconds };
};

const pad = (n: number) => String(n).padStart(2, '0');

const Digit: React.FC<{ value: string; reduceMotion: boolean }> = ({ value, reduceMotion }) => {
  if (reduceMotion) {
    return <span className="tabular-nums">{value}</span>;
  }

  return (
    <span className="relative inline-flex min-w-[2ch] justify-center overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0, filter: 'blur(2px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-100%', opacity: 0, filter: 'blur(2px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const CountdownUnit: React.FC<{ label: string; value: number; reduceMotion: boolean }> = ({ label, value, reduceMotion }) => (
  <div className="min-w-0 px-1.5 py-2 sm:px-3 sm:py-2.5 text-center">
    <div className="font-serif text-lg sm:text-xl lg:text-2xl font-semibold text-[#1C1B1A] leading-none">
      <Digit value={pad(value)} reduceMotion={reduceMotion} />
    </div>
    <div className="mt-1 text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-[#777C60] font-semibold">{label}</div>
  </div>
);

export const UpcomingEventSpotlight: React.FC<UpcomingEventSpotlightProps> = ({
  meetup,
  announcement,
  onViewEvent,
  onViewAnnouncement,
  onViewGatherings,
}) => {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(meetup?.startsAt));

  useEffect(() => {
    if (!meetup?.startsAt) return;

    const tick = () => setTimeLeft(getTimeLeft(meetup.startsAt));
    const timeoutId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [meetup?.startsAt, meetup?.id]);

  const isLiveOrPast = useMemo(() => Boolean(meetup?.startsAt) && timeLeft.totalMs <= 0, [meetup?.startsAt, timeLeft.totalMs]);

  const announcementPreview = useMemo(() => {
    if (!announcement) return '';
    const text = announcement.content.replace(/\s+/g, ' ').trim();
    return text.length > 180 ? `${text.slice(0, 177)}…` : text;
  }, [announcement]);

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="cine-scene relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-label="Upcoming event and latest announcement"
    >
      <div className="cine-layer cine-layer--raised rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(250,248,245,0.96),rgba(235,240,233,0.92))] shadow-[0_20px_60px_rgba(28,27,26,0.08)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#455240]/15 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#455240]">
              <Sparkles className="w-3.5 h-3.5 text-[#8D5B4C]" />
              <span>Next Community Gathering</span>
            </div>

            {meetup ? (
              <div className="mt-5 space-y-5">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1B1A] leading-[1.05]">
                    {meetup.title}
                  </h2>
                  {meetup.edition && (
                    <p className="mt-2 text-sm sm:text-base font-medium text-[#455240]">{meetup.edition}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#595550]">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 mt-0.5 text-[#8D5B4C]" />
                    <div>
                      <div className="font-semibold text-[#1C1B1A]">{meetup.date}</div>
                      <div>{meetup.time}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#8D5B4C]" />
                    <div>
                      <div className="font-semibold text-[#1C1B1A]">{meetup.venue}</div>
                      {meetup.address && <div>{meetup.address}</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#777C60] font-semibold mb-3">
                    {isLiveOrPast ? 'Event is starting soon or in progress' : 'Countdown to gathering'}
                  </p>
                  {isLiveOrPast ? (
                    <div className="rounded-2xl border border-[#455240]/15 bg-white/70 px-5 py-4 text-[#455240] font-medium">
                      This gathering is happening now or its scheduled start time has arrived. Check details for the latest update.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 w-full max-w-[340px] overflow-hidden rounded-xl border border-[#455240]/15 bg-white/70 divide-x divide-[#455240]/10 shadow-sm" role="timer" aria-live="polite">
                      <CountdownUnit label="Days" value={timeLeft.days} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Hours" value={timeLeft.hours} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Minutes" value={timeLeft.minutes} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Seconds" value={timeLeft.seconds} reduceMotion={shouldReduceMotion} />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => onViewEvent(meetup)}
                    className="glass-button px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>View details & register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {meetup.registrationUrl && (
                    <a
                      href={meetup.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button-secondary px-5 py-3 rounded-full text-sm font-semibold cursor-pointer"
                    >
                      {meetup.registrationStatus === 'open' ? 'Register now' : 'Registration info'}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1B1A] leading-[1.05]">
                  Our next chapter is being prepared
                </h2>
                <p className="text-base sm:text-lg text-[#595550] leading-relaxed max-w-2xl">
                  There isn&apos;t a confirmed upcoming meetup on the calendar right now. Stay close — new gatherings, reading circles, and community moments are announced here as soon as they&apos;re ready.
                </p>
                <button
                  onClick={onViewGatherings}
                  className="glass-button px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Explore gatherings</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#D8D3C8]/70 bg-white/45 p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 text-[#455240] font-semibold text-xs uppercase tracking-[0.18em]">
              <Bell className="w-4 h-4" />
              <span>Latest Community Announcement</span>
            </div>

            {announcement ? (
              <div
                id={announcementTargetDomId(announcement.id)}
                className="mt-5 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-2 text-xs text-[#777C60]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Published {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B1A] leading-tight">
                  {announcement.title}
                </h3>
                <p className="text-sm sm:text-base text-[#595550] leading-relaxed whitespace-pre-line">
                  {announcementPreview}
                </p>
                <button
                  onClick={onViewAnnouncement}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#455240] hover:text-[#8D5B4C] transition-colors cursor-pointer"
                >
                  <span>View full announcement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">No new announcements yet</h3>
                <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
                  When the community shares an update, you&apos;ll see it here alongside the next gathering.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
