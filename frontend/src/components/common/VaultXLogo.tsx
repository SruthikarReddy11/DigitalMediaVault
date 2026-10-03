import React from 'react';
import { Link } from 'react-router-dom';

interface VaultXLogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  withBadge?: boolean;
  badgeText?: string;
  to?: string | null;
  className?: string;
}

export const VaultXLogo: React.FC<VaultXLogoProps> = ({
  size = 'md',
  withText = true,
  withBadge = true,
  badgeText = 'PRO',
  to = '/',
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      svg: 24,
      text: 'text-sm',
      badge: 'text-[8px] px-1 py-0.2',
    },
    md: {
      svg: 30,
      text: 'text-base sm:text-lg',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    lg: {
      svg: 40,
      text: 'text-xl sm:text-2xl',
      badge: 'text-[10px] px-2 py-0.5',
    },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
      {/* Glowing 3D Neon "X" Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Multi-layered Neon Ambient Backlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 blur-md opacity-75 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 pointer-events-none" />
        <div className="absolute -inset-1 rounded-full bg-cyan-400/30 blur-sm opacity-50 group-hover:opacity-90 transition-opacity pointer-events-none" />

        <svg
          width={sizeConfig.svg}
          height={sizeConfig.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_4px_12px_rgba(6,182,212,0.5)] transform transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Primary Left-to-Right diagonal gradient (Deep Blue to Electric Cyan) */}
            <linearGradient id="vxArm1Grad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="45%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>

            {/* Secondary Right-to-Left diagonal gradient (Electric Purple to Indigo) */}
            <linearGradient id="vxArm2Grad" x1="85" y1="15" x2="15" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="40%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Specular Core Reflection */}
            <radialGradient id="vxCenterGlow" cx="50" cy="50" r="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#67e8f9" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>

            {/* Edge Specular Sheen */}
            <linearGradient id="vxSheen" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Central Radial Light Orb */}
          <circle cx="50" cy="50" r="26" fill="url(#vxCenterGlow)" />

          {/* Diagonal 1: Top-Right to Bottom-Left (Purple/Indigo Arm) */}
          <path
            d="M78 16L87 25L28 84L19 75L78 16Z"
            fill="url(#vxArm2Grad)"
            stroke="url(#vxSheen)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Diagonal 2: Top-Left to Bottom-Right (Blue/Cyan Forward Arm) */}
          <path
            d="M22 16L13 25L72 84L81 75L22 16Z"
            fill="url(#vxArm1Grad)"
            stroke="url(#vxSheen)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Center Intersection Diamond Jewel */}
          <path
            d="M50 36L62 50L50 64L38 50L50 36Z"
            fill="#ffffff"
            fillOpacity="0.9"
            className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
          <circle cx="50" cy="50" r="3" fill="#0284c7" />
        </svg>
      </div>

      {/* Brand Typography & Badge */}
      {withText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${sizeConfig.text} font-sans`}>
            Vault<span className="text-cyan-400">X</span>Media
          </span>

          {withBadge && (
            <span
              className={`font-mono font-extrabold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20 ${sizeConfig.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
};
