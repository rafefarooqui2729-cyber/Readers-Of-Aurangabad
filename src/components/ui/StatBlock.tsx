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
  const [displayNum, setDisplayNum] = useState<number>(() =>
    shouldReduceMotion || isNaN(rawNum) || rawNum <= 0 ? (isNaN(rawNum) ? 0 : rawNum) : 0,
  );

  useEffect(() => {
    if (shouldReduceMotion || isNaN(rawNum) || rawNum <= 0) return;

    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const increment = rawNum / (duration / stepTime);

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

  if (value === undefined || value === null || String(value).trim() === '') return null;

  const finalValueStr = isNaN(rawNum) ? String(value) : `${displayNum}${suffix}`;

  return (
    <div className={`rr-stat ${className}`.trim()}>
      <span className="rr-stat__value">{finalValueStr}</span>
      <span className="rr-stat__label">{label}</span>
    </div>
  );
};
