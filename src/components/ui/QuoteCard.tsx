import React from 'react';

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
}) => (
  <figure className={`rr-panel rr-quote-panel ${className}`.trim()}>
    <blockquote className="rr-quote">&ldquo;{quote}&rdquo;</blockquote>
    <figcaption className="rr-quote-caption">
      <div>
        <cite className="rr-quote-cite-name">{memberName}</cite>
        {location ? <span className="rr-quote-cite-meta">{location}</span> : null}
      </div>
      <span className="rr-quote-year">{joinYear}</span>
    </figcaption>
  </figure>
);
