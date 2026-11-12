import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A minimal animated open‑book loader.
 * Uses pure CSS keyframes to animate two pages flipping.
 * Respects prefers‑reduced‑motion – if the user has reduced motion enabled,
 * the component renders a static placeholder instead of the animation.
 */
export const BookLoader: React.FC = () => {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div
        className="w-3 h-3 rounded-full bg-[#455240]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

  return (
    <div className="min-h-[50vh] flex items-center justify-center overflow-hidden">
      <div className="relative w-16 h-16">
        {/* Book cover */}
        <div className="absolute inset-0 bg-[#B88B4A] rounded-t-md shadow-md" />
        {/* Left page */}
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-t-md transform-origin-left animate-page-left" />
        {/* Right page */}
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-t-md transform-origin-right animate-page-right" />
      </div>
      {/* CSS keyframes */}
      <style>{`
        @keyframes page-left {
          0% { transform: rotateY(0deg); opacity: 1; }
          50% { transform: rotateY(-120deg); opacity: 0.8; }
          100% { transform: rotateY(-180deg); opacity: 0; }
        }
        @keyframes page-right {
          0% { transform: rotateY(0deg); opacity: 1; }
          50% { transform: rotateY(120deg); opacity: 0.8; }
          100% { transform: rotateY(180deg); opacity: 0; }
        }
        .animate-page-left {
          animation: page-left 1.2s ease-in-out infinite;
        }
        .animate-page-right {
          animation: page-right 1.2s ease-in-out infinite;
        }
        .transform-origin-left { transform-origin: left; }
        .transform-origin-right { transform-origin: right; }
      `}</style>
    </div>
  );
};

