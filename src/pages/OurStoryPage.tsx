import React from 'react';
import { useApp } from '../context/AppContext';
import { Compass, Heart, Feather, Users, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export const OurStoryPage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="space-y-20 pb-24 paper-grain overflow-hidden">
      
      {/* 1. HERO HEADER */}
      <motion.section 
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeCurve }}
        className="pt-12 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#455240]" />
          <span>The Origin of the Movement</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          Every movement begins with a simple thought.
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-2xl mx-auto leading-relaxed">
          "In a city full of centuries-old stories, we wanted to create a space where people could discover the joy of reading together."
        </p>
      </motion.section>

      {/* 2. THE CORE NARRATIVE (Editorial Layout) */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="paper-card p-8 sm:p-14 rounded-3xl space-y-8 text-base sm:text-lg text-[#2A2826] leading-[1.85] font-serif">
          
          <p className="text-xl sm:text-2xl font-bold text-[#1C1B1A] leading-snug">
            Not another platform telling people which books to read. Not another community limited by genres or languages.
          </p>

          <p>
            Just a simple, enduring idea: <strong>bring readers together, create meaningful real-world experiences, and make reading a part of everyday life again.</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 not-prose font-sans">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <span className="text-xs font-bold text-[#8D5B4C] uppercase tracking-wider block mb-2">The Reality We Saw</span>
              <p className="text-sm text-[#595550] leading-relaxed">
                Screens had colonized our free time. Bookshops were thinning, and solitary readers had nowhere to share their joy without commercial pressure or academic judgment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#EBF0E9]/60 border border-[#455240]/20">
              <span className="text-xs font-bold text-[#455240] uppercase tracking-wider block mb-2">The Sanctuary We Built</span>
              <p className="text-sm text-[#2E372B] leading-relaxed">
                An open sanctuary under trees and across friendly spaces where anyone could bring whatever they were reading, sit quietly for an hour, and make authentic human connections.
              </p>
            </div>
          </div>

          <p>
            Aurangabad—Chhatrapati Sambhajinagar—has historically been a crossroads of civilizational dialogue. From Buddhist rock-cut meditation halls at Ajanta and Ellora, to Sufi sanctuaries and modern educational institutions, this city understands reflection. Readers of Aurangabad (Readers of MH20) is an organic continuation of that legacy for our digital generation.
          </p>

          <p>
            We don't test your comprehension. We don't ask you to finish a book a week. We simply invite you to sit down, open a book, breathe, and belong.
          </p>

        </div>
      </motion.section>

      {/* 3. MISSION, VISION & ETHOS */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="paper-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240]">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">Our Mission</h3>
            <p className="text-sm text-[#595550] leading-relaxed">
              To revive reading as an unhurried, collective cultural habit in Aurangabad by hosting accessible physical gatherings, curating an independent literary journal, and building a community book archive.
            </p>
          </div>

          <div className="paper-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">Our Vision</h3>
            <p className="text-sm text-[#595550] leading-relaxed">
              A city where public parks, gardens, and quiet corners are celebrated as communal reading sanctuaries, where every neighborhood has access to shared books, and where dialogue flourishes across languages.
            </p>
          </div>

          <div className="paper-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#1C1B1A]">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">Our Core Values</h3>
            <ul className="text-xs text-[#595550] space-y-2 leading-relaxed">
              <li><strong>Zero Elitism:</strong> All genres—fiction, textbooks, comics, philosophy—are welcomed equally.</li>
              <li><strong>Radical Inclusivity:</strong> Four regional languages (English, Hindi, Urdu, Marathi) honoured side-by-side.</li>
              <li><strong>Physical Warmth:</strong> Real handshakes, real paper, real presence over social media clout.</li>
            </ul>
          </div>

        </div>
      </motion.section>

      {/* 4. FOUNDER INTRODUCTION WITH EMBLEM INTEGRATION */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="paper-card p-8 sm:p-12 rounded-3xl border border-[#E8E2D5] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Founder Avatar / Portrait Slot with Real Photo & Official Crest */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="w-48 h-56 sm:w-56 sm:h-64 rounded-2xl overflow-hidden border-4 border-[#FAF8F5] shadow-xl bg-[#1C1B1A] relative group"
              >
                <img
                  src="/images/processed/community/founder-abdul-rafe.webp"
                  alt="Abdul Rafe Farooqui — Founder, Readers of Aurangabad"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 w-12 h-12 rounded-full overflow-hidden border border-white/80 shadow-md bg-white p-0.5">
                  <img src="/brand/logo.png" alt="Seal" className="w-full h-full object-contain" />
                </div>
              </motion.div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
                  Abdul Rafe Farooqui
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B4C]">
                  Founder, Readers of Aurangabad
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#8C857B] mt-1">
                  <MapPin className="w-3 h-3 text-[#455240]" />
                  <span>Aurangabad, Maharashtra</span>
                </div>
              </div>
            </div>

            {/* Founder Words */}
            <div className="md:col-span-8 space-y-4 text-sm sm:text-base text-[#595550] leading-relaxed font-serif">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#1C1B1A] border border-[#E8E2D5]">
                <Feather className="w-3.5 h-3.5 text-[#8D5B4C]" />
                <span>Founder’s Note</span>
              </div>

              <p className="italic text-lg text-[#1C1B1A]">
                "I started Readers of Aurangabad with one conviction: readers in our city don't lack curiosity; they simply needed an unhurried, genuine space to gather."
              </p>

              <p>
                When you step into one of our meetups, you aren't asked who you voted for, what language your ancestors spoke, or how many bestsellers you've read. You are welcomed simply as a human being holding a book.
              </p>

              <p>
                This movement belongs entirely to the readers of Aurangabad. Every volunteer who brings extra mats, every reader who shares a favorite poem, and every quiet soul who simply reads in peace shapes our collective narrative.
              </p>

              <div className="pt-2">
                <a
                  href="https://instagram.com/readers.of.aurangabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-[#1C1B1A] hover:text-[#455240] transition-colors"
                >
                  <span>Connect with the Movement on Instagram</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* 4b. VISUAL MILESTONES: THE MOVEMENT IN PHOTOGRAPHS */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block mb-1">
              Photographic Chronicle
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
              Moments That Define Our Movement
            </h2>
          </div>
          <p className="text-xs text-[#8C857B]">
            Authentic snapshots from park lawns and public courtyards in Aurangabad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="paper-card rounded-2xl overflow-hidden group">
            <div className="relative h-64 overflow-hidden bg-[#1C1B1A]">
              <img
                src="/images/processed/community/story-first-circle.webp"
                alt="Quiet reading sanctuary in the park"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#1C1B1A]">The Sacred Hour of Silence</h3>
              <p className="text-xs text-[#595550] leading-relaxed">
                60 minutes where all notifications stop and the only sound is turning paper under morning trees.
              </p>
            </div>
          </div>

          <div className="paper-card rounded-2xl overflow-hidden group">
            <div className="relative h-64 overflow-hidden bg-[#1C1B1A]">
              <img
                src="/images/processed/community/story-historic-venue.webp"
                alt="Historic Delhi Gate chapter gathering"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#1C1B1A]">Reclaiming Public Spaces</h3>
              <p className="text-xs text-[#595550] leading-relaxed">
                Bringing literature into the heart of historic Aurangabad so culture belongs to everyone.
              </p>
            </div>
          </div>

          <div className="paper-card rounded-2xl overflow-hidden group">
            <div className="relative h-64 overflow-hidden bg-[#1C1B1A]">
              <img
                src="/images/processed/hero/terrace-gathering-wide.webp"
                alt="Community assembly on garden terrace"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#1C1B1A]">A Growing Reading Family</h3>
              <p className="text-xs text-[#595550] leading-relaxed">
                Readers across Marathi, Urdu, Hindi, and English gathered side-by-side with zero pretension.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 5. ORGANIZING TEAM & STEWARDSHIP */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: easeCurve }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
            Community Stewards
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
            The Organizing Circle
          </h2>
          <p className="text-sm text-[#595550] max-w-xl mx-auto">
            Driven by passion, run by readers. We don't have corporate sponsors; we have caring citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="paper-card p-6 rounded-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E8E2D5] mx-auto bg-[#1C1B1A]">
              <img src="/images/thumbnails/roa-061-2026-11-05.webp" alt="Abdul Rafe Farooqui" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Abdul Rafe Farooqui</h4>
              <p className="text-xs text-[#8D5B4C] font-semibold">Founder & Community Lead</p>
            </div>
            <p className="text-xs text-[#595550] leading-relaxed">
              Curating gatherings, welcoming new readers, and anchoring the movement's vision.
            </p>
          </div>

          <div className="paper-card p-6 rounded-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] mx-auto text-lg font-serif font-bold">
              VL
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Volunteer Circle</h4>
              <p className="text-xs text-[#8D5B4C] font-semibold">Gathering Logistics & Hospitality</p>
            </div>
            <p className="text-xs text-[#595550] leading-relaxed">
              Managing park coordination, seating mats, tea, and warm welcomes every Sunday morning.
            </p>
          </div>

          <div className="paper-card p-6 rounded-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] mx-auto text-lg font-serif font-bold">
              ED
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Journal Editors</h4>
              <p className="text-xs text-[#8D5B4C] font-semibold">Literature & Multilingual Content</p>
            </div>
            <p className="text-xs text-[#595550] leading-relaxed">
              Reviewing essays, poems, and book reviews in English, Hindi, Urdu, and Marathi.
            </p>
          </div>

          <div className="paper-card p-6 rounded-2xl text-center space-y-3 bg-[#F4EFEA] border-dashed border-[#8D5B4C]/40 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-white border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Join the Circle</h4>
                <p className="text-xs text-[#8D5B4C] font-semibold">Be a Community Steward</p>
              </div>
              <p className="text-xs text-[#595550]">
                Help us host meetups, photograph moments, or organize book donation drives.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={() => {
                  setCurrentPage('get-involved');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#1C1B1A] hover:text-[#455240] underline cursor-pointer"
              >
                Volunteer with Us →
              </button>
            </div>
          </div>

        </div>
      </motion.section>

    </div>
  );
};
