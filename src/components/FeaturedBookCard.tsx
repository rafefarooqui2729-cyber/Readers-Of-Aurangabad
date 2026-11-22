import React from 'react';
import { BookOpen } from 'lucide-react';
import { bookOfTheMonth } from '../content/books';

interface FeaturedBookCardProps {
  className?: string;
}

/** Uses the existing book-of-the-month content; no book details are invented. */
export const FeaturedBookCard: React.FC<FeaturedBookCardProps> = ({ className = '' }) => {
  const book = bookOfTheMonth;

  return (
    <article className={`rr-book-feature ${className}`.trim()}>
      <div className="rr-book-feature__copy">
        <p className="rr-eyebrow rr-eyebrow--small">Book of the month</p>
        <h3 className="rr-title rr-title--small mt-4">{book.title}</h3>
        <p className="rr-book-feature__author">{book.author}</p>
        <p className="rr-body mt-4">{book.oneLineReason}</p>
        <p className="rr-book-feature__suggester">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Suggested by {book.suggestedBy}
        </p>
      </div>
      <div className="rr-book-feature__cover">
        <img
          src={book.coverImage}
          alt={`Cover shared for ${book.title}`}
          loading="lazy"
        />
      </div>
    </article>
  );
};
