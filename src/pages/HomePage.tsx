import React, { useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Compass,
  Coffee,
  Users,
  Feather,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FeaturedAnnouncementReel } from '../components/FeaturedAnnouncementReel';
import { ReelCollectionSection } from '../components/ReelCollectionSection';
import { CommunityGallery } from '../components/CommunityGallery';
import { UpcomingEventSpotlight } from '../components/UpcomingEventSpotlight';
import { JoinSection } from '../components/JoinSection';
import { StatBlock } from '../components/ui/StatBlock';
import { QuoteCard } from '../components/ui/QuoteCard';
import { BentoCard, EditorialSectionHeading, Stamp } from '../components/ui';
import { FeaturedBookCard } from '../components/FeaturedBookCard';
import { readingList } from '../content/books';
import { scrollToTop } from '../utils/scroll';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';
import {
  findActiveAnnouncementById,
  getAnnouncementNavigationId,
  scrollToAnnouncement,
} from '../utils/announcementNavigation';
import { communityStats } from '../content/stats';
import { memberVoices } from '../content/testimonials';
import { siteConfig } from '../content/siteConfig';
import { isMeetupUpcoming, getMeetupStartMs } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';
import { teamMembers } from '../content/team';

export const HomePage: React.FC = () => {
  const {
    t,
    setCurrentPage,
    meetups,
    articles,
    announcements,
    setSelectedArticle,
    setSelectedMeetup,
    announcementNavigationId,
    clearAnnouncementNavigation,
    dbLoading,
    isPageLoading,
  } = useApp();

  const shouldReduceMotion = useReducedMotion();
  const [fullAnnouncementId, setFullAnnouncementId] = React.useState<string | null>(null);
  const [announcementsNow] = React.useState(() => Date.now());
  const upcomingMeetups = useMemo(() => {
    return meetups
      .filter(m => isMeetupUpcoming(m))
      .sort((a, b) => getMeetupStartMs(a) - getMeetupStartMs(b));
  }, [meetups]);
  const nearestUpcomingMeetup = upcomingMeetups[0] || null;
  const latestAnnouncement = useMemo(() => {
    return [...announcements]
      .filter(a => a.isPublished && (!a.expiresAt || new Date(a.expiresAt).getTime() >= announcementsNow))
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())[0] || null;
  }, [announcements, announcementsNow]);
  const announcementTargetId = announcementNavigationId || (
    typeof window === 'undefined' ? null : getAnnouncementNavigationId(window.location.search)
  );
  const announcementToShow = (
    announcementTargetId
      ? findActiveAnnouncementById(announcements, announcementTargetId, announcementsNow)
      : null
  ) || latestAnnouncement;

  const fullAnnouncement = fullAnnouncementId
    ? announcements.find((announcement) => announcement.id === fullAnnouncementId) || null
    : null;
  const fullAnnouncementSurfaceRef = useRef<HTMLDivElement>(null);
  const dismissFullAnnouncement = useModalEscapeDismiss(
    Boolean(fullAnnouncement),
    () => setFullAnnouncementId(null),
    fullAnnouncementSurfaceRef
  );

  React.useEffect(() => {
    if (!announcementNavigationId || dbLoading || isPageLoading) return;

    const target = findActiveAnnouncementById(
      announcements,
      announcementNavigationId,
      announcementsNow
    );
    if (!target) {
      clearAnnouncementNavigation(announcementNavigationId);
      return;
    }

    let frameId = 0;
    let attempts = 0;
    const scrollWhenReady = () => {
      if (scrollToAnnouncement(target.id, Boolean(shouldReduceMotion))) {
        clearAnnouncementNavigation(target.id);
        return;
      }

      attempts += 1;
      if (attempts >= 120) {
        clearAnnouncementNavigation(target.id);
        return;
      }
      frameId = window.requestAnimationFrame(scrollWhenReady);
    };

    frameId = window.requestAnimationFrame(scrollWhenReady);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    announcementNavigationId,
    announcements,
    announcementsNow,
    clearAnnouncementNavigation,
    dbLoading,
    isPageLoading,
    shouldReduceMotion,
  ]);
  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const recentArticles = articles.slice(0, 3);

  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeCurve } },
  };

  return (
    <div className="paper-grain overflow-hidden bg-[#F7F3EB] text-[#24262D]">

      {/* 1. EDITORIAL HERO — real community photograph on a warm-paper spread */}
      <section className="ed-section pb-8 pt-5 sm:pt-8" aria-label="Readers of Aurangabad community hero">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="ed-hero"
        >
          <motion.div variants={staggerItem}>
            <BentoCard surface="paper" tape className="h-full">
              <div className="flex min-h-full flex-col justify-between gap-10">
                <div>
                  <p className="ed-kicker">MH20 · Aurangabad</p>
                  <h1 className="mt-4 font-display text-[clamp(2.6rem,6.2vw,5.1rem)] leading-[0.94] tracking-[-0.04em] text-[#24262D]">
                    Readers of<br />
                    <span className="text-[#F47B49]">Aurangabad</span>
                  </h1>
                  <p className="mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-[#5E5B55] sm:text-xl">
                    {t.hero.headline}
                  </p>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5E5B55] sm:text-base">
                    {t.hero.supporting}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    onClick={() => { setCurrentPage('get-involved'); scrollToTop(); }}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded bg-[#F47B49] px-5 py-2.5 font-sans text-sm font-semibold text-white shadow-[var(--mh20-shadow-sm)] transition-colors hover:bg-[#DE6638] cursor-pointer"
                  >
                    <span>{t.hero.ctaPrimary}</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    onClick={() => { setCurrentPage('story'); scrollToTop(); }}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded border border-[#24262D]/25 bg-[#FFFDF8] px-5 py-2.5 font-sans text-sm font-semibold text-[#24262D] transition-colors hover:border-[#F47B49] hover:bg-[#FFD8C1] cursor-pointer"
                  >
                    {t.hero.ctaSecondary}
                  </motion.button>
                  <span className="ml-auto hidden font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E5B55] sm:block">
                    Est. {siteConfig.establishedYear}
                  </span>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          <motion.div variants={staggerItem} className="ed-hero__media">
            <picture className="absolute inset-0 block h-full w-full">
              <source media="(max-width: 640px)" srcSet="/images/enhanced/mobile/roa-hero-mobile.webp" />
              <source media="(min-width: 1441px)" srcSet="/images/enhanced/hero/roa-hero-4k-master.webp" />
              <source media="(min-width: 641px)" srcSet="/images/enhanced/hero/roa-group-hero-clean.webp" />
              <img
                src="/images/enhanced/hero/roa-group-hero-clean.webp"
                alt="Readers of Aurangabad community gathered outdoors"
                className="h-full w-full object-cover object-[48%_50%] sm:object-[50%_50%] lg:object-[50%_48%]"
                width={2560}
                height={1260}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-[#24262D]/55 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div className="rounded bg-[#F7F3EB]/95 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#24262D] shadow-[var(--mh20-shadow-sm)]">
                Community album · MH20
              </div>
              <Stamp year={siteConfig.establishedYear} size="sm" className="hidden sm:inline-flex" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 1b. PROOF STRIP — community figures kept exactly as recorded */}
      <section className="ed-section pb-4" aria-label="Community statistics">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="ed-grid sm:grid-cols-2"
        >
          {communityStats.map((stat, index) => (
            <motion.div key={stat.id} variants={staggerItem}>
              <BentoCard surface={index === 0 ? 'mint' : 'peach'} label="From our records">
                <StatBlock value={stat.value} suffix={stat.suffix} label={stat.label} />
              </BentoCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 2. EDITORIAL SPREAD — the movement in its own words */}
      <section className="ed-section py-8 sm:py-10" aria-label="The Aurangabad Reading Movement">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px', amount: 0.2 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.75, ease: easeCurve }}
          className="ed-grid ed-grid--bento"
        >
          <BentoCard surface="paper" label="The Aurangabad Reading Movement" className="ed-span-3">
            <h2 className="ed-title max-w-none">{t.intro.heading}</h2>
            <p className="ed-lede mt-4">{t.intro.subheading}</p>
            <span className="mt-6 block h-px w-full bg-[#24262D]/12" aria-hidden="true" />
            <motion.blockquote
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, delay: shouldReduceMotion ? 0 : 0.1, ease: easeCurve }}
              className="mt-6 font-serif text-lg italic leading-relaxed text-[#24262D] sm:text-xl"
            >
              “{t.intro.body}”
            </motion.blockquote>
          </BentoCard>

          <div className="ed-span-3 overflow-hidden rounded-lg border border-[#24262D]/12 bg-[#CFE3FA] shadow-[var(--mh20-shadow-sm)]">
            <img
              src="/images/enhanced/community/community-banner-wide.webp"
              alt="Readers of Aurangabad gathered together"
              loading="lazy"
              className="h-full min-h-[260px] w-full object-cover object-center"
            />
          </div>
        </motion.div>
      </section>

      {/* 2b. READING DESK — real recommendations already in the repository */}
      <section className="ed-section py-8 sm:py-10" aria-label="From the reading desk">
        <EditorialSectionHeading
          eyebrow="From the reading desk"
          title="Books moving through the circle."
          description="Recommendations and reading notes shared by readers in Aurangabad."
        />
        <div className="ed-grid ed-grid--bento mt-8">
          <FeaturedBookCard className="ed-span-4" />
          <BentoCard surface="mint" label="Also on the reading list" className="ed-span-2">
            <div className="space-y-4">
              {readingList.map((book) => (
                <div key={book.id} className="flex gap-3 border-b border-[#24262D]/12 pb-4 last:border-0 last:pb-0">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#F47B49]" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-base font-semibold leading-snug text-[#24262D]">{book.title}</h3>
                    <p className="mt-0.5 text-xs text-[#5E5B55]">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </section>

      {/* ---
          4. FEATURED ANNOUNCEMENT REEL
          --- */}
      {/* Upcoming event countdown + latest announcement */}
      <section className="ed-section relative py-6 sm:py-8">
        <UpcomingEventSpotlight
          key={nearestUpcomingMeetup?.id ?? nearestUpcomingMeetup?.startsAt ?? 'no-upcoming-meetup'}
          meetup={nearestUpcomingMeetup}
          announcement={announcementToShow}
          onViewEvent={(meetup) => setSelectedMeetup(meetup)}
          onViewAnnouncement={() => {
            if (announcementToShow) setFullAnnouncementId(announcementToShow.id);
          }}
          onViewGatherings={() => {
            setCurrentPage('gatherings');
            scrollToTop();
          }}
        />
      </section>

      <div className="ed-section pb-8">
        <FeaturedAnnouncementReel />
      </div>

      {/* ---
          5. REEL COLLECTION
          --- */}
      <div className="ed-section pb-8">
        <ReelCollectionSection />
      </div>

      {/* ---
          6. OUR PHILOSOPHY — pastel bento notes
          --- */}
      <section className="ed-section py-10 sm:py-12" aria-label={t.philosophy.heading}>
        <EditorialSectionHeading
          eyebrow="Why we gather"
          title={t.philosophy.heading}
          description={t.philosophy.subheading}
          action={
            <p className="rounded border border-[#24262D]/15 bg-[#FFD8C1] px-4 py-2 font-serif text-sm italic text-[#24262D]">
              No boundaries of RELIGION | LANGUAGES | AGES
            </p>
          }
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="ed-grid ed-grid--bento mt-8"
        >
          {[
            { icon: <Users className="h-5 w-5" />, title: t.philosophy.p1Title, desc: t.philosophy.p1Desc, num: '01', label: 'Shared Experience', surface: 'lavender' as const },
            { icon: <Compass className="h-5 w-5" />, title: t.philosophy.p2Title, desc: t.philosophy.p2Desc, num: '02', label: 'Open Intellect', surface: 'peach' as const },
            { icon: <Feather className="h-5 w-5" />, title: t.philosophy.p3Title, desc: t.philosophy.p3Desc, num: '03', label: 'Empathy & Voice', surface: 'mint' as const },
            { icon: <Coffee className="h-5 w-5" />, title: t.philosophy.p4Title, desc: t.philosophy.p4Desc, num: '04', label: 'Real Bonds', surface: 'blue' as const },
          ].map((card) => (
            <motion.div key={card.num} variants={staggerItem} className="ed-span-3">
              <BentoCard surface={card.surface} label={`${card.num} · ${card.label}`}>
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded border border-[#24262D]/20 bg-[#FFFDF8]/70 text-[#F47B49]">
                  {card.icon}
                </span>
                <h3 className="ed-card__title">{card.title}</h3>
                <p className="ed-card__body mt-3">{card.desc}</p>
              </BentoCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---
          7. UPCOMING GATHERINGS
          --- */}
      <section className="ed-section py-10 sm:py-12" aria-label={t.gatherings.upcomingHeading}>
        <EditorialSectionHeading
          eyebrow="On the calendar"
          title={t.gatherings.upcomingHeading}
          description={t.gatherings.upcomingSub}
          action={
            <button
              onClick={() => { setCurrentPage('gatherings'); scrollToTop(); }}
              className="p4-touch-target inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#24262D] transition-colors hover:text-[#F47B49] cursor-pointer"
            >
              <span>{t.gatherings.viewAllGatherings}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          }
        />

        {upcomingMeetups.length > 0 ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="ed-grid ed-grid--bento mt-8"
          >
            {upcomingMeetups.slice(0, 3).map((meetup) => (
              <motion.article
                key={meetup.id}
                variants={staggerItem}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.25 }}
                className="ed-card ed-span-2 flex flex-col"
              >
                {meetup.featuredImage && (
                  <div className="relative mb-5 h-44 overflow-hidden rounded bg-[#24262D]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      className="h-full w-full object-cover object-[center_20%] transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#24262D]/60 to-transparent" aria-hidden="true" />
                    <span className="absolute left-3 top-3 rounded bg-[#D8CBFF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#24262D]">
                      {meetup.edition || 'Meetup'}
                    </span>
                  </div>
                )}

                <p className="ed-card__label">{meetup.date}</p>
                <h3 className="ed-card__title">{meetup.title}</h3>
                <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#5E5B55]">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{meetup.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{meetup.time}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{meetup.venue}</span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#24262D]/12 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMeetup(meetup)}
                    className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[#5E5B55] transition-colors hover:text-[#F47B49] cursor-pointer"
                  >
                    View Details
                  </button>
                  {meetup.registrationStatus === 'open' && getSafeRegistrationUrl(meetup) ? (
                    <a
                      href={getSafeRegistrationUrl(meetup)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded bg-[#F47B49] px-4 py-2 text-xs font-semibold text-white shadow-[var(--mh20-shadow-sm)] transition-colors hover:bg-[#DE6638]"
                    >
                      <span>RSVP Free</span>
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      href={siteConfig.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded bg-[#F47B49] px-4 py-2 text-xs font-semibold text-white shadow-[var(--mh20-shadow-sm)] transition-colors hover:bg-[#DE6638]"
                    >
                      <span>Ask on WhatsApp</span>
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <BentoCard surface="paper" label="Next chapter" className="mx-auto mt-8 max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-[#24262D]/15 bg-[#FFD8C1] text-[#F47B49]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="ed-card__title">Next Chapter in the Making</h3>
            <p className="ed-card__body mt-3 font-serif italic">“{t.gatherings.emptyUpcoming}”</p>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded bg-[#F47B49] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-white shadow-[var(--mh20-shadow-sm)] transition-colors hover:bg-[#DE6638]"
            >
              <span>Follow {siteConfig.instagramHandle} for Announcements</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </BentoCard>
        )}
      </section>

      {/* ---
          8. COMMUNITY GALLERY — real photographs, editorial rhythm
          --- */}
      <section className="ed-section py-10 sm:py-12" aria-label={t.community.galleryTitle}>
        <EditorialSectionHeading
          eyebrow="Real photographs & authentic moments"
          title={t.community.galleryTitle}
          description="Glimpses of quiet contemplation and heartfelt conversations under the Deccan sky."
          action={
            <button
              onClick={() => { setCurrentPage('community'); scrollToTop(); }}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#24262D] transition-colors hover:text-[#F47B49] cursor-pointer"
            >
              <span>Explore full archive</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          }
        />
        <div className="mt-8">
          <CommunityGallery compact={true} />
        </div>
      </section>

      {/* ---
          8b. FOUNDER'S NOTE — a pull-quote from our published reflection
          --- */}
      {memberVoices.length > 0 && (
        <section className="ed-section py-10 sm:py-12" aria-label="A note from our founder">
          <EditorialSectionHeading eyebrow="From our founder" title="Why we gather." />
          <div className="ed-grid ed-grid--bento mt-8">
            {memberVoices.map((voice, index) => (
              <BentoCard
                key={voice.id}
                surface={index === 0 ? 'peach' : 'lavender'}
                label="From the journal"
                className="ed-span-6"
              >
                <QuoteCard
                  quote={voice.quote}
                  memberName={voice.memberName}
                  joinYear={voice.joinYear}
                  location={voice.location}
                />
              </BentoCard>
            ))}
          </div>
        </section>
      )}

      {/* ---
          8c. THE TEAM — people behind Readers of Aurangabad
          --- */}
      {teamMembers.length > 0 && (
        <section className="ed-section py-10 sm:py-12" aria-label="The team">
          <EditorialSectionHeading eyebrow="The circle" title="People who make it happen." />
          <div className="ed-grid mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <BentoCard
                  surface={(['lavender', 'mint', 'blue', 'paper'] as const)[index % 4]}
                  className="flex h-full flex-col items-center text-center"
                >
                  <div className="mb-4 h-20 w-20 shrink-0 overflow-hidden rounded border border-[#24262D]/20 bg-[#FFFDF8] sm:h-24 sm:w-24">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Users className="h-8 w-8 text-[#5E5B55]/40" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug text-[#24262D]">{member.name}</h3>
                  <p className="mt-1 font-sans text-xs text-[#5E5B55]">{member.role}</p>
                </BentoCard>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ---
          8d. JOIN SECTION — Warm community invitation with form
          --- */}
      <JoinSection />

      {/* ---
          9. JOURNAL PREVIEW
          --- */}
      <section className="ed-section py-10 sm:py-12" aria-label={t.journal.heading}>
        <EditorialSectionHeading
          eyebrow="Words & reflections"
          title={t.journal.heading}
          description={t.journal.subheading}
          action={
            <button
              onClick={() => { setCurrentPage('journal'); scrollToTop(); }}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#24262D] transition-colors hover:text-[#F47B49] cursor-pointer"
            >
              <span>Browse All Articles</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          }
        />

        <div className="ed-grid ed-grid--bento mt-8 items-start">
          {/* Featured article */}
          {featuredArticle && (
            <motion.article
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedArticle(featuredArticle)}
              className="ed-card ed-span-4 cursor-pointer"
            >
              <div className="relative mb-6 h-64 overflow-hidden rounded bg-[#24262D] sm:h-72">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 ease-out"
                />
                <span className="absolute left-4 top-4 rounded bg-[#D8CBFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#24262D]">
                  Featured Reflection
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5E5B55]">
                <span className="font-semibold uppercase text-[#F47B49]">{featuredArticle.category}</span>
                <span>·</span>
                <span>{featuredArticle.readingTime} {t.journal.readTime}</span>
              </div>
              <h3 className="ed-card__title mt-3">{featuredArticle.title}</h3>
              <p className="ed-card__body mt-4">{featuredArticle.excerpt}</p>
              <div className="mt-6 flex items-center justify-between border-t border-[#24262D]/12 pt-4 text-xs text-[#5E5B55]">
                <span>By {featuredArticle.author}</span>
                <span className="flex items-center gap-1 font-semibold text-[#24262D]">
                  {t.journal.readArticle} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.article>
          )}

          {/* Secondary articles */}
          <div className="ed-span-2 space-y-4">
            {recentArticles.filter(a => a.id !== featuredArticle?.id).map((article) => (
              <motion.article
                key={article.id}
                whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedArticle(article)}
                className="ed-card cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-[#24262D]">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="h-full w-full object-cover object-[center_20%]"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5" dir={article.language === 'ur' ? 'rtl' : 'ltr'} lang={article.language}>
                    <span className={`block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#F47B49] ${article.language === 'ur' ? 'text-right' : ''}`}>
                      {article.category} · {article.language.toUpperCase()}
                    </span>
                    <h4 className={`line-clamp-2 font-display text-base font-semibold text-[#24262D] ${
                      article.language === 'ur'
                        ? 'p4-urdu-card-heading font-urdu text-right text-lg leading-[2.3]'
                        : article.language === 'hi' || article.language === 'mr'
                        ? 'font-hindi leading-[1.6]'
                        : 'leading-snug'
                    }`}>
                      {article.title}
                    </h4>
                    <div className={`flex items-center gap-2 pt-1 text-[11px] text-[#5E5B55] ${article.language === 'ur' ? 'justify-end' : ''}`}>
                      <span>{article.author}</span>
                      <span>·</span>
                      <span>{article.readingTime} min</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            <BentoCard surface="blue" label="Submit to the journal" className="space-y-2">
              <h4 className="font-display text-base font-semibold text-[#24262D]">Have a story or essay to submit?</h4>
              <p className="text-xs leading-relaxed text-[#5E5B55]">
                We accept reader memoirs, poems, and book critiques in English, Hindi, Urdu, and Marathi.
              </p>
              <button
                onClick={() => { setCurrentPage('contact'); scrollToTop(); }}
                className="inline-flex min-h-[44px] items-center gap-1 pt-1 text-xs font-semibold text-[#5E5B55] transition-colors hover:text-[#F47B49] cursor-pointer"
              >
                <span>Submit to Journal</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ---
          10. COMMUNITY CTA — a dark scrapbook endpaper
          --- */}
      <section className="ed-section py-8 sm:py-10" aria-label="Join Readers of Aurangabad">
        <BentoCard surface="dark" label="Every reader deserves a place" tape className="ed-card--cta">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.2rem)] leading-[1.1] tracking-[-0.03em] text-[#F7F3EB]">
                Whether you read every day or are just beginning, there is a place for you here.
              </h2>
              <p className="mt-5 max-w-2xl font-sans text-sm leading-relaxed text-[#F7F3EB]/75 sm:text-base">
                No registration fees. No judgment on what you read. Just good people, quiet sunlight, and the magic of physical books in Aurangabad.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => { setCurrentPage('get-involved'); scrollToTop(); }}
                className="inline-flex min-h-[46px] items-center rounded bg-[#F47B49] px-6 py-3 text-sm font-semibold text-white shadow-[var(--mh20-shadow-sm)] transition-colors hover:bg-[#DE6638] cursor-pointer"
              >
                Become a Part of Us
              </motion.button>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center rounded border border-[#F7F3EB]/30 bg-[#C7EFDE] px-6 py-3 text-sm font-semibold text-[#24262D] transition-colors hover:bg-[#F7F3EB]"
              >
                {siteConfig.instagramHandle}
              </a>
            </div>
          </div>
        </BentoCard>
      </section>


      {fullAnnouncement && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#24262D]/80 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissFullAnnouncement}
        >
          <motion.div
            ref={fullAnnouncementSurfaceRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-announcement-title"
            tabIndex={-1}
            className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#24262D]/20 bg-[#F7F3EB] p-6 shadow-[var(--mh20-shadow-lg)] sm:p-9"
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismissFullAnnouncement}
              aria-label="Close announcement"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded border border-[#24262D]/15 text-2xl text-[#5E5B55] transition-colors hover:bg-[#FFD8C1]"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="mb-6 pr-10">
              <p className="ed-kicker">Latest Community Announcement</p>
              <p className="mt-2 text-sm text-[#5E5B55]">
                Published {new Date(
                  fullAnnouncement.publishedAt || fullAnnouncement.createdAt
                ).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <h2
              id="full-announcement-title"
              className="mb-5 font-display text-2xl font-semibold leading-tight text-[#24262D] sm:text-3xl"
            >
              {fullAnnouncement.title}
            </h2>

            <div className="whitespace-pre-wrap break-words text-base leading-8 text-[#5E5B55]">
              {fullAnnouncement.content}
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};
