import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface StatBlockProps {
  value?: string | number;
  suffix?: string;
  label: string;
  className?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  value,
  suffix = '',
  label,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const rawNum = typeof value === 'number' ? value : parseInt(String(value || '').replace(/\D/g, ''), 10);
  const [displayNum, setDisplayNum] = useState<number>(() => (shouldReduceMotion || isNaN(rawNum) || rawNum <= 0) ? (isNaN(rawNum) ? 0 : rawNum) : 0);

  useEffect(() => {
    if (shouldReduceMotion || isNaN(rawNum) || rawNum <= 0) {
      return;
    }

    let start = 0;
    const duration = 1200; // ms
    const stepTime = 30;
    const totalSteps = duration / stepTime;
    const increment = rawNum / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= rawNum) {
        setDisplayNum(rawNum);
        clearInterval(timer);
      } else {
        setDisplayNum(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [rawNum, shouldReduceMotion]);

  // Hide cleanly if value is empty or missing
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const finalValueStr = isNaN(rawNum) ? String(value) : `${displayNum}${suffix}`;

  return (
    <div className={`flex flex-col items-center sm:items-start text-center sm:text-left ${className}`}>
      <span className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl text-[#1B2A49] dark:text-[#F4ECDD] tracking-tight leading-none">
        {finalValueStr}
      </span>
      <span className="font-sans text-xs sm:text-sm font-medium text-[#4B5A77] dark:text-[#D1C5B0] mt-2 max-w-[200px]">
        {label}
      </span>
    </div>
  );
};
