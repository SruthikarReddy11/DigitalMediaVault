import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ListMusic,
  Play,
  Pause,
  Shuffle,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
  Music,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { playlistsApi } from '../services/playlistsApi';
import { PlaylistItem, MusicItem } from '../types';
import { formatDuration } from '../utils/formatters';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { playPlaylistNow, currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  const [playlist, setPlaylist] = useState<PlaylistItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchPlaylist = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await playlistsApi.getPlaylist(id);
      setPlaylist(data);
      setName(data.name);
      setDescription(data.description || '');
    } catch (err: any) {
      error(err.message || 'Failed to load playlist.');
      navigate('/music');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    try {
      const updated = await playlistsApi.updatePlaylist(id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setPlaylist((prev: PlaylistItem | null) =>
        prev ? { ...prev, name: updated.name, description: updated.description } : null
      );
      success('Playlist updated!');
      setIsEditOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to update playlist.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await playlistsApi.deletePlaylist(id);
      success('Playlist deleted.');
      navigate('/music');
    } catch (err: any) {
      error(err.message || 'Failed to delete playlist.');
    }
  };

  const handleRemoveSong = async (musicId: string) => {
    if (!id) return;
    try {
      await playlistsApi.removeSong(id, musicId);
      setPlaylist((prev: PlaylistItem | null) =>
        prev
          ? {
              ...prev,
              songs: prev.songs?.filter((s: MusicItem) => s.id !== musicId),
              songCount: (prev.songCount || 1) - 1,
            }
          : null
      );
      success('Song removed from playlist.');
    } catch (err: any) {
      error(err.message || 'Failed to remove song.');
    }
  };

  const handleMoveSong = async (index: number, direction: 'up' | 'down') => {
    if (!playlist || !playlist.songs || !id) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= playlist.songs.length) return;

    const newSongs = [...playlist.songs];
    const [moved] = newSongs.splice(index, 1);
    newSongs.splice(newIndex, 0, moved);

    // Update state immediately for instant feedback
    setPlaylist({ ...playlist, songs: newSongs });

    try {
      const reorderPayload = newSongs.map((s, pos) => ({
        id: s.playlistItemId || s.id,
        position: pos,
      }));
      await playlistsApi.reorder(id, reorderPayload);
    } catch (err: any) {
      error(err.message || 'Failed to reorder playlist.');
      fetchPlaylist();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/music')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Music Library
      </button>

      {/* Playlist Hero Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30 shrink-0">
            <ListMusic className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              PLAYLIST
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
              {playlist.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              {playlist.description || 'No description provided.'}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-2">
              <span>{playlist.songs?.length || 0} songs</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(playlist.totalDuration || 0)} total
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {playlist.songs && playlist.songs.length > 0 && (
            <>
              <button
                onClick={() => playPlaylistNow(playlist.songs!, 0)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Play All
              </button>
              <button
                onClick={() => {
                  const shuffled = [...playlist.songs!].sort(() => Math.random() - 0.5);
                  playPlaylistNow(shuffled, 0);
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsEditOpen(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
            title="Edit playlist"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-2.5 bg-slate-800 hover:bg-rose-600 text-white rounded-xl transition"
            title="Delete playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playlist Songs Table */}
      {!playlist.songs || playlist.songs.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Playlist is empty"
          description="Go to Music Library to add tracks to this playlist."
          actionLabel="Browse Music"
          onAction={() => navigate('/music')}
        />
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 sm:col-span-4">Title</div>
            <div className="hidden sm:block sm:col-span-3">Artist / Album</div>
            <div className="col-span-3 sm:col-span-2 text-right">Duration</div>
            <div className="col-span-3 sm:col-span-2 text-right">Order / Remove</div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {playlist.songs.map((song: MusicItem, idx: number) => {
              const isCurrent = currentTrack?.id === song.id;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${song.id}-${idx}`}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 items-center text-xs transition group ${
                    isCurrent ? 'bg-brand-600/15 text-brand-300' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  {/* Play / Index */}
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <button
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playPlaylistNow(playlist.songs!, idx);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-brand-600 text-slate-300 group-hover:text-white flex items-center justify-center transition shadow"
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Cover */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center border border-slate-800">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-semibold text-white truncate text-sm leading-tight">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate sm:hidden mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Artist / Album */}
                  <div className="hidden sm:block sm:col-span-3 truncate">
                    <p className="font-medium text-slate-200 truncate">{song.artist}</p>
                    <p className="text-[11px] text-slate-400 truncate">{song.album || '—'}</p>
                  </div>

                  {/* Duration */}
                  <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-400">
                    {formatDuration(song.duration)}
                  </div>

                  {/* Reorder and Remove Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveSong(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded transition"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveSong(idx, 'down')}
                      disabled={idx === playlist.songs!.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded transition"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveSong(song.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition ml-1"
                      title="Remove from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Playlist"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Playlist Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlist.name}"? The songs inside will remain in your library.`}
        confirmText="Delete Playlist"
        isDangerous
      />
    </div>
  );
};
