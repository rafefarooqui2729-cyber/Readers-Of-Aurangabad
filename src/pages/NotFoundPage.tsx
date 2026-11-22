import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, BookOpen, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../components/ui/Button';
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
    <div className="rr-home">
      <section className="rr-container flex min-h-[75vh] items-center py-16 sm:py-24" aria-labelledby="not-found-title">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl"
        >
          <div className="grid gap-10 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-14">
            <div className="border-r border-[color:var(--rr-border)] pr-8">
              <p className="font-display text-7xl leading-none text-[color:var(--rr-brass)] md:text-8xl">
                404
              </p>
              <p className="rr-meta mt-5 text-[color:var(--rr-muted)]">
                Chapter not found · MH20
              </p>
            </div>
            <div>
              <h1 id="not-found-title" className="rr-title">
                This page is off the shelf.
              </h1>
              <p className="rr-quote mt-8">
                The link you followed doesn&apos;t lead to a published chapter. Head back to the reading
                movement or browse upcoming gatherings in Aurangabad.
              </p>

              <div className="mt-10 border-t border-[color:var(--rr-border)] pt-7">
                <p className="rr-meta flex items-center gap-2 text-[color:var(--rr-terracotta)]">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Reading tip
                </p>
                <p className="rr-body mt-3 max-w-[58ch]">
                  Looking for an event, announcement, or registration link? Check Gatherings for the
                  latest chapter details and community updates.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" onClick={handleReturnHome} className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Return home
                </Button>
                <Button variant="secondary" onClick={handleBrowseGatherings} className="w-full sm:w-auto">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Explore gatherings
                </Button>
              </div>
            </div>
          </div>

          <p className="rr-meta mt-16 border-t border-[color:var(--rr-border)] pt-5 text-[color:var(--rr-muted)]">
            Readers of Aurangabad · Est. {siteConfig.establishedYear}
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default NotFoundPage;
