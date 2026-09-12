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
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatBytes } from '../../utils/formatters';
import { Logo3D } from '../common/Logo3D';

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
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08]">
          <Logo3D size="md" withText badge="PRO" to="/" />

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {/* Main Media Library */}
          <div>
            <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Studio & Media
            </p>
            <nav className="space-y-1">
              {[
                { to: '/', label: 'Dashboard', icon: Home },
                { to: '/gallery', label: 'Photos', icon: Image },
                { to: '/videos', label: 'Cinema & Video', icon: Video },
                { to: '/music', label: 'Lossless Music', icon: Music, badge: 'Hi-Fi' },
                { to: '/files', label: 'Files Drive', icon: FolderClosed },
                { to: '/calendar', label: 'Calendar', icon: Calendar },
                { to: '/products', label: 'Product Wishlist', icon: ShoppingBag, badge: 'NEW', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 border border-brand-400/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80 hover:border-slate-800'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-400/20 text-brand-300 font-bold border border-brand-400/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Secure & Pinned */}
          <div>
            <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Security & Vault
            </p>
            <nav className="space-y-1">
              {[
                { to: '/vault', label: 'Secret Vault', icon: KeyRound, badge: '2FA', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                { to: '/contacts', label: 'Secure Contacts', icon: BookUser, badge: 'Vault', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
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
                      `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 border border-brand-400/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80 hover:border-slate-800'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between px-2.5 mb-2">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Admin System
                </p>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                  ROOT
                </span>
              </div>
              <nav className="space-y-1">
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
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
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

        {/* User Card & Storage Meter at Bottom */}
        <div className="p-3.5 border-t border-white/[0.08] bg-slate-950/90">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-brand-400" />
                Cloud Quota
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-400">100 GB</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400 h-full w-[12%] rounded-full shadow-sm" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Encrypted Vault</span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
