import React from 'react';
import { Eyebrow } from './Eyebrow';

interface PageHeroProps {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
}

/** Shared full-bleed photographic masthead for public pages. */
export const PageHero: React.FC<PageHeroProps> = ({
  image,
  alt,
  eyebrow,
  title,
  lead,
  children,
}) => (
  <section
    className="relative isolate flex min-h-[clamp(360px,52vh,540px)] flex-col justify-end overflow-hidden bg-[#1B2A49]"
    aria-label={title}
  >
    <img
      src={image}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
      fetchPriority="high"
    />
    <div
      className="absolute inset-0 bg-gradient-to-t from-[#1B2A49]/95 via-[#1B2A49]/45 to-transparent"
      aria-hidden="true"
    />
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 sm:pb-10 lg:px-12">
      <span className="mb-3 block h-px w-10 bg-[#E8B04A]" aria-hidden="true" />
      <Eyebrow color="marigold">{eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-[#F4ECDD]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl font-serif text-lg italic leading-relaxed text-[#F4ECDD]/85 sm:text-xl">
        {lead}
      </p>
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  </section>
);

interface PaperPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Warm paper surface with a hairline ink edge. */
export const PaperPanel: React.FC<PaperPanelProps> = ({ children, className = '' }) => (
  <div
    className={`border border-[#1B2A49]/15 bg-[#FFF8EA] dark:border-[#F4ECDD]/15 dark:bg-[#243557] ${className}`.trim()}
  >
    {children}
  </div>
);

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  center = false,
  className = '',
}) => (
  <div className={`${center ? 'text-center' : ''} ${className}`.trim()}>
    <Eyebrow color="clay">{eyebrow}</Eyebrow>
    <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight text-[#1B2A49] dark:text-[#F4ECDD] sm:text-4xl">
      {title}
    </h2>
    {description ? (
      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0] sm:text-base">
        {description}
      </p>
    ) : null}
    <span className="mt-5 block h-px w-16 bg-[#1B2A49]/25 dark:bg-[#F4ECDD]/25" aria-hidden="true" />
  </div>
);

export const fieldClasses =
  'w-full rounded-[4px] border border-[#1B2A49]/25 bg-[#FFF8EA] px-3.5 py-2.5 font-sans text-sm text-[#1B2A49] placeholder:text-[#5E7A63]/70 focus:border-[#A8431F] focus:outline-none focus:ring-2 focus:ring-[#A8431F]/25 dark:border-[#F4ECDD]/25 dark:bg-[#1B2A49] dark:text-[#F4ECDD] dark:placeholder:text-[#D1C5B0]/60';

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
      className="mb-1.5 block font-sans text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD]"
    >
      {label}
      {required ? <span className="ml-1 text-[#A8431F]">*</span> : null}
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
    className={`min-h-[40px] rounded-[4px] border px-4 py-2 font-sans text-xs font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8431F] ${
      active
        ? 'border-[#A8431F] bg-[#A8431F] text-[#F4ECDD]'
        : 'border-[#1B2A49]/20 text-[#1B2A49] hover:border-[#A8431F] hover:text-[#A8431F] dark:border-[#F4ECDD]/25 dark:text-[#F4ECDD] dark:hover:border-[#E8B04A] dark:hover:text-[#E8B04A]'
    } ${className}`.trim()}
    {...props}
  />
);
