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
      'inline-flex items-center justify-center font-sans font-bold text-sm tracking-wide min-h-[48px] px-6 py-3 transition-colors duration-200 cursor-pointer rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8431F] disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary:
        'bg-[#A8431F] text-[#F4ECDD] hover:bg-[#8F3717] active:bg-[#782E12] border-0',
      secondary:
        'border-2 border-[#1B2A49] dark:border-[#F4ECDD] text-[#1B2A49] dark:text-[#F4ECDD] bg-transparent hover:bg-[#1B2A49]/5 dark:hover:bg-[#F4ECDD]/10 active:bg-[#1B2A49]/10',
      'outline-marigold':
        'border-2 border-[#E8B04A] text-[#E8B04A] bg-transparent hover:bg-[#E8B04A]/10 active:bg-[#E8B04A]/20',
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
