import React, { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

interface BookHeroObjectProps {
  className?: string;
  style?: React.CSSProperties;
}

const SPRING = { stiffness: 90, damping: 24, mass: 0.7 } as const;

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value));

/**
 * Presentation-only CSS 3D hardcover.
 *
 * The book is decorative and intentionally non-interactive for assistive tech.
 * Its resting pose is defined in CSS, so touch devices and reduced-motion users
 * still see a complete 3D object. Pointer movement only adds a small spring
 * offset through Framer Motion values, never React state.
 */
export const BookHeroObject: React.FC<BookHeroObjectProps> = ({ className = '', style }) => {
  const stageRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const targetRotateY = useTransform(pointerX, [-1, 1], [-5, 5]);
  const targetRotateX = useTransform(pointerY, [-1, 1], [3, -3]);
  const rotateY = useSpring(targetRotateY, SPRING);
  const rotateX = useSpring(targetRotateX, SPRING);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resetPointer = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) resetPointer();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (motionQuery.matches || event.pointerType === 'touch') return;

      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rangeX = Math.max(rect.width * 0.95, 180);
      const rangeY = Math.max(rect.height * 0.95, 200);

      pointerX.set(clampUnit((event.clientX - centerX) / rangeX));
      pointerY.set(clampUnit((event.clientY - centerY) / rangeY));
    };

    motionQuery.addEventListener('change', handleMotionPreference);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('pointerleave', resetPointer);

    return () => {
      motionQuery.removeEventListener('change', handleMotionPreference);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', resetPointer);
      document.removeEventListener('pointerleave', resetPointer);
    };
  }, [pointerX, pointerY]);

  return (
    <div
      ref={stageRef}
      className={`book-hero ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      <div className="book-hero__shadow" />
      <motion.div className="book-hero__rig" style={{ rotateX, rotateY }}>
        <div className="book-hero__object">
          <div className="book-hero__face book-hero__face--back" />
          <div className="book-hero__face book-hero__face--pages-bottom" />
          <div className="book-hero__face book-hero__face--pages-top" />
          <div className="book-hero__face book-hero__face--spine" />
          <div className="book-hero__face book-hero__face--fore-edge" />
          <div className="book-hero__face book-hero__face--front">
            <div className="book-hero__spine-panel" />
            <div className="book-hero__cover">
              <span className="book-hero__cover-kicker">Readers of</span>
              <span className="book-hero__cover-title">Aurangabad</span>
              <span className="book-hero__cover-rule" />
              <span className="book-hero__cover-subtitle">A reading movement</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookHeroObject;
