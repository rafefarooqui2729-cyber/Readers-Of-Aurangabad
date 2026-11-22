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
  <div className={`rr-section-head ${className}`.trim()}>
    <div className="rr-section-head__copy">
      <p className="rr-eyebrow">{eyebrow}</p>
      <h2 className="rr-title rr-title--compact mt-4">{title}</h2>
      {description ? <p className="rr-lede mt-4">{description}</p> : null}
    </div>
    {action ? <div className="rr-section-head__action">{action}</div> : null}
  </div>
);
