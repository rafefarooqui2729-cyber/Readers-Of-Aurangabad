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
  const tone = color === 'neem' ? 'rr-eyebrow--muted' : color === 'marigold' ? 'rr-eyebrow--light' : '';

  return (
    <span className={`rr-eyebrow ${tone} ${className}`.trim()}>
      {children}
    </span>
  );
};
