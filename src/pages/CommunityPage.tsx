import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Heart, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { CommunityGallery } from '../components/CommunityGallery';

export const CommunityPage: React.FC = () => {
  const { stories, setCurrentPage } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const revealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeCurve } },
  };

  return (
    <div className="pb-16 paper-grain overflow-hidden">

      {/* ── HERO with roa-049 background ───────────────────────────────── */}
      <section className="relative min-h-[52vh] sm:min-h-[60vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/enhanced/gallery/roa-049-2026-11-05.webp"
            alt="Readers of Aurangabad community"
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
            <Heart className="w-3 h-3 text-[#A65F46]" />
            The Soul of Readers of Aurangabad
          </span>

          <h1 className="font-serif font-bold text-[#F2EBDD] leading-[1.0]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
          >
            Our Readers<br />&amp; Stories
          </h1>

          <p className="font-serif italic text-[#F2EBDD]/75 text-lg sm:text-xl max-w-2xl leading-relaxed">
            "A community is not defined by follower counts, but by the warmth with which we listen to each other's stories."
          </p>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B89A65]/30 to-transparent" />
      </section>

      <div className="space-y-10 sm:space-y-12">

        {/* ── READER STORIES ─────────────────────────────────────────────── */}
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 sm:pt-12 space-y-6"
        >
          <div className="border-b border-[#E5DFD4] pb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block mb-2">
              01 — Testimonials of Stillness
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#20231F]">
              Voices of Real Readers
            </h2>
            <p className="text-sm text-[#595550] mt-1">
              Authentic reflections from members of the MH20 reading circle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <motion.div
                key={story.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="glass-card p-8 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                {/* Large decorative quote mark */}
                <span className="absolute top-4 right-5 font-serif font-bold text-6xl text-[#E5DFD4] select-none leading-none">
                  "
                </span>

                <div className="space-y-4 relative z-10">
                  <p className="font-serif italic text-base sm:text-lg text-[#20231F] leading-relaxed">
                    "{story.quote}"
                  </p>

                  <p className="text-xs text-[#595550] leading-relaxed">{story.story}</p>

                  {story.favoriteBooks && story.favoriteBooks.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A65F46] block mb-1.5">
                        Favourite Reads
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {story.favoriteBooks.map((book, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md text-[11px] bg-white/80 text-[#20231F] border border-[#E5DFD4]">
                            {book}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E5DFD4]/60 flex items-center gap-3">
                  {story.avatar ? (
                    <img
                      src={story.avatar}
                      alt={story.name}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover object-[center_15%] border border-[#E5DFD4]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#20231F] text-[#F2EBDD] flex items-center justify-center font-serif font-bold text-sm">
                      {story.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#20231F]">{story.name}</h4>
                    {story.location && (
                      <span className="text-[11px] text-[#8C857B] block">{story.location}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── FULL COMMUNITY GALLERY ─────────────────────────────────────── */}
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 space-y-10"
        >
          <div className="border-b border-[#E5DFD4] pb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block mb-2">
              02 — The Complete Archive
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#20231F]">
              Community Photographs
            </h2>
            <p className="text-sm text-[#595550] mt-1">
              Real moments from real meetups — browse by category, open in full-screen.
            </p>
          </div>

          <CommunityGallery compact={false} />
        </motion.section>

        {/* ── STEWARDSHIP ───────────────────────────────────────────────── */}
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A65F46] block">
              03 — Humble Leadership
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#20231F]">
              The Stewards of the Movement
            </h2>
            <p className="text-sm text-[#595550] max-w-xl mx-auto">
              Prioritizing community warmth over individual acclaim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 sm:p-8 rounded-2xl flex items-start gap-5">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E5DFD4] bg-[#20231F] shrink-0">
                <img
                  src="/images/enhanced/community/founder-portrait.webp"
                  alt="Abdul Rafe Farooqui"
                  loading="lazy"
                  className="w-full h-full object-cover object-[center_15%]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/enhanced/thumbnails/roa-061-2026-11-05-thumb.webp';
                  }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-xl text-[#20231F]">Abdul Rafe Farooqui</h3>
                <p className="text-xs font-semibold text-[#A65F46] uppercase tracking-wider">Founder, Readers of Aurangabad</p>
                <p className="text-xs text-[#595550] leading-relaxed">
                  Began the movement to bring the tactile joy of paperbacks back to Aurangabad's public spaces. Believes every reader holds a vital perspective.
                </p>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-[#E8ECE0] text-[#777C60] flex items-center justify-center shrink-0 border border-[#777C60]/20">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-xl text-[#20231F]">The Community Volunteers</h3>
                <p className="text-xs font-semibold text-[#777C60] uppercase tracking-wider">Coordinators &amp; Event Stewards</p>
                <p className="text-xs text-[#595550] leading-relaxed">
                  Local students, educators, and readers who arrive early on Sunday mornings to lay out mats, welcome first-timers, and keep the space friendly.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── INVITATION BANNER ─────────────────────────────────────────── */}
        <motion.section
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-5"
        >
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#20231F]">
            Share Your Reading Journey
          </h3>
          <p className="text-sm text-[#595550] max-w-lg mx-auto">
            Have you attended a meetup or rediscovering books in Aurangabad? We would love to feature your story in this archive.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setCurrentPage('get-involved'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 glass-button px-7 py-3 rounded-full text-sm font-semibold cursor-pointer"
          >
            <span>Share Your Story or Volunteer</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.section>

      </div>
    </div>
  );
};
