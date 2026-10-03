import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Image,
  Video,
  Music,
  FolderClosed,
  Heart,
  ListMusic,
  Trash2,
  Settings,
  Shield,
  Users,
  Files,
  Activity,
  HardDrive,
  Sparkles,
  KeyRound,
  Share2,
  Calendar,
  BookUser,
  ShoppingBag,
  Wallet,
  StickyNote,
  Compass,
  Luggage,
  Globe,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatBytes } from '../../utils/formatters';
import { Logo3D } from '../common/Logo3D';
import { VaultXLogo } from '../common/VaultXLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/gallery', label: 'Gallery', icon: Image },
    { to: '/videos', label: 'Videos', icon: Video },
    { to: '/music', label: 'Music', icon: Music },
    { to: '/files', label: 'Files', icon: FolderClosed },
    { to: '/vault', label: 'Secret Vault', icon: KeyRound },
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
    { to: '/shared-links', label: 'Shared Links', icon: Share2 },
    { to: '/trash', label: 'Trash', icon: Trash2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminItems = [
    { to: '/admin', label: 'Overview', icon: Shield },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/files', label: 'All Files', icon: Files },
    { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Tagline */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08]">
          <div className="flex flex-col">
            <VaultXLogo size="md" withText withBadge badgeText="PRO" to="/" />
            <span className="text-[8px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase mt-1 pl-0.5">
              QUANTUM CLOUD VAULT
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Main Dashboard Button */}
          <NavLink
            to="/"
            end
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>Dashboard</span>
            </div>
          </NavLink>

          {/* Section: MEDIA */}
          <div>
            <p className="px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              MEDIA
            </p>
            <nav className="space-y-0.5">
              {[
                { to: '/gallery', label: 'Photos', icon: Image },
                { to: '/videos', label: 'Cinema & Video', icon: Video },
                { to: '/music', label: 'Lossless Music', icon: Music, badge: 'Hi-Fi', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                { to: '/files', label: 'Files & Documents', icon: FolderClosed },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section: TOOLS */}
          <div>
            <p className="px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              TOOLS
            </p>
            <nav className="space-y-0.5">
              {[
                { to: '/vault', label: 'Secret Vault', icon: KeyRound, badge: '2FA', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                { to: '/expenses', label: 'Expenses', icon: Wallet, badge: 'NEW', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                { to: '/places', label: 'Places', icon: Compass },
                { to: '/products', label: 'Wishlist', icon: ShoppingBag },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section: PRODUCTIVITY */}
          <div>
            <p className="px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              PRODUCTIVITY
            </p>
            <nav className="space-y-0.5">
              {[
                { to: '/notes', label: 'Notes', icon: StickyNote },
                { to: '/calendar', label: 'Calendar', icon: Calendar },
                { to: '/projects', label: 'Web Projects', icon: Globe },
                { to: '/plans', label: 'Trip Planner', icon: Luggage, badge: 'PLAN', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section: SECURE & STORAGE */}
          <div>
            <p className="px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              SECURE VAULT
            </p>
            <nav className="space-y-0.5">
              {[
                { to: '/contacts', label: 'Secure Contacts', icon: BookUser },
                { to: '/favorites', label: 'Favorites', icon: Heart },
                { to: '/playlists', label: 'Playlists', icon: ListMusic },
                { to: '/shared-links', label: 'Shared Links', icon: Share2 },
                { to: '/trash', label: 'Trash', icon: Trash2 },
                { to: '/settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <p className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  ADMIN SYSTEM
                </p>
                <span className="text-[8px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded border border-purple-500/30">
                  ROOT
                </span>
              </div>
              <nav className="space-y-0.5">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin'}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card & Storage Meter at Bottom (No Subscription, Just Real Quota) */}
        <div className="p-3.5 border-t border-white/[0.08] bg-slate-950/90">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Cloud Storage
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-400">100 GB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 h-full w-[1.5%] rounded-full shadow-sm" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span>620.3 MB used (1.0%)</span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
