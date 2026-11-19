import React from 'react';

interface StampProps {
  year?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({
  year = '2024',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24 text-[9px]',
    md: 'w-32 h-32 text-[10px]',
    lg: 'w-40 h-40 text-[12px]',
  };

  return (
    <div
      aria-label={`Community stamp: Readers of Aurangabad, Established ${year}`}
      className={`relative inline-flex items-center justify-center rounded-none border-[3px] border-[#171717] bg-[#D9F36A] p-2 text-center select-none rotate-[-6deg] transition-transform duration-200 hover:rotate-[-2deg] shadow-[6px_6px_0_#171717] ${sizeClasses[size]} ${className}`}
    >
      <div className="flex flex-col items-center justify-center font-sans uppercase tracking-widest text-[#171717] leading-tight">
        <span className="text-[0.75em] font-bold tracking-[0.22em]">
          MH20 READING
        </span>
        <span className="font-display text-[1.05em] my-1 tracking-[0.04em] px-1 text-center leading-[0.95]">
          READERS OF
          <br />
          AURANGABAD
        </span>
        <span className="text-[0.8em] font-bold tracking-[0.18em] border-t-2 border-[#171717] pt-1 mt-1">
          EST. {year}
        </span>
      </div>
    </div>
  );
};
