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
      className={`relative bg-[#FFF8EA] dark:bg-[#243557] border-2 border-[#1B2A49] dark:border-[#384F7A] text-[#1B2A49] dark:text-[#F4ECDD] rounded-[6px] p-6 sm:p-8 overflow-visible ${className}`}
    >
      {/* Hanging Clay Ribbon with V-cut bottom (clip-path polygon) */}
      <div
        className="absolute -top-3 right-6 sm:right-8 w-8 sm:w-9 h-14 bg-[#A8431F] text-[#F4ECDD] flex items-start justify-center pt-1.5 shadow-sm select-none z-10"
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
