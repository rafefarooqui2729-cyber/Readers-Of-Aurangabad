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
    className="relative isolate flex min-h-[clamp(420px,58vh,620px)] flex-col justify-end overflow-hidden border-b-[3px] border-[#171717] bg-[#171717]"
    aria-label={title}
  >
    <img
      src={image}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover object-[center_25%] grayscale-[0.15] contrast-[1.05]"
      fetchPriority="high"
    />
    <div
      className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/55 to-[#171717]/10"
      aria-hidden="true"
    />
    <div
      className="absolute inset-y-0 left-0 w-2 bg-[#F4512C]"
      aria-hidden="true"
    />
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12">
      <span className="mb-4 inline-flex border-2 border-[#171717] bg-[#D9F36A] px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#171717] shadow-[4px_4px_0_#171717]">
        MH20 / Aurangabad
      </span>
      <div className="mb-3">
        <Eyebrow color="clay">{eyebrow}</Eyebrow>
      </div>
      <h1 className="max-w-4xl font-display text-[clamp(2.6rem,7vw,5.2rem)] uppercase leading-[0.92] tracking-[-0.03em] text-[#F4F0E8]">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl border-l-4 border-[#F4512C] pl-4 font-serif text-lg italic leading-relaxed text-[#F4F0E8]/92 sm:text-xl">
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

/** Warm paper surface with neo-brutalist edge and shadow. */
export const PaperPanel: React.FC<PaperPanelProps> = ({ children, className = '' }) => (
  <div
    className={`border-2 border-[#171717] bg-[#FFFCF5] shadow-[6px_6px_0_#171717] dark:border-[#F4F0E8]/25 dark:bg-[#202020] dark:shadow-[6px_6px_0_#000] ${className}`.trim()}
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
    <h2 className="mt-2 font-display text-3xl uppercase leading-[0.95] tracking-[-0.02em] text-[#171717] dark:text-[#F4F0E8] sm:text-4xl lg:text-5xl">
      {title}
    </h2>
    {description ? (
      <p className={`mt-4 ${center ? 'mx-auto' : ''} max-w-2xl font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6] sm:text-base`}>
        {description}
      </p>
    ) : null}
    <span
      className={`mt-5 block h-[3px] w-20 bg-[#F4512C] ${center ? 'mx-auto' : ''}`}
      aria-hidden="true"
    />
  </div>
);

export const fieldClasses =
  'w-full rounded-none border-2 border-[#171717] bg-[#FFFCF5] px-3.5 py-3 font-sans text-sm text-[#171717] placeholder:text-[#6E6960] focus:border-[#F4512C] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_rgba(244,81,44,0.2)] dark:border-[#F4F0E8]/30 dark:bg-[#202020] dark:text-[#F4F0E8] dark:placeholder:text-[#9E988F]';

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
      className="mb-1.5 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] dark:text-[#F4F0E8]"
    >
      {label}
      {required ? <span className="ml-1 text-[#F4512C]">*</span> : null}
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
    className={`min-h-[44px] rounded-none border-2 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F4512C] ${
      active
        ? 'border-[#171717] bg-[#F4512C] text-white shadow-[4px_4px_0_#171717]'
        : 'border-[#171717] bg-[#FFFCF5] text-[#171717] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8] dark:hover:bg-[#D9F36A] dark:hover:text-[#171717]'
    } ${className}`.trim()}
    {...props}
  />
);
