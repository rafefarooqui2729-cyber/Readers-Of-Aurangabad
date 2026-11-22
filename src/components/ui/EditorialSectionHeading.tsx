import React from 'react';

interface EditorialSectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Shared editorial masthead for full-width public sections. */
export const EditorialSectionHeading: React.FC<EditorialSectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col gap-5 border-b border-[color:var(--mh20-line)] pb-7 md:flex-row md:items-end md:justify-between ${className}`.trim()}>
    <div>
      <p className="ed-kicker">{eyebrow}</p>
      <h2 className="ed-title">{title}</h2>
      {description ? <p className="ed-lede mt-4">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
