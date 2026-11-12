import React from 'react';
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

export const HomePage: React.FC = () => {
  const { t, setCurrentPage, meetups, articles, setSelectedArticle, setSelectedMeetup } = useApp();

  const shouldReduceMotion = useReducedMotion();
  const upcomingMeetups = meetups.filter(m => m.isUpcoming);
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

      {/* 1. HERO — Authentic group photograph with title over image & unobstructed faces */}
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
              <span className="glass-pill px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#F2EBDD] bg-black/40 border-white/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89A65] inline-block mr-1.5" />
                Aurangabad reading movement
              </span>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="font-serif font-bold tracking-tight leading-[0.95] text-2xl sm:text-4xl lg:text-5xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
            >
              READERS OF<br />AURANGABAD
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-1.5 sm:mt-2.5 font-serif italic text-xs sm:text-base lg:text-lg text-[#F2EBDD]/95 max-w-xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            >
              Making reading a part of everyday life again.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => { setCurrentPage('get-involved'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-[#F2EBDD] hover:bg-white text-[#20231F] px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setCurrentPage('story'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="glass-pill text-[#F2EBDD] hover:text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border-white/25 cursor-pointer bg-black/25 backdrop-blur-md hover:bg-black/40 transition-colors"
              >
                {t.hero.ctaSecondary}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE AURANGABAD READING MOVEMENT — Editorial Storytelling Section on Warm Paper */}
      <motion.section
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px', amount: 0.2 }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.75, ease: easeCurve }}
        className="relative bg-[#F3ECDD] px-5 sm:px-8 lg:px-12 py-8 sm:py-10"
        aria-label="The Aurangabad Reading Movement"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">

          {/* Left Column: Heading & Label (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[#B89A65]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#777C60]">
                The Aurangabad Reading Movement
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.72, ease: easeCurve }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#20231F] tracking-tight leading-[1.08]"
            >
              {t.intro.heading}
            </motion.h2>
          </div>

          {/* Right Column: Carefully typeset quotation with decorative mark (7 cols) */}
          <div className="lg:col-span-7 relative pl-0 lg:pl-8 lg:border-l lg:border-[#E8E2D5]">
            <span
              className="font-serif text-5xl sm:text-6xl text-[#B89A65]/40 leading-none select-none block -mb-4"
              aria-hidden="true"
            >
              “
            </span>

            <motion.blockquote
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.72, delay: shouldReduceMotion ? 0 : 0.12, ease: easeCurve }}
              className="font-serif italic text-lg sm:text-xl lg:text-2xl text-[#20231F]/90 leading-relaxed"
            >
              {t.intro.body}
            </motion.blockquote>
          </div>

        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          4. FEATURED ANNOUNCEMENT REEL
          ════════════════════════════════════════════════════════════ */}
      <FeaturedAnnouncementReel />

      {/* ══════════════════════════════════════════════════════════════
          5. REEL COLLECTION
          ════════════════════════════════════════════════════════════ */}
      <ReelCollectionSection />

      {/* ══════════════════════════════════════════════════════════════
          6. OUR PHILOSOPHY — Editorial Offset Cards
          ════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#E5DFD4]">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block">
              02 — Why We Gather
            </span>
            <h2 className="font-serif font-bold text-[#20231F] leading-tight"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
            >
              {t.philosophy.heading}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
              {t.philosophy.subheading}
            </p>
          </div>
        </div>

        {/* 2×2 Editorial Offset Grid */}
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
              className="glass-card p-6 rounded-2xl flex flex-col justify-between group"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ background: `${card.accent}18`, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <span className="font-serif font-bold text-5xl leading-none select-none"
                    style={{ color: `${card.accent}18` }}
                  >{card.num}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#20231F] group-hover:text-[#777C60] transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-[#595550] leading-relaxed">{card.desc}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E5DFD4]/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: card.accent }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: card.accent }}>
                  {card.label}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          7. UPCOMING GATHERINGS
          ════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DFD4] pb-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block mb-2">
              03 — Events in Aurangabad
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#20231F]">
              {t.gatherings.upcomingHeading}
            </h2>
            <p className="text-sm text-[#595550] mt-1">{t.gatherings.upcomingSub}</p>
          </div>
          <button
            onClick={() => { setCurrentPage('gatherings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="text-xs font-semibold text-[#20231F] hover:text-[#777C60] flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
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
                className="glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer group"
                onClick={() => setSelectedMeetup(meetup)}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${meetup.title}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedMeetup(meetup);
                  }
                }}
              >
                {/* Cover */}
                {meetup.featuredImage && (
                  <div className="relative h-48 overflow-hidden bg-[#20231F]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#20231F]/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#F2EBDD] uppercase tracking-wider border-white/20">
                        {meetup.edition || 'Meetup'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-bold text-[#20231F] group-hover:text-[#777C60] transition-colors leading-snug">
                      {meetup.title}
                    </h3>
                    <div className="flex flex-col gap-1.5 text-xs text-[#595550]">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{meetup.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{meetup.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{meetup.venue}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5DFD4]/60 flex items-center justify-between gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMeetup(meetup); }}
                      className="text-xs font-semibold text-[#595550] hover:text-[#20231F] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <a
                      href={meetup.registrationUrl || meetup.rsvpLink || 'https://forms.gle/readers-of-aurangabad'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="glass-button px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>RSVP Free</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/80 border border-[#E5DFD4] flex items-center justify-center text-[#A65F46] mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#20231F]">Next Chapter in the Making</h3>
            <p className="text-base text-[#595550] font-serif italic">"{t.gatherings.emptyUpcoming}"</p>
            <a
              href="https://instagram.com/readers.of.aurangabad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-button text-xs font-semibold mt-2"
            >
              <span>Follow on Instagram for Announcements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          8. COMMUNITY GALLERY — Full Editorial Masonry
          ════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#E5DFD4]">
          <div className="lg:col-span-8 space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block">
              04 — Real Photographs & Authentic Moments
            </span>
            <h2 className="font-serif font-bold text-[#20231F] leading-tight"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
            >
              {t.community.galleryTitle}
            </h2>
            <p className="text-sm text-[#595550] max-w-xl">
              Glimpses of quiet contemplation and heartfelt conversations under the Deccan sky.            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <button
              onClick={() => { setCurrentPage('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20231F] hover:text-[#777C60] transition-colors cursor-pointer"
            >
              <span>Explore full archive</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CommunityGallery compact={true} />
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          9. JOURNAL PREVIEW
          ════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DFD4] pb-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block mb-2">
              05 — Words & Reflections
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#20231F]">
              {t.journal.heading}
            </h2>
            <p className="text-sm text-[#595550] mt-1">{t.journal.subheading}</p>
          </div>
          <button
            onClick={() => { setCurrentPage('journal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="text-xs font-semibold text-[#20231F] hover:text-[#777C60] flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="lg:col-span-7 glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col"
            >
              <div className="relative h-64 sm:h-72 overflow-hidden bg-[#20231F]">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-4 left-4">
                  <span className="glass-pill px-3 py-1 rounded-full text-xs font-semibold text-[#20231F] border-white/60">
                    Featured Reflection
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#8C857B]">
                  <span className="text-[#A65F46] font-semibold uppercase">{featuredArticle.category}</span>
                  <span>·</span>
                  <span>{featuredArticle.readingTime} {t.journal.readTime}</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#20231F] group-hover:text-[#777C60] transition-colors leading-snug">
                  {featuredArticle.title}
                </h3>
                <p className="text-sm sm:text-base text-[#595550] leading-relaxed">{featuredArticle.excerpt}</p>
                <div className="pt-3 border-t border-[#E5DFD4]/60 flex items-center justify-between text-xs text-[#8C857B]">
                  <span>By {featuredArticle.author}</span>
                  <span className="font-semibold text-[#20231F] group-hover:text-[#777C60] flex items-center gap-1">
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
                className="glass-card p-5 rounded-2xl cursor-pointer group flex gap-4 items-start"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#20231F]">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0" dir={article.language === 'ur' ? 'rtl' : 'ltr'} lang={article.language}>
                  <span className={`text-[10px] font-semibold text-[#A65F46] uppercase tracking-wider block ${article.language === 'ur' ? 'text-right' : ''}`}>
                    {article.category} · {article.language.toUpperCase()}
                  </span>
                  <h4 className={`font-bold text-base text-[#20231F] group-hover:text-[#777C60] transition-colors line-clamp-2 leading-snug ${
                    article.language === 'ur'
                      ? 'font-urdu text-right text-lg leading-[2.0]'
                      : article.language === 'hi' || article.language === 'mr'
                      ? 'font-hindi leading-[1.6]'
                      : 'font-serif'
                  }`}>
                    {article.title}
                  </h4>
                  <div className={`flex items-center gap-2 text-[11px] text-[#8C857B] pt-1 ${article.language === 'ur' ? 'justify-end' : ''}`}>
                    <span>{article.author}</span>
                    <span>·</span>
                    <span>{article.readingTime} min</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-6 rounded-2xl glass-panel space-y-2">
              <h4 className="font-serif font-bold text-base text-[#20231F]">Have a story or essay to submit?</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                We accept reader memoirs, poems, and book critiques in English, Hindi, Urdu, and Marathi.
              </p>
              <button
                onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-xs font-semibold text-[#777C60] hover:text-[#20231F] pt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Submit to Journal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          10. COMMUNITY CTA BANNER
          ════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-10"
      >
        <div className="relative rounded-3xl glass-dark p-10 sm:p-16 overflow-hidden shadow-2xl border-white/15">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#777C60]/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#A65F46]/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl space-y-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B89A65] block">
              Every Reader Deserves a Place
            </span>

            <h2 className="font-serif font-bold text-[#F2EBDD] leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
            >
              Whether you read every day or are just beginning, there is a place for you here.
            </h2>

            <p className="text-base text-[#F2EBDD]/70 font-sans leading-relaxed">
              No registration fees. No judgment on what you read. Just good people, quiet sunlight, and the magic of physical books in Aurangabad.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setCurrentPage('get-involved'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-[#F2EBDD] hover:bg-white text-[#20231F] px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all shadow-md cursor-pointer"
              >
                Become a Part of Us
              </motion.button>
              <a
                href="https://instagram.com/readers.of.aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-pill px-6 py-3.5 rounded-full text-sm font-semibold text-[#F2EBDD] border-white/20 hover:bg-white/10 transition-all inline-block"
              >
                @readers.of.aurangabad
              </a>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
};
