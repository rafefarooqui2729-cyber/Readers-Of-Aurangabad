import React, { useState } from 'react';
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
  ExternalLink,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export const HomePage: React.FC = () => {
  const { 
    t, 
    setCurrentPage, 
    meetups, 
    articles, 
    gallery, 
    setSelectedArticle, 
    setSelectedMeetup 
  } = useApp();

  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const upcomingMeetups = meetups.filter(m => m.isUpcoming);
  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const recentArticles = articles.slice(0, 3);

  // Easing curve as mandated: 200–600ms natural cubic-bezier
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05
      }
    }
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: easeCurve }
    }
  };

  const cardStaggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: easeCurve }
    }
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 paper-grain overflow-hidden">
      
      {/* 1. HERO SECTION WITH AMBIENT VIDEO & LITERARY COMPOSITION */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Ambient Video Atmosphere */}
        <div className="absolute inset-0 -top-20 -z-20 overflow-hidden pointer-events-none rounded-3xl opacity-20 mask-radial">
          {isPlayingVideo && (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover scale-105 filter blur-xs"
              poster="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80"
            >
              {/* Quiet sunlight through leaves / reading aesthetic video loop */}
              <source 
                src="https://assets.mixkit.co/videos/preview/mixkit-sunlight-through-the-leaves-of-a-tree-4243-large.mp4" 
                type="video/mp4" 
              />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/60 via-[#FAF8F5]/90 to-[#FAF8F5]" />
        </div>

        <motion.div 
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
        >
          {/* Left Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Movement Tag / Location Pill & Ambient Toggle */}
            <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#455240] animate-pulse" />
                <span>{t.hero.tag}</span>
              </div>

              {/* Ambient Motion Toggle */}
              <button
                onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/80 border border-[#E8E2D5] text-[#595550] hover:text-[#1C1B1A] transition-colors"
                title="Toggle ambient background video"
              >
                {isPlayingVideo ? <Pause className="w-3 h-3 text-[#455240]" /> : <Play className="w-3 h-3 text-[#8D5B4C]" />}
                <span>{isPlayingVideo ? 'Ambient Video' : 'Paused'}</span>
              </button>
            </motion.div>

            {/* Editorial Main Headline Entrance */}
            <motion.h1 
              variants={heroItemVariants}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1C1B1A] leading-[1.08]"
            >
              {t.hero.headline}
            </motion.h1>

            {/* Supporting Prose */}
            <motion.p 
              variants={heroItemVariants}
              className="text-lg sm:text-xl text-[#595550] font-sans leading-relaxed max-w-2xl"
            >
              {t.hero.supporting}
            </motion.p>

            {/* Actions */}
            <motion.div variants={heroItemVariants} className="pt-2 flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18 }}
                onClick={() => {
                  setCurrentPage('get-involved');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#1C1B1A] hover:bg-[#455240] text-[#FAF8F5] px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-colors shadow-md hover:shadow-lg flex items-center gap-2 group cursor-pointer"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18 }}
                onClick={() => {
                  setCurrentPage('story');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide text-[#1C1B1A] bg-white border border-[#E8E2D5] hover:bg-[#FAF8F5] hover:border-[#1C1B1A] transition-all shadow-sm cursor-pointer"
              >
                {t.hero.ctaSecondary}
              </motion.button>
            </motion.div>

            {/* Key Community Highlights / Badges */}
            <motion.div variants={heroItemVariants} className="pt-6 border-t border-[#E8E2D5] grid grid-cols-3 gap-4 text-left">
              <div>
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
                  MH20
                </span>
                <span className="text-xs text-[#8C857B] font-medium">Aurangabad Roots</span>
              </div>
              <div>
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#455240]">
                  4+
                </span>
                <span className="text-xs text-[#8C857B] font-medium">Languages Embraced</span>
              </div>
              <div>
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#8D5B4C]">
                  Free
                </span>
                <span className="text-xs text-[#8C857B] font-medium">Open to Every Reader</span>
              </div>
            </motion.div>

          </div>

          {/* Right Cinematic Editorial Composition (5 cols) with Official Emblem Integration */}
          <motion.div 
            variants={heroItemVariants}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Decorative Literary Frame */}
              <div className="absolute -inset-3 rounded-3xl bg-[#E8E2D5]/60 rotate-1 -z-10" />
              
              {/* Main Photo Card */}
              <div className="rounded-2xl overflow-hidden shadow-xl border border-[#E8E2D5] bg-[#1C1B1A] relative group">
                <img
                  src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
                  alt="A reader immersed in a physical book"
                  className="w-full h-[470px] object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B1A]/85 via-[#1C1B1A]/20 to-transparent" />
                
                {/* Official Brand Emblem Seal Overlaid Elegantly */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute top-4 right-4 w-20 h-20 rounded-full shadow-2xl border-2 border-[#E8E2D5] overflow-hidden bg-[#FAF8F5]/90 backdrop-blur-md p-1"
                  title="Official Seal — Readers of Aurangabad"
                >
                  <img
                    src="/brand/logo.png"
                    alt="Readers of Aurangabad Seal"
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                {/* Floating Quote Stamp */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-xl bg-[#FAF8F5]/95 backdrop-blur-md border border-[#E8E2D5] shadow-lg">
                  <p className="font-serif italic text-sm text-[#1C1B1A] leading-relaxed">
                    "A reader lives a thousand lives before he dies. The man who never reads lives only one."
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8E2D5]">
                    <span className="text-[10px] font-sans font-semibold text-[#8D5B4C] uppercase tracking-wider">
                      — Readers of Aurangabad
                    </span>
                    <span className="text-[10px] text-[#455240] font-semibold">MH20 Movement</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* 2. INTRODUCTION SECTION WITH SCROLL-TRIGGERED REVEAL */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E8E2D5] shadow-sm mx-auto bg-white p-1">
          <img src="/brand/logo.png" alt="Emblem" className="w-full h-full object-contain" />
        </div>
        
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1C1B1A]">
          {t.intro.heading}
        </h2>
        
        <p className="text-sm sm:text-base font-semibold uppercase tracking-widest text-[#8D5B4C]">
          {t.intro.subheading}
        </p>

        <p className="text-lg sm:text-xl text-[#595550] font-serif leading-relaxed italic max-w-3xl mx-auto">
          "{t.intro.body}"
        </p>
      </motion.section>

      {/* 3. OUR PHILOSOPHY (4 Editorial Cards with Staggered Entrance) */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
      >
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
            {t.philosophy.heading}
          </h2>
          <p className="text-base text-[#595550] max-w-2xl mx-auto">
            {t.philosophy.subheading}
          </p>
        </div>

        <motion.div 
          variants={cardStaggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Card 1 */}
          <motion.div variants={cardItemVariants} className="paper-card p-8 rounded-2xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors">
                {t.philosophy.p1Title}
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                {t.philosophy.p1Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#F4EFEA] text-[11px] font-semibold text-[#8D5B4C] uppercase tracking-wider">
              01 • Shared Experience
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={cardItemVariants} className="paper-card p-8 rounded-2xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors">
                {t.philosophy.p2Title}
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                {t.philosophy.p2Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#F4EFEA] text-[11px] font-semibold text-[#8D5B4C] uppercase tracking-wider">
              02 • Open Intellect
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={cardItemVariants} className="paper-card p-8 rounded-2xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] group-hover:scale-105 transition-transform">
                <Feather className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors">
                {t.philosophy.p3Title}
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                {t.philosophy.p3Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#F4EFEA] text-[11px] font-semibold text-[#8D5B4C] uppercase tracking-wider">
              03 • Empathy & Voice
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={cardItemVariants} className="paper-card p-8 rounded-2xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] group-hover:scale-105 transition-transform">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors">
                {t.philosophy.p4Title}
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                {t.philosophy.p4Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#F4EFEA] text-[11px] font-semibold text-[#8D5B4C] uppercase tracking-wider">
              04 • Real Bonds
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 4. UPCOMING GATHERINGS */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D5] pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block mb-1">
              Events in Aurangabad
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
              {t.gatherings.upcomingHeading}
            </h2>
            <p className="text-sm text-[#595550] mt-1">
              {t.gatherings.upcomingSub}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentPage('gatherings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#1C1B1A] hover:text-[#455240] flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>{t.gatherings.viewAllGatherings}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingMeetups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingMeetups.map((meetup) => (
              <motion.div 
                key={meetup.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="paper-card rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-56 overflow-hidden bg-[#1C1B1A]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {meetup.edition && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#1C1B1A] text-white">
                          {meetup.edition}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF0E9] text-[#2E372B] border border-[#455240]/20">
                        {meetup.registrationStatus === 'open' ? 'Open for RSVP' : 'Announced'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors leading-snug">
                      {meetup.title}
                    </h3>

                    <p className="text-sm text-[#595550] line-clamp-2 leading-relaxed">
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
                        <span>{meetup.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-[#F4EFEA]">
                  <button
                    onClick={() => setSelectedMeetup(meetup)}
                    className="text-xs font-semibold text-[#595550] hover:text-[#1C1B1A] transition-colors cursor-pointer"
                  >
                    View Schedule & Details
                  </button>

                  <a
                    href={meetup.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1C1B1A] hover:bg-[#455240] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    <span>{t.gatherings.registerNow}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Next Chapter in the Making
            </h3>
            <p className="text-base text-[#595550] font-serif italic">
              "{t.gatherings.emptyUpcoming}"
            </p>
            <div className="pt-2">
              <a
                href="https://instagram.com/readers.of.aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-[#455240] transition-colors"
              >
                <span>Follow on Instagram for Announcement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </motion.section>

      {/* 5. COMMUNITY MOMENTS (Editorial Image Gallery Grid with Hover Interactions) */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
            Real Photographs & Authentic Moments
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
            {t.community.galleryTitle}
          </h2>
          <p className="text-sm text-[#595550] max-w-xl mx-auto">
            Glimpses of quiet contemplation and heartfelt conversations under the Deccan sky.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {gallery.slice(0, 6).map((item) => (
            <div 
              key={item.id}
              className="group relative h-48 rounded-xl overflow-hidden border border-[#E8E2D5] bg-[#1C1B1A]"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                <span className="text-[11px] font-semibold text-white leading-tight">
                  {item.title}
                </span>
                <span className="text-[9px] text-[#E8E2D5]">{item.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setCurrentPage('community');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1B1A] hover:text-[#455240] editorial-link py-1 cursor-pointer"
          >
            <span>Explore full community archive</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.section>

      {/* 6. JOURNAL PREVIEW */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D5] pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block mb-1">
              Words & Reflections
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
              {t.journal.heading}
            </h2>
            <p className="text-sm text-[#595550] mt-1">
              {t.journal.subheading}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentPage('journal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#1C1B1A] hover:text-[#455240] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Browse All Articles</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feature (7 cols) */}
          {featuredArticle && (
            <motion.div 
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedArticle(featuredArticle)}
              className="lg:col-span-7 paper-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative h-72 sm:h-80 overflow-hidden bg-[#1C1B1A]">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#1C1B1A] border border-[#E8E2D5] shadow-sm">
                    Featured Reflection
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#8C857B]">
                  <span className="text-[#8D5B4C] font-semibold uppercase">{featuredArticle.category}</span>
                  <span>•</span>
                  <span>{featuredArticle.readingTime} {t.journal.readTime}</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors leading-snug">
                  {featuredArticle.title}
                </h3>

                <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
                  {featuredArticle.excerpt}
                </p>

                <div className="pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#8C857B]">
                  <span>By {featuredArticle.author}</span>
                  <span className="font-semibold text-[#1C1B1A] group-hover:text-[#455240] flex items-center gap-1">
                    {t.journal.readArticle} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* List of Other Articles (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {recentArticles.filter(a => a.id !== featuredArticle?.id).map((article) => (
              <motion.div
                key={article.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedArticle(article)}
                className="paper-card p-6 rounded-xl cursor-pointer group flex gap-4 items-start"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#1C1B1A]">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-[#8D5B4C] uppercase tracking-wider block">
                    {article.category} • {article.language.toUpperCase()}
                  </span>
                  
                  <h4 className="font-serif font-bold text-base text-[#1C1B1A] group-hover:text-[#455240] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>

                  <div className="flex items-center gap-2 text-[11px] text-[#8C857B] pt-1">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.readingTime} min</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-6 rounded-xl bg-[#F4EFEA] border border-[#E8E2D5] space-y-2">
              <h4 className="font-serif font-bold text-base text-[#1C1B1A]">
                Have a story or essay to submit?
              </h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                We accept reader memoirs, poems, and book critiques in English, Hindi, Urdu, and Marathi.
              </p>
              <button
                onClick={() => {
                  setCurrentPage('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#455240] hover:text-[#1C1B1A] pt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Submit to Journal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </motion.section>

      {/* 7. COMMUNITY CTA BANNER */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="relative rounded-3xl bg-[#1C1B1A] text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#455240]/40 blur-3xl" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#8D5B4C]/30 blur-3xl" />

          <div className="relative max-w-2xl space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2A2826] text-[#B88B4A] border border-[#363330] inline-block uppercase tracking-wider">
              Every Reader Deserves a Place
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
              Whether you read every day or are just beginning, there is a place for you here.
            </h2>

            <p className="text-base sm:text-lg text-[#B4ADA2] font-sans leading-relaxed">
              No registration fees. No judgment on what you read. Just good people, quiet sunlight, and the magic of physical books in Aurangabad.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCurrentPage('get-involved');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#FAF8F5] hover:bg-[#E8E2D5] text-[#1C1B1A] px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all shadow-md cursor-pointer"
              >
                Become a Part of Us
              </motion.button>

              <a
                href="https://instagram.com/readers.of.aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white border border-[#363330] hover:bg-[#2A2826] transition-all"
              >
                Instagram: @readers.of.aurangabad
              </a>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
};
