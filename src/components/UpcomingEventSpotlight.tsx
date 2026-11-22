import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { Announcement, Meetup } from '../types';
import { announcementTargetDomId } from '../utils/announcementNavigation';
import { getMeetupStartMs } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';
import { siteConfig } from '../content/siteConfig';

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

const getTimeLeft = (targetMs?: number): TimeLeft => {
  const hasTarget = typeof targetMs === 'number' && Number.isFinite(targetMs);
  const totalMs = hasTarget ? Math.max(0, (targetMs as number) - Date.now()) : 0;
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
  <div className="min-w-0 px-2 py-3 text-center sm:px-4">
    <div className="font-display text-2xl leading-none text-[color:var(--rr-forest)] sm:text-3xl">
      <Digit value={pad(value)} reduceMotion={reduceMotion} />
    </div>
    <div className="rr-meta mt-2 text-[color:var(--rr-muted)]">{label}</div>
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
  const startMs = getMeetupStartMs(meetup);
  const hasValidDate = Number.isFinite(startMs);
  const registrationUrl = meetup ? getSafeRegistrationUrl(meetup) : undefined;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(startMs));

  useEffect(() => {
    if (!hasValidDate) return;

    const tick = () => setTimeLeft(getTimeLeft(startMs));
    const timeoutId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [startMs, hasValidDate, meetup?.id]);

  const isLiveOrPast = useMemo(
    () => hasValidDate && timeLeft.totalMs <= 0,
    [hasValidDate, timeLeft.totalMs],
  );

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
      className="rr-container rr-section--tight"
      aria-label="Upcoming event and latest announcement"
    >
      <div className="rr-panel overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="p-6 sm:p-9 lg:col-span-7 lg:p-11">
            <div className="flex items-center gap-3">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <span className="rr-eyebrow">Next Community Gathering</span>
            </div>

            {meetup ? (
              <div className="mt-7 space-y-7">
                <div>
                  <h2 className="rr-title rr-title--compact text-[color:var(--rr-ink)]">
                    {meetup.title}
                  </h2>
                  {meetup.edition && (
                    <p className="rr-meta mt-3 text-[color:var(--rr-terracotta)]">{meetup.edition}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-0 border-y border-[color:var(--rr-border)] sm:grid-cols-2 sm:gap-0">
                  <div className="flex items-start gap-3 border-b border-[color:var(--rr-border)] py-4 sm:border-b-0 sm:border-r sm:pr-6">
                    <Calendar className="mt-0.5 h-4 w-4 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                    <div>
                      <span className="rr-meta block text-[color:var(--rr-muted)]">Date &amp; time</span>
                      <span className="mt-1 block text-sm font-semibold text-[color:var(--rr-ink)]">{meetup.date}</span>
                      <span className="rr-body text-xs">{meetup.time}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-4 sm:pl-6">
                    <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                    <div>
                      <span className="rr-meta block text-[color:var(--rr-muted)]">Venue</span>
                      <span className="mt-1 block text-sm font-semibold text-[color:var(--rr-ink)]">{meetup.venue}</span>
                      {meetup.address && <span className="rr-body block text-xs">{meetup.address}</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="rr-meta mb-3 text-[color:var(--rr-muted)]">
                    {!hasValidDate
                      ? 'Date to be confirmed'
                      : isLiveOrPast
                      ? 'Event is starting soon or in progress'
                      : 'Countdown to gathering'}
                  </p>
                  {!hasValidDate ? (
                    <div className="rr-panel rr-panel--plain border border-[color:var(--rr-border)] px-5 py-4 rr-body">
                      The date for this gathering is yet to be confirmed. Check the gathering archive for updates.
                    </div>
                  ) : isLiveOrPast ? (
                    <div className="rr-panel rr-panel--plain border border-[color:var(--rr-border)] px-5 py-4 rr-body">
                      This gathering is happening now or its scheduled start time has arrived. Check details for the latest update.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 border-y border-[color:var(--rr-border)]" role="timer" aria-live="polite">
                      <CountdownUnit label="Days" value={timeLeft.days} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Hours" value={timeLeft.hours} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Minutes" value={timeLeft.minutes} reduceMotion={shouldReduceMotion} />
                      <CountdownUnit label="Seconds" value={timeLeft.seconds} reduceMotion={shouldReduceMotion} />
                    </div>
                  )}
                </div>

                <div className="rr-event-actions pt-1">
                  <button onClick={() => onViewEvent(meetup)} className="rr-btn cursor-pointer">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {registrationUrl && meetup.registrationStatus === 'open' ? (
                    <a
                      href={registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rr-btn rr-btn--outline"
                    >
                      Register now
                    </a>
                  ) : (
                    <a
                      href={siteConfig.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rr-btn rr-btn--outline"
                    >
                      Ask on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-7 space-y-6">
                <h2 className="rr-title rr-title--compact text-[color:var(--rr-ink)]">
                  Our next chapter is being prepared
                </h2>
                <p className="rr-lede">
                  There isn&apos;t a confirmed upcoming meetup on the calendar right now. Stay close — new gatherings, reading circles, and community moments are announced here as soon as they&apos;re ready.
                </p>
                <button onClick={onViewGatherings} className="rr-btn cursor-pointer">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Explore gatherings</span>
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-[color:var(--rr-border)] bg-[color:var(--rr-sage)] p-6 sm:p-9 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-11">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-[color:var(--rr-forest)]" aria-hidden="true" />
              <span className="rr-eyebrow">From the Noticeboard</span>
            </div>

            {announcement ? (
              <div
                id={announcementTargetDomId(announcement.id)}
                className="mt-7 space-y-5 scroll-mt-24"
              >
                <div className="flex items-center gap-2 text-[color:var(--rr-muted)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="rr-meta">
                    Published {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="rr-title rr-title--small text-[color:var(--rr-ink)]">
                  {announcement.title}
                </h3>
                <p className="rr-body whitespace-pre-line text-sm">
                  {announcementPreview}
                </p>
                <button
                  onClick={onViewAnnouncement}
                  className="rr-link cursor-pointer"
                >
                  <span>View full announcement</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="rr-empty mt-7">
                <h3 className="rr-title rr-title--small text-[color:var(--rr-ink)]">
                  No new announcements yet
                </h3>
                <p className="rr-body mt-2 max-w-xs">
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
