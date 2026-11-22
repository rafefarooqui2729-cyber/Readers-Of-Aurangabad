import React from 'react';
import { isSafeHref } from '../../utils/url';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline-marigold';
  asAnchor?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'rr-btn',
  secondary: 'rr-btn rr-btn--outline',
  'outline-marigold': 'rr-btn rr-btn--brass',
};

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'primary', asAnchor = false, href, children, className = '', ...props }, ref) => {
    const combinedClasses = `${variantClass[variant]} ${className}`.trim();

    // Fail closed: only render an anchor for an explicitly safe href.
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
  },
);

Button.displayName = 'Button';
