import React from 'react';

export type BentoSurface = 'paper' | 'lavender' | 'peach' | 'mint' | 'blue' | 'dark';

interface BentoCardProps {
  surface?: BentoSurface;
  label?: string;
  tape?: boolean;
  className?: string;
  children: React.ReactNode;
}

const surfaces: Record<BentoSurface, string> = {
  paper: 'ed-card--paper',
  lavender: 'ed-card--lavender',
  peach: 'ed-card--peach',
  mint: 'ed-card--mint',
  blue: 'ed-card--blue',
  dark: 'ed-card--dark',
};

/** A reusable editorial bento tile with an optional restrained tape detail. */
export const BentoCard: React.FC<BentoCardProps> = ({
  surface = 'paper',
  label,
  tape = false,
  className = '',
  children,
}) => (
  <article className={`ed-card ${surfaces[surface]} ${className}`.trim()}>
    {tape ? <span className="ed-tape" aria-hidden="true" /> : null}
    {label ? <p className="ed-card__label">{label}</p> : null}
    {children}
  </article>
);
