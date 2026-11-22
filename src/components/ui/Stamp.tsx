import React from 'react';

interface StampProps {
  year?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Quiet typographic imprint — not a sticker or decorative stamp. */
export const Stamp: React.FC<StampProps> = ({
  year = '2024',
  size = 'md',
  className = '',
}) => (
  <div
    aria-label={`Reading-room imprint: Readers of Aurangabad, Established ${year}`}
    className={`rr-imprint rr-imprint--${size} ${className}`.trim()}
  >
    <span className="rr-imprint__meta">Aurangabad · MH20</span>
    <span className="rr-imprint__name">Readers of Aurangabad</span>
    <span className="rr-imprint__rule" aria-hidden="true" />
    <span className="rr-imprint__year">Established {year}</span>
  </div>
);
