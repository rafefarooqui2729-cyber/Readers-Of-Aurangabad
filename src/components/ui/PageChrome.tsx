import React from 'react';
import { Eyebrow } from './Eyebrow';

interface PageHeroProps {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  lead: string;
  imagePosition?: string;
  srcSet?: string;
  sizes?: string;
  titleSize?: 'default' | 'compact';
  children?: React.ReactNode;
}

/** Shared photographic masthead for public pages. */
export const PageHero: React.FC<PageHeroProps> = ({
  image,
  alt,
  eyebrow,
  title,
  lead,
  imagePosition = 'object-[center_25%]',
  srcSet,
  sizes,
  titleSize = 'default',
  children,
}) => (
  <section className="rr-page-hero" aria-label={title}>
    <img
      src={image}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={`rr-page-hero__image ${imagePosition}`}
      fetchPriority="high"
    />
    <div className="rr-page-hero__shade" aria-hidden="true" />
    <div className="rr-page-hero__edge" aria-hidden="true" />
    <div className="rr-page-hero__inner">
      <p className="rr-page-hero__place">MH20 / Chhatrapati Sambhajinagar</p>
      <div className="rr-page-hero__eyebrow">
        <Eyebrow color="marigold">{eyebrow}</Eyebrow>
      </div>
      <h1 className={`rr-page-hero__title ${titleSize === 'compact' ? 'rr-page-hero__title--compact' : ''}`}>
        {title}
      </h1>
      <p className="rr-page-hero__lead">{lead}</p>
      {children ? <div className="rr-page-hero__actions">{children}</div> : null}
    </div>
  </section>
);

interface PaperPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Plain paper surface used across interior pages. */
export const PaperPanel: React.FC<PaperPanelProps> = ({ children, className = '' }) => (
  <div className={`rr-panel ${className}`.trim()}>{children}</div>
);

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  center = false,
  size = 'default',
  className = '',
}) => (
  <div className={`rr-section-heading ${center ? 'rr-section-heading--center' : ''} ${className}`.trim()}>
    <Eyebrow color="clay">{eyebrow}</Eyebrow>
    <h2 className={`rr-title ${size === 'compact' ? 'rr-title--compact' : ''} mt-4`}>{title}</h2>
    {description ? <p className="rr-lede mt-4">{description}</p> : null}
    <span className="rr-section-heading__rule" aria-hidden="true" />
  </div>
);

export const fieldClasses = 'rr-input';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  invalid = false,
  children,
  className = '',
}) => (
  <div className={`rr-field ${className}`.trim()}>
    <label htmlFor={id} className="rr-label">
      {label}
      {required ? <span className="rr-required">*</span> : null}
    </label>
    {children}
    {invalid ? <span className="sr-only">This field needs attention.</span> : null}
  </div>
);

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  active = false,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    aria-pressed={active}
    className={`rr-filter ${className}`.trim()}
    {...props}
  />
);
