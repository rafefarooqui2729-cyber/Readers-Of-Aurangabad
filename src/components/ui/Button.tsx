import React from 'react';
import { isSafeHref } from '../../utils/url';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline-marigold';
  asAnchor?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'primary', asAnchor = false, href, children, className = '', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-sans font-semibold text-sm tracking-[0.01em] min-h-[46px] px-6 py-3 transition-all duration-200 cursor-pointer rounded border border-[#F47B49] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F47B49] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

    const variantClasses = {
      primary:
        'bg-[#F47B49] text-white shadow-[var(--mh20-shadow-sm)] hover:-translate-y-[1px] hover:shadow-[var(--mh20-shadow)] active:translate-y-0 active:shadow-none',
      secondary:
        'bg-[#FFFDF8] text-[#24262D] border-[#24262D]/20 shadow-[var(--mh20-shadow-sm)] hover:bg-[#C7EFDE] hover:-translate-y-[1px] hover:shadow-[var(--mh20-shadow)] dark:bg-[#2B2E36] dark:text-[#F7F3EB] dark:border-[#F7F3EB]/25 dark:hover:bg-[#C7EFDE] dark:hover:text-[#24262D]',
      'outline-marigold':
        'bg-[#C7EFDE] text-[#24262D] border-[#24262D]/15 shadow-[var(--mh20-shadow-sm)] hover:-translate-y-[1px] hover:shadow-[var(--mh20-shadow)]',
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

    // Fail closed: only render an anchor for an explicitly safe href. Empty or
    // unsafe values (e.g. javascript:, data:, protocol-relative) become a
    // disabled button rather than an inert or dangerous link.
    if (asAnchor && href && isSafeHref(href)) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClasses}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={combinedClasses}
        disabled={asAnchor ? true : props.disabled}
        {...(asAnchor ? {} : props)}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
