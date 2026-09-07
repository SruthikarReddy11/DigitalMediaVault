import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  UploadCloud,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Settings,
  Shield,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getMediaUrl } from '../../services/api';
import { calculateAge } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenUpload }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const userAge = user?.dob ? calculateAge(user.dob) : null;
  const locationDisplay = [user?.village, user?.pincode].filter(Boolean).join(', ');

  // Reset image error if user avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/files?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files, lossless music, 4K videos, documents..."
            className="w-full bg-slate-900/70 border border-white/[0.08] hover:border-slate-700 focus:border-brand-500 rounded-xl pl-10 pr-16 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition backdrop-blur-md"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded">
                Ctrl K
              </kbd>
            </div>
          )}
        </form>
      </div>

      {/* Right section: Upload, Theme, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-500/20 border border-brand-400/30 active:scale-95 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-slate-700 rounded-xl transition"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-brand-500/20 overflow-hidden border border-white/20 shrink-0">
              {user?.avatarUrl && !imageError ? (
                <img
                  src={getMediaUrl(user.avatarUrl)}
                  alt={user.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
              {/* Online status indicator */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[130px] lg:max-w-[170px]">
                  {user?.name || 'User'}
                </p>
                {userAge !== null && (
                  <span className="text-[10px] font-extrabold text-brand-300 bg-brand-500/20 px-1.5 py-0.5 rounded-md border border-brand-500/30 shrink-0">
                    {userAge}y
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate max-w-[140px] lg:max-w-[180px] mt-0.5">
                {locationDisplay ? (
                  <>
                    <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{locationDisplay}</span>
                  </>
                ) : (
                  <span>{isAdmin ? 'Administrator' : 'Digital Vault'}</span>
                )}
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="px-4 py-3 border-b border-white/[0.08] bg-slate-950/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-white truncate">{user?.name}</p>
                  {userAge !== null && (
                    <span className="text-[10px] font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full shrink-0 border border-brand-500/30">
                      {userAge} yrs
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{user?.email}</p>

                {locationDisplay && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate font-semibold">{locationDisplay}</span>
                  </div>
                )}

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    }`}
                  >
                    {isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account Settings
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-slate-800/80 transition text-left"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    Admin Console
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
