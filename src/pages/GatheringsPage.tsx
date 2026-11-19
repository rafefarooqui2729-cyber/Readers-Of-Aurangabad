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
  BookOpen,
  Coffee,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, FilterButton, PageHero, PaperPanel, SectionHeading } from '../components/ui';
import { isMeetupUpcoming } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';

export const GatheringsPage: React.FC = () => {
  const { meetups, setSelectedMeetup, t } = useApp();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const shouldReduceMotion = useReducedMotion();

  // Upcoming status is derived from each meetup's actual start time so a stale
  // stored flag can never surface a past event as upcoming.
  const upcomingMeetups = meetups.filter((m) => isMeetupUpcoming(m));
  const pastMeetups = meetups.filter((m) => !isMeetupUpcoming(m));
  const displayedMeetups =
    filter === 'all' ? meetups : filter === 'upcoming' ? upcomingMeetups : pastMeetups;

  const itinerary = [
    {
      icon: BookOpen,
      title: 'Silent Reading Session',
      text: '60 minutes of undistracted, deep immersion in your own book. Phones silenced, nature breathing around us.',
    },
    {
      icon: MessageCircle,
      title: 'Book Discussions & Reflections',
      text: 'Voluntary sharing: tell the circle what you read, what struck you, or a passage that challenged your perspective.',
    },
    {
      icon: Sparkles,
      title: 'Reader Recommendations',
      text: "Discover titles across English, Marathi, Urdu, and Hindi literature that you won't find on algorithm feeds.",
    },
    {
      icon: Coffee,
      title: 'Chai & Creative Storytelling',
      text: 'Informal conversations, poetry recitation, and community camaraderie over warm chai or local snacks.',
    },
  ];

  const principles = [
    { icon: Calendar, num: '01', title: t.gatherings.philosophyP1Title, desc: t.gatherings.philosophyP1Desc },
    { icon: Sparkles, num: '02', title: t.gatherings.philosophyP2Title, desc: t.gatherings.philosophyP2Desc },
    { icon: MessageCircle, num: '03', title: t.gatherings.philosophyP3Title, desc: t.gatherings.philosophyP3Desc },
    { icon: ShieldCheck, num: '04', title: t.gatherings.philosophyP4Title, desc: t.gatherings.philosophyP4Desc },
  ];

  return (
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-051-2026-11-05.webp"
        alt="Readers of Aurangabad gathering outdoors"
        eyebrow="Sunday mornings in Aurangabad"
        title="The Gatherings Archive"
        lead="A quiet sanctuary under open skies where strangers arrive with paperbacks and leave as friends."
      >
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter gatherings"
        >
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All gatherings ({meetups.length})
          </FilterButton>
          <FilterButton active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
            Upcoming ({upcomingMeetups.length})
          </FilterButton>
          <FilterButton active={filter === 'past'} onClick={() => setFilter('past')}>
            Past archive ({pastMeetups.length})
          </FilterButton>
        </motion.div>
      </PageHero>

      <div className="space-y-12 sm:space-y-16">
        {/* What to expect */}
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
          <PaperPanel className="rounded-[6px] p-6 sm:p-10">
            <SectionHeading
              eyebrow="What to expect"
              title={t.gatherings.experienceHeading}
              description="Never been to a silent reading meetup before? Here is how our typical two hours unfold."
            />
            <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {itinerary.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="border border-[#1B2A49]/10 bg-[#F4ECDD] p-5 dark:border-[#F4ECDD]/10 dark:bg-[#1B2A49]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center border border-[#5E7A63]/30 text-[#5E7A63] dark:text-[#8BA890]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-xl font-bold text-[#5E7A63]/40 dark:text-[#8BA890]/40">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
                      {step.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </PaperPanel>
        </section>

        {/* Philosophy */}
        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-[6px] p-6 sm:p-10">
            <SectionHeading
              eyebrow={t.gatherings.philosophyEyebrow}
              title={t.gatherings.philosophyHeading}
              description={t.gatherings.philosophyIntro}
            />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article
                    key={principle.num}
                    className="border border-[#1B2A49]/10 bg-[#F4ECDD] p-6 dark:border-[#F4ECDD]/10 dark:bg-[#1B2A49]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-10 w-10 items-center justify-center border border-[#A8431F]/30 text-[#A8431F]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-3xl font-bold text-[#A8431F]/25" aria-hidden="true">
                        {principle.num}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                      {principle.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
                      {principle.desc}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 border-l-4 border-[#E8B04A] bg-[#1B2A49] px-6 py-8 sm:px-10">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">
                {t.gatherings.coreBeliefLabel}
              </p>
              <blockquote className="mt-3 font-serif text-xl italic leading-relaxed text-[#F4ECDD] sm:text-2xl">
                &ldquo;{t.gatherings.coreBeliefQuote}&rdquo;
              </blockquote>
            </div>
          </PaperPanel>
        </section>

        {/* Archive */}
        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionHeading eyebrow="Chapter by chapter" title="The meeting archive" />
          {displayedMeetups.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedMeetups.map((meetup) => (
                <article
                  key={meetup.id}
                  className="flex h-full flex-col border border-[#1B2A49]/15 bg-[#FFF8EA] dark:border-[#F4ECDD]/15 dark:bg-[#243557]"
                >
                  <div className="relative h-52 overflow-hidden bg-[#1B2A49]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-[center_25%]"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {meetup.edition ? (
                        <span className="border border-[#F4ECDD]/40 bg-[#1B2A49] px-2.5 py-1 text-[11px] font-bold text-[#F4ECDD]">
                          {meetup.edition}
                        </span>
                      ) : null}
                      <span className="border border-[#F4ECDD]/40 bg-[#1B2A49]/85 px-2.5 py-1 text-[11px] font-bold text-[#F4ECDD]">
                        {meetup.registrationStatus === 'cancelled'
                          ? 'Cancelled'
                          : isMeetupUpcoming(meetup)
                          ? 'Upcoming'
                          : 'Archived chapter'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl font-bold leading-snug text-[#1B2A49] dark:text-[#F4ECDD]">
                      {meetup.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
                      {meetup.description}
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-[#1B2A49]/10 pt-4 font-sans text-xs text-[#4B5A77] dark:border-[#F4ECDD]/10 dark:text-[#D1C5B0]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#5E7A63]" aria-hidden="true" />
                        <dt className="sr-only">Date</dt>
                        <dd className="font-bold text-[#1B2A49] dark:text-[#F4ECDD]">{meetup.date}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#5E7A63]" aria-hidden="true" />
                        <dt className="sr-only">Time</dt>
                        <dd>{meetup.time}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#A8431F]" aria-hidden="true" />
                        <dt className="sr-only">Venue</dt>
                        <dd className="truncate">{meetup.venue}</dd>
                      </div>
                    </dl>
                    {meetup.activities && meetup.activities.length > 0 ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {meetup.activities.slice(0, 2).map((activity) => (
                          <li
                            key={activity}
                            className="border border-[#1B2A49]/15 bg-[#F4ECDD] px-2 py-1 text-[10px] font-semibold text-[#4B5A77] dark:border-[#F4ECDD]/15 dark:bg-[#1B2A49] dark:text-[#D1C5B0]"
                          >
                            {activity}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1B2A49]/10 pt-5 dark:border-[#F4ECDD]/10">
                      <button
                        type="button"
                        onClick={() => setSelectedMeetup(meetup)}
                        className="min-h-[44px] font-sans text-xs font-bold text-[#1B2A49] underline underline-offset-4 hover:text-[#A8431F] dark:text-[#F4ECDD] dark:hover:text-[#E8B04A]"
                      >
                        View details &amp; photos
                      </button>
                      {isMeetupUpcoming(meetup) && meetup.registrationStatus === 'open' && getSafeRegistrationUrl(meetup) ? (
                        <Button
                          asAnchor
                          href={getSafeRegistrationUrl(meetup)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-xs"
                        >
                          RSVP via form
                          <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedMeetup(meetup)}
                          className="min-h-[44px] font-sans text-xs font-bold text-[#A8431F] hover:underline"
                        >
                          {isMeetupUpcoming(meetup) ? 'View gathering details →' : 'Browse chapter archive →'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <PaperPanel className="mx-auto mt-8 max-w-xl p-10 text-center">
              <h3 className="font-display text-2xl font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                No events in this category
              </h3>
              <p className="mt-3 font-sans text-sm text-[#4B5A77] dark:text-[#D1C5B0]">
                {t.gatherings.emptyUpcoming}
              </p>
            </PaperPanel>
          )}
        </section>
      </div>
    </div>
  );
};
