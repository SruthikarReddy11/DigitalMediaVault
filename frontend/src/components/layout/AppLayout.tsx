import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PersistentPlayer } from '../player/PersistentPlayer';
import { UploadModal } from '../upload/UploadModal';
import { AddToPlaylistModal } from '../music/AddToPlaylistModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [playlistSongId, setPlaylistSongId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Ambient Depth Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 relative z-10">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Page View with bottom padding for persistent music player */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-36 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet context={{ openUpload: () => setIsUploadOpen(true) }} />
        </main>
      </div>

      {/* Global Persistent Music Player */}
      <PersistentPlayer onAddToPlaylist={(musicId) => setPlaylistSongId(musicId)} />

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          // Trigger custom event so active pages can refetch
          window.dispatchEvent(new CustomEvent('pdl_files_updated'));
        }}
      />

      {/* Global Add to Playlist Modal */}
      {playlistSongId && (
        <AddToPlaylistModal
          musicId={playlistSongId}
          isOpen={!!playlistSongId}
          onClose={() => setPlaylistSongId(null)}
        />
      )}
    </div>
  );
};
