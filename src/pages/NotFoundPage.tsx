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
        className="max-w-2xl w-full border-2 border-[#171717] bg-[#FFFCF5] p-6 sm:p-10 shadow-[8px_8px_0_#171717] dark:border-[#F4F0E8]/30 dark:bg-[#202020] dark:shadow-[8px_8px_0_#000]"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow color="clay" className="mb-3">
              CHAPTER NOT FOUND · MH20
            </Eyebrow>
            <h1 className="font-display text-4xl uppercase leading-[0.92] tracking-[-0.03em] text-[#171717] dark:text-[#F4F0E8] sm:text-5xl">
              This page is off the shelf.
            </h1>
          </div>
          <Stamp year={siteConfig.establishedYear} size="md" className="!rotate-[-3deg]" />
        </div>

        <p className="mt-5 max-w-xl border-l-4 border-[#F4512C] pl-4 font-serif text-lg italic leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6] sm:text-xl">
          The link you followed doesn&apos;t lead to a published chapter. Head back to the reading
          movement or browse upcoming gatherings in Aurangabad.
        </p>

        <div className="mt-8 border-2 border-[#171717] bg-[#F4F0E8] p-5 dark:border-[#F4F0E8]/25 dark:bg-[#171717]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#171717] bg-[#D9F36A] text-[#171717]">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block font-sans text-xs font-bold uppercase tracking-[0.16em] text-[#F4512C]">
                Reading tip
              </span>
              <p className="mt-1 font-sans text-sm leading-relaxed text-[#171717] dark:text-[#F4F0E8]">
                Looking for an event, announcement, or registration link? Check Gatherings for the
                latest chapter details and community updates.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={handleReturnHome}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Return home
          </Button>
          <Button
            variant="secondary"
            onClick={handleBrowseGatherings}
            className="w-full sm:w-auto"
          >
            <Compass className="mr-2 h-4 w-4" aria-hidden="true" />
            Explore gatherings
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
