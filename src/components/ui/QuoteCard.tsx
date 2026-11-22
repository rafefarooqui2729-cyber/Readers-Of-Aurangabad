import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface QuoteCardProps {
  quote: string;
  memberName: string;
  joinYear: string;
  location?: string;
  className?: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  memberName,
  joinYear,
  location = 'Aurangabad',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.figure
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={`bg-[#FFD8C1] text-[#24262D] rounded-lg p-6 sm:p-8 flex flex-col justify-between border border-[#24262D]/10 shadow-[var(--mh20-shadow-sm)] ${className}`}
    >
      <blockquote className="font-serif italic text-xl sm:text-2xl leading-relaxed text-[#24262D]">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <figcaption className="mt-6 pt-4 border-t border-[#24262D]/15 flex items-center justify-between">
        <div>
          <cite className="font-sans not-italic font-semibold text-sm text-[#24262D] block">
            {memberName}
          </cite>
          {location && (
            <span className="font-sans text-xs text-[#24262D]/80 block">
              {location}
            </span>
          )}
        </div>
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#24262D]/80 bg-[#24262D]/10 px-2 py-1 rounded">
          {joinYear}
        </span>
      </figcaption>
    </motion.figure>
  );
};
