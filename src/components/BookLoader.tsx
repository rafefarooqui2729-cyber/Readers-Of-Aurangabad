import React from 'react';

interface BookLoaderProps {
  fullScreen?: boolean;
}

/**
 * Restrained editorial loading state. Accessibility hooks are intentionally
 * unchanged: callers and tests rely on the status role and loading label.
 */
export const BookLoader: React.FC<BookLoaderProps> = ({ fullScreen = false }) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Loading Readers of Aurangabad"
    className={`rr-loader ${fullScreen ? 'rr-loader--full' : ''}`.trim()}
  >
    <div className="rr-loader__mark">
      <span className="rr-loader__overline">MH20 / Chhatrapati Sambhajinagar</span>
      <span className="rr-loader__title">Read.<br />Meet.<br />Repeat.</span>
      <span className="rr-loader__rule" aria-hidden="true" />
      <span className="rr-loader__note">Readers of Aurangabad</span>
    </div>
  </div>
);

export default BookLoader;
