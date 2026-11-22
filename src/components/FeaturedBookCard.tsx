import React from 'react';
import { BookOpen } from 'lucide-react';
import { BentoCard } from './ui/BentoCard';
import { bookOfTheMonth } from '../content/books';

interface FeaturedBookCardProps {
  className?: string;
}

/** Uses the existing book-of-the-month content; no book details are invented. */
export const FeaturedBookCard: React.FC<FeaturedBookCardProps> = ({ className = '' }) => {
  const book = bookOfTheMonth;

  return (
    <BentoCard surface="lavender" label="Book of the month" tape className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="ed-card__title">{book.title}</h3>
          <p className="mt-1.5 text-sm font-medium text-[#24262D]">{book.author}</p>
          <p className="ed-card__body mt-4 max-w-md">{book.oneLineReason}</p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#24262D]/75">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {book.suggestedBy}
          </p>
        </div>
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-md bg-[#24262D]/10 sm:h-32 sm:w-28">
          <img
            src={book.coverImage}
            alt={`Cover shared for ${book.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </BentoCard>
  );
};
