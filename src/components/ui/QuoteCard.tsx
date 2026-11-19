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
      className={`bg-[#E8B04A] text-[#1B2A49] rounded-[6px] p-6 sm:p-8 flex flex-col justify-between border-2 border-[#1B2A49]/20 ${className}`}
    >
      <blockquote className="font-serif italic text-xl sm:text-2xl leading-relaxed text-[#1B2A49]">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <figcaption className="mt-6 pt-4 border-t border-[#1B2A49]/20 flex items-center justify-between">
        <div>
          <cite className="font-sans not-italic font-bold text-sm text-[#1B2A49] block">
            {memberName}
          </cite>
          {location && (
            <span className="font-sans text-xs text-[#1B2A49]/80 block">
              {location}
            </span>
          )}
        </div>
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#1B2A49]/70 bg-[#1B2A49]/10 px-2 py-1 rounded-[4px]">
          {joinYear}
        </span>
      </figcaption>
    </motion.figure>
  );
};
