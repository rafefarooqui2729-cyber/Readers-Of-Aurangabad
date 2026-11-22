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
    neem: 'text-[#5E5B55] dark:text-[#C9C4BA]',
    clay: 'text-[#F47B49]',
    marigold: 'text-[#F47B49] dark:text-[#FFD8C1]',
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] sm:text-[12px] font-semibold tracking-[0.16em] uppercase ${colorClasses[color]} ${className}`}
    >
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
};
