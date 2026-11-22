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
  paper: 'rr-panel--plain',
  lavender: '',
  peach: '',
  mint: 'rr-panel--sage',
  blue: '',
  dark: 'rr-panel--forest',
};

/**
 * Compatibility panel primitive. The old scrapbook surface names now map to
 * plain City Reading Collective surfaces so existing callers stay compatible.
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  surface = 'paper',
  label,
  className = '',
  children,
}) => (
  <article className={`rr-panel ${surfaces[surface]} ${className}`.trim()}>
    {label ? <p className="rr-eyebrow rr-eyebrow--small">{label}</p> : null}
    {children}
  </article>
);
