import React, { useEffect, useState } from 'react';
import { ScrollState } from './useScrollProgress';

interface SceneStackProps {
  scrollState: ScrollState;
  reduceEffects?: boolean;
  children?: React.ReactNode;
}

export const SceneStack: React.FC<SceneStackProps> = ({
  scrollState,
  reduceEffects = false,
  children,
}) => {
  const { scrollY, toEmber, toNight } = scrollState;
  const [hasDayPlate, setHasDayPlate] = useState(false);
  const [hasNightPlate, setHasNightPlate] = useState(false);

  // Probe media files safely without throwing or showing broken image icons
  useEffect(() => {
    const imgDay = new Image();
    imgDay.onload = () => setHasDayPlate(true);
    imgDay.src = '/media/plate-day.webp';

    const imgNight = new Image();
    imgNight.onload = () => setHasNightPlate(true);
    imgNight.src = '/media/plate-night.webp';
  }, []);

  // Day plate styles:
  // Fallback: radial-gradient(900px 600px at 78% 45%, rgba(255,180,84,.28), transparent), linear-gradient(180deg,#1a0f07,#0a0705)
  const dayOpacity = reduceEffects ? 1 : Math.max(0, Math.min(1, 1 - toEmber));
  const dayTransform = reduceEffects
    ? 'none'
    : `scale(${1 + 0.08 * toEmber}) translateY(${-0.06 * scrollY}px)`;

  const dayBgStyle: React.CSSProperties = {
    opacity: dayOpacity,
    transform: dayTransform,
    transformOrigin: 'center center',
    willChange: 'opacity, transform',
    backgroundImage: hasDayPlate
      ? `url('/media/plate-day.webp'), radial-gradient(900px 600px at 78% 45%, rgba(255,180,84,.28), transparent), linear-gradient(180deg,#1a0f07,#0a0705)`
      : `radial-gradient(900px 600px at 78% 45%, rgba(255,180,84,.28), transparent), linear-gradient(180deg,#1a0f07,#0a0705)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
  };

  // Ember layer styles:
  // linear-gradient(180deg,#170e07 0%,#0e0905 50%,#07060a 100%), opacity 0 (flat gradient, no blobs)
  // ember opacity = toEmber * (1 - toNight)
  const emberOpacity = reduceEffects ? 0 : Math.max(0, Math.min(1, toEmber * (1 - toNight)));

  // Night plate styles:
  // plate-night.webp with ::after overlay linear-gradient(180deg, rgba(5,6,11,.15), transparent 30%, rgba(5,6,11,.6) 58%, rgba(5,6,11,.94))
  // Fallback: #05060B with star dots
  const nightOpacity = reduceEffects ? 0 : Math.max(0, Math.min(1, toNight));

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Layer 1: Day plate */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
        style={dayBgStyle}
      />

      {/* Layer 2: Ember layer (flat gradient, no blobs) */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: emberOpacity,
          background: 'linear-gradient(180deg, #170e07 0%, #0e0905 50%, #07060a 100%)',
          willChange: 'opacity',
        }}
      />

      {/* Layer 3: Night plate with darkening overlay */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: nightOpacity,
          willChange: 'opacity',
        }}
      >
        {/* Night background image or CSS star field fallback */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: '#05060B',
            backgroundImage: hasNightPlate
              ? `url('/media/plate-night.webp')`
              : `radial-gradient(1px 1px at 25px 35px, #fff, transparent),
                 radial-gradient(1px 1px at 85px 125px, rgba(255,255,255,.8), transparent),
                 radial-gradient(1.5px 1.5px at 160px 45px, rgba(255,220,180,.9), transparent),
                 radial-gradient(1px 1px at 220px 190px, rgba(255,255,255,.6), transparent),
                 radial-gradient(1.5px 1.5px at 300px 90px, #fff, transparent),
                 radial-gradient(1px 1px at 380px 240px, rgba(255,240,200,.7), transparent)`,
            backgroundSize: hasNightPlate ? 'cover' : '400px 300px',
            backgroundPosition: 'center center',
          }}
        />

        {/* Night darkening gradient overlay */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,6,11,.15) 0%, transparent 30%, rgba(5,6,11,.6) 58%, rgba(5,6,11,.94) 100%)',
          }}
        />
      </div>

      {/* Layer 4: Orbit canvas / 3D Scene */}
      <div className="absolute inset-0 w-full h-full">
        {children}
      </div>
    </div>
  );
};
