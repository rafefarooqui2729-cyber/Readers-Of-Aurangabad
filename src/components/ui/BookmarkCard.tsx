import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BookmarkCardProps {
  children: React.ReactNode;
  className?: string;
  ribbonLabel?: string;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  children,
  className = '',
  ribbonLabel = 'NEXT MEETUP',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-[#FFFDF8] dark:bg-[#24262D] border-2 border-[#24262D] dark:border-[#384F7A] text-[#24262D] dark:text-[#F7F3EB] rounded-[6px] p-6 sm:p-8 overflow-visible ${className}`}
    >
      {/* Hanging Clay Ribbon with V-cut bottom (clip-path polygon) */}
      <div
        className="absolute -top-3 right-6 sm:right-8 w-8 sm:w-9 h-14 bg-[#F47B49] text-[#F7F3EB] flex items-start justify-center pt-1.5 shadow-sm select-none z-10"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
        }}
        title={ribbonLabel}
      >
        <span className="text-[9px] font-sans font-bold tracking-widest uppercase rotate-90 translate-y-2 whitespace-nowrap opacity-90">
          MH20
        </span>
      </div>

      {children}
    </motion.div>
  );
};
