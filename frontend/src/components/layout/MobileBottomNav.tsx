import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Image,
  Video,
  Music,
  FolderClosed,
  Menu,
} from 'lucide-react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenSidebar }) => {
  const location = useLocation();

  let isPlaying = false;
  try {
    const audio = useAudioPlayer();
    isPlaying = audio.isPlaying;
  } catch {
    // Graceful fallback
  }

  // Check if current route is an auxiliary page accessed via the "More" drawer
  const isAuxiliaryActive = [
    '/vault',
    '/contacts',
    '/products',
    '/playlists',
    '/favorites',
    '/shared-links',
    '/trash',
    '/calendar',
    '/settings',
    '/admin',
    '/search',
  ].some((path) => location.pathname.startsWith(path));

  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/gallery', label: 'Photos', icon: Image, end: false },
    { to: '/videos', label: 'Videos', icon: Video, end: false },
    {
      to: '/music',
      label: 'Music',
      icon: Music,
      end: false,
      isMusic: true,
    },
    { to: '/files', label: 'Files', icon: FolderClosed, end: false },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-950/90 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_30px_rgba(0,0,0,0.7)] px-2 safe-area-bottom select-none"
    >
      {/* Laser highlight line on top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 via-indigo-500/40 to-transparent pointer-events-none" />

      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 group cursor-pointer ${
                  isActive
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active glowing pill indicator on top */}
                  {isActive && (
                    <div className="absolute -top-[1px] w-8 h-[2.5px] rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  )}

                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''
                      }`}
                    />

                    {/* Live playing equalizer badge on Music tab */}
                    {item.isMusic && isPlaying && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] tracking-tight mt-1 truncate">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More button to toggle sidebar drawer */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open More Menu"
          className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 group cursor-pointer ${
            isAuxiliaryActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAuxiliaryActive && (
            <div className="absolute -top-[1px] w-8 h-[2.5px] rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
          )}

          <div className="relative flex items-center justify-center">
            <Menu
              className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                isAuxiliaryActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : ''
              }`}
            />
            {isAuxiliaryActive && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-slate-950"></span>
            )}
          </div>

          <span className="text-[10px] tracking-tight mt-1 truncate">More</span>
        </button>
      </div>
    </nav>
  );
};
