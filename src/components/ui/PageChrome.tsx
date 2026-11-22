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

/** Shared full-bleed photographic masthead for public pages. */
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
  <section
    className="relative isolate flex min-h-[clamp(380px,52vh,560px)] flex-col justify-end overflow-hidden bg-[#24262D]"
    aria-label={title}
  >
    <img
      src={image}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${imagePosition} grayscale-[0.08] contrast-[1.02]`}
      fetchPriority="high"
    />
    <div
      className="absolute inset-0 bg-gradient-to-t from-[#24262D]/95 via-[#24262D]/60 to-[#24262D]/10"
      aria-hidden="true"
    />
    <div
      className="absolute inset-y-0 left-0 w-1.5 bg-[#F47B49]"
      aria-hidden="true"
    />
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12">
      <span className="mb-4 inline-flex rounded-full bg-[#FFD8C1] px-3 py-1 font-sans text-[11px] font-semibold tracking-[0.14em] text-[#24262D]">
        MH20 / Aurangabad
      </span>
      <div className="mb-3">
        <Eyebrow color="clay">{eyebrow}</Eyebrow>
      </div>
      <h1
        className={
          titleSize === 'compact'
            ? 'max-w-3xl font-display text-[clamp(2.1rem,4.5vw,3.6rem)] leading-[1.05] tracking-[-0.025em] text-balance text-[#F7F3EB]'
            : 'max-w-4xl font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] tracking-[-0.025em] text-balance text-[#F7F3EB]'
        }
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl border-l-2 border-[#F47B49] pl-4 font-serif text-lg italic leading-relaxed text-[#F7F3EB]/90 sm:text-xl">
        {lead}
      </p>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  </section>
);

interface PaperPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Warm paper surface used across interior pages. */
export const PaperPanel: React.FC<PaperPanelProps> = ({ children, className = '' }) => (
  <div
    className={`rounded-lg border border-[#24262D]/12 bg-[#FFFDF8] shadow-[var(--mh20-shadow-sm)] dark:border-[#F7F3EB]/15 dark:bg-[#2B2E36] ${className}`.trim()}
  >
    {children}
  </div>
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
  <div className={`${center ? 'text-center' : ''} ${className}`.trim()}>
    <Eyebrow color="clay">{eyebrow}</Eyebrow>
    <h2
      className={
        size === 'compact'
          ? 'mt-2 font-display text-2xl leading-[1.12] tracking-[-0.02em] text-[#24262D] dark:text-[#F7F3EB] sm:text-3xl'
          : 'mt-2 font-display text-3xl leading-[1.1] tracking-[-0.02em] text-[#24262D] dark:text-[#F7F3EB] sm:text-4xl lg:text-5xl'
      }
    >
      {title}
    </h2>
    {description ? (
      <p className={`mt-4 ${center ? 'mx-auto' : ''} max-w-2xl font-sans text-sm leading-relaxed text-[#5E5B55] dark:text-[#D4CFC5] sm:text-base`}>
        {description}
      </p>
    ) : null}
    <span
      className={`mt-5 block h-[2px] w-16 rounded bg-[#F47B49] ${center ? 'mx-auto' : ''}`}
      aria-hidden="true"
    />
  </div>
);

export const fieldClasses =
  'w-full rounded border border-[#24262D]/20 bg-[#FFFDF8] px-3.5 py-3 font-sans text-sm text-[#24262D] placeholder:text-[#5E5B55] focus:border-[#F47B49] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(244,123,73,0.18)] dark:border-[#F7F3EB]/25 dark:bg-[#2B2E36] dark:text-[#F7F3EB] dark:placeholder:text-[#D4CFC5]';

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
  <div className={className}>
    <label
      htmlFor={id}
      className="mb-1.5 block font-sans text-xs font-semibold tracking-[0.05em] text-[#24262D] dark:text-[#F7F3EB]"
    >
      {label}
      {required ? <span className="ml-1 text-[#F47B49]">*</span> : null}
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
    className={`min-h-[44px] rounded border border-[#24262D]/25 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F47B49] ${
      active
        ? 'border-[#24262D] bg-[#F47B49] text-white shadow-[var(--mh20-shadow-sm)]'
        : 'border-[#24262D]/25 bg-[#FFFDF8] text-[#24262D] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:border-[#24262D] hover:bg-[#C7EFDE] hover:text-[#24262D] dark:border-[#F7F3EB]/30 dark:bg-[#2B2E36] dark:text-[#F7F3EB] dark:hover:bg-[#C7EFDE] dark:hover:text-[#24262D]'
    } ${className}`.trim()}
    {...props}
  />
);
