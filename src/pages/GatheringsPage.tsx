import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export const GatheringsPage: React.FC = () => {
  const { meetups, setSelectedMeetup, t } = useApp();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const shouldReduceMotion = useReducedMotion();
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const upcomingMeetups = meetups.filter(m => m.isUpcoming);
  const pastMeetups = meetups.filter(m => !m.isUpcoming);

  const displayedMeetups = filter === 'all'
    ? meetups
    : filter === 'upcoming'
    ? upcomingMeetups
    : pastMeetups;

  return (
    <div className="pb-16 paper-grain overflow-hidden">

      {/* Full-bleed hero — roa-051 */}
      <section className="relative min-h-[52vh] sm:min-h-[60vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/enhanced/gallery/roa-051-2026-11-05.webp"
            alt="Readers of Aurangabad gathering"
            className="w-full h-full object-cover object-[center_20%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#20231F]/90 via-[#20231F]/30 to-[#20231F]/10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeCurve }}
          className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-6 sm:pb-10 space-y-3 sm:space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-dark border border-white/15 text-[#F2EBDD]/90 text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B89A65] animate-pulse" />
            Sunday Mornings in Aurangabad
          </span>

          <h1 className="font-serif font-bold text-[#F2EBDD] leading-[1.0]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
          >
            The Gatherings<br />Archive
          </h1>

          <p className="font-serif italic text-[#F2EBDD]/75 text-lg sm:text-xl max-w-2xl leading-relaxed">
            "A quiet sanctuary under open skies where strangers arrive with paperbacks and leave as friends."
          </p>

          {/* Filter Pills — moved into hero bottom */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(['all', 'upcoming', 'past'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
                  filter === f
                    ? 'bg-[#F2EBDD] text-[#20231F] border-[#F2EBDD]'
                    : 'glass-dark border-white/20 text-[#F2EBDD]/80 hover:text-[#F2EBDD]'
                }`}
              >
                {f === 'all' ? `All Gatherings (${meetups.length})`
                 : f === 'upcoming' ? `Upcoming (${upcomingMeetups.length})`
                 : `Past Archive (${pastMeetups.length})`}
              </button>
            ))}
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B89A65]/30 to-transparent" />
      </section>

      <div className="space-y-8 sm:space-y-10">

      {/* 2. THE MEETUP EXPERIENCE EXPLANATION (Required by prompt) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="paper-card p-8 sm:p-12 rounded-3xl bg-white border border-[#E8E2D5]">
          <div className="max-w-3xl space-y-4 mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block">
              What to Expect
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
              {t.gatherings.experienceHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
              Never been to a silent reading meetup before? Here is how our typical two hours unfold:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#455240]">01</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Silent Reading Session</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                60 minutes of undistracted, deep immersion in your own book. Phones silenced, nature breathing around us.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#8D5B4C]">02</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Book Discussions & Reflections</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Voluntary sharing: tell the circle what you read, what struck you, or a passage that challenged your perspective.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#455240]">03</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Reader Recommendations</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Discover titles across English, Marathi, Urdu, and Hindi literature that you won't find on algorithm feeds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#8D5B4C]">04</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Chai & Creative Storytelling</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Informal conversations, poetry recitation, and community camaraderie over warm chai or local snacks.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MEETUP ARCHIVE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {displayedMeetups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedMeetups.map((meetup) => (
              <div
                key={meetup.id}
                className="paper-card rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-[#1C1B1A]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-4 left-4 flex gap-2">
                      {meetup.edition && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#1C1B1A] text-white">
                          {meetup.edition}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        meetup.isUpcoming
                          ? 'bg-[#EBF0E9] text-[#2E372B] border border-[#455240]/20'
                          : 'bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]'
                      }`}>
                        {meetup.isUpcoming ? 'Upcoming Event' : 'Archived Chapter'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors leading-snug">
                      {meetup.title}
                    </h3>

                    <p className="text-sm text-[#595550] line-clamp-3 leading-relaxed">
                      {meetup.description}
                    </p>

                    <div className="pt-2 space-y-2 text-xs text-[#8C857B] border-t border-[#F4EFEA]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#455240]" />
                        <span className="font-medium text-[#1C1B1A]">{meetup.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#455240]" />
                        <span>{meetup.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#8D5B4C]" />
                        <span className="truncate">{meetup.venue}</span>
                      </div>
                    </div>

                    {/* Activities List */}
                    {meetup.activities && meetup.activities.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {meetup.activities.slice(0, 2).map((act, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]">
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-[#F4EFEA]">
                  <button
                    onClick={() => setSelectedMeetup(meetup)}
                    className="text-xs font-semibold text-[#595550] hover:text-[#1C1B1A] transition-colors"
                  >
                    View Details & Photos
                  </button>

                  {meetup.isUpcoming && meetup.registrationStatus === 'open' ? (
                    <a
                      href={meetup.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#1C1B1A] hover:bg-[#455240] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <span>RSVP via Form</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedMeetup(meetup)}
                      className="text-xs font-semibold text-[#8D5B4C] hover:underline"
                    >
                      Browse Chapter Archive →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">No events in this category</h3>
            <p className="text-sm text-[#595550]">
              {t.gatherings.emptyUpcoming}
            </p>
          </div>
        )}

      </section>

      </div>
    </div>
  );
};
