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
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-semibold bg-[#FFFDF8] text-[#5E5B55] border border-[#24262D]">
          Past Gathering Archive
        </span>
      );
    }

    switch (meetup.registrationStatus) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-semibold bg-[#F7F3EB] text-[#24262D] border border-[#24262D]/20">
            <span className={`w-2 h-2 rounded-none bg-[#24262D] ${shouldReduceMotion ? '' : 'animate-pulse'}`}></span>
            Registrations Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-semibold bg-[#F7F3EB] text-[#24262D]">
            Registration Closed
          </span>
        );
      case 'announced':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-semibold bg-[#FFD8C1]/45 text-[#24262D] border border-[#FFD8C1]">
            Announced
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-semibold bg-[#F47B49]/15 text-[#24262D] border border-[#F47B49]/45">
            Event Cancelled
          </span>
        );
      case 'past':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-semibold bg-[#FFFDF8] text-[#5E5B55] border border-[#24262D]">
            Past Gathering Archive
          </span>
        );
    }
  };

  return (
    <motion.div
      className="p3-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-[#24262D]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
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
        className="p3-modal-surface p3-meetup-modal glass-modal rounded-none max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[var(--mh20-shadow-lg)] relative border-white/75"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.985 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="p3-modal-header relative h-60 w-full shrink-0 overflow-hidden bg-[#24262D]">
          <img
            src={meetup.featuredImage}
            alt={meetup.title}
            className="w-full h-full object-cover object-[center_20%] opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#24262D]/80 via-[#24262D]/30 to-transparent" />

          <button
            onClick={dismiss}
            className="p3-icon-button p3-modal-close absolute top-4 right-4 z-20 p-2 rounded-none bg-[#24262D]/45 text-white hover:bg-[#24262D]/70 transition-colors backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              {meetup.edition && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F47B49] text-white">
                  {meetup.edition}
                </span>
              )}
              {getStatusBadge()}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
              {meetup.title}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p3-modal-body p-6 sm:p-8 overflow-y-auto space-y-6">

          {/* Key Logistical Metadata */}
          <div className="p3-modal-meta grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-none border border-[#24262D]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-[#FFFDF8] flex items-center justify-center text-[#24262D] border border-[#24262D]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5E5B55] font-semibold block">Date</span>
                <span className="text-sm font-medium text-[#24262D]">{meetup.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-[#FFFDF8] flex items-center justify-center text-[#24262D] border border-[#24262D]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5E5B55] font-semibold block">Time</span>
                <span className="text-sm font-medium text-[#24262D]">{meetup.time}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-3 pt-1 border-t border-[#FFFDF8]">
              <div className="w-9 h-9 rounded-none bg-[#FFFDF8] flex items-center justify-center text-[#F47B49] border border-[#24262D] shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#5E5B55] font-semibold block">Venue</span>
                <span className="text-sm font-medium text-[#24262D]">{meetup.venue}</span>
                {meetup.address && (
                  <p className="text-xs text-[#5E5B55] mt-0.5">{meetup.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#24262D] mb-2">
              About This Gathering
            </h3>
            <p className="text-sm text-[#5E5B55] leading-relaxed whitespace-pre-line">
              {meetup.description}
            </p>
          </div>

          {/* Meetup Activities Agenda */}
          {meetup.activities && meetup.activities.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#24262D] mb-3">
                Flow of the Gathering
              </h3>
              <div className="space-y-2">
                {meetup.activities.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#24262D] bg-[#FFFDF8] p-2.5 rounded-none border border-[#24262D]">
                    <CheckCircle className="w-4 h-4 text-[#24262D] shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights / What to bring */}
          {meetup.highlights && (
            <div className="bg-[#F7F3EB]/60 border border-[#24262D]/20 p-4 rounded-none flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#24262D] shrink-0 mt-0.5" />
              <div className="text-xs text-[#24262D]">
                <strong className="block font-semibold mb-0.5">Guidelines & What to Bring:</strong>
                <p className="leading-relaxed">{meetup.highlights}</p>
              </div>
            </div>
          )}

          {/* Event Photo Highlights */}
          {meetup.photos && meetup.photos.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#24262D] mb-3">
                Memories from this Meetup
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {meetup.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Meetup memory ${i + 1}`}
                    loading="lazy"
                    className="w-full h-24 sm:h-28 object-cover object-[center_20%] rounded-none border border-[#24262D]"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p3-modal-actions p-4 sm:p-6 bg-white border-t border-[#24262D] flex items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="p3-secondary-action flex items-center gap-1.5 px-3 py-2 rounded-none text-xs font-medium text-[#5E5B55] hover:bg-[#FFFDF8] transition-colors border border-[#24262D]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="p3-text-action px-4 py-2 rounded-none text-xs font-medium text-[#5E5B55] hover:bg-[#FFFDF8] transition-colors"
            >
              Close
            </button>

            {isMeetupUpcoming(meetup) && meetup.registrationStatus === 'open' && registrationUrl ? (
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p3-primary-action inline-flex items-center gap-2 bg-[#24262D] hover:bg-[#F47B49] text-white px-5 py-2.5 rounded-none text-xs font-semibold transition-all shadow-[var(--mh20-shadow-sm)]"
              >
                <span>Register now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : isMeetupUpcoming(meetup) && meetup.registrationStatus === 'open' ? (
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p3-primary-action inline-flex items-center gap-2 bg-[#24262D] hover:bg-[#F47B49] text-white px-5 py-2.5 rounded-none text-xs font-semibold transition-all shadow-[var(--mh20-shadow-sm)]"
              >
                <span>Ask on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="p3-status-chip px-4 py-2 text-xs font-medium text-[#5E5B55] bg-[#F7F3EB] rounded-none">
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
