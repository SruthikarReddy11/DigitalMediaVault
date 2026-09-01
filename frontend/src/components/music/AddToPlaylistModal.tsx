import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ListMusic, Plus, Check, Music } from 'lucide-react';
import { playlistsApi } from '../../services/playlistsApi';
import { PlaylistItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface AddToPlaylistModalProps {
  musicId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  musicId,
  isOpen,
  onClose,
}) => {
  const { success, error } = useToast();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      playlistsApi.getPlaylists().then(setPlaylists).catch(console.error);
    }
  }, [isOpen]);

  const handleAddToPlaylist = async (playlist: PlaylistItem) => {
    setLoadingId(playlist.id);
    try {
      await playlistsApi.addSong(playlist.id, musicId);
      success(`Added to playlist "${playlist.name}"!`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to add song to playlist.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const created = await playlistsApi.createPlaylist(newPlaylistName.trim());
      await playlistsApi.addSong(created.id, musicId);
      success(`Created playlist "${created.name}" and added song!`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to create playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Playlist" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Existing Playlists */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {playlists.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No playlists found. Create one below!
            </p>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAddToPlaylist(p)}
                disabled={loadingId === p.id}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/60 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-brand-400">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-brand-300 transition">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-400">{p.songCount} songs</p>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400 group-hover:text-white group-hover:bg-brand-600 transition">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Create New Playlist Form */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-300 mb-2">Or Create New Playlist</p>
          <form onSubmit={handleCreateAndAdd} className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim() || isCreating}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
