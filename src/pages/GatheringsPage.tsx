import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  MessageCircle,
  ShieldCheck,
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
    <div className="p2-page p2-gatherings pb-16 paper-grain overflow-hidden">

      {/* Full-bleed hero — roa-051 */}
      <section className="p2-hero p2-hero--gatherings relative min-h-[52vh] sm:min-h-[60vh] flex flex-col justify-end overflow-hidden">
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
          className="p2-hero-copy relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-6 sm:pb-10 space-y-3 sm:space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-dark border border-white/15 text-[#F2EBDD]/90 text-xs font-semibold tracking-wide">
            <span className={`w-1.5 h-1.5 rounded-full bg-[#B89A65] ${shouldReduceMotion ? '' : 'animate-pulse'}`} />
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
          <div className="p2-gathering-filters flex flex-wrap gap-2 pt-2">
            {(['all', 'upcoming', 'past'] as const).map((f) => (
              <button
                key={f}
                data-active={filter === f}
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
      <section className="p2-experience max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p2-experience-card paper-card p-8 sm:p-12 rounded-3xl bg-white border border-[#E8E2D5]">
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

          <div className="p2-itinerary grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

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

      {/* 3. OUR MEETUP PHILOSOPHY */}
      <section className="p2-philosophy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p2-philosophy-card paper-card p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D5] space-y-8">
          <div className="p2-philosophy-heading max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block">
              {t.gatherings.philosophyEyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
              {t.gatherings.philosophyHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
              {t.gatherings.philosophyIntro}
            </p>
          </div>

          <div className="p2-principles grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Calendar className="w-5 h-5" />,
                num: '01',
                title: t.gatherings.philosophyP1Title,
                desc: t.gatherings.philosophyP1Desc,
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                num: '02',
                title: t.gatherings.philosophyP2Title,
                desc: t.gatherings.philosophyP2Desc,
              },
              {
                icon: <MessageCircle className="w-5 h-5" />,
                num: '03',
                title: t.gatherings.philosophyP3Title,
                desc: t.gatherings.philosophyP3Desc,
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                num: '04',
                title: t.gatherings.philosophyP4Title,
                desc: t.gatherings.philosophyP4Desc,
              },
            ].map((principle) => (
              <div
                key={principle.num}
                className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-xl bg-[#455240]/10 text-[#455240] flex items-center justify-center"
                  >
                    {principle.icon}
                  </div>
                  <span
                    aria-hidden="true"
                    className="font-serif font-bold text-4xl leading-none text-[#455240]/15 select-none"
                  >
                    {principle.num}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">
                  {principle.title}
                </h3>
                <p className="text-sm text-[#595550] leading-relaxed">
                  {principle.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p2-core-belief relative overflow-hidden rounded-2xl bg-[#20231F] px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[#8D5B4C]/25 blur-[80px] pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B89A65] block">
                {t.gatherings.coreBeliefLabel}
              </span>
              <blockquote className="font-serif italic text-xl sm:text-2xl text-[#F2EBDD] leading-relaxed">
                <p>"{t.gatherings.coreBeliefQuote}"</p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEETUP ARCHIVE GRID */}
      <section className="p2-meetups max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {displayedMeetups.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={{ hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 } } }}
            className="p2-meetup-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {displayedMeetups.map((meetup) => (
              <motion.div
                key={meetup.id}
                variants={{ hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeCurve } } }}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                className="p2-meetup-card paper-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-shadow"
              >
                <div>
                  <div className="p2-meetup-image relative h-52 sm:h-56 overflow-hidden bg-[#1C1B1A]">
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
                        meetup.registrationStatus === 'cancelled'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : meetup.isUpcoming
                          ? 'bg-[#EBF0E9] text-[#2E372B] border border-[#455240]/20'
                          : 'bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]'
                      }`}>
                        {meetup.registrationStatus === 'cancelled'
                          ? 'Cancelled'
                          : meetup.isUpcoming
                          ? 'Upcoming Event'
                          : 'Archived Chapter'}
                      </span>
                    </div>
                  </div>

                  <div className="p2-meetup-info p-5 space-y-4">
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

                <div className="p2-meetup-actions p-6 pt-0 flex items-center justify-between gap-3 border-t border-[#F4EFEA]">
                  <button
                    onClick={() => setSelectedMeetup(meetup)}
                    className="p4-touch-target text-xs font-semibold text-[#595550] hover:text-[#1C1B1A] transition-colors"
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
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="p2-empty-state bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
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
