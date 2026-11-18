import React from 'react';

interface CinematicSectionProps {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  number?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

/**
 * Presentation-only editorial section shell.
 * It does not own data, routing, or modal state; it only composes layout.
 */
export const CinematicSection: React.FC<CinematicSectionProps> = ({
  id,
  eyebrow,
  title,
  lead,
  number,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const hasHeader = Boolean(eyebrow || title || lead);

  return (
    <section id={id} className={`cine-section ${className}`.trim()}>
      <div className="cine-container">
        {hasHeader && (
          <header className={`relative max-w-3xl space-y-5 ${headerClassName}`.trim()}>
            {number && <span className="cine-number absolute -top-10 -left-4" aria-hidden="true">{number}</span>}
            {eyebrow && <span className="cine-eyebrow">{eyebrow}</span>}
            {title && <h2 className="cine-title text-3xl sm:text-4xl lg:text-5xl">{title}</h2>}
            {lead && <p className="cine-lead max-w-2xl">{lead}</p>}
            <span className="cine-gold-rule" aria-hidden="true" />
          </header>
        )}
        <div className={bodyClassName.trim()}>{children}</div>
      </div>
    </section>
  );
};

export default CinematicSection;
