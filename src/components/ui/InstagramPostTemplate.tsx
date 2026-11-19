import React from 'react';

interface InstagramPostTemplateProps {
  edition: string;
  bookTitle: string;
  bookAuthor?: string;
  date: string;
  time: string;
  venue: string;
  city?: string;
  id?: string;
}

export const InstagramPostTemplate: React.FC<InstagramPostTemplateProps> = ({
  edition,
  bookTitle,
  bookAuthor,
  date,
  time,
  venue,
  city = 'Aurangabad (MH20)',
  id = 'instagram-post-canvas',
}) => {
  return (
    <div
      id={id}
      style={{ width: '720px', height: '720px' }}
      className="relative bg-[#1B2A49] text-[#F4ECDD] p-12 flex flex-col justify-between overflow-hidden select-none border-4 border-[#E8B04A]/30"
    >
      {/* Marigold circle accent in the top-right corner */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#E8B04A] opacity-90 blur-0 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-8 right-8 text-[#1B2A49] font-sans font-bold text-xs tracking-[0.25em] uppercase z-10"
      >
        MH20
      </div>

      {/* Top Header */}
      <div className="z-10">
        <span className="font-sans text-xs font-bold tracking-[0.3em] uppercase text-[#E8B04A] block mb-2">
          READERS OF AURANGABAD · {edition}
        </span>
        <div className="w-16 h-1 bg-[#A8431F]" />
      </div>

      {/* Middle: Big Book Title & Author */}
      <div className="my-auto z-10 max-w-[580px]">
        <p className="font-sans text-sm font-semibold tracking-wider uppercase text-[#E8B04A]/90 mb-2">
          Featured Reading / Theme
        </p>
        <h1 className="font-serif font-bold text-5xl leading-tight text-[#F4ECDD] drop-shadow-sm">
          {bookTitle}
        </h1>
        {bookAuthor && (
          <p className="font-serif italic text-2xl text-[#E8B04A] mt-3">
            by {bookAuthor}
          </p>
        )}
      </div>

      {/* Bottom: Date, Time, Venue, and Brand Stamp */}
      <div className="pt-6 border-t-2 border-[#F4ECDD]/20 flex items-end justify-between z-10">
        <div className="space-y-1 text-sm font-sans">
          <p className="font-bold text-[#F4ECDD] text-base">{date}</p>
          <p className="text-[#D1C5B0]">{time}</p>
          <p className="text-[#E8B04A] font-medium">{venue}, {city}</p>
        </div>

        <div className="text-right">
          <span className="font-sans font-bold text-xs tracking-widest uppercase text-[#F4ECDD]/70 block">
            FREE & OPEN TO ALL
          </span>
          <span className="font-serif italic text-sm text-[#E8B04A] block mt-0.5">
            @books.toread._
          </span>
        </div>
      </div>
    </div>
  );
};
