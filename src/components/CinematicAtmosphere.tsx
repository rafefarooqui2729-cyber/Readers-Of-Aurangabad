import React from 'react';

interface CinematicAtmosphereProps {
  className?: string;
}

/**
 * Presentation-only ambient layer for public pages.
 * Restyled for MH20 neo-brutalist editorial direction (kept name for compatibility).
 */
export const CinematicAtmosphere: React.FC<CinematicAtmosphereProps> = ({ className = '' }) => {
  return (
    <div className={`mh20-atmosphere cine-atmosphere ${className}`.trim()} aria-hidden="true">
      <div className="mh20-atmosphere__grid" />
      <div className="mh20-atmosphere__blob mh20-atmosphere__blob--signal" />
      <div className="mh20-atmosphere__blob mh20-atmosphere__blob--lime" />
      <div className="mh20-atmosphere__blob mh20-atmosphere__blob--ink" />
    </div>
  );
};

export default CinematicAtmosphere;
