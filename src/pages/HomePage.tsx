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
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FeaturedAnnouncementReel } from '../components/FeaturedAnnouncementReel';
import { ReelCollectionSection } from '../components/ReelCollectionSection';
import { CommunityGallery } from '../components/CommunityGallery';
import { UpcomingEventSpotlight } from '../components/UpcomingEventSpotlight';
import { JoinSection } from '../components/JoinSection';
import { StatBlock } from '../components/ui/StatBlock';
import { QuoteCard } from '../components/ui/QuoteCard';
import { Eyebrow } from '../components/ui/Eyebrow';
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

  const revealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeCurve } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeCurve } },
  };

  return (
    <div className="paper-grain overflow-hidden">

      {/* 1. HERO â€” Authentic group photograph with title over image & unobstructed faces */}
      <section
        className="relative isolate min-h-[420px] sm:min-h-[500px] lg:min-h-[580px] overflow-hidden"
        aria-label="Readers of Aurangabad community hero"
      >
        <picture className="absolute inset-0 block h-full w-full">          <source media="(max-width: 640px)" srcSet="/images/enhanced/mobile/roa-hero-mobile.webp" />
          <source media="(min-width: 1441px)" srcSet="/images/enhanced/hero/roa-hero-4k-master.webp" />
          <source media="(min-width: 641px)" srcSet="/images/enhanced/hero/roa-group-hero-clean.webp" />
          <img
            src="/images/enhanced/hero/roa-group-hero-clean.webp"
            alt="Readers of Aurangabad community gathered outdoors"
            className="w-full h-full object-cover object-[48%_50%] sm:object-[50%_50%] lg:object-[50%_48%]"
            width={2560}
            height={1260}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Subtle, non-destructive gradient strictly on the lower foreground lawn for crisp text legibility without obscuring faces */}
        <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full h-full min-h-[420px] sm:min-h-[500px] lg:min-h-[580px] flex flex-col justify-end pb-5 sm:pb-8 lg:pb-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-2xl text-white"
          >
            <motion.div variants={staggerItem} className="mb-1.5 sm:mb-2.5 inline-flex items-center gap-2">
              <span className="border-2 border-[#171717] bg-[#D9F36A] text-[#171717] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-none text-[9px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#F4F0E8] bg-black/40 border-white/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-none bg-[#D9F36A] inline-block mr-1.5" />
                Aurangabad reading movement
              </span>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="font-display uppercase tracking-[-0.03em] leading-[0.9] text-3xl sm:text-5xl lg:text-6xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
            >
              READERS OF<br />AURANGABAD
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-1.5 sm:mt-2.5 font-serif italic text-xs sm:text-base lg:text-lg text-[#F4F0E8]/95 max-w-xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            >
              Making reading a part of everyday life again.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => { setCurrentPage('get-involved'); scrollToTop(); }}
                className="bg-[#F2EBDD] hover:bg-white text-[#171717] px-4 py-2 sm:px-5 sm:py-2.5 rounded-none text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setCurrentPage('story'); scrollToTop(); }}
                className="border-2 border-[#171717] bg-[#D9F36A] text-[#171717] font-bold text-[#F4F0E8] hover:text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-none text-xs sm:text-sm font-semibold border-white/25 cursor-pointer bg-black/25 backdrop-blur-md hover:bg-black/40 transition-colors"
              >
                {t.hero.ctaSecondary}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 1b. PROOF STRIP â€” Community statistics */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="bg-[#F4F0E8] dark:bg-[#171717] border-y border-[#171717]/15 dark:border-[#F4F0E8]/15 py-8 sm:py-10"
        aria-label="Community statistics"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 justify-items-center sm:justify-items-start">
          {communityStats.map((stat) => (
            <StatBlock
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </motion.section>

      {/* 2. THE AURANGABAD READING MOVEMENT â€” Editorial Storytelling Section on Warm Paper */}
      <motion.section
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px', amount: 0.2 }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.75, ease: easeCurve }}
        className="relative bg-[#F4F0E8] px-5 sm:px-8 lg:px-12 py-8 sm:py-10"
        aria-label="The Aurangabad Reading Movement"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">

          {/* Left Column: Heading & Label (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[#D9F36A]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6E6960]">
                The Aurangabad Reading Movement
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.72, ease: easeCurve }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717] tracking-tight leading-[1.08]"
            >
              {t.intro.heading}
            </motion.h2>
          </div>

          {/* Right Column: Carefully typeset quotation with decorative mark (7 cols) */}
          <div className="lg:col-span-7 relative pl-0 lg:pl-8 lg:border-l lg:border-[#171717]/15">
            <span
              className="font-serif text-5xl sm:text-6xl text-[#D9F36A]/40 leading-none select-none block -mb-4"
              aria-hidden="true"
            >
              â€œ
            </span>

            <motion.blockquote
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.72, delay: shouldReduceMotion ? 0 : 0.12, ease: easeCurve }}
              className="font-serif italic text-lg sm:text-xl lg:text-2xl text-[#171717]/90 leading-relaxed"
            >
              {t.intro.body}
            </motion.blockquote>
          </div>

        </div>
      </motion.section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          4. FEATURED ANNOUNCEMENT REEL
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* Upcoming event countdown + latest announcement */}
      <section className="relative py-6 sm:py-8">
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

      <FeaturedAnnouncementReel />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          5. REEL COLLECTION
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <ReelCollectionSection />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          6. OUR PHILOSOPHY â€” Editorial Offset Cards
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#171717]/15">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F4512C] block">
              02 â€” Why We Gather
            </span>
            <h2 className="font-serif font-bold text-[#171717] leading-tight"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
            >
              {t.philosophy.heading}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-[#4F4A43] leading-relaxed">
              {t.philosophy.subheading}
            </p>
            <p className="mt-2 font-serif text-lg text-[#171717] text-center">No boundaries of RELIGION | LANGUAGES | AGES</p>
          </div>
        </div>

        {/* 2Ã—2 Editorial Offset Grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            { icon: <Users className="w-6 h-6" />, title: t.philosophy.p1Title, desc: t.philosophy.p1Desc, num: '01', label: 'Shared Experience', accent: '#777C60', offset: false },
            { icon: <Compass className="w-6 h-6" />, title: t.philosophy.p2Title, desc: t.philosophy.p2Desc, num: '02', label: 'Open Intellect', accent: '#A65F46', offset: true },
            { icon: <Feather className="w-6 h-6" />, title: t.philosophy.p3Title, desc: t.philosophy.p3Desc, num: '03', label: 'Empathy & Voice', accent: '#B89A65', offset: true },
            { icon: <Coffee className="w-6 h-6" />, title: t.philosophy.p4Title, desc: t.philosophy.p4Desc, num: '04', label: 'Real Bonds', accent: '#777C60', offset: false },
          ].map((card) => (
            <motion.div
              key={card.num}
              variants={staggerItem}
              className="border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 p-6 rounded-none flex flex-col justify-between group"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-none flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ background: `${card.accent}18`, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <span className="font-serif font-bold text-5xl leading-none select-none"
                    style={{ color: `${card.accent}18` }}
                  >{card.num}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#171717] group-hover:text-[#6E6960] transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-[#4F4A43] leading-relaxed">{card.desc}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#171717]/15/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-none" style={{ background: card.accent }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: card.accent }}>
                  {card.label}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          7. UPCOMING GATHERINGS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#171717]/15 pb-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F4512C] block mb-2">
              03 â€” Events in Aurangabad
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#171717]">
              {t.gatherings.upcomingHeading}
            </h2>
            <p className="text-sm text-[#4F4A43] mt-1">{t.gatherings.upcomingSub}</p>
          </div>
          <button
            onClick={() => { setCurrentPage('gatherings'); scrollToTop(); }}
            className="p4-touch-target inline-flex min-h-[24px] items-center text-xs font-semibold text-[#171717] hover:text-[#6E6960] gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>{t.gatherings.viewAllGatherings}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingMeetups.length > 0 ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {upcomingMeetups.slice(0, 3).map((meetup) => (
              <motion.div
                key={meetup.id}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 rounded-none overflow-hidden flex flex-col group"
              >
                {/* Cover */}
                {meetup.featuredImage && (
                  <div className="relative h-48 overflow-hidden bg-[#171717]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#20231F]/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="border-2 border-[#171717] bg-[#D9F36A] text-[#171717] font-bold px-2.5 py-1 rounded-none text-[10px] font-semibold text-[#F4F0E8] uppercase tracking-wider border-white/20">
                        {meetup.edition || 'Meetup'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-bold text-[#171717] group-hover:text-[#6E6960] transition-colors leading-snug">
                      {meetup.title}
                    </h3>
                    <div className="flex flex-col gap-1.5 text-xs text-[#4F4A43]">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{meetup.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{meetup.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{meetup.venue}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#171717]/15/60 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMeetup(meetup)}
                      className="inline-flex min-h-[24px] items-center text-xs font-semibold text-[#4F4A43] hover:text-[#171717] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    {meetup.registrationStatus === 'open' && getSafeRegistrationUrl(meetup) ? (
                      <a
                        href={getSafeRegistrationUrl(meetup)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center border-2 border-[#171717] bg-[#F4512C] text-white font-bold uppercase tracking-[0.04em] shadow-[4px_4px_0_#171717] px-5 py-2.5 rounded-none text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>RSVP Free</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <a
                        href={siteConfig.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center border-2 border-[#171717] bg-[#F4512C] text-white font-bold uppercase tracking-[0.04em] shadow-[4px_4px_0_#171717] px-5 py-2.5 rounded-none text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Ask on WhatsApp</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 rounded-none p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-none bg-white/80 border border-[#171717]/15 flex items-center justify-center text-[#F4512C] mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#171717]">Next Chapter in the Making</h3>
            <p className="text-base text-[#4F4A43] font-serif italic">"{t.gatherings.emptyUpcoming}"</p>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none inline-flex items-center justify-center border-2 border-[#171717] bg-[#F4512C] text-white font-bold uppercase tracking-[0.04em] shadow-[4px_4px_0_#171717] text-xs font-semibold mt-2"
            >
              <span>Follow {siteConfig.instagramHandle} for Announcements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </motion.section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          8. COMMUNITY GALLERY â€” Full Editorial Masonry
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#171717]/15">
          <div className="lg:col-span-8 space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F4512C] block">
              04 â€” Real Photographs & Authentic Moments
            </span>
            <h2 className="font-serif font-bold text-[#171717] leading-tight"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
            >
              {t.community.galleryTitle}
            </h2>
            <p className="text-sm text-[#4F4A43] max-w-xl">
  Glimpses of quiet contemplation and heartfelt conversations under the Deccan sky.
</p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <button
              onClick={() => { setCurrentPage('community'); scrollToTop(); }}
              className="inline-flex min-h-[24px] items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#6E6960] transition-colors cursor-pointer"
            >
              <span>Explore full archive</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CommunityGallery compact={true} />
      </motion.section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          8b. FOUNDER'S NOTE â€” A pull-quote from our published reflection
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {memberVoices.length > 0 && (
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
          aria-label="A note from our founder"
        >
          <div className="pb-6 border-b border-[#171717]/15 dark:border-[#F4F0E8]/15">
            <Eyebrow color="clay">From Our Founder</Eyebrow>
            <h2 className="font-serif font-bold text-[#171717] dark:text-[#F4F0E8] mt-2 leading-tight section-h2">
              Why we gather.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 max-w-3xl">
            {memberVoices.map((voice) => (
              <QuoteCard
                key={voice.id}
                quote={voice.quote}
                memberName={voice.memberName}
                joinYear={voice.joinYear}
                location={voice.location}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          8c. THE TEAM â€” People behind Readers of Aurangabad
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {teamMembers.length > 0 && (
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
          aria-label="The team"
        >
          <div className="pb-6 border-b border-[#171717]/15 dark:border-[#F4F0E8]/15">
            <Eyebrow color="neem">The Circle</Eyebrow>
            <h2 className="font-serif font-bold text-[#171717] dark:text-[#F4F0E8] mt-2 leading-tight section-h2">
              People who make it happen.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center gap-3"
              >
                {/* Photo or ink placeholder */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[6px] overflow-hidden bg-[#1B2A49] dark:bg-[#202020] shrink-0 border-2 border-[#171717]/15 dark:border-[#F4F0E8]/15">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-[#F4ECDD]/40" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-serif font-bold text-sm text-[#171717] dark:text-[#F4F0E8] leading-snug">
                    {member.name}
                  </p>
                  <p className="font-sans text-xs text-[#6E6960] dark:text-[#D6D0C6] mt-0.5">
                    {member.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          8d. JOIN SECTION â€” Warm community invitation with form
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <JoinSection />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          9. JOURNAL PREVIEW
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#171717]/15 pb-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F4512C] block mb-2">
              05 â€” Words & Reflections
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#171717]">
              {t.journal.heading}
            </h2>
            <p className="text-sm text-[#4F4A43] mt-1">{t.journal.subheading}</p>
          </div>
          <button
            onClick={() => { setCurrentPage('journal'); scrollToTop(); }}
            className="inline-flex min-h-[24px] items-center text-xs font-semibold text-[#171717] hover:text-[#6E6960] gap-1.5 transition-colors cursor-pointer"
          >
            <span>Browse All Articles</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Featured article */}
          {featuredArticle && (
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedArticle(featuredArticle)}
              className="lg:col-span-7 border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 rounded-none overflow-hidden cursor-pointer group flex flex-col"
            >
              <div className="relative h-64 sm:h-72 overflow-hidden bg-[#171717]">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-4 left-4">
                  <span className="border-2 border-[#171717] bg-[#D9F36A] text-[#171717] font-bold px-3 py-1 rounded-none text-xs font-semibold text-[#171717] border-white/60">
                    Featured Reflection
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#6E6960]">
                  <span className="text-[#F4512C] font-semibold uppercase">{featuredArticle.category}</span>
                  <span>Â·</span>
                  <span>{featuredArticle.readingTime} {t.journal.readTime}</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#171717] group-hover:text-[#6E6960] transition-colors leading-snug">
                  {featuredArticle.title}
                </h3>
                <p className="text-sm sm:text-base text-[#4F4A43] leading-relaxed">{featuredArticle.excerpt}</p>
                <div className="pt-3 border-t border-[#171717]/15/60 flex items-center justify-between text-xs text-[#6E6960]">
                  <span>By {featuredArticle.author}</span>
                  <span className="font-semibold text-[#171717] group-hover:text-[#6E6960] flex items-center gap-1">
                    {t.journal.readArticle} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Side articles */}
          <div className="lg:col-span-5 space-y-4">
            {recentArticles.filter(a => a.id !== featuredArticle?.id).map((article) => (
              <motion.div
                key={article.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedArticle(article)}
                className="border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 p-5 rounded-none cursor-pointer group flex gap-4 items-start"
              >
                <div className="w-20 h-20 rounded-none overflow-hidden shrink-0 bg-[#171717]">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0" dir={article.language === 'ur' ? 'rtl' : 'ltr'} lang={article.language}>
                  <span className={`text-[10px] font-semibold text-[#F4512C] uppercase tracking-wider block ${article.language === 'ur' ? 'text-right' : ''}`}>
                    {article.category} Â· {article.language.toUpperCase()}
                  </span>
                  <h4 className={`font-bold text-base text-[#171717] group-hover:text-[#6E6960] transition-colors line-clamp-2 ${
                    article.language === 'ur'
                      ? 'p4-urdu-card-heading font-urdu text-right text-lg leading-[2.3]'
                      : article.language === 'hi' || article.language === 'mr'
                      ? 'font-hindi leading-[1.6]'
                      : 'font-serif leading-snug'
                  }`}>
                    {article.title}
                  </h4>
                  <div className={`flex items-center gap-2 text-[11px] text-[#6E6960] pt-1 ${article.language === 'ur' ? 'justify-end' : ''}`}>
                    <span>{article.author}</span>
                    <span>Â·</span>
                    <span>{article.readingTime} min</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-6 rounded-none border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:border-[#F4F0E8]/25 space-y-2">
              <h4 className="font-serif font-bold text-base text-[#171717]">Have a story or essay to submit?</h4>
              <p className="text-xs text-[#4F4A43] leading-relaxed">
  We accept reader memoirs, poems, and book critiques in English, Hindi, Urdu, and Marathi.
</p>
              <button
                onClick={() => { setCurrentPage('contact'); scrollToTop(); }}
                className="inline-flex min-h-[24px] items-center text-xs font-semibold text-[#6E6960] hover:text-[#171717] pt-1 gap-1 cursor-pointer"
              >
                <span>Submit to Journal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          10. COMMUNITY CTA BANNER
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-10"
      >
        <div className="relative rounded-none bg-[#171717] text-[#F4F0E8] border-2 border-[#171717] p-10 sm:p-16 overflow-hidden shadow-2xl border-white/15">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-none bg-[#6E6960]/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-none bg-[#F4512C]/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl space-y-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D9F36A] block">
              Every Reader Deserves a Place
            </span>

            <h2 className="font-serif font-bold text-[#F4F0E8] leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
            >
              Whether you read every day or are just beginning, there is a place for you here.
            </h2>

            <p className="text-base text-[#F4F0E8]/70 font-sans leading-relaxed">
  No registration fees. No judgment on what you read. Just good people, quiet sunlight, and the magic of physical books in Aurangabad.
</p>

            <div className="pt-2 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setCurrentPage('get-involved'); scrollToTop(); }}
                className="bg-[#F2EBDD] hover:bg-white text-[#171717] px-7 py-3.5 rounded-none text-sm font-semibold tracking-wide transition-all shadow-md cursor-pointer"
              >
                Become a Part of Us
              </motion.button>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-[#171717] bg-[#D9F36A] text-[#171717] font-bold px-6 py-3.5 rounded-none text-sm font-semibold text-[#F4F0E8] border-white/20 hover:bg-white/10 transition-all inline-block"
              >
                {siteConfig.instagramHandle}
              </a>
            </div>
          </div>
        </div>
      </motion.section>


      {fullAnnouncement && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/65 backdrop-blur-md p-3 sm:p-6"
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
            className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-none border border-white/60 bg-[#FAF8F5] p-6 shadow-2xl sm:p-9"
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismissFullAnnouncement}
              aria-label="Close announcement"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-none border border-[#171717]/15 text-2xl text-[#4F4A43] transition-colors hover:bg-white"
            >
              <span aria-hidden="true">Ã—</span>
            </button>

            <div className="mb-6 pr-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E6960]">
                Latest Community Announcement
              </p>
              <p className="mt-2 text-sm text-[#6E6960]">
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
              className="mb-5 font-serif text-2xl font-bold leading-tight text-[#171717] sm:text-3xl"
            >
              {fullAnnouncement.title}
            </h2>

            <div className="whitespace-pre-wrap break-words text-base leading-8 text-[#4F4A43]">
              {fullAnnouncement.content}
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};
