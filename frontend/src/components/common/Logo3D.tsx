import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface Logo3DProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  subtext?: string;
  badge?: string;
  interactive?: boolean;
  to?: string | null;
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-7 h-7', px: 28, text: 'text-xs', badge: 'text-[8px] px-1 py-0.2' },
  sm: { box: 'w-9 h-9', px: 36, text: 'text-sm', badge: 'text-[9px] px-1.5 py-0.5' },
  md: { box: 'w-11 h-11', px: 44, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5' },
  lg: { box: 'w-14 h-14', px: 56, text: 'text-xl', badge: 'text-[10px] px-2 py-0.5' },
  xl: { box: 'w-20 h-20', px: 80, text: 'text-2xl', badge: 'text-xs px-2.5 py-1' },
};

export const Logo3D: React.FC<Logo3DProps> = ({
  size = 'md',
  withText = false,
  subtext,
  badge = 'PRO',
  interactive = true,
  to = '/',
  className = '',
}) => {
  const { box, px, text, badge: badgeClass } = SIZE_MAP[size];
  const [isHovered, setIsHovered] = useState(false);

  const emblem = (
    <div
      className={`relative ${box} shrink-0 select-none group perspective-800 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic 3D Ambient Back-Glow */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-purple-600/40 blur-lg transition-all duration-500 pointer-events-none ${
          isHovered ? 'opacity-100 scale-125' : 'opacity-60 scale-100'
        }`}
      />

      {/* 3D Isometric Container with interactive hover tilt & float */}
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-300 ease-out ${
          interactive && isHovered
            ? 'rotate-x-12 rotate-y-12 scale-105'
            : 'animate-float-3d'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          width={px}
          height={px}
          className="w-full h-full drop-shadow-[0_8px_16px_rgba(6,182,212,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Plane: Specular Cyan-Indigo Gradient */}
            <linearGradient id="topFaceGrad" x1="50" y1="8" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Left Plane: Deep Cyber Cyan/Navy Gradient */}
            <linearGradient id="leftFaceGrad" x1="12" y1="30" x2="50" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Right Plane: Neon Indigo/Purple Shaded Gradient */}
            <linearGradient id="rightFaceGrad" x1="88" y1="30" x2="50" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            {/* Glowing Core Radial Gradient */}
            <radialGradient id="coreBloom" cx="50" cy="52" r="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="1" />
              <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>

            {/* Specular Rim Light */}
            <linearGradient id="rimLight" x1="12" y1="8" x2="88" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Background Core Ambient Glow */}
          <circle cx="50" cy="52" r="26" fill="url(#coreBloom)" />

          {/* 3D Left Face (Cyan/Navy isometric facet) */}
          <path
            d="M12 30L50 52V94L12 72V30Z"
            fill="url(#leftFaceGrad)"
            stroke="url(#rimLight)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Circuit Grid Lines on Left Face */}
          <path
            d="M24 48L38 56M24 64L44 75M32 37L32 68"
            stroke="#38bdf8"
            strokeOpacity="0.35"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* 3D Right Face (Purple/Indigo isometric facet) */}
          <path
            d="M50 52L88 30V72L50 94V52Z"
            fill="url(#rightFaceGrad)"
            stroke="url(#rimLight)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Circuit Grid Lines on Right Face */}
          <path
            d="M76 48L62 56M76 64L56 75M68 37L68 68"
            stroke="#a855f7"
            strokeOpacity="0.35"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* 3D Top Face (Reflective diamond facet) */}
          <path
            d="M50 8L88 30L50 52L12 30L50 8Z"
            fill="url(#topFaceGrad)"
            stroke="url(#rimLight)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* Specular Glaze Ribbon on Top Face */}
          <path
            d="M32 20L68 20L58 26L22 26L32 20Z"
            fill="#ffffff"
            fillOpacity="0.35"
          />

          {/* Central Holographic Core / Floating 3D Vault Keyhole */}
          <g className="animate-pulse">
            {/* Inner Floating Vault Diamond */}
            <path
              d="M50 38L62 45L50 58L38 45L50 38Z"
              fill="#080e1a"
              stroke="#67e8f9"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Luminous Core Key Symbol */}
            <circle cx="50" cy="46" r="3" fill="#ffffff" />
            <path
              d="M50 49V54M48.5 52H51.5"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Sparkle Nodes on Vertices */}
          <circle cx="50" cy="8" r="1.6" fill="#ffffff" />
          <circle cx="88" cy="30" r="1.6" fill="#38bdf8" />
          <circle cx="12" cy="30" r="1.6" fill="#38bdf8" />
          <circle cx="50" cy="94" r="1.6" fill="#818cf8" />
        </svg>
      </div>
    </div>
  );

  const content = withText ? (
    <div className="flex items-center gap-3">
      {emblem}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 ${text}`}>
            VaultMedia
          </span>
          {badge && (
            <span
              className={`font-mono font-black uppercase rounded-lg tracking-wider bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20 ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtext !== undefined ? (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtext}</p>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Cloud Vault & Studio</p>
        )}
      </div>
    </div>
  ) : (
    emblem
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center group transition-transform active:scale-95">
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center">{content}</div>;
};
