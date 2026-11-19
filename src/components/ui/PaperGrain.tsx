import React from 'react';

export const PaperGrain: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    >
      <svg
        className="w-full h-full opacity-[0.035] dark:opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="paperNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperNoise)" />
      </svg>
    </div>
  );
};
