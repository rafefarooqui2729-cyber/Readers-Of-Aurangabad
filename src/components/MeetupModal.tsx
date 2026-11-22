import React, { useRef } from 'react';
import type { Meetup } from '../types';
import { X, Calendar, Clock, MapPin, ExternalLink, CheckCircle, AlertCircle, Share2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';
import { getSafeRegistrationUrl } from '../utils/url';
import { isMeetupUpcoming } from '../utils/meetupStatus';
import { siteConfig } from '../content/siteConfig';

interface MeetupModalProps {
  meetup: Meetup | null;
  onClose: () => void;
}

export const MeetupModal: React.FC<MeetupModalProps> = ({ meetup, onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dismiss = useModalEscapeDismiss(Boolean(meetup), onClose, surfaceRef);

  if (!meetup) return null;

  const registrationUrl = getSafeRegistrationUrl(meetup);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetup.title,
          text: `Join Readers of Aurangabad for ${meetup.title} on ${meetup.date}!`,
          url: window.location.href,
        });
      } catch {
        // Share dismissed or unsupported at call time — nothing else to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `${meetup.title} - Readers of Aurangabad\nDate: ${meetup.date}`,
      );
      alert('Event details copied to clipboard!');
    } catch {
      alert('Could not copy event details. Please try again.');
    }
  };

  const getStatusBadge = () => {
    // A past date always renders as an archive, even if a stale admin status
    // was left as "open".
    if (meetup.registrationStatus !== 'cancelled' && !isMeetupUpcoming(meetup)) {
      return (
        <span className="rr-meta inline-flex items-center border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-on-dark)]/80">
          Past Gathering Archive
        </span>
      );
    }

    switch (meetup.registrationStatus) {
      case 'open':
        return (
          <span className="rr-meta inline-flex items-center gap-1.5 border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-on-dark)]">
            <span className={`h-1.5 w-1.5 bg-[color:var(--rr-brass)] ${shouldReduceMotion ? '' : 'animate-pulse'}`} aria-hidden="true"></span>
            Registrations Open
          </span>
        );
      case 'closed':
        return (
          <span className="rr-meta inline-flex items-center border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-on-dark)]/80">
            Registration Closed
          </span>
        );
      case 'announced':
        return (
          <span className="rr-meta inline-flex items-center border border-[color:var(--rr-brass)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-brass)]">
            Announced
          </span>
        );
      case 'cancelled':
        return (
          <span className="rr-meta inline-flex items-center border border-[color:var(--rr-terracotta)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-terracotta)]">
            Event Cancelled
          </span>
        );
      case 'past':
        return (
          <span className="rr-meta inline-flex items-center border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/70 px-2.5 py-1 text-[color:var(--rr-on-dark)]/80">
            Past Gathering Archive
          </span>
        );
    }
  };

  return (
    <motion.div
      className="p3-modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
    >
      <motion.div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-label={meetup.title}
        tabIndex={-1}
        className="p3-modal-surface p3-meetup-modal rr-modal flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.985 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p3-modal-header relative h-56 w-full shrink-0 overflow-hidden bg-[color:var(--rr-dark)]">
          <img
            src={meetup.featuredImage}
            alt={meetup.title}
            className="h-full w-full object-cover object-[center_20%] opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--rr-dark)] via-[color:var(--rr-dark)]/40 to-transparent" aria-hidden="true" />

          <button
            onClick={dismiss}
            className="p3-icon-button p3-modal-close absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/70 text-[color:var(--rr-on-dark)] hover:text-[color:var(--rr-brass)] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {meetup.edition && (
                <span className="rr-meta border border-[color:var(--rr-brass)] bg-[color:var(--rr-brass)] px-2 py-1 text-[color:var(--rr-dark)]">
                  {meetup.edition}
                </span>
              )}
              {getStatusBadge()}
            </div>
            <h2 className="rr-title rr-title--compact text-[color:var(--rr-on-dark)]">
              {meetup.title}
            </h2>
          </div>
        </div>

        <div className="p3-modal-body space-y-7 overflow-y-auto p-6 sm:p-8">
          <div className="p3-modal-meta grid grid-cols-1 border border-[color:var(--rr-border)] sm:grid-cols-2">
            <div className="flex items-center gap-3 border-b border-[color:var(--rr-border)] p-4 sm:border-b-0 sm:border-r">
              <Calendar className="h-4 w-4 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <div>
                <span className="rr-meta block text-[color:var(--rr-muted)]">Date</span>
                <span className="mt-1 block text-sm font-semibold text-[color:var(--rr-ink)]">{meetup.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <Clock className="h-4 w-4 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <div>
                <span className="rr-meta block text-[color:var(--rr-muted)]">Time</span>
                <span className="mt-1 block text-sm font-semibold text-[color:var(--rr-ink)]">{meetup.time}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-[color:var(--rr-border)] p-4 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <div>
                <span className="rr-meta block text-[color:var(--rr-muted)]">Venue</span>
                <span className="mt-1 block text-sm font-semibold text-[color:var(--rr-ink)]">{meetup.venue}</span>
                {meetup.address && (
                  <p className="rr-body mt-0.5 text-xs">{meetup.address}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="rr-title rr-title--small mb-3 text-[color:var(--rr-ink)]">
              About This Gathering
            </h3>
            <p className="rr-body whitespace-pre-line text-sm">
              {meetup.description}
            </p>
          </div>

          {meetup.activities && meetup.activities.length > 0 && (
            <div>
              <h3 className="rr-title rr-title--small mb-3 text-[color:var(--rr-ink)]">
                Flow of the Gathering
              </h3>
              <div className="border-t border-[color:var(--rr-border)]">
                {meetup.activities.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-3 border-b border-[color:var(--rr-border)] py-2.5 text-sm text-[color:var(--rr-ink)]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[color:var(--rr-forest)]" aria-hidden="true" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meetup.highlights && (
            <div className="rr-alert flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <div className="text-xs text-[color:var(--rr-ink)]">
                <strong className="mb-0.5 block font-bold">Guidelines &amp; What to Bring:</strong>
                <p className="leading-relaxed">{meetup.highlights}</p>
              </div>
            </div>
          )}

          {meetup.photos && meetup.photos.length > 0 && (
            <div>
              <h3 className="rr-title rr-title--small mb-3 text-[color:var(--rr-ink)]">
                Memories from this Meetup
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {meetup.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Meetup memory ${i + 1}`}
                    loading="lazy"
                    className="h-24 w-full border border-[color:var(--rr-border)] object-cover object-[center_20%] sm:h-28"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p3-modal-actions flex items-center justify-between gap-3 border-t border-[color:var(--rr-border)] bg-[color:var(--rr-paper)] p-4 sm:p-5">
          <button
            onClick={handleShare}
            className="p3-secondary-action rr-btn rr-btn--outline cursor-pointer"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="p3-text-action rr-link cursor-pointer"
            >
              Close
            </button>

            {isMeetupUpcoming(meetup) && meetup.registrationStatus === 'open' && registrationUrl ? (
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p3-primary-action rr-btn cursor-pointer"
              >
                <span>Register now</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : isMeetupUpcoming(meetup) && meetup.registrationStatus === 'open' ? (
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p3-primary-action rr-btn cursor-pointer"
              >
                <span>Ask on WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="p3-status-chip rr-meta px-3 py-2 text-[color:var(--rr-muted)]">
                {meetup.registrationStatus === 'past'
                  ? 'Past Event'
                  : meetup.registrationStatus === 'cancelled'
                  ? 'Event Cancelled'
                  : 'Registrations Closed'}
              </span>
            )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
