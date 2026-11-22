import React from 'react';

interface CinematicAtmosphereProps {
  className?: string;
}

/** Quiet ruled background layer; name retained for caller compatibility. */
export const CinematicAtmosphere: React.FC<CinematicAtmosphereProps> = ({ className = '' }) => (
  <div className={`mh20-atmosphere cine-atmosphere ${className}`.trim()} aria-hidden="true">
    <div className="mh20-atmosphere__grid" />
  </div>
);

export default CinematicAtmosphere;
