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
    neem: 'text-[#5E7A63] dark:text-[#8BA890]',
    clay: 'text-[#A8431F]',
    marigold: 'text-[#E8B04A]',
  };

  return (
    <span
      className={`inline-block text-[12px] sm:text-[13px] font-bold tracking-[0.2em] uppercase ${colorClasses[color]} ${className}`}
    >
      {children}
    </span>
  );
};
