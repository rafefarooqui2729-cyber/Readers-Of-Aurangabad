import React from 'react';
import { siteConfig } from '../../content/siteConfig';

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
      className="relative bg-[#24262D] text-[#F7F3EB] p-12 flex flex-col justify-between overflow-hidden select-none border-4 border-[#FFD8C1]/30"
    >
      {/* Peach circle accent in the top-right corner */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FFD8C1] opacity-90 blur-0 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-8 right-8 text-[#24262D] font-sans font-bold text-xs tracking-[0.25em] uppercase z-10"
      >
        MH20
      </div>

      {/* Top Header */}
      <div className="z-10">
        <span className="font-sans text-xs font-bold tracking-[0.3em] uppercase text-[#FFD8C1] block mb-2">
          READERS OF AURANGABAD · {edition}
        </span>
        <div className="w-16 h-1 bg-[#F47B49]" />
      </div>

      {/* Middle: Big Book Title & Author */}
      <div className="my-auto z-10 max-w-[580px]">
        <p className="font-sans text-sm font-semibold tracking-wider uppercase text-[#FFD8C1]/90 mb-2">
          Featured Reading / Theme
        </p>
        <h1 className="font-serif font-bold text-5xl leading-tight text-[#F7F3EB] drop-shadow-sm">
          {bookTitle}
        </h1>
        {bookAuthor && (
          <p className="font-serif italic text-2xl text-[#FFD8C1] mt-3">
            by {bookAuthor}
          </p>
        )}
      </div>

      {/* Bottom: Date, Time, Venue, and Brand Stamp */}
      <div className="pt-6 border-t-2 border-[#F7F3EB]/20 flex items-end justify-between z-10">
        <div className="space-y-1 text-sm font-sans">
          <p className="font-bold text-[#F7F3EB] text-base">{date}</p>
          <p className="text-[#D4CFC5]">{time}</p>
          <p className="text-[#FFD8C1] font-medium">{venue}, {city}</p>
        </div>

        <div className="text-right">
          <span className="font-sans font-bold text-xs tracking-widest uppercase text-[#F7F3EB]/70 block">
            FREE & OPEN TO ALL
          </span>
          <span className="font-serif italic text-sm text-[#FFD8C1] block mt-0.5">
            {siteConfig.instagramHandle}
          </span>
        </div>
      </div>
    </div>
  );
};
