import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  color?: 'neem' | 'clay' | 'marigold';
  className?: string;
}

export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  color = 'neem',
  className = '',
}) => {
  const colorClasses = {
    neem: 'text-[#6E6960] dark:text-[#B8B2A8]',
    clay: 'text-[#F4512C]',
    marigold: 'text-[#171717] dark:text-[#D9F36A]',
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] sm:text-[12px] font-bold tracking-[0.22em] uppercase ${colorClasses[color]} ${className}`}
    >
      <span className="mr-2 inline-block h-2 w-2 bg-current" aria-hidden="true" />
      {children}
    </span>
  );
};
