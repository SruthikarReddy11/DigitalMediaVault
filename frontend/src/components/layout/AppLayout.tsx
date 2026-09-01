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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Page View with bottom padding for persistent music player */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
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
