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
      'inline-flex items-center justify-center font-sans font-bold text-sm tracking-[0.04em] uppercase min-h-[48px] px-6 py-3 transition-transform duration-150 cursor-pointer rounded-none border-2 border-[#171717] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F4512C] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

    const variantClasses = {
      primary:
        'bg-[#F4512C] text-white shadow-[4px_4px_0_#171717] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_#171717]',
      secondary:
        'bg-[#FFFCF5] text-[#171717] shadow-[4px_4px_0_#171717] hover:bg-[#D9F36A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717] dark:bg-[#202020] dark:text-[#F4F0E8] dark:border-[#F4F0E8]/35 dark:shadow-[4px_4px_0_#000] dark:hover:bg-[#D9F36A] dark:hover:text-[#171717]',
      'outline-marigold':
        'bg-[#D9F36A] text-[#171717] shadow-[4px_4px_0_#171717] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717]',
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
