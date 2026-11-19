import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, BookOpen, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Stamp } from '../components/ui/Stamp';
import { Button } from '../components/ui/Button';
import { Eyebrow } from '../components/ui/Eyebrow';
import { scrollToTop } from '../utils/scroll';
import { siteConfig } from '../content/siteConfig';

export const NotFoundPage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const handleReturnHome = () => {
    setCurrentPage('home');
    scrollToTop();
  };

  const handleBrowseGatherings = () => {
    setCurrentPage('gatherings');
    scrollToTop();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 paper-grain">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full text-center space-y-6 sm:space-y-8"
      >
        {/* Stamp & Chapter Badge */}
        <div className="flex flex-col items-center justify-center gap-3">
          <Stamp year={siteConfig.establishedYear} size="lg" />
          <Eyebrow color="clay" className="mt-2">
            CHAPTER NOT FOUND · MH20
          </Eyebrow>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#1B2A49] dark:text-[#F4ECDD] leading-tight">
            This page is still on someone's shelf.
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#4B5A77] dark:text-[#D1C5B0] leading-relaxed max-w-md mx-auto">
            Perhaps it was borrowed by a reader under the garden shade, or tucked away in an uncatalogued corner. Let’s head back to the circle.
          </p>
        </div>

        {/* Bookmark Motif Card */}
        <div className="bg-[#FFF8EA] dark:bg-[#243557] border-2 border-[#1B2A49]/15 dark:border-[#F4ECDD]/15 rounded-[6px] p-6 text-left max-w-md mx-auto shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-[#A8431F]/10 dark:bg-[#A8431F]/20 text-[#A8431F] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <span className="font-serif font-bold text-base text-[#1B2A49] dark:text-[#F4ECDD] block">
                Reading Tip
              </span>
              <p className="font-sans text-xs sm:text-sm text-[#4B5A77] dark:text-[#D1C5B0] leading-relaxed">
                If you were looking for an event registration or announcement, check our latest Sunday chapter in the gatherings archive.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleReturnHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleBrowseGatherings}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Gatherings</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
