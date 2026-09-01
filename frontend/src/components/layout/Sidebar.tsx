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
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatBytes } from '../../utils/formatters';

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
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                Personal Library
              </h1>
              <p className="text-xs text-slate-400 font-medium">Digital Media Vault</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Library
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
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
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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

          {/* Admin Navigation */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  Admin Panel
                </p>
                <span className="text-[10px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded">
                  ADMIN
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
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-brand-400" />
                Storage
              </span>
              <span className="font-semibold text-slate-200">100 GB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full w-[8%] rounded-full" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              Private isolated storage
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
