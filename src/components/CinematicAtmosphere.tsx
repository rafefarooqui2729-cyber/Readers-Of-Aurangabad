import React from 'react';

interface CinematicAtmosphereProps {
  className?: string;
}

/**
 * Presentation-only ambient layer for cinematic public pages.
 * Intentionally contains no state, effects, or interaction logic.
 */
export const CinematicAtmosphere: React.FC<CinematicAtmosphereProps> = ({ className = '' }) => {
  return (
    <div className={`cine-atmosphere ${className}`.trim()} aria-hidden="true">
      <div className="cine-atmosphere__glow cine-atmosphere__glow--gold" />
      <div className="cine-atmosphere__glow cine-atmosphere__glow--clay" />
      <div className="cine-atmosphere__glow cine-atmosphere__glow--olive" />
      <div className="cine-atmosphere__grain" />
      <div className="cine-atmosphere__vignette" />
    </div>
  );
};

export default CinematicAtmosphere;
