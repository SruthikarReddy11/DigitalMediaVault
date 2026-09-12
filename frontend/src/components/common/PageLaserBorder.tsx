import React from 'react';

/**
 * PageLaserBorder - Frames the entire viewport / web page
 * with a continuous sleek, multi-color animated laser border
 * matching the header's cyber neon laser design.
 */
export const PageLaserBorder: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Top Edge Laser (Left to Right) */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] laser-multi-streak opacity-95" />
      <div className="absolute -top-[0.5px] left-0 right-0 h-[2.5px] laser-multi-streak opacity-45 blur-[1px]" />

      {/* Right Edge Laser (Top to Bottom) */}
      <div className="absolute top-0 bottom-0 right-0 w-[1.5px] laser-multi-streak-v opacity-95" />
      <div className="absolute top-0 bottom-0 -right-[0.5px] w-[2.5px] laser-multi-streak-v opacity-45 blur-[1px]" />

      {/* Bottom Edge Laser (Right to Left) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] laser-multi-streak-rev opacity-95" />
      <div className="absolute -bottom-[0.5px] left-0 right-0 h-[2.5px] laser-multi-streak-rev opacity-45 blur-[1px]" />

      {/* Left Edge Laser (Bottom to Top) */}
      <div className="absolute top-0 bottom-0 left-0 w-[1.5px] laser-multi-streak-v-rev opacity-95" />
      <div className="absolute top-0 bottom-0 -left-[0.5px] w-[2.5px] laser-multi-streak-v-rev opacity-45 blur-[1px]" />

      {/* Ambient Corner Flare Orbs */}
      <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-cyan-400/30 blur-sm" />
      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500/30 blur-sm" />
      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400/30 blur-sm" />
      <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-emerald-400/30 blur-sm" />
    </div>
  );
};
