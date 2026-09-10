import React, { useState, useRef } from 'react';
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
  xs: { box: 'w-8 h-8', px: 32, text: 'text-xs', sub: 'text-[9px]', badge: 'text-[8px] px-1 py-0.2' },
  sm: { box: 'w-10 h-10', px: 40, text: 'text-sm', sub: 'text-[10px]', badge: 'text-[9px] px-1.5 py-0.5' },
  md: { box: 'w-12 h-12', px: 48, text: 'text-base', sub: 'text-[11px]', badge: 'text-[9px] px-1.5 py-0.5' },
  lg: { box: 'w-16 h-16', px: 64, text: 'text-xl', sub: 'text-xs', badge: 'text-[10px] px-2 py-0.5' },
  xl: { box: 'w-24 h-24', px: 96, text: 'text-2xl', sub: 'text-sm', badge: 'text-xs px-2.5 py-1' },
};

export const Logo3D: React.FC<Logo3DProps> = ({
  size = 'md',
  withText = false,
  subtext,
  badge = '3D ULTRA',
  interactive = true,
  to = '/',
  className = '',
}) => {
  const { box, px, text, sub, badge: badgeClass } = SIZE_MAP[size];
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({
      x: -(relY * 26),
      y: relX * 26,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const emblem = (
    <div
      ref={containerRef}
      className={`relative ${box} shrink-0 select-none group perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Multi-Layer Ambient Back-Glow */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500/50 via-blue-600/40 to-purple-600/50 blur-xl transition-all duration-500 pointer-events-none ${
          isHovered ? 'opacity-100 scale-135' : 'opacity-65 scale-105'
        }`}
      />
      <div
        className={`absolute -inset-1 rounded-full bg-cyan-400/20 blur-md transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-90' : 'opacity-30'
        }`}
      />

      {/* 3D Isometric Container with Interactive Mouse Parallax Tilt & Smooth Idle Float */}
      <div
        className={`relative w-full h-full preserve-3d transition-transform ease-out ${
          isHovered ? 'duration-150' : 'duration-700 animate-float-3d'
        }`}
        style={
          interactive && isHovered
            ? {
                transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.1, 1.1, 1.1)`,
              }
            : undefined
        }
      >
        <svg
          viewBox="0 0 120 120"
          width={px}
          height={px}
          className="w-full h-full drop-shadow-[0_10px_22px_rgba(6,182,212,0.4)] overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Plane: Specular Cyan-Indigo Gradient */}
            <linearGradient id="topFaceGrad3D" x1="60" y1="14" x2="60" y2="62" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Left Plane: Deep Cyber Cyan/Navy Gradient */}
            <linearGradient id="leftFaceGrad3D" x1="18" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#0369a1" />
              <stop offset="85%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>

            {/* Right Plane: Neon Indigo/Purple Shaded Gradient */}
            <linearGradient id="rightFaceGrad3D" x1="102" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="45%" stopColor="#7c3aed" />
              <stop offset="80%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Glowing Singularity Core Radial */}
            <radialGradient id="quantumBloom" cx="60" cy="62" r="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a5f3fc" stopOpacity="1" />
              <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>

            {/* Metallic Specular Rim Light */}
            <linearGradient id="specularRim3D" x1="18" y1="14" x2="102" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#a5f3fc" stopOpacity="0.8" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="85%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>

            {/* Inner Chamfer Bevel Highlight */}
            <linearGradient id="chamferLight" x1="60" y1="14" x2="60" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>

            {/* Orbital Ring Radial Gradient */}
            <linearGradient id="orbitRingGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* ========================================================= */}
          {/* LAYER 1: Futuristic Gyroscopic Orbital Gimbal Rings        */}
          {/* ========================================================= */}
          {/* Outer Compass Orbital Ring */}
          <g className="animate-orbit-cw origin-center opacity-65">
            <ellipse
              cx="60"
              cy="60"
              rx="54"
              ry="24"
              fill="none"
              stroke="url(#orbitRingGrad)"
              strokeWidth="0.85"
              strokeDasharray="4 6 1 6"
            />
            {/* Orbital Satellite Node */}
            <circle cx="114" cy="60" r="2.2" fill="#38bdf8" />
            <circle cx="6" cy="60" r="1.6" fill="#a855f7" />
          </g>

          {/* Inner Counter-Rotating Tilted Orbital Ring */}
          <g className="animate-orbit-ccw origin-center opacity-50">
            <ellipse
              cx="60"
              cy="60"
              rx="24"
              ry="50"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="0.75"
              strokeDasharray="3 5"
              transform="rotate(25 60 60)"
            />
            <circle cx="60" cy="10" r="1.8" fill="#ffffff" transform="rotate(25 60 60)" />
          </g>

          {/* Background Core Ambient Bloom */}
          <circle cx="60" cy="62" r="30" fill="url(#quantumBloom)" />

          {/* ========================================================= */}
          {/* LAYER 2: Multi-Faceted 3D Isometric Vault Geometry         */}
          {/* ========================================================= */}

          {/* 3D Left Face (Cyber-Navy Armor Facet) */}
          <path
            d="M18 38L60 62V106L18 82V38Z"
            fill="url(#leftFaceGrad3D)"
            stroke="url(#specularRim3D)"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          {/* Etched Precision Circuit Tracks & Nodes on Left Face */}
          <g opacity="0.65">
            <path
              d="M32 58L48 67M32 76L54 88M40 46L40 82"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Glowing Circuit Bus Nodes */}
            <circle cx="32" cy="58" r="1.5" fill="#a5f3fc" />
            <circle cx="48" cy="67" r="1.5" fill="#38bdf8" />
            <circle cx="32" cy="76" r="1.5" fill="#a5f3fc" />
            <circle cx="54" cy="88" r="1.5" fill="#38bdf8" />
          </g>

          {/* 3D Right Face (Neon Indigo/Violet Shaded Facet) */}
          <path
            d="M60 62L102 38V82L60 106V62Z"
            fill="url(#rightFaceGrad3D)"
            stroke="url(#specularRim3D)"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          {/* Etched Circuit Grid on Right Face */}
          <g opacity="0.65">
            <path
              d="M88 58L72 67M88 76L66 88M80 46L80 82"
              stroke="#c084fc"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Circuit Bus Nodes */}
            <circle cx="88" cy="58" r="1.5" fill="#e9d5ff" />
            <circle cx="72" cy="67" r="1.5" fill="#c084fc" />
            <circle cx="88" cy="76" r="1.5" fill="#e9d5ff" />
            <circle cx="66" cy="88" r="1.5" fill="#c084fc" />
          </g>

          {/* 3D Top Face (Prismatic Crystal Roof) */}
          <path
            d="M60 14L102 38L60 62L18 38L60 14Z"
            fill="url(#topFaceGrad3D)"
            stroke="url(#specularRim3D)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Chamfer Inner Border on Top Face */}
          <path
            d="M60 21L92 38L60 55L28 38L60 21Z"
            fill="none"
            stroke="url(#chamferLight)"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />

          {/* Specular Diagonal Glass Glaze Highlight */}
          <path
            d="M40 26L80 26L70 33L30 33L40 26Z"
            fill="#ffffff"
            fillOpacity={isHovered ? '0.5' : '0.35'}
            className="transition-all duration-300"
          />

          {/* Center Seam Chamfer Bevel Highlight */}
          <path
            d="M60 62V106"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* ========================================================= */}
          {/* LAYER 3: Holographic Quantum Singularity / Keyhole Core    */}
          {/* ========================================================= */}
          <g className="animate-pulse">
            {/* Floating Cybernetic Diamond Bezel */}
            <path
              d="M60 46L74 54L60 69L46 54L60 46Z"
              fill="#030712"
              fillOpacity="0.9"
              stroke="#67e8f9"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Inner Concentric Energy Ring */}
            <circle cx="60" cy="55" r="5" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />

            {/* Glowing Core Vault Key Glyph */}
            <circle cx="60" cy="54" r="3.2" fill="#ffffff" />
            <circle cx="60" cy="54" r="1.6" fill="#0284c7" />
            <path
              d="M60 57.5V63.5M58 61H62"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>

          {/* ========================================================= */}
          {/* LAYER 4: Dynamic 4-Point Specular Lens Flare Stars         */}
          {/* ========================================================= */}
          {/* Top Apex Flare Star */}
          <g transform="translate(60, 14)">
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
            <path d="M-6 0H6M0 -6V6" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
          </g>
          {/* Right Vertex Flare Star */}
          <g transform="translate(102, 38)">
            <circle cx="0" cy="0" r="1.8" fill="#a5f3fc" />
            <path d="M-4 0H4M0 -4V4" stroke="#a5f3fc" strokeWidth="0.7" strokeLinecap="round" />
          </g>
          {/* Left Vertex Flare Star */}
          <g transform="translate(18, 38)">
            <circle cx="0" cy="0" r="1.8" fill="#a5f3fc" />
            <path d="M-4 0H4M0 -4V4" stroke="#a5f3fc" strokeWidth="0.7" strokeLinecap="round" />
          </g>
          {/* Bottom Vertex Node */}
          <circle cx="60" cy="106" r="2" fill="#a855f7" />
        </svg>
      </div>
    </div>
  );

  const content = withText ? (
    <div className="flex items-center gap-3">
      {emblem}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 leading-none">
          <div className="flex items-baseline tracking-tight font-black">
            <span className={`text-white tracking-wide ${text}`}>VAULT</span>
            <span
              className={`bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)] ml-1 ${text}`}
            >
              MEDIA
            </span>
          </div>
          {badge && (
            <span
              className={`font-mono font-black uppercase rounded-lg tracking-wider bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/25 ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          className={`font-mono uppercase font-bold text-cyan-400/75 tracking-[0.22em] mt-1 ${sub}`}
        >
          {subtext !== undefined ? subtext : 'QUANTUM CLOUD VAULT'}
        </p>
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

