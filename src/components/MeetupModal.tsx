import React from 'react';
import type { Meetup } from '../types';
import { X, Calendar, Clock, MapPin, ExternalLink, CheckCircle, AlertCircle, Share2 } from 'lucide-react';

interface MeetupModalProps {
  meetup: Meetup | null;
  onClose: () => void;
}

export const MeetupModal: React.FC<MeetupModalProps> = ({ meetup, onClose }) => {
  if (!meetup) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: meetup.title,
        text: `Join Readers of Aurangabad for ${meetup.title} on ${meetup.date}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${meetup.title} - Readers of Aurangabad\nDate: ${meetup.date}\nRegistration: ${meetup.registrationUrl}`);
      alert('Event details copied to clipboard!');
    }
  };

  const getStatusBadge = () => {
    switch (meetup.registrationStatus) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF0E9] text-[#2E372B] border border-[#455240]/20">
            <span className="w-2 h-2 rounded-full bg-[#455240] animate-pulse"></span>
            Registrations Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Registration Closed
          </span>
        );
      case 'announced':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Announced
          </span>
        );
      case 'past':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]">
            Past Gathering Archive
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-60 w-full overflow-hidden bg-[#1C1B1A]">
          <img
            src={meetup.featuredImage}
            alt={meetup.title}
            className="w-full h-full object-cover object-[center_20%] opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B1A]/80 via-[#1C1B1A]/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              {meetup.edition && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#8D5B4C] text-white">
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
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Key Logistical Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-[#E8E2D5]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#455240] border border-[#E8E2D5]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C857B] font-semibold block">Date</span>
                <span className="text-sm font-medium text-[#1C1B1A]">{meetup.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#455240] border border-[#E8E2D5]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C857B] font-semibold block">Time</span>
                <span className="text-sm font-medium text-[#1C1B1A]">{meetup.time}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-3 pt-1 border-t border-[#F4EFEA]">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#8D5B4C] border border-[#E8E2D5] shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C857B] font-semibold block">Venue</span>
                <span className="text-sm font-medium text-[#1C1B1A]">{meetup.venue}</span>
                {meetup.address && (
                  <p className="text-xs text-[#595550] mt-0.5">{meetup.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1C1B1A] mb-2">
              About This Gathering
            </h3>
            <p className="text-sm text-[#595550] leading-relaxed whitespace-pre-line">
              {meetup.description}
            </p>
          </div>

          {/* Meetup Activities Agenda */}
          {meetup.activities && meetup.activities.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1C1B1A] mb-3">
                Flow of the Gathering
              </h3>
              <div className="space-y-2">
                {meetup.activities.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#1C1B1A] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E8E2D5]">
                    <CheckCircle className="w-4 h-4 text-[#455240] shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights / What to bring */}
          {meetup.highlights && (
            <div className="bg-[#EBF0E9]/60 border border-[#455240]/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#455240] shrink-0 mt-0.5" />
              <div className="text-xs text-[#2E372B]">
                <strong className="block font-semibold mb-0.5">Guidelines & What to Bring:</strong>
                <p className="leading-relaxed">{meetup.highlights}</p>
              </div>
            </div>
          )}

          {/* Event Photo Highlights */}
          {meetup.photos && meetup.photos.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1C1B1A] mb-3">
                Memories from this Meetup
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {meetup.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Meetup memory ${i + 1}`}
                    className="w-full h-24 sm:h-28 object-cover object-[center_20%] rounded-lg border border-[#E8E2D5]"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#E8E2D5] flex items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#595550] hover:bg-[#FAF8F5] transition-colors border border-[#E8E2D5]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#595550] hover:bg-[#FAF8F5] transition-colors"
            >
              Close
            </button>

            {meetup.registrationStatus === 'open' ? (
              <a
                href={meetup.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1C1B1A] hover:bg-[#455240] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <span>Register via Google Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="px-4 py-2 text-xs font-medium text-[#8C857B] bg-gray-100 rounded-xl">
                {meetup.registrationStatus === 'past' ? 'Past Event' : 'Registrations Closed'}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
