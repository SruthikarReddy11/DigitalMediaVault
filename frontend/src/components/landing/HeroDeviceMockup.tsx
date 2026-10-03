import React from 'react';
import {
  Search,
  Bell,
  HardDrive,
  FolderClosed,
  KeyRound,
  UploadCloud,
  FolderPlus,
  Play,
  FileText,
  Volume2,
  Compass,
  Heart,
  ShoppingBag,
  Wallet,
  StickyNote,
  Trash2,
  Home,
  Image,
  Video,
  Music,
  Files,
  Lock,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { VaultXLogo } from '../common/VaultXLogo';

export const HeroDeviceMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-[850px] mx-auto select-none perspective-1000">
      {/* Ambient Neon Back-Glow Behind Laptop */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-purple-600/25 blur-3xl rounded-[3rem] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-fuchsia-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 left-10 w-96 h-28 bg-cyan-400/20 blur-2xl rounded-full pointer-events-none" />

      {/* 3D Tilted Container */}
      <div className="relative transition-transform duration-500 ease-out hover:scale-[1.01]">
        {/* LAPTOP CHASSIS */}
        <div className="relative rounded-t-3xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-2.5 sm:p-3 shadow-2xl border border-white/15 ring-1 ring-black/80">
          {/* Top Bezel with Camera Dot */}
          <div className="flex items-center justify-center pb-1.5 sm:pb-2">
            <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-500/70" />
            </div>
          </div>

          {/* LAPTOP SCREEN (The Authentic VaultXMedia Dashboard) */}
          <div className="relative rounded-2xl bg-slate-950 border border-white/[0.08] overflow-hidden shadow-inner text-[10px] sm:text-xs">
            {/* Screen Content Wrapper */}
            <div className="flex h-[360px] sm:h-[460px] md:h-[500px] w-full overflow-hidden bg-slate-950">
              {/* SCREEN LEFT SIDEBAR */}
              <div className="w-36 sm:w-44 md:w-48 bg-slate-950/95 border-r border-white/[0.08] flex flex-col justify-between p-2.5 sm:p-3 shrink-0 hidden xs:flex">
                <div className="space-y-3">
                  {/* Brand Header */}
                  <div className="px-1 py-0.5">
                    <VaultXLogo size="sm" withText withBadge badgeText="PRO" to={null} />
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5 text-slate-400 font-medium text-[9px] sm:text-[11px]">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20">
                      <Home className="w-3 h-3 text-cyan-300" />
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Image className="w-3 h-3 text-slate-500" />
                      <span>Photos</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Video className="w-3 h-3 text-slate-500" />
                      <span>Videos</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Music className="w-3 h-3 text-slate-500" />
                      <span>Music</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <FolderClosed className="w-3 h-3 text-slate-500" />
                      <span>Files</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <KeyRound className="w-3 h-3 text-amber-400/80" />
                      <span>Secret Vault</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Wallet className="w-3 h-3 text-slate-500" />
                      <span>Expenses</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Compass className="w-3 h-3 text-slate-500" />
                      <span>Places</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <ShoppingBag className="w-3 h-3 text-slate-500" />
                      <span>Wishlist</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      <span>Drive</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <StickyNote className="w-3 h-3 text-slate-500" />
                      <span>Notes</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:text-white transition">
                      <Trash2 className="w-3 h-3 text-slate-500" />
                      <span>Trash</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCREEN MAIN CONTENT AREA */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-950/80 overflow-y-auto scrollbar-none">
                {/* Top Nav Header */}
                <div className="h-10 sm:h-12 border-b border-white/[0.08] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 bg-slate-950/90">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <div className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-12 py-1 text-[9px] sm:text-[10px] text-slate-300 flex items-center justify-between">
                      <span className="truncate">Search files, photos, videos, music...</span>
                      <kbd className="hidden sm:inline font-mono text-[8px] bg-slate-800 text-cyan-300 px-1 py-0.2 rounded border border-white/10">
                        Ctrl K
                      </kbd>
                    </div>
                  </div>

                  {/* Profile & Notifications */}
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400">
                      <Bell className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white ring-1 ring-cyan-400/30">
                        S
                      </div>
                      <div className="hidden sm:flex flex-col text-left leading-none">
                        <span className="text-[10px] font-bold text-white">Sruthikar Reddy</span>
                        <span className="text-[8px] text-slate-500">@sruthikar11</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Scrollable Body */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Greeting */}
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-white">
                      Welcome back, Sruthikar!
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">
                      Your memories, securely organized.
                    </p>
                  </div>

                  {/* 5 Stat Cards */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Image className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-white">2,438</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold truncate">Photos</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/20 flex items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-white">186</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold truncate">Videos</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 flex items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-white">412</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold truncate">Music</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-blue-500/20 flex items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Files className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-white">320</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold truncate">Files</p>
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-pink-500/20 flex items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <FolderClosed className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-white">5</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold truncate">Folders</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Files Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-white">Recent Files</span>
                      <span className="text-[9px] text-cyan-400 font-semibold cursor-pointer">View All</span>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {/* File 1: Mountain landscape */}
                      <div className="relative h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img
                          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=80"
                          alt="Recent 1"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[7px] text-white truncate">Everest.jpg</span>
                        </div>
                      </div>

                      {/* File 2: Sunset highway */}
                      <div className="relative h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img
                          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&q=80"
                          alt="Recent 2"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[7px] text-white truncate">Sunset.jpg</span>
                        </div>
                      </div>

                      {/* File 3: Supercar / Video */}
                      <div className="relative h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img
                          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=80"
                          alt="Recent 3"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="w-2 h-2 text-white fill-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[7px] text-white truncate">Drive_4K.mp4</span>
                        </div>
                      </div>

                      {/* File 4: Audio Waveform */}
                      <div className="relative h-14 sm:h-16 rounded-xl bg-slate-900 border border-cyan-500/30 p-1.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span className="text-[7px] font-mono text-cyan-300">03:14</span>
                        </div>
                        <div className="flex items-end gap-0.5 h-5 px-1">
                          <span className="w-1 bg-cyan-400 h-2 rounded-full" />
                          <span className="w-1 bg-cyan-300 h-4 rounded-full" />
                          <span className="w-1 bg-indigo-400 h-5 rounded-full" />
                          <span className="w-1 bg-cyan-400 h-3 rounded-full" />
                          <span className="w-1 bg-sky-300 h-4 rounded-full" />
                          <span className="w-1 bg-indigo-400 h-2 rounded-full" />
                        </div>
                        <span className="text-[7px] text-slate-300 truncate">Song_Flac.m4a</span>
                      </div>

                      {/* File 5: Encrypted PDF */}
                      <div className="relative h-14 sm:h-16 rounded-xl bg-slate-900 border border-white/10 p-1.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[7px] bg-blue-500/20 text-blue-300 px-1 rounded">PDF</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="w-full h-1 bg-slate-700 rounded-full" />
                          <div className="w-3/4 h-1 bg-slate-800 rounded-full" />
                        </div>
                        <span className="text-[7px] text-slate-300 truncate">TaxVault_2026.pdf</span>
                      </div>

                      {/* File 6: Travel photo */}
                      <div className="relative h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img
                          src="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=200&q=80"
                          alt="Recent 6"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[7px] text-white truncate">Dubai_Trip.png</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Storage Usage & Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
                    {/* Storage Usage Widget */}
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Circular SVG Progress Meter */}
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-800"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-cyan-400"
                              strokeDasharray="62, 100"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black text-white">62%</span>
                        </div>

                        <div>
                          <p className="text-[9px] font-bold text-white">Storage Usage</p>
                          <p className="text-[8px] text-slate-400 font-mono">62 GB of 100 GB used</p>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          Photos 32GB
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Videos 18GB
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Music 6GB
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Files 4GB
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 text-center flex flex-col items-center justify-center transition">
                        <div className="p-1 rounded-lg bg-blue-500/20 text-cyan-300 mb-1">
                          <UploadCloud className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-bold text-white leading-tight">Upload</span>
                        <span className="text-[6px] text-slate-400 leading-tight">Drag or pick</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 text-center flex flex-col items-center justify-center transition">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 mb-1">
                          <FolderPlus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-bold text-white leading-tight">New Folder</span>
                        <span className="text-[6px] text-slate-400 leading-tight">Organize</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-purple-500/40 text-center flex flex-col items-center justify-center transition">
                        <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 mb-1">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-bold text-white leading-tight">Secret Vault</span>
                        <span className="text-[6px] text-slate-400 leading-tight">Add PIN file</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LAPTOP BASE CHASSIS & KEYBOARD NOTCH DECK */}
        <div className="relative h-3 sm:h-4 w-[104%] -left-[2%] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-b-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-t border-white/20 flex items-center justify-center">
          {/* Thumb Notch */}
          <div className="w-16 sm:w-20 h-1 bg-slate-950 rounded-full border border-slate-600/60" />
        </div>

        {/* STANDING SMARTPHONE MOCKUP (Overlapping Right Side) */}
        <div className="absolute -bottom-4 -right-2 sm:-right-6 w-36 sm:w-48 md:w-52 h-[260px] sm:h-[340px] md:h-[370px] rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-950 p-1.5 sm:p-2 shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-cyan-500/30 ring-1 ring-white/10 z-20 transition-transform duration-300 hover:-translate-y-1">
          {/* Phone Screen */}
          <div className="relative w-full h-full rounded-[1.6rem] bg-slate-950 border border-white/10 overflow-hidden flex flex-col justify-between p-2">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-[7px] text-slate-400 px-1 pt-0.5">
              <span className="font-bold text-white">11:21</span>
              <div className="w-10 h-2.5 bg-black rounded-full" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="w-2.5 h-1.5 border border-slate-400 rounded-xs bg-emerald-400" />
              </div>
            </div>

            {/* Mobile App Header & Search */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-black text-white">
                  Vault<span className="text-cyan-400">X</span>Media
                </span>
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[7px] font-bold">
                  S
                </div>
              </div>

              {/* Mobile Search Bar */}
              <div className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[7px] text-slate-400">
                <Search className="w-2.5 h-2.5 text-cyan-400" />
                <span>Search your media...</span>
              </div>
            </div>

            {/* Mobile Category Grid (Photos, Videos, Music, Files, Vault, More) */}
            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <Image className="w-3.5 h-3.5 text-cyan-400 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">Photos</span>
              </div>
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <Video className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">Videos</span>
              </div>
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <Music className="w-3.5 h-3.5 text-purple-400 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">Music</span>
              </div>
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <Files className="w-3.5 h-3.5 text-blue-400 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">Files</span>
              </div>
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <KeyRound className="w-3.5 h-3.5 text-cyan-300 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">Vault</span>
              </div>
              <div className="p-1 rounded-lg bg-slate-900 border border-white/10 text-center">
                <Layers className="w-3.5 h-3.5 text-indigo-400 mx-auto" />
                <span className="text-[6px] font-bold text-slate-200 block mt-0.5">More</span>
              </div>
            </div>

            {/* Mobile Recent Thumbnails */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[7px]">
                <span className="font-bold text-white">Recent</span>
                <span className="text-[6px] text-cyan-400">View All &gt;</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="h-10 rounded-md overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&q=80"
                    alt="m1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-10 rounded-md overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&q=80"
                    alt="m2"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="h-6 border-t border-white/10 flex items-center justify-around text-[7px] text-slate-400 pt-0.5">
              <span className="text-cyan-400 font-bold flex flex-col items-center">
                <Home className="w-2.5 h-2.5" />
                Home
              </span>
              <span className="flex flex-col items-center">
                <Files className="w-2.5 h-2.5" />
                Files
              </span>
              <span className="flex flex-col items-center">
                <Lock className="w-2.5 h-2.5" />
                Vault
              </span>
              <span className="flex flex-col items-center">
                <Layers className="w-2.5 h-2.5" />
                More
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
