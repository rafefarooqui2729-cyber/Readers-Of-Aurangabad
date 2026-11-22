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
import { Button, FilterButton, PageHero, SectionHeading } from '../components/ui';
import { isMeetupUpcoming } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';
import { siteConfig } from '../content/siteConfig';

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
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-051-2026-11-05.webp"
        alt="Readers of Aurangabad gathering outdoors"
        eyebrow="Gatherings in Aurangabad"
        title="The Gatherings Archive"
        titleSize="compact"
        lead="Real reading meetups across Aurangabad. Bring a book, find your people, and be part of the circle."
      >
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rr-filter-row !pb-0"
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

      {/* Readers group — a narrow ruled notice, not a promotional card. */}
      <section id="readers-group" className="rr-section rr-section--tight scroll-mt-24">
        <div className="rr-container">
          <div className="rr-panel rr-panel--forest flex flex-col gap-8 p-8 sm:p-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="rr-eyebrow rr-eyebrow--light">Stay connected</p>
              <h2 className="rr-title rr-title--compact mt-4">Join the Readers Group</h2>
              <p className="rr-cta-band__copy mt-4">
                Our WhatsApp group is where we share monthly gathering announcements, venue details,
                and book conversation between meetups.
              </p>
            </div>
            <Button
              asAnchor
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline-marigold"
              className="shrink-0"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Join Readers Group on WhatsApp
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* What to expect — the two hours, set out as a numbered programme. */}
      <section className="rr-section rr-section--line" aria-label={t.gatherings.experienceHeading}>
        <div className="rr-container">
          <SectionHeading
            eyebrow="What to expect"
            title={t.gatherings.experienceHeading}
            description="Never been to a silent reading meetup before? Here is how our typical two hours unfold."
          />
          <ol className="mt-10 grid gap-px border border-[color:var(--rr-border)] bg-[color:var(--rr-border)] sm:grid-cols-2 lg:grid-cols-4">
            {itinerary.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex flex-col bg-[color:var(--rr-paper)] p-7">
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                    <span className="font-display text-2xl leading-none text-[color:var(--rr-brass)]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="rr-title rr-title--small mt-8">{step.title}</h3>
                  <p className="rr-body mt-3 text-sm">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Philosophy — long-form principles and a single forest-coloured pull quote. */}
      <section className="rr-section rr-section--line" aria-label={t.gatherings.philosophyHeading}>
        <div className="rr-container">
          <SectionHeading
            eyebrow={t.gatherings.philosophyEyebrow}
            title={t.gatherings.philosophyHeading}
            description={t.gatherings.philosophyIntro}
          />
          <div className="mt-10 grid gap-x-12 gap-y-2 md:grid-cols-2">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article
                  key={principle.num}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-5 border-t border-[color:var(--rr-border)] py-7"
                >
                  <span className="rr-meta pt-1 text-[color:var(--rr-brass)]">{principle.num}</span>
                  <div>
                    <Icon className="h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                    <h3 className="rr-title rr-title--small mt-4">{principle.title}</h3>
                    <p className="rr-body mt-2 text-sm">{principle.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <blockquote className="rr-panel rr-panel--forest mt-10 flex flex-col gap-4 p-8 sm:p-10 md:flex-row md:items-center md:gap-10">
            <p className="rr-meta shrink-0 text-[color:var(--rr-brass)]">{t.gatherings.coreBeliefLabel}</p>
            <p className="rr-quote text-[color:var(--rr-on-dark)]">&ldquo;{t.gatherings.coreBeliefQuote}&rdquo;</p>
          </blockquote>
        </div>
      </section>

      {/* Archive — a chapter ledger, with one photographic lead entry. */}
      <section className="rr-section rr-section--line" aria-label="The meeting archive">
        <div className="rr-container">
          <SectionHeading eyebrow="Chapter by chapter" title="The meeting archive" size="compact" />
          {displayedMeetups.length > 0 ? (
            <div className="rr-event-list mt-10">
              {displayedMeetups.map((meetup) => {
                const status = isMeetupUpcoming(meetup);
                const registrationUrl = getSafeRegistrationUrl(meetup);
                const canRegister = status && meetup.registrationStatus === 'open' && registrationUrl;
                return (
                  <article key={meetup.id} className="rr-event-row">
                    <div className="rr-event-date">
                      {meetup.date}
                      <span>{meetup.edition || (status ? 'Upcoming' : 'Archive')}</span>
                    </div>
                    <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start">
                      <div className="min-w-0">
                        <h3 className="rr-event-title">{meetup.title}</h3>
                        <div className="rr-event-meta">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {meetup.date}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {meetup.time}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {meetup.venue}
                          </span>
                        </div>
                        <p className="rr-body mt-4 max-w-[62ch] text-sm">{meetup.description}</p>
                        <p className="rr-meta mt-4 text-[color:var(--rr-terracotta)]">
                          {meetup.registrationStatus === 'cancelled'
                            ? 'Cancelled'
                            : status
                            ? 'Upcoming'
                            : 'Archived chapter'}
                        </p>
                      </div>
                      <div className="rr-image aspect-[4/3]">
                        <img
                          src={meetup.featuredImage}
                          alt={meetup.title}
                          loading="lazy"
                          decoding="async"
                          className="object-[center_25%]"
                        />
                      </div>
                    </div>
                    <div className="rr-event-actions">
                      <button type="button" className="rr-link" onClick={() => setSelectedMeetup(meetup)}>
                        View details &amp; photos
                      </button>
                      {canRegister ? (
                        <Button
                          asAnchor
                          href={registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-xs"
                        >
                          RSVP via form
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      ) : (
                        <button
                          type="button"
                          className="rr-link"
                          onClick={() => setSelectedMeetup(meetup)}
                        >
                          {status ? 'View gathering details →' : 'Browse chapter archive →'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rr-empty mt-10">
              <h3 className="rr-title rr-title--small">No events in this category</h3>
              <p className="rr-lede mt-3">{t.gatherings.emptyUpcoming}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
