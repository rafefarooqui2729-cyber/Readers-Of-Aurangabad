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
      aria-label={`Official Community Stamp: Readers of Aurangabad, Established ${year}`}
      className={`relative inline-flex items-center justify-center rounded-full border-[3px] border-[#E8B04A] p-2 text-center select-none rotate-[-8deg] transition-transform duration-300 hover:rotate-[-4deg] ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: 'inset 0 0 0 2px rgba(232, 176, 74, 0.25)',
      }}
    >
      <div className="flex flex-col items-center justify-center font-serif uppercase tracking-widest text-[#E8B04A] leading-tight">
        <span className="text-[0.8em] font-sans font-bold tracking-[0.25em] opacity-90">
          MEMBER OF
        </span>
        <span className="font-serif font-bold text-[1.1em] my-0.5 tracking-wider px-1 text-center">
          Readers of
          <br />
          Aurangabad
        </span>
        <span className="text-[0.85em] font-sans font-bold tracking-[0.2em] border-t border-[#E8B04A]/60 pt-0.5 mt-0.5">
          EST. {year}
        </span>
      </div>
    </div>
  );
};
