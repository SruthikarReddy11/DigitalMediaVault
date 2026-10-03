import React from 'react';

interface DayPeriodIndicatorProps {
  currentDate?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DayPeriodIndicator: React.FC<DayPeriodIndicatorProps> = ({
  currentDate = new Date(),
  className = '',
  size = 'md',
}) => {
  const hour = currentDate.getHours();

  // Morning: 5 AM - 11:59 AM
  // Afternoon: 12 PM - 4:59 PM (12 - 16)
  // Evening/Night: 5 PM - 4:59 AM (17 - 4)
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = !isMorning && !isAfternoon;

  const sizePx = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      title={
        isMorning
          ? 'Morning: Calm Rising Sun'
          : isAfternoon
          ? 'Afternoon: Bright Shining Sun'
          : 'Evening: Luminous Moon'
      }
    >
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.7)); }
        }
        @keyframes sun-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rays-pulse {
          0%, 100% { transform: scale(0.92); opacity: 0.75; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes moon-float {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-3px) rotate(4deg); }
        }
        @keyframes star-twinkle {
          0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
        }
        @keyframes halo-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.8; transform: scale(1.12); }
        }
      `}</style>

      {/* 1. MORNING: NORMAL SUN (Gentle warm morning glow, calm rising pulse) */}
      {isMorning && (
        <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx }}>
          {/* Soft Morning Halo */}
          <div
            className="absolute inset-0 rounded-full bg-amber-400/30 blur-md pointer-events-none"
            style={{ animation: 'gentle-pulse 3s ease-in-out infinite' }}
          />

          <svg
            width={sizePx}
            height={sizePx}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
            style={{ animation: 'gentle-pulse 3.5s ease-in-out infinite' }}
          >
            {/* Steady rays */}
            <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="2" x2="18" y2="6" />
              <line x1="18" y1="30" x2="18" y2="34" />
              <line x1="2" y1="18" x2="6" y2="18" />
              <line x1="30" y1="18" x2="34" y2="18" />
              <line x1="6.7" y1="6.7" x2="9.5" y2="9.5" />
              <line x1="26.5" y1="26.5" x2="29.3" y2="29.3" />
              <line x1="6.7" y1="29.3" x2="9.5" y2="26.5" />
              <line x1="26.5" y1="9.5" x2="29.3" y2="6.7" />
            </g>
            {/* Sun Core */}
            <circle cx="18" cy="18" r="7.5" fill="url(#morning-grad)" />
            <defs>
              <linearGradient id="morning-grad" x1="12" y1="12" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 2. AFTERNOON: SHINING SUN (Radiant rotating rays, bright sparkling lens flare, high energy) */}
      {isAfternoon && (
        <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx }}>
          {/* Intense Outer Golden Corona Glow */}
          <div
            className="absolute inset-0 rounded-full bg-amber-500/40 blur-lg pointer-events-none"
            style={{ animation: 'halo-glow 2s ease-in-out infinite' }}
          />

          {/* Rotating Outer Rays */}
          <svg
            width={sizePx}
            height={sizePx}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 z-0 origin-center"
            style={{ animation: 'sun-spin 12s linear infinite' }}
          >
            {/* 12 Radiant Rays with tapered spikes */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <polygon
                key={deg}
                points="20,2 21.5,8 18.5,8"
                fill="#F59E0B"
                transform={`rotate(${deg} 20 20)`}
                className="opacity-90"
              />
            ))}
          </svg>

          {/* Shining Pulsating Sun Core */}
          <svg
            width={sizePx}
            height={sizePx}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ animation: 'rays-pulse 2s ease-in-out infinite' }}
          >
            <circle cx="20" cy="20" r="8.5" fill="url(#afternoon-grad)" />
            <circle cx="17.5" cy="17.5" r="2.5" fill="#FEF08A" opacity="0.8" />
            <defs>
              <linearGradient id="afternoon-grad" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FEF08A" />
                <stop offset="0.5" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#EA580C" />
              </linearGradient>
            </defs>
          </svg>

          {/* Sparkle Flares */}
          <span
            className="absolute -top-1 -right-1 text-[10px] text-amber-200 pointer-events-none"
            style={{ animation: 'star-twinkle 1.8s ease-in-out infinite' }}
          >
            ✦
          </span>
          <span
            className="absolute -bottom-1 -left-1 text-[8px] text-yellow-300 pointer-events-none"
            style={{ animation: 'star-twinkle 2.4s ease-in-out 0.9s infinite' }}
          >
            ✦
          </span>
        </div>
      )}

      {/* 3. EVENING: BRIGHT MOON WITH ANIMATION (Luminous lunar halo, gentle floating drift, twinkling stars) */}
      {isEvening && (
        <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx }}>
          {/* Luminous Lunar Cyan/Indigo Halo */}
          <div
            className="absolute inset-0 rounded-full bg-cyan-400/25 blur-md pointer-events-none"
            style={{ animation: 'halo-glow 3.5s ease-in-out infinite' }}
          />

          {/* Floating Crescent Moon */}
          <svg
            width={sizePx}
            height={sizePx}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_0_10px_rgba(103,232,249,0.7)]"
            style={{ animation: 'moon-float 4s ease-in-out infinite' }}
          >
            <path
              d="M27.5 19.5C27.5 25.0228 23.0228 29.5 17.5 29.5C12.5714 29.5 8.48624 25.9324 7.64336 21.2291C7.45037 20.1524 8.52044 19.308 9.53107 19.7214C11.667 20.595 14.072 21.0769 16.5862 21.0769C22.6105 21.0769 27.5 16.1874 27.5 10.1631C27.5 7.64893 27.0181 5.24391 26.1445 3.10804C25.7311 2.09741 26.5755 1.02734 27.6522 1.22033C32.3555 2.06321 35.9231 6.14837 35.9231 11.0769C35.9231 11.2338 35.9202 11.3901 35.9145 11.5457C35.637 11.4589 35.3444 11.4118 35.0415 11.4118C31.5796 11.4118 28.7735 14.2178 28.7735 17.6798C28.7735 18.3228 28.8702 18.9431 29.0494 19.5262C28.5513 19.5088 28.0315 19.5 27.5 19.5Z"
              fill="url(#moon-grad)"
            />
            {/* Crater accents */}
            <circle cx="15" cy="22" r="1.5" fill="#93C5FD" opacity="0.4" />
            <circle cx="19" cy="25" r="1.2" fill="#93C5FD" opacity="0.3" />

            <defs>
              <linearGradient id="moon-grad" x1="8" y1="4" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.4" stopColor="#E0F2FE" />
                <stop offset="0.8" stopColor="#BAE6FD" />
                <stop offset="1" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Twinkling Surrounding Stars */}
          <span
            className="absolute -top-1 -right-0.5 text-[9px] text-cyan-200 pointer-events-none drop-shadow-[0_0_4px_rgba(103,232,249,0.8)]"
            style={{ animation: 'star-twinkle 2.2s ease-in-out infinite' }}
          >
            ✦
          </span>
          <span
            className="absolute top-1 -left-2 text-[7px] text-sky-200 pointer-events-none drop-shadow-[0_0_4px_rgba(103,232,249,0.8)]"
            style={{ animation: 'star-twinkle 3s ease-in-out 1.1s infinite' }}
          >
            ✦
          </span>
          <span
            className="absolute -bottom-1 right-2 text-[6px] text-indigo-200 pointer-events-none drop-shadow-[0_0_3px_rgba(199,210,254,0.8)]"
            style={{ animation: 'star-twinkle 2.5s ease-in-out 0.5s infinite' }}
          >
            ★
          </span>
        </div>
      )}
    </div>
  );
};
